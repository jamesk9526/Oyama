'use client';

import { Copy, Check, Play, ThumbsUp, ThumbsDown, RefreshCw, Edit2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onReaction?: (reaction: 'like' | 'dislike') => void;
  reaction?: 'like' | 'dislike' | null;
  isStreaming?: boolean;
  isLatest?: boolean;
}

interface ExecutionState {
  running: boolean;
  result?: {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
    executionTime: number;
  };
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  messageId,
  onRegenerate,
  onEdit,
  onReaction,
  reaction,
  isStreaming,
  isLatest 
}: ChatMessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executionStates, setExecutionStates] = useState<Record<string, ExecutionState>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showActions, setShowActions] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditSave = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const executeCode = async (codeToRun: string, codeId: string) => {
    setExecutionStates((prev) => ({
      ...prev,
      [codeId]: { running: true },
    }));

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun, timeout: 5000 }),
      });

      const result = await response.json();

      setExecutionStates((prev) => ({
        ...prev,
        [codeId]: { running: false, result },
      }));
    } catch (error) {
      setExecutionStates((prev) => ({
        ...prev,
        [codeId]: {
          running: false,
          result: {
            success: false,
            stdout: '',
            stderr: error instanceof Error ? error.message : 'Unknown error',
            executionTime: 0,
          },
        },
      }));
    }
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end group zen-message">
        <div className="max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg bg-primary text-primary-foreground relative zen-message-user">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-primary-foreground/10 text-primary-foreground rounded p-2 text-sm min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary-foreground/30"
                placeholder="Edit your message..."
                aria-label="Edit message"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSave}
                  className="px-2 py-1 text-xs rounded bg-primary-foreground/20 hover:bg-primary-foreground/30"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-2 py-1 text-xs rounded bg-primary-foreground/10 hover:bg-primary-foreground/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-primary-foreground/70">
              {timestamp.toLocaleTimeString()}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isEditing && onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded hover:bg-primary-foreground/10"
                  title="Edit message"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => copyToClipboard(content)}
                className="p-1 rounded hover:bg-primary-foreground/10"
                title="Copy message"
              >
                {copiedId === content ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start group zen-message">
      <div className="max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg bg-secondary text-foreground border border-border relative zen-message-assistant">
        <button
          onClick={() => copyToClipboard(content)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent z-10"
          title="Copy message"
        >
          {copiedId === content ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
        <div className="text-sm break-words prose prose-invert max-w-none prose-sm
          prose-headings:text-foreground prose-headings:font-bold
          prose-p:text-foreground prose-p:my-1
          prose-a:text-primary prose-a:underline
          prose-code:bg-background prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-red-400
          prose-pre:bg-background prose-pre:border prose-pre:border-border prose-pre:p-0 prose-pre:overflow-hidden
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
          prose-ul:list-disc prose-ul:list-inside
          prose-ol:list-decimal prose-ol:list-inside
          prose-li:my-0
          prose-table:border-collapse prose-table:w-full
          prose-th:border prose-th:border-border prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:bg-muted
          prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({ children }) => <div className="my-1">{children}</div>,
              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match?.[1] || 'text';
                const code = String(children).replace(/\n$/, '');
                const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                const isRunnable = ['javascript', 'js', 'typescript', 'ts'].includes(language.toLowerCase());
                const execState = executionStates[codeId];

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="my-2 rounded-lg overflow-hidden bg-background border border-border">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                      <span className="text-xs font-mono text-muted-foreground">
                        {language}
                      </span>
                      <div className="flex gap-2">
                        {isRunnable && (
                          <button
                            onClick={() => executeCode(code, codeId)}
                            disabled={execState?.running}
                            className="px-2 py-1 text-xs rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            {execState?.running ? 'Running...' : 'Run'}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="px-2 py-1 text-xs rounded bg-primary/20 hover:bg-primary/30 text-primary transition-colors flex items-center gap-1"
                        >
                          {copiedId === code ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    {execState?.result && (
                      <div className="border-t border-border">
                        {execState.result.success ? (
                          <>
                            {execState.result.stdout && (
                              <div className="p-3 bg-background/50">
                                <div className="text-xs font-semibold text-green-400 mb-1">Output:</div>
                                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-foreground font-mono">
                                  {execState.result.stdout}
                                </pre>
                              </div>
                            )}
                            {execState.result.stderr && (
                              <div className="p-3 bg-background/50 border-t border-border">
                                <div className="text-xs font-semibold text-yellow-400 mb-1">Warnings/Info:</div>
                                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-yellow-400 font-mono">
                                  {execState.result.stderr}
                                </pre>
                              </div>
                            )}
                            <div className="px-3 py-2 bg-background/30 border-t border-border text-xs text-muted-foreground">
                              Executed in {execState.result.executionTime}ms
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-destructive/10">
                            <div className="text-xs font-semibold text-destructive mb-1">Error:</div>
                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-destructive font-mono">
                              {execState.result.error || execState.result.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
              pre: ({ node, ...props }: any) => (
                <pre {...props} />
              ),
              table: ({ node, ...props }: any) => (
                <div className="my-2 rounded-lg overflow-x-auto border border-border">
                  <table {...props} />
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString()}
            {isStreaming && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <span className="animate-pulse">●</span> Streaming...
              </span>
            )}
          </p>
          <div className="flex items-center gap-1">
            {onReaction && (
              <>
                <button
                  onClick={() => onReaction('like')}
                  className={`p-1 rounded transition-colors ${
                    reaction === 'like'
                      ? 'bg-green-500/20 text-green-500'
                      : 'hover:bg-accent opacity-60 hover:opacity-100'
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onReaction('dislike')}
                  className={`p-1 rounded transition-colors ${
                    reaction === 'dislike'
                      ? 'bg-red-500/20 text-red-500'
                      : 'hover:bg-accent opacity-60 hover:opacity-100'
                  }`}
                  title="Unhelpful response"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </>
            )}
            {onRegenerate && isLatest && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded hover:bg-accent opacity-60 hover:opacity-100 transition-opacity"
                title="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
