import { NextRequest, NextResponse } from 'next/server';
import { chatQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    
    // Get all chats (or limit if specified)
    const chats = chatQueries.getAll();
    
    // Apply limit if specified, otherwise return all
    const result = limit ? chats.slice(0, parseInt(limit)) : chats;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch chats', details: errorMessage },
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create chat', details: errorMessage },
      { status: 500 }
    );
  }
}
