'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Home,
  MessageSquare,
  FileText,
  Users,
  Grid3X3,
  Settings,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAgentsStore } from '@/lib/stores/agents';
import { useTemplatesStore } from '@/lib/stores/templates';
import { useCrewsStore } from '@/lib/stores/crews';

interface Command {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'agents' | 'templates' | 'crews' | 'actions';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { agents } = useAgentsStore();
  const { templates } = useTemplatesStore();
  const { crews } = useCrewsStore();

  // Build command list
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      // Navigation commands
      {
        id: 'nav-home',
        label: 'Go to Home',
        category: 'navigation',
        icon: <Home className="w-4 h-4" />,
        action: () => {
          router.push('/');
          onClose();
        },
        keywords: ['home', 'dashboard', 'main'],
      },
      {
        id: 'nav-chat',
        label: 'Go to Chat',
        category: 'navigation',
        icon: <MessageSquare className="w-4 h-4" />,
        action: () => {
          router.push('/chats');
          onClose();
        },
        keywords: ['chat', 'conversation', 'talk', 'message'],
      },
      {
        id: 'nav-templates',
        label: 'Go to Templates',
        category: 'navigation',
        icon: <FileText className="w-4 h-4" />,
        action: () => {
          router.push('/templates');
          onClose();
        },
        keywords: ['templates', 'prompts'],
      },
      {
        id: 'nav-agents',
        label: 'Go to Agents',
        category: 'navigation',
        icon: <Users className="w-4 h-4" />,
        action: () => {
          router.push('/agents');
          onClose();
        },
        keywords: ['agents', 'bots', 'ai'],
      },
      {
        id: 'nav-crews',
        label: 'Go to Crews',
        category: 'navigation',
        icon: <Grid3X3 className="w-4 h-4" />,
        action: () => {
          router.push('/crews');
          onClose();
        },
        keywords: ['crews', 'workflows', 'teams'],
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        category: 'navigation',
        icon: <Settings className="w-4 h-4" />,
        action: () => {
          router.push('/settings');
          onClose();
        },
        keywords: ['settings', 'preferences', 'config'],
      },
      // Action commands
      {
        id: 'action-new-chat',
        label: 'Start New Chat',
        category: 'actions',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          router.push('/chats');
          onClose();
        },
        keywords: ['new', 'chat', 'start', 'conversation'],
      },
      {
        id: 'action-new-agent',
        label: 'Create New Agent',
        category: 'actions',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          router.push('/agents');
          onClose();
        },
        keywords: ['new', 'agent', 'create'],
      },
      {
        id: 'action-new-template',
        label: 'Create New Template',
        category: 'actions',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          router.push('/templates');
          onClose();
        },
        keywords: ['new', 'template', 'create', 'prompt'],
      },
      {
        id: 'action-new-crew',
        label: 'Create New Crew',
        category: 'actions',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          router.push('/crews');
          onClose();
        },
        keywords: ['new', 'crew', 'create', 'workflow'],
      },
    ];

    // Add agent quick access
    agents.forEach((agent) => {
      cmds.push({
        id: `agent-${agent.id}`,
        label: agent.name,
        description: agent.role,
        category: 'agents',
        icon: <Users className="w-4 h-4" />,
        action: () => {
          router.push('/agents');
          onClose();
        },
        keywords: [agent.name.toLowerCase(), agent.role.toLowerCase()],
      });
    });

    // Add template quick access
    templates.forEach((template) => {
      cmds.push({
        id: `template-${template.id}`,
        label: template.name,
        description: template.description,
        category: 'templates',
        icon: <FileText className="w-4 h-4" />,
        action: () => {
          router.push('/templates');
          onClose();
        },
        keywords: [
          template.name.toLowerCase(),
          ...(template.tags || []).map((t) => t.toLowerCase()),
        ],
      });
    });

    // Add crew quick access
    crews.forEach((crew) => {
      cmds.push({
        id: `crew-${crew.id}`,
        label: crew.name,
        description: `${crew.agents.length} agents • ${crew.workflowType}`,
        category: 'crews',
        icon: <Grid3X3 className="w-4 h-4" />,
        action: () => {
          router.push('/crews');
          onClose();
        },
        keywords: [crew.name.toLowerCase(), crew.workflowType],
      });
    });

    return cmds;
  }, [agents, templates, crews, router, onClose]);

  // Fuzzy search filter
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

    return commands.filter((cmd) => {
      const searchableText = [
        cmd.label.toLowerCase(),
        cmd.description?.toLowerCase() || '',
        cmd.category.toLowerCase(),
        ...(cmd.keywords || []),
      ].join(' ');

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      actions: [],
      agents: [],
      templates: [],
      crews: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      navigation: 'Navigation',
      actions: 'Actions',
      agents: 'Agents',
      templates: 'Templates',
      crews: 'Crews',
    };
    return labels[category] || category;
  };

  let globalIndex = 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col h-[500px]">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, pages, agents..."
            className="pl-10"
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(
              ([category, cmds]) =>
                cmds.length > 0 && (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                      {getCategoryLabel(category)}
                    </p>
                    <div className="space-y-1">
                      {cmds.map((cmd) => {
                        const itemIndex = globalIndex++;
                        const isSelected = itemIndex === selectedIndex;

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => cmd.action()}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                              isSelected
                                ? 'bg-primary/20 text-primary'
                                : 'hover:bg-secondary'
                            }`}
                          >
                            <div className="flex-shrink-0">{cmd.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {cmd.label}
                              </p>
                              {cmd.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
            )
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd> Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> Close
              </span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
