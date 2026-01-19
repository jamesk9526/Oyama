import { NextRequest, NextResponse } from 'next/server';
import { memoryQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get('keywords');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      const memories = memoryQueries.search(keywordArray, limit);
      
      // Update access counts
      memories.forEach(m => memoryQueries.updateAccess(m.id));
      
      return NextResponse.json(memories);
    } else {
      const memories = memoryQueries.getRecent(limit);
      return NextResponse.json(memories);
    }
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, chatId, content, type, importance, keywords } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: id, content' },
        { status: 400 }
      );
    }

    const memory = memoryQueries.create({
      id,
      chatId,
      content,
      type: type || 'fact',
      importance: importance || 5,
      keywords: keywords || [],
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}
