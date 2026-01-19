import { NextRequest, NextResponse } from 'next/server';
import { messageQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId parameter is required' },
        { status: 400 }
      );
    }

    const messages = messageQueries.getAllByChatId(chatId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const message = await request.json();

    if (!message.id || !message.chatId || !message.role || !message.content || !message.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: id, chatId, role, content, timestamp' },
        { status: 400 }
      );
    }

    const createdMessage = messageQueries.create(message);
    return NextResponse.json(createdMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId parameter is required' },
        { status: 400 }
      );
    }

    messageQueries.deleteByChatId(chatId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    );
  }
}
