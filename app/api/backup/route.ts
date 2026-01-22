import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    // Prepare backup data
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        chats: [] as any[],
        messages: [] as any[],
        agents: [] as any[],
        crews: [] as any[],
        templates: [] as any[],
        memories: [] as any[],
        attachments: [] as any[],
        settings: {} as any,
      },
    };

    // Fetch all data
    try {
      backup.data.chats = db.prepare('SELECT * FROM chats').all();
    } catch (e) {
      console.log('Chats table might not exist');
    }

    try {
      backup.data.messages = db.prepare('SELECT * FROM messages').all();
    } catch (e) {
      console.log('Messages table might not exist');
    }

    try {
      backup.data.agents = db.prepare('SELECT * FROM agents').all();
    } catch (e) {
      console.log('Agents table might not exist');
    }

    try {
      backup.data.crews = db.prepare('SELECT * FROM crews').all();
    } catch (e) {
      console.log('Crews table might not exist');
    }

    try {
      backup.data.templates = db.prepare('SELECT * FROM prompt_templates').all();
    } catch (e) {
      console.log('Templates table might not exist');
    }

    try {
      backup.data.memories = db.prepare('SELECT * FROM memories').all();
    } catch (e) {
      console.log('Memories table might not exist');
    }

    try {
      backup.data.attachments = db.prepare('SELECT * FROM attachments').all();
    } catch (e) {
      console.log('Attachments table might not exist');
    }

    try {
      const settings = db.prepare('SELECT * FROM global_settings').all() as any[];
      backup.data.settings = {};
      settings.forEach((setting) => {
        backup.data.settings[setting.key] = setting.value;
      });
    } catch (e) {
      console.log('Settings table might not exist');
    }

    // Return JSON backup
    return NextResponse.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Backup data is required' },
        { status: 400 }
      );
    }

    // Restore data from backup
    const transaction = db.transaction(() => {
      // Chats
      if (data.chats && Array.isArray(data.chats)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO chats (id, title, agent_id, model, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const chat of data.chats) {
          try {
            stmt.run(chat.id, chat.title, chat.agentId || chat.agent_id, chat.model, chat.createdAt || chat.created_at, chat.updatedAt || chat.updated_at);
          } catch (e) {
            // Skip if chat already exists or data mismatch
          }
        }
      }

      // Messages
      if (data.messages && Array.isArray(data.messages)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO messages (id, chat_id, role, content, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const msg of data.messages) {
          try {
            stmt.run(msg.id, msg.chatId || msg.chat_id, msg.role, msg.content, msg.timestamp);
          } catch (e) {
            // Skip errors
          }
        }
      }

      // Memories
      if (data.memories && Array.isArray(data.memories)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO memories (id, chat_id, content, type, importance, keywords, created_at, last_accessed_at, access_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const mem of data.memories) {
          try {
            stmt.run(
              mem.id,
              mem.chatId || mem.chat_id,
              mem.content,
              mem.type,
              mem.importance,
              mem.keywords,
              mem.createdAt || mem.created_at,
              mem.lastAccessed || mem.last_accessed_at,
              mem.accessCount || mem.access_count
            );
          } catch (e) {
            // Skip errors
          }
        }
      }
    });

    transaction();

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
