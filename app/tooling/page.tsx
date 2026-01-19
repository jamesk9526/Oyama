'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { 
  FileCode, 
  Send, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Loader,
  StopCircle,
  Settings2,
  User,
  Check,
  X,
  RefreshCw,
  Copy,
  FileText,
  Code2
} from 'lucide-react';
import { useAgentsStore } from '@/lib/stores/agents';
import { useSettingsStore } from '@/lib/stores/settings';
import { ChatMessage } from '@/components/chat/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
  suggestedEdit?: {
    startLine: number;
    endLine: number;
    newContent: string;
    explanation: string;
  };
}

interface DocumentEdit {
  id: string;
  startLine: number;
  endLine: number;
  oldContent: string;
  newContent: string;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function ToolingPage() {
  const { agents, fetchAgents } = useAgentsStore();
  const settings = useSettingsStore();
  
  const [document, setDocument] = useState('// Start writing or paste your code here\n\n');
  const [fileName, setFileName] = useState('untitled.js');
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<DocumentEdit[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      // Default to coder agent if available, otherwise first agent
      const coderAgent = agents.find(a => a.role === 'coder');
      setSelectedAgentId(coderAgent?.id || agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave) {
      autoSaveIntervalRef.current = setInterval(() => {
        if (document.trim()) {
          localStorage.setItem('oyama-tooling-autosave', JSON.stringify({
            document,
            fileName,
            language,
            timestamp: new Date().toISOString(),
          }));
        }
      }, 30000); // Auto-save every 30 seconds
    } else if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [autoSave, document, fileName, language]);

  // Generate quick suggestions based on document type
  useEffect(() => {
    const suggestions: string[] = [];
    const lines = document.split('\n').length;
    
    if (language === 'javascript' || language === 'typescript') {
      suggestions.push(
        'Add TypeScript type annotations',
        'Refactor this into smaller functions',
        'Add error handling',
        'Optimize performance',
        'Add JSDoc comments'
      );
    } else if (language === 'python') {
      suggestions.push(
        'Add type hints',
        'Improve code structure',
        'Add docstrings',
        'Check for PEP 8 compliance',
        'Optimize loops and operations'
      );
    } else if (language === 'markdown') {
      suggestions.push(
        'Improve structure and headings',
        'Add more examples',
        'Check grammar and clarity',
        'Add table of contents',
        'Enhance formatting'
      );
    } else {
      suggestions.push(
        'Review and improve this code',
        'Explain what this does',
        'Suggest improvements',
        'Find potential bugs',
        'Add documentation'
      );
    }
    
    setQuickSuggestions(suggestions);
  }, [language, document]);

  const getLineCount = () => document.split('\n').length;

  const extractCodeEdits = (response: string): DocumentEdit[] => {
    const edits: DocumentEdit[] = [];
    
    // Pattern: ```EDIT:startLine-endLine
    const editPattern = /```EDIT:(\d+)-(\d+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = editPattern.exec(response)) !== null) {
      const startLine = parseInt(match[1]);
      const endLine = parseInt(match[2]);
      const newContent = match[3].trim();
      
      const lines = document.split('\n');
      const oldContent = lines.slice(startLine - 1, endLine).join('\n');
      
      edits.push({
        id: `edit-${Date.now()}-${startLine}`,
        startLine,
        endLine,
        oldContent,
        newContent,
        explanation: `Lines ${startLine}-${endLine}`,
        status: 'pending',
      });
    }
    
    return edits;
  };

  const applyEdit = (edit: DocumentEdit) => {
    const lines = document.split('\n');
    const before = lines.slice(0, edit.startLine - 1);
    const after = lines.slice(edit.endLine);
    const newLines = [...before, ...edit.newContent.split('\n'), ...after];
    
    setDocument(newLines.join('\n'));
    setPendingEdits(prev => prev.map(e => 
      e.id === edit.id ? { ...e, status: 'accepted' as const } : e
    ));
  };

  const rejectEdit = (editId: string) => {
    setPendingEdits(prev => prev.map(e => 
      e.id === editId ? { ...e, status: 'rejected' as const } : e
    ));
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating || !selectedAgentId) return;

    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    if (!selectedAgent) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const conversationHistory = messages
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const systemPrompt = `${selectedAgent.systemPrompt}

You are helping with code/document editing. The current document is:
---
${document}
---

Language: ${language}
Filename: ${fileName}

When suggesting code changes, use this format:
\`\`\`EDIT:startLine-endLine
new code here
\`\`\`

Where startLine and endLine are the line numbers to replace (1-indexed).
You can suggest multiple edits in one response.
Provide clear explanations for your changes.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          model: settings.defaultProvider === 'openai' ? settings.openaiModel : settings.ollamaModel,
          systemPrompt,
          temperature,
          topP: 0.9,
          maxTokens,
          stream: false,
          conversationHistory,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Failed to generate response');

      const data = await response.json();
      const content = data.response || 'No response received.';

      // Extract any code edits
      const edits = extractCodeEdits(content);
      if (edits.length > 0) {
        setPendingEdits(prev => [...prev.filter(e => e.status === 'pending'), ...edits]);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        agentName: selectedAgent.name,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate response'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveDocument = () => {
    const blob = new Blob([document], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext) {
      const langMap: Record<string, string> = {
        js: 'javascript', ts: 'typescript', py: 'python', 
        java: 'java', cpp: 'cpp', c: 'c', go: 'go',
        rs: 'rust', rb: 'ruby', php: 'php', html: 'html',
        css: 'css', md: 'markdown', json: 'json', xml: 'xml',
      };
      setLanguage(langMap[ext] || 'text');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocument(e.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleNewDocument = () => {
    if (document.trim() && !confirm('Create new document? Current document will be lost.')) {
      return;
    }
    setDocument('// Start writing or paste your code here\n\n');
    setFileName('untitled.js');
    setMessages([]);
    setPendingEdits([]);
  };

  const copyDocument = () => {
    navigator.clipboard.writeText(document);
  };

  const pendingEditsCount = pendingEdits.filter(e => e.status === 'pending').length;

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Document Editor Panel */}
      <div className="flex-1 flex flex-col border-r border-border/60 bg-background">
        {/* Editor Header */}
        <div className="border-b border-border/60 bg-secondary/40 backdrop-blur-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-primary" />
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-48 h-8 text-sm font-mono"
                placeholder="filename.ext"
              />
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-32 h-8 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="text">Plain Text</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleNewDocument} title="New document">
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Open file">
                <Upload className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleLoadDocument}
                accept=".txt,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.rb,.php,.html,.css,.md,.json,.xml"
              />
              <Button size="sm" variant="ghost" onClick={copyDocument} title="Copy to clipboard">
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSaveDocument} title="Download">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {pendingEditsCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Badge className="bg-primary/20 text-primary">{pendingEditsCount}</Badge>
              <span className="text-sm text-primary font-medium">Pending edit{pendingEditsCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden flex">
          {lineNumbers && (
            <div className="w-12 bg-muted/20 border-r border-border/40 p-4 text-right text-xs text-muted-foreground/60 font-mono select-none overflow-y-auto">
              {Array.from({ length: getLineCount() }, (_, i) => (
                <div key={i + 1} className="leading-6">{i + 1}</div>
              ))}
            </div>
          )}
          <Textarea
            ref={documentRef}
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            className="flex-1 resize-none border-0 rounded-none font-mono text-sm leading-6 focus:ring-0 focus:outline-none p-4 bg-background"
            placeholder="Start typing or load a file..."
            spellCheck={false}
          />
        </div>

        {/* Pending Edits Overlay */}
        {pendingEdits.filter(e => e.status === 'pending').length > 0 && (
          <div className="border-t border-border/60 bg-secondary/60 backdrop-blur-sm p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {pendingEdits.filter(e => e.status === 'pending').map((edit) => (
                <div key={edit.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-xs font-mono">
                        Lines {edit.startLine}-{edit.endLine}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{edit.explanation}</span>
                    </div>
                    <div className="text-xs font-mono bg-muted/40 p-2 rounded max-h-20 overflow-y-auto">
                      <div className="text-red-400/80 line-through">{edit.oldContent}</div>
                      <div className="text-green-400/90">{edit.newContent}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => applyEdit(edit)}
                      className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                      title="Accept change"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectEdit(edit.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Reject change"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <div className="w-[480px] flex flex-col bg-secondary/40 backdrop-blur-sm">
        {/* Chat Header */}
        <div className="border-b border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Tooling</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title="Toggle settings"
            >
              <Settings2 className={`w-4 h-4 ${showSettings ? 'text-primary' : ''}`} />
            </Button>
          </div>

          {showSettings && (
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div>
                <Label className="text-xs mb-2 block">Temperature: {temperature}</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  aria-label={`Temperature: ${temperature}`}
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Max Tokens: {maxTokens}</Label>
                <input
                  type="range"
                  min="1024"
                  max="8192"
                  step="512"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                  aria-label={`Max Tokens: ${maxTokens}`}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="autoSave" className="text-xs cursor-pointer">
                  Auto-save every 30s
                </Label>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs mb-2 block">Active Agent</Label>
            <Select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full"
              disabled={agents.length === 0}
            >
              {agents.length === 0 ? (
                <option>No agents available</option>
              ) : (
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Quick Suggestions */}
          {quickSuggestions.length > 0 && messages.length === 0 && (
            <div className="pt-2">
              <Label className="text-xs mb-2 block text-muted-foreground/80">Quick Actions</Label>
              <div className="space-y-1.5">
                {quickSuggestions.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-muted/40 hover:bg-muted/60 border border-border/40 hover:border-primary/30 transition-all duration-200 text-foreground/80 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div className="max-w-sm">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-2">Smart Document Assistant</p>
                <p className="text-xs max-w-xs mx-auto mb-4">
                  Ask questions about your code, request changes, or get suggestions.
                  The AI can directly edit your document with context-aware modifications.
                </p>
                <div className="bg-muted/30 rounded-lg p-3 text-xs text-left space-y-1.5">
                  <p className="font-semibold text-foreground/90">Try asking:</p>
                  <p className="text-muted-foreground/80">• "Add error handling to this function"</p>
                  <p className="text-muted-foreground/80">• "Explain what lines 10-20 do"</p>
                  <p className="text-muted-foreground/80">• "Refactor this for better readability"</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.agentName && message.role === 'assistant' && (
                    <div className="mb-2 pl-1">
                      <Badge variant="default" className="text-xs font-medium">
                        {message.agentName}
                      </Badge>
                    </div>
                  )}
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    messageId={message.id}
                  />
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Agent is analyzing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/60 p-4 bg-background/80 backdrop-blur">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the code, request changes, or get suggestions..."
              rows={3}
              className="flex-1 resize-none"
              disabled={isGenerating || agents.length === 0}
            />
            <div className="flex flex-col gap-2">
              {isGenerating ? (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  size="sm"
                  className="h-full"
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || agents.length === 0}
                  size="sm"
                  className="h-full font-semibold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
