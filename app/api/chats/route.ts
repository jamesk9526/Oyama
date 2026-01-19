import { NextRequest, NextResponse } from 'next/server';
import { chatQueries } from '@/lib/db/queries';

export async function GET() {
  try {
    const chats = chatQueries.getAll();
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const chat = await request.json();

    if (!chat.id || !chat.title || !chat.createdAt || !chat.updatedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, createdAt, updatedAt' },
        { status: 400 }
      );
    }

    const createdChat = chatQueries.create(chat);
    return NextResponse.json(createdChat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
