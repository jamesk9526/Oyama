'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Settings, 
  Folder,
  Plus,
  X,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/lib/stores/ui';
import { useEffect } from 'react';

const navigation = [
  { name: 'Chats', href: '/chats', icon: MessageSquare },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Crews', href: '/crews', icon: Folder },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-secondary border border-border hover:bg-accent transition-colors"
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
          'fixed lg:static inset-y-0 left-0 z-40 w-64 border-r border-border bg-secondary',
          'flex flex-col h-screen transition-transform duration-200 ease-in-out',
          {
            '-translate-x-full lg:translate-x-0': !sidebarOpen,
            'translate-x-0': sidebarOpen,
          }
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold">Oyama</h1>
          <p className="text-xs text-muted-foreground mt-0.5">AI Agent Platform</p>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button 
            className="w-full" 
            size="sm"
            onClick={() => router.push('/chats')}
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
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  {
                    'bg-accent text-accent-foreground': isActive,
                    'text-muted-foreground hover:bg-accent/50 hover:text-foreground': !isActive,
                  }
                )}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between mb-1">
              <span>Workspace</span>
              <button className="hover:text-foreground transition-colors">
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
