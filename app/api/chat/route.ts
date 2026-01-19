import { NextRequest, NextResponse } from 'next/server';
import { OllamaProvider } from '@/lib/providers/ollama';
import { messageQueries, attachmentQueries, memoryQueries } from '@/lib/db/queries';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  model: string;
  agentId?: string;
  chatId?: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
  messageHistory?: ChatMessage[];
  attachmentIds?: string[];
}

const resolveAttachmentPath = (relativePath: string) => {
  return path.join(process.cwd(), '.data', relativePath);
};

const buildAttachmentContext = (attachments: { name: string; path: string }[]) => {
  if (attachments.length === 0) return '';
  const maxCharsPerFile = 6000;
  const parts = attachments.map((attachment) => {
    const absolutePath = resolveAttachmentPath(attachment.path);
    let content = '';
    try {
      content = fs.readFileSync(absolutePath, 'utf-8');
    } catch {
      content = '[Unable to read file]';
    }
    const clipped = content.length > maxCharsPerFile
      ? `${content.slice(0, maxCharsPerFile)}\n...[truncated]`
      : content;
    return `File: ${attachment.name}\n${clipped}`;
  });

  return `\n\nAttached Files:\n${parts.join('\n\n')}`;
};

// Extract keywords from text for memory search
const extractKeywords = (text: string): string[] => {
  // Simple keyword extraction - remove common words and get unique terms
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.has(w));
  
  // Return unique words
  return [...new Set(words)].slice(0, 10);
};

// Extract important facts from conversation for memory
const extractMemories = async (userMessage: string, assistantResponse: string, chatId?: string) => {
  try {
    // Simple heuristic-based memory extraction
    const memories: Array<{ content: string; type: 'fact' | 'preference' | 'context'; importance: number }> = [];
    
    // Look for user preferences/statements
    const preferencePatterns = /(?:i (?:like|love|prefer|want|need|hate|dislike))\s+([^.!?]+)/gi;
    let match;
    while ((match = preferencePatterns.exec(userMessage)) !== null) {
      memories.push({
        content: `User ${match[0]}`,
        type: 'preference',
        importance: 8,
      });
    }
    
    // Look for factual statements
    const factPatterns = /(?:my name is|i am|i'm|i work (?:at|for)|i live in)\s+([^.!?]+)/gi;
    while ((match = factPatterns.exec(userMessage)) !== null) {
      memories.push({
        content: `User stated: ${match[0]}`,
        type: 'fact',
        importance: 9,
      });
    }
    
    // Store memories in database
    for (const memory of memories) {
      const keywords = extractKeywords(memory.content);
      await memoryQueries.create({
        id: uuidv4(),
        chatId,
        content: memory.content,
        type: memory.type,
        importance: memory.importance,
        keywords,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error extracting memories:', error);
  }
};

// Retrieve relevant memories for context
const getRelevantMemories = (message: string, limit: number = 5): string => {
  try {
    const keywords = extractKeywords(message);
    if (keywords.length === 0) return '';
    
    const memories = memoryQueries.search(keywords, limit);
    if (memories.length === 0) return '';
    
    const memoryContext = memories.map(m => m.content).join('\n- ');
    return `\n\nRelevant Information from Previous Conversations:\n- ${memoryContext}`;
  } catch (error) {
    console.error('Error retrieving memories:', error);
    return '';
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const {
      message,
      model,
      chatId,
      systemPrompt = 'You are a helpful AI assistant.',
      temperature = 0.7,
      topP = 0.9,
      maxTokens = 2048,
      stream = false,
      messageHistory = [],
      attachmentIds = [],
    } = body;

    if (!message || !model) {
      return NextResponse.json(
        { error: 'message and model are required' },
        { status: 400 }
      );
    }

    // Create Ollama provider (could be configurable in future)
    const provider = new OllamaProvider();

    // Build message history with system prompt
    // Use provided history or load from chat if available
    let effectiveHistory = messageHistory;
    if ((!effectiveHistory || effectiveHistory.length === 0) && chatId) {
      const storedMessages = messageQueries.getAllByChatId(chatId);
      effectiveHistory = storedMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));
    }

    let attachments: { name: string; path: string }[] = [];
    if (attachmentIds.length > 0) {
      attachments = attachmentQueries.getByIds(attachmentIds);
    } else if (chatId) {
      attachments = attachmentQueries.getByScope('chat', chatId);
    }

    const attachmentContext = buildAttachmentContext(attachments);
    const memoryContext = getRelevantMemories(message);
    const effectiveSystemPrompt = `${systemPrompt}${attachmentContext}${memoryContext}`;

    const messages = [
      {
        role: 'system',
        content: effectiveSystemPrompt,
      },
      ...effectiveHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      let fullResponse = '';

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            await provider.chatStream(
              {
                model,
                messages: messages as any,
                temperature,
                topP,
                maxTokens,
              },
              (chunk) => {
                fullResponse += chunk.content;
                // Send each chunk as a Server-Sent Event
                const data = `data: ${JSON.stringify({ chunk: chunk.content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            );

            // Send completion signal
            const completeData = `data: ${JSON.stringify({ complete: true, response: fullResponse })}\n\n`;
            controller.enqueue(encoder.encode(completeData));
            controller.close();

            // Extract memories after response completes
            extractMemories(message, fullResponse, chatId);
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new NextResponse(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response (fallback)
    let fullResponse = '';

    try {
      await provider.chatStream(
        {
          model,
          messages: messages as any,
          temperature,
          topP,
          maxTokens,
        },
        (chunk) => {
          fullResponse += chunk.content;
        }
      );

      // Extract memories after response completes
      extractMemories(message, fullResponse, chatId);

      return NextResponse.json({
        response: fullResponse,
        model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      });
    } catch (error) {
      console.error('Ollama API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to get response from Ollama. Make sure Ollama is running at http://localhost:11434',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
