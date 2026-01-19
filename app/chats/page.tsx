'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Plus, Send, MessageSquare, Loader, AlertCircle, Trash2 } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAgentsStore } from '@/lib/stores/agents';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatsPage() {
  const settings = useSettingsStore();
  const { agents, fetchAgents } = useAgentsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState(settings.ollamaModel);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Update model when settings change
  useEffect(() => {
    setSelectedModel(settings.ollamaModel);
  }, [settings.ollamaModel]);

  // Load or create chat session on mount
  useEffect(() => {
    const initializeChat = async () => {
      // Check if there's a current chat ID in session storage
      const savedChatId = sessionStorage.getItem('currentChatId');
      
      if (savedChatId) {
        // Load messages for this chat
        try {
          const response = await fetch(`/api/messages?chatId=${savedChatId}`);
          if (response.ok) {
            const loadedMessages = await response.json();
            setMessages(
              loadedMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }))
            );
            setCurrentChatId(savedChatId);
            return;
          }
        } catch (err) {
          console.error('Failed to load messages:', err);
        }
      }

      // Create a new chat if no saved chat or loading failed
      const newChatId = uuidv4();
      try {
        await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newChatId,
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
        setCurrentChatId(newChatId);
        sessionStorage.setItem('currentChatId', newChatId);
      } catch (err) {
        console.error('Failed to create chat:', err);
      }
    };

    initializeChat();
  }, []);

  // Save message to database
  const saveMessage = async (message: Message) => {
    if (!currentChatId) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: message.id,
          chatId: currentChatId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
        }),
      });

      // Update chat's updatedAt timestamp
      await fetch(`/api/chats/${currentChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  // Start a new chat
  const handleNewChat = async () => {
    const newChatId = uuidv4();
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newChatId,
          title: 'New Chat',
          agentId: selectedAgent || undefined,
          model: selectedModel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
      setCurrentChatId(newChatId);
      sessionStorage.setItem('currentChatId', newChatId);
      setMessages([]);
      setError('');
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setError('Failed to create new chat');
    }
  };

  // Clear current chat
  const handleClearChat = async () => {
    if (!currentChatId || messages.length === 0) return;
    
    if (!confirm('Clear this chat? This will delete all messages.')) return;

    try {
      await fetch(`/api/messages?chatId=${currentChatId}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
      setError('Failed to clear chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!selectedModel) {
      setError('Please select a model in Settings');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setLoading(true);
    setError('');

    // Create assistant message with streaming
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Get agent's system prompt if selected
      const agent = selectedAgent ? agents.find((a) => a.id === selectedAgent) : null;
      const systemPrompt = agent?.systemPrompt || settings.systemPrompt;

      // Call the chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          model: selectedModel,
          agentId: selectedAgent || undefined,
          systemPrompt,
          temperature: settings.temperature,
          topP: settings.topP,
          maxTokens: settings.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                // Update the assistant message with streamed content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + data.chunk }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.chunk) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: msg.content + data.chunk }
                  : msg
              )
            );
          }
        } catch (e) {
          // Skip parsing errors
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Chat error:', err);

      // Remove the empty assistant message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
    } finally {
      setLoading(false);
      // Focus back on input after response completes
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Chat</h1>
            <p className="text-sm text-muted-foreground">
              Chat with AI agents powered by {settings.defaultProvider === 'ollama' ? 'Ollama' : 'OpenAI'}
            </p>
          </div>
        </div>
      </div>

      {/* Agent and Model Selection */}
      <div className="border-b border-border bg-background px-4 pt-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="agent-select" className="text-sm mb-1 block">
              Agent (Optional)
            </Label>
            <Select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
              <option value="">Use system prompt</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="model-select" className="text-sm mb-1 block">
              Model
            </Label>
            <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option value="">Select model...</option>
              {settings.ollamaAvailableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {!selectedModel && (
          <p className="text-xs text-destructive mb-4 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            No model selected. Go to Settings to configure Ollama.
          </p>
        )}
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select an agent (optional) and model, then send a message to chat with your AI.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground border border-border px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Streaming response...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !selectedModel}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !selectedModel || !inputValue.trim()}
            size="md"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          {settings.defaultProvider === 'ollama'
            ? 'Powered by Ollama (local)'
            : 'Powered by OpenAI'}
        </p>
      </div>
    </div>
  );
}
