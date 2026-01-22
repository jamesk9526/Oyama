// API route for tool discovery and search
import { NextRequest, NextResponse } from 'next/server';
import { toolDiscovery } from '@/lib/mcp';
import type { ToolSearchQuery } from '@/lib/mcp';

/**
 * GET /api/tools/discover - Search and discover tools
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'search';

    switch (action) {
      case 'search': {
        const query: ToolSearchQuery = {};
        
        // Parse keywords
        const keywordsParam = searchParams.get('keywords');
        if (keywordsParam) {
          query.keywords = keywordsParam.split(',').map(k => k.trim());
        }
        
        // Parse categories
        const categoriesParam = searchParams.get('categories');
        if (categoriesParam) {
          query.categories = categoriesParam.split(',').map(c => c.trim()) as ToolSearchQuery['categories'];
        }
        
        // Parse permissions
        const permissionsParam = searchParams.get('permissions');
        if (permissionsParam) {
          query.permissions = permissionsParam.split(',').map(p => p.trim());
        }
        
        // Parse source
        const sourceParam = searchParams.get('source');
        if (sourceParam) {
          query.source = sourceParam as ToolSearchQuery['source'];
        }
        
        // Parse boolean filters
        const enabledParam = searchParams.get('enabled');
        if (enabledParam !== null) {
          query.enabled = enabledParam === 'true';
        }
        
        const openSourceParam = searchParams.get('openSource');
        if (openSourceParam !== null) {
          query.openSource = openSourceParam === 'true';
        }
        
        const results = toolDiscovery.search(query);
        
        return NextResponse.json({
          results,
          count: results.length,
          query,
        });
      }

      case 'byCapability': {
        const capability = searchParams.get('capability');
        if (!capability) {
          return NextResponse.json(
            { error: 'Missing required parameter: capability' },
            { status: 400 }
          );
        }
        
        const tools = toolDiscovery.discoverByCapability(capability);
        
        return NextResponse.json({
          tools,
          count: tools.length,
          capability,
        });
      }

      case 'related': {
        const toolId = searchParams.get('toolId');
        const limit = parseInt(searchParams.get('limit') || '5');
        
        if (!toolId) {
          return NextResponse.json(
            { error: 'Missing required parameter: toolId' },
            { status: 400 }
          );
        }
        
        const related = toolDiscovery.getRelatedTools(toolId, limit);
        
        return NextResponse.json({
          tools: related,
          count: related.length,
          toolId,
        });
      }

      case 'statistics': {
        const stats = toolDiscovery.getStatistics();
        
        return NextResponse.json(stats);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in tool discovery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tool discovery failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/discover - Rebuild index
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'refreshIndex') {
      toolDiscovery.refreshIndex();
      
      return NextResponse.json({
        success: true,
        message: 'Tool index refreshed successfully',
        statistics: toolDiscovery.getStatistics(),
      });
    } else {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error refreshing tool index:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh index' },
      { status: 500 }
    );
  }
}
