'use client';

import { Copy, Check, Play, ThumbsUp, ThumbsDown, RefreshCw, Edit2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';

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
        <div className="max-w-[70%] px-4 py-3 rounded-relaxed rounded-br-tight bg-primary/10 border-l-[3px] border-primary text-foreground relative shadow-sm">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-primary/10 text-foreground rounded-standard p-2.5 text-body min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all focus-ring"
                placeholder="Edit your message..."
                aria-label="Edit message"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSave}
                  className="px-3 py-1.5 text-xs font-medium rounded-standard bg-primary/20 hover:bg-primary/30 transition-colors focus-ring"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-standard bg-muted/20 hover:bg-muted/30 transition-colors focus-ring"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-body break-words whitespace-pre-wrap leading-relaxed">{content}</p>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
            <p className="text-caption text-muted-foreground font-medium">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!isEditing && onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-standard hover:bg-muted/40 transition-colors focus-ring"
                  title="Edit message"
                  aria-label="Edit message"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => copyToClipboard(content)}
                className="p-1.5 rounded-standard hover:bg-muted/40 transition-colors focus-ring"
                title="Copy message"
                aria-label="Copy message"
              >
                {copiedId === content ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
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
      {/* Agent Avatar */}
      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-border/40">
        <span className="text-xs font-semibold text-primary">AI</span>
      </div>
      <div className="max-w-[85%] px-5 py-4 rounded-relaxed rounded-bl-tight bg-surface text-foreground border border-border/60 relative shadow-sm">
        <button
          onClick={() => copyToClipboard(content)}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-standard hover:bg-muted/60 z-10 focus-ring"
          title="Copy message"
          aria-label="Copy message"
        >
          {copiedId === content ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <div className="text-body break-words prose prose-invert max-w-none prose-sm
          prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:mt-4 prose-h1:mb-2
          prose-h2:text-xl prose-h2:mt-3 prose-h2:mb-2
          prose-h3:text-lg prose-h3:mt-3 prose-h3:mb-1.5
          prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed
          prose-a:text-primary prose-a:underline
          prose-strong:text-foreground prose-strong:font-semibold
          prose-code:bg-background prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-accent
          prose-pre:bg-background prose-pre:border prose-pre:border-border prose-pre:p-0 prose-pre:overflow-hidden
          prose-hr:border-border/60
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80
          prose-ul:list-disc prose-ul:list-inside prose-ul:my-2
          prose-ol:list-decimal prose-ol:list-inside prose-ol:my-2
          prose-li:my-1
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
                  <div className="my-3 rounded-lg overflow-hidden bg-background/80 border border-border/60 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border/60">
                      <span className="text-xs font-mono font-medium text-muted-foreground/90 uppercase tracking-wide">
                        {language}
                      </span>
                      <div className="flex gap-2">
                        {isRunnable && (
                          <button
                            onClick={() => executeCode(code, codeId)}
                            disabled={execState?.running}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3" />
                            {execState?.running ? 'Running...' : 'Run'}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-all flex items-center gap-1.5"
                        >
                          {copiedId === code ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
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
                    <pre className="p-4 overflow-x-auto text-sm">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    {execState?.result && (
                      <div className="border-t border-border/60">
                        {execState.result.success ? (
                          <>
                            {execState.result.stdout && (
                              <div className="p-3 bg-background/60">
                                <div className="text-xs font-semibold text-emerald-400/90 mb-1.5 uppercase tracking-wide">Output</div>
                                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-foreground/90 font-mono leading-relaxed">
                                  {execState.result.stdout}
                                </pre>
                              </div>
                            )}
                            {execState.result.stderr && (
                              <div className="p-3 bg-background/60 border-t border-border/60">
                                <div className="text-xs font-semibold text-amber-400/90 mb-1.5 uppercase tracking-wide">Warnings</div>
                                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-amber-400/90 font-mono leading-relaxed">
                                  {execState.result.stderr}
                                </pre>
                              </div>
                            )}
                            <div className="px-3 py-2 bg-background/40 border-t border-border/40 text-xs text-muted-foreground/70">
                              Executed in {execState.result.executionTime}ms
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-destructive/5">
                            <div className="text-xs font-semibold text-destructive/90 mb-1.5 uppercase tracking-wide">Error</div>
                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-destructive/90 font-mono leading-relaxed">
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
                <div className="my-2 rounded-standard overflow-x-auto border border-border">
                  <table {...props} />
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
          <div className="flex items-center gap-3 text-caption text-muted-foreground/70">
            <span className="font-medium">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isStreaming ? (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <span className="animate-pulse text-base leading-none">●</span> 
                <span className="text-caption">Generating...</span>
              </span>
            ) : (
              <span className="text-muted-foreground/50 hidden sm:inline">AI Assistant</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onReaction && (
              <>
                <button
                  onClick={() => onReaction('like')}
                  className={`p-1.5 rounded-standard transition-all duration-200 focus-ring ${
                    reaction === 'like'
                      ? 'bg-success/15 text-success'
                      : 'hover:bg-muted/60 opacity-50 hover:opacity-100'
                  }`}
                  title="Helpful response"
                  aria-label="Mark as helpful"
                  aria-pressed={reaction === 'like'}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReaction('dislike')}
                  className={`p-1.5 rounded-standard transition-all duration-200 focus-ring ${
                    reaction === 'dislike'
                      ? 'bg-error/15 text-error'
                      : 'hover:bg-muted/60 opacity-50 hover:opacity-100'
                  }`}
                  title="Unhelpful response"
                  aria-label="Mark as unhelpful"
                  aria-pressed={reaction === 'dislike'}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {onRegenerate && isLatest && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-standard hover:bg-muted/60 opacity-50 hover:opacity-100 transition-all duration-200 focus-ring"
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
