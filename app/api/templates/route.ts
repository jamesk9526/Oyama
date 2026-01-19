import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { Template } from '@/types';

// In-memory storage (replace with database later)
let templates: Template[] = [
  {
    id: '1',
    name: 'Blog Post Outline',
    description: 'Generate a comprehensive blog post outline',
    category: 'Blog',
    tags: ['writing', 'content', 'blog'],
    body: 'Create a detailed blog post outline for:\n\nTopic: {{topic}}\nTarget Audience: {{audience}}\nTone: {{tone}}\n\nInclude:\n- Compelling headline\n- Introduction hook\n- 3-5 main sections with subsections\n- Conclusion with call-to-action',
    variables: [
      { name: 'topic', type: 'string', description: 'The blog post topic', required: true },
      { name: 'audience', type: 'string', description: 'Target audience', required: true },
      { name: 'tone', type: 'string', description: 'Writing tone', defaultValue: 'professional', required: false },
    ],
    workspaceId: null,
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Code Review',
    description: 'Comprehensive code review template',
    category: 'Code',
    tags: ['code', 'review', 'quality'],
    body: 'Review the following code:\n\n```{{language}}\n{{code}}\n```\n\nProvide:\n1. Overall assessment\n2. Potential bugs or issues\n3. Performance concerns\n4. Best practice violations\n5. Suggestions for improvement\n6. Security considerations',
    variables: [
      { name: 'language', type: 'string', description: 'Programming language', required: true },
      { name: 'code', type: 'text', description: 'Code to review', required: true },
    ],
    workspaceId: null,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Research Summary',
    description: 'Summarize research findings',
    category: 'Research',
    tags: ['research', 'summary', 'analysis'],
    body: 'Research and summarize information about: {{topic}}\n\nFocus areas:\n{{focus_areas}}\n\nProvide:\n- Executive summary\n- Key findings (5-7 points)\n- Supporting details\n- Sources and references\n- Recommendations',
    variables: [
      { name: 'topic', type: 'string', description: 'Research topic', required: true },
      { name: 'focus_areas', type: 'text', description: 'Specific areas to focus on', required: false },
    ],
    workspaceId: null,
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newTemplate: Template = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  return NextResponse.json(newTemplate);
}
