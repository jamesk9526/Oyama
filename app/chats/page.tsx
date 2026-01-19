'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Plus, Send, MessageSquare, Loader, AlertCircle, Trash2, Download, X, Search, Sparkles, TrendingUp, Upload, History } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAgentsStore } from '@/lib/stores/agents';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { FloatingToolbar } from '@/components/chat/FloatingToolbar';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function ChatsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useSettingsStore();
  const { agents, fetchAgents } = useAgentsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState(settings.ollamaModel);
  const [templateBanner, setTemplateBanner] = useState<{ name: string } | null>(null);
  const [templateSystemAdditions, setTemplateSystemAdditions] = useState('');
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [moodState, setMoodState] = useState<'idle' | 'focused' | 'thinking' | 'success' | 'error'>('idle');
  const [showFab, setShowFab] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const isForceNewChat = searchParams.get('newChat') === '1';
  const queryAgentId = searchParams.get('agentId');
  const isTemplateTest = searchParams.get('templateTest') === '1';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (settings.autoScrollToLatest) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, settings.autoScrollToLatest]);

  // Fetch agents and chat history on mount
  useEffect(() => {
    fetchAgents();
    fetchChatHistory();
  }, [fetchAgents]);

  // Update model when settings change
  useEffect(() => {
    setSelectedModel(settings.ollamaModel);
  }, [settings.ollamaModel]);

  const handleNewChat = useCallback(async () => {
    const newChatId = uuidv4();
    sessionStorage.removeItem('currentChatId');
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
      setAttachments([]);
      setSuggestedFollowUps([]);
      await fetchChatHistory(); // Refresh history
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setError('Failed to create new chat');
    }
  }, [selectedAgent, selectedModel]);

  // Load or create chat session on mount, or force new chat via query param
  useEffect(() => {
    if (queryAgentId) {
      setSelectedAgent(queryAgentId);
    }

    if (isTemplateTest) {
      const raw = sessionStorage.getItem('oyama:template-test');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { body: string; systemAdditions?: string; name?: string };
          if (parsed.body) {
            setInputValue(parsed.body);
          }
          if (parsed.systemAdditions) {
            setTemplateSystemAdditions(parsed.systemAdditions);
          }
          if (parsed.name) {
            setTemplateBanner({ name: parsed.name });
          }
        } catch {
          // ignore
        } finally {
          sessionStorage.removeItem('oyama:template-test');
        }
      }
    }

    if (isForceNewChat) {
      handleNewChat().finally(() => router.replace('/chats'));
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeChat = async () => {
      const savedChatId = sessionStorage.getItem('currentChatId');

      if (savedChatId) {
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

      sessionStorage.removeItem('currentChatId');
      await handleNewChat();
    };

    initializeChat();
  }, [handleNewChat, isForceNewChat, router]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!currentChatId) return;
      try {
        const response = await fetch(`/api/attachments?scopeType=chat&scopeId=${currentChatId}`);
        if (response.ok) {
          const data = await response.json();
          setAttachments(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      } catch {
        // ignore
      }
    };

    loadAttachments();
  }, [currentChatId]);

  const handleAttachFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentChatId || !event.target.files?.length) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('scopeType', 'chat');
    formData.append('scopeId', currentChatId);

    try {
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const created = await response.json();
        setAttachments((prev) => [...prev, { id: created.id, name: created.name }]);
      }
    } catch {
      // ignore
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    } catch {
      // ignore
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!currentChatId) return;

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scopeType', 'chat');
      formData.append('scopeId', currentChatId);

      try {
        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const created = await response.json();
          setAttachments((prev) => [...prev, { id: created.id, name: created.name }]);
        }
      } catch {
        // ignore
      }
    }
  };

  // Listen for sidebar-triggered new chat events
  useEffect(() => {
    const handler = () => {
      handleNewChat();
    };

    window.addEventListener('oyama:new-chat', handler);
    return () => window.removeEventListener('oyama:new-chat', handler);
  }, [handleNewChat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          handleNewChat();
        } else if (e.key === '/') {
          e.preventDefault();
          setShowShortcuts(true);
        }
      } else if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNewChat]);

  const handleExportConversation = () => {
    const markdown = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        const time = msg.timestamp.toLocaleString();
        return `## ${role} (${time})\n\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${currentChatId}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const chats = await response.json();
        setChatHistory(chats);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const loadConversation = async (chatId: string) => {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      if (response.ok) {
        const loadedMessages = await response.json();
        setMessages(
          loadedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
        setCurrentChatId(chatId);
        sessionStorage.setItem('currentChatId', chatId);
        setShowHistory(false);
        setSuggestedFollowUps([]);
        
        // Load attachments for this chat
        const attResponse = await fetch(`/api/attachments?scopeType=chat&scopeId=${chatId}`);
        if (attResponse.ok) {
          const data = await attResponse.json();
          setAttachments(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      await fetchChatHistory();
      if (currentChatId === chatId) {
        await handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // // Handle conversation selection
  // const handleSelectConversation = (chatId: string) => {
  //   loadConversation(chatId);
  // };

  // // Handle new conversation
  // const handleNewConversation = async () => {
  //   const newChatId = uuidv4();
  //   try {
  //     await fetch('/api/chats', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         id: newChatId,
  //         title: 'New Chat',
  //         agentId: selectedAgent || undefined,
  //         model: selectedModel,
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //       }),
  //     });
  //     setCurrentChatId(newChatId);
  //     sessionStorage.setItem('currentChatId', newChatId);
  //     setMessages([]);
  //     setError('');
  //   } catch (err) {
  //     console.error('Failed to create chat:', err);
  //   }
  // };

  // // Handle conversation deletion
  // const handleDeleteConversation = async (chatId: string) => {
  //   try {
  //     await fetch(`/api/chats/${chatId}`, {
  //       method: 'DELETE',
  //     });
  //     if (currentChatId === chatId) {
  //       setCurrentChatId(null);
  //       setMessages([]);
  //       sessionStorage.removeItem('currentChatId');
  //     }
  //   } catch (err) {
  //     console.error('Failed to delete chat:', err);
  //   }
  // };

  // // Handle conversation renaming
  // const handleRenameConversation = async (chatId: string, newTitle: string) => {
  //   try {
  //     await fetch(`/api/chats/${chatId}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         title: newTitle,
  //       }),
  //     });
  //   } catch (err) {
  //     console.error('Failed to rename chat:', err);
  //   }
  // };

  const handleClearChat = async () => {
    if (!currentChatId || messages.length === 0) return;
    
    if (!confirm('Clear this chat? This will delete all messages.')) return;

    try {
      await fetch(`/api/messages?chatId=${currentChatId}`, {
        method: 'DELETE',
      });
      setMessages([]);
      setSuggestedFollowUps([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
      setError('Failed to clear chat');
    }
  };

  const handleReaction = (messageId: string, reaction: 'like' | 'dislike') => {
    setMessageReactions(prev => {
      const newReactions = { ...prev };
      if (newReactions[messageId] === reaction) {
        delete newReactions[messageId];
      } else {
        newReactions[messageId] = reaction;
      }
      return newReactions;
    });
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Update message in state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, content: newContent } : msg
    ));

    // Update in database
    if (currentChatId) {
      try {
        await fetch(`/api/messages/${messageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        });
      } catch (err) {
        console.error('Failed to update message:', err);
      }
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message
    const lastUserMsg = messages.slice(0, -1).reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    setMessages(prev => prev.slice(0, -1));
    setInputValue(lastUserMsg.content);
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 100);
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Calculate conversation analytics
  const analytics = {
    messageCount: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    totalWords: messages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
    avgResponseLength: messages.filter(m => m.role === 'assistant').length > 0
      ? Math.round(messages.filter(m => m.role === 'assistant').reduce((sum, m) => sum + m.content.length, 0) / messages.filter(m => m.role === 'assistant').length)
      : 0,
    positiveReactions: Object.values(messageReactions).filter(r => r === 'like').length,
    negativeReactions: Object.values(messageReactions).filter(r => r === 'dislike').length,
  };

  // Generate suggested follow-ups based on last assistant message
  const generateSuggestedFollowUps = useCallback((lastMessage: string) => {
    // Simple heuristic-based suggestions
    const suggestions: string[] = [];
    
    if (lastMessage.toLowerCase().includes('error') || lastMessage.toLowerCase().includes('issue')) {
      suggestions.push('How can I fix this?', 'What are the common causes?', 'Can you provide more details?');
    } else if (lastMessage.toLowerCase().includes('code') || lastMessage.includes('```')) {
      suggestions.push('Explain this code', 'What are the alternatives?', 'How can I optimize this?');
    } else if (lastMessage.includes('?')) {
      suggestions.push('Can you elaborate?', 'Give me an example', 'What else should I know?');
    } else {
      suggestions.push('Tell me more', 'Can you give an example?', 'What are the next steps?');
    }
    
    setSuggestedFollowUps(suggestions.slice(0, 3));
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!selectedModel) {
      setError('Please select a model in Settings');
      setMoodState('error');
      setTimeout(() => setMoodState('idle'), 2000);
      return;
    }

    setMoodState('focused');
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    saveMessage(userMessage); // Save to database

    const userInput = inputValue;
    setInputValue('');
    setLoading(true);
    setError('');
    setMoodState('thinking');

    // Create assistant message with streaming
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Get agent's system prompt if selected
      const agent = selectedAgent ? agents.find((a) => a.id === selectedAgent) : null;
      const basePrompt = agent?.systemPrompt || settings.systemPrompt;
      const systemPrompt = templateSystemAdditions
        ? `${basePrompt}\n\n${templateSystemAdditions}`
        : basePrompt;

      const messageHistory = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

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
          chatId: currentChatId || undefined,
          systemPrompt,
          messageHistory,
          attachmentIds: attachments.map((item) => item.id),
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
      let fullContent = '';

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
                fullContent += data.chunk;
                // Update the assistant message with streamed content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: fullContent }
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
            fullContent += data.chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          }
        } catch (e) {
          // Skip parsing errors
        }
      }

      // Save the complete assistant message to database
      if (fullContent) {
        saveMessage({
          ...assistantMessage,
          content: fullContent,
        });

        // Generate suggested follow-ups based on the response
        generateSuggestedFollowUps(fullContent);

        // Update chat title with first user message if still "New Chat"
        if (currentChatId && userInput) {
          try {
            const chatResponse = await fetch(`/api/chats/${currentChatId}`);
            if (chatResponse.ok) {
              const chat = await chatResponse.json();
              if (chat.title === 'New Chat') {
                const title = userInput.length > 50 ? userInput.slice(0, 50) + '...' : userInput;
                await fetch(`/api/chats/${currentChatId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title, updatedAt: new Date().toISOString() }),
                });
                await fetchChatHistory();
              }
            }
          } catch {
            // Ignore title update errors
          }
        }
      }

      if (templateSystemAdditions) {
        setTemplateSystemAdditions('');
        setTemplateBanner(null);
      }

      // Set success mood
      setMoodState('success');
      setTimeout(() => setMoodState('idle'), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Chat error:', err);

      // Set error mood
      setMoodState('error');
      setTimeout(() => setMoodState('idle'), 2000);

      // Remove the empty assistant message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
    } finally {
      setLoading(false);
      // Focus back on input after response completes
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Drag & Drop Overlay */}
      {dragActive && (
        <div className="fixed top-8 left-0 right-0 bottom-0 bg-primary/10 backdrop-blur-sm z-40 flex items-center justify-center border-4 border-dashed border-primary">
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-xl font-semibold">Drop files to attach</p>
          </div>
        </div>
      )}

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="fixed top-8 left-0 right-0 bottom-0 bg-black/50 z-50 flex" onClick={() => setShowHistory(false)}>
          <div className="w-80 bg-background border-r border-border overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Chat History</h3>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-accent rounded" aria-label="Close history">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{chatHistory.length} conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No chat history yet</p>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative rounded-lg p-3 mb-2 border transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-accent border-primary/40'
                        : 'border-border bg-background/60 hover:bg-accent/50 cursor-pointer'
                    }`}
                    onClick={() => currentChatId !== chat.id && loadConversation(chat.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}



      {/* Search Bar */}
      {showSearch && messages.length > 0 && (
        <div className="border-b border-border/60 bg-background/80 backdrop-blur px-4 py-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full"
          />
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              Found {filteredMessages.length} of {messages.length} messages
            </p>
          )}
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && messages.length > 0 && (
        <div className="border-b border-border/60 bg-background/80 backdrop-blur px-4 py-3">
          <div className="p-4 rounded-lg border border-border bg-background/60">
            <h3 className="text-sm font-semibold mb-3">Conversation Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Total Messages</div>
                <div className="text-lg font-semibold">{analytics.messageCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Words</div>
                <div className="text-lg font-semibold">{analytics.totalWords}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Response</div>
                <div className="text-lg font-semibold">{analytics.avgResponseLength} chars</div>
              </div>
              <div>
                <div className="text-muted-foreground">Reactions</div>
                <div className="text-lg font-semibold">
                  👍 {analytics.positiveReactions} / 👎 {analytics.negativeReactions}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={messagesContainerRef} 
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-500 mood-${moodState}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-3 zen-breathe" />
            <h3 className="text-lg font-semibold mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Type a message to begin. Use the floating toolbar to select an agent.
            </p>
          </div>
        ) : (
          <>
            {filteredMessages.map((message, index) => {
              const originalIndex = messages.findIndex(m => m.id === message.id);
              return (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  messageId={message.id}
                  onRegenerate={message.role === 'assistant' && originalIndex === messages.length - 1 ? handleRegenerate : undefined}
                  onEdit={message.role === 'user' ? (content) => handleEditMessage(message.id, content) : undefined}
                  onReaction={message.role === 'assistant' ? (reaction) => handleReaction(message.id, reaction) : undefined}
                  reaction={messageReactions[message.id]}
                  isStreaming={loading && originalIndex === messages.length - 1 && message.role === 'assistant'}
                  isLatest={originalIndex === messages.length - 1}
                />
              );
            })}
            
            {/* Suggested Follow-ups */}
            {!loading && suggestedFollowUps.length > 0 && !searchQuery && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  <span>Suggested follow-ups:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedFollowUps.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-accent transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background text-foreground border border-border/60 px-4 py-2 rounded-lg flex items-center gap-2">
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

      {/* Floating Toolbar */}
      <FloatingToolbar
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        selectedModel={selectedModel}
        onModelChange={(model) => {
          setSelectedModel(model);
          settings.setOllamaModel(model);
        }}
      />

      {/* Input area */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur p-4">
        {templateBanner && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Template test: {templateBanner.name}</span>
            <button
              className="text-foreground hover:underline"
              onClick={() => {
                setTemplateBanner(null);
                setTemplateSystemAdditions('');
              }}
            >
              Clear
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAttachFile}
            aria-label="Attach file"
            title="Attach file"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentChatId}
          >
            Attach
          </Button>
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
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs"
              >
                <span>{attachment.name}</span>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  type="button"
                  title={`Remove ${attachment.name}`}
                  aria-label={`Remove ${attachment.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense>
      <ChatsPageInner />
    </Suspense>
  );
}
