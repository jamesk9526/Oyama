'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, MessageSquare, Trash2, Edit2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  model?: string;
}

interface ConversationSidebarProps {
  currentChatId: string | null;
  onSelectConversation: (chatId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (chatId: string) => void;
  onRenameConversation: (chatId: string, newTitle: string) => void;
}

export function ConversationSidebar({
  currentChatId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await onRenameConversation(editingId, editTitle.trim());
      await fetchConversations();
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      await onDeleteConversation(chatId);
      await fetchConversations();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-secondary/40 backdrop-blur-sm border-r border-border/60 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-9 bg-muted/40 rounded-lg"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-secondary/40 backdrop-blur-sm border-r border-border/60 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/60">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start font-semibold"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 px-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/40 border border-border/40 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/70" />
            </div>
            <p className="text-sm font-semibold mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">Start a new chat to begin your conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative rounded-lg border transition-all duration-200 cursor-pointer ${
                  currentChatId === conversation.id
                    ? 'bg-primary/10 border-primary/30 shadow-sm'
                    : 'bg-background/60 hover:bg-secondary/60 border-border/60 hover:border-border hover:shadow-sm'
                }`}
              >
                {editingId === conversation.id ? (
                  <div className="p-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onBlur={handleSaveEdit}
                      autoFocus
                      className="text-sm h-8"
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="p-3"
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-snug mb-1">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground/70 font-medium">
                            {formatDate(conversation.updatedAt)}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(conversation);
                            }}
                            className="h-7 w-7 p-0 hover:bg-muted/60"
                            title="Rename conversation"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(conversation.id);
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}