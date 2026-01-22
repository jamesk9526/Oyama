'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { 
  MessageSquare, 
  FileText, 
  Settings, 
  Plus,
  X,
  Menu,
  History,
  Search,
  Trash2,
  Code2,
  Sparkles,
  Users,
  GitBranch,
  Server,
  Library,
  Database,
  Cpu,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/lib/stores/ui';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Chat', href: '/chats', icon: MessageSquare },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Crews', href: '/crews', icon: Sparkles },
  { name: 'Workflows', href: '/workflows', icon: GitBranch },
  { name: 'Tools Server', href: '/tools-server', icon: Server },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Models / Providers', href: '/models', icon: Cpu },
  { name: 'Memory', href: '/memory', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [historySearch, setHistorySearch] = useState('');

  const handleNewChatClick = () => {
    if (pathname === '/chats') {
      window.dispatchEvent(new Event('oyama:new-chat'));
      return;
    }

    router.push('/chats?newChat=1');
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chats?limit=50');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const loadChat = (chatId: string) => {
    router.push(`/chats?chatId=${chatId}`);
    setShowChatHistory(false);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      setChatHistory(prev => prev.filter(c => c.id !== chatId));
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Filter chat history by search
  const filteredHistory = historySearch.trim()
    ? chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(historySearch.toLowerCase())
      )
    : chatHistory;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-10 left-4 z-50 p-2 rounded-md bg-secondary border border-border hover:bg-accent transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 border-r border-border/60 bg-background',
          'flex flex-col h-[calc(100vh-2rem)] transition-transform duration-200 ease-in-out lg:mt-0 mt-8',
          {
            '-translate-x-full lg:translate-x-0': !sidebarOpen,
            'translate-x-0': sidebarOpen,
          }
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border/60">
          <h1 className="text-xl font-semibold tracking-tight">Oyama</h1>
          <p className="text-xs text-muted-foreground mt-0.5">AI Agent Platform</p>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button 
            className="w-full" 
            size="sm"
            onClick={handleNewChatClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    {
                      'bg-accent/40 text-foreground': isActive,
                      'text-muted-foreground hover:bg-accent/40 hover:text-foreground': !isActive,
                    }
                  )}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
                {/* History submenu under Chats */}
                {item.name === 'Chats' && (
                  <button
                    onClick={() => {
                      setShowChatHistory(!showChatHistory);
                      if (!showChatHistory) fetchChatHistory();
                    }}
                    className="w-full flex items-center px-3 py-1.5 ml-4 rounded-md text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors mt-1"
                  >
                    <History className="w-3.5 h-3.5 mr-3" />
                    History
                  </button>
                )}
                {/* Chat history dropdown */}
                {item.name === 'Chats' && showChatHistory && (
                  <div className="ml-4 mt-1 space-y-1">
                    {/* Search bar */}
                    <div className="relative px-2">
                      <Search className="absolute left-3.5 top-2 w-3 h-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-muted/30 border border-border rounded text-xs pl-7 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Chat list */}
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {filteredHistory.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {historySearch ? 'No matches' : 'No history'}
                        </div>
                      ) : (
                        filteredHistory.map((chat) => (
                          <div
                            key={chat.id}
                            className="group relative flex items-center px-2 py-1.5 rounded text-xs hover:bg-accent/40 transition-colors"
                          >
                            <button
                              onClick={() => loadChat(chat.id)}
                              className="flex-1 text-left text-muted-foreground hover:text-foreground truncate"
                            >
                              {chat.title}
                            </button>
                            <button
                              onClick={(e) => deleteChat(chat.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 space-y-3">
          {/* Command Palette Hint */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quick Search</span>
              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Workspace Info */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between mb-1">
              <span>Workspace</span>
              <button
                className="hover:text-foreground transition-colors"
                title="Workspace settings"
                aria-label="Workspace settings"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
            <div className="font-medium text-foreground">Default</div>
          </div>
        </div>
      </div>
    </>
  );
};
