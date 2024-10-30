import type { APIRoute } from 'astro';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { content } = data;

    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Content is required' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract title from first line of content
    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s+/, '').trim();
    
    if (!title) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'First line must be a title (e.g., # My Note Title)' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate description from first paragraph
    const description = lines
      .slice(1)
      .find(line => line.trim().length > 0) || title;

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create markdown file content
    const fileContent = `---
title: ${title}
description: ${description}
date: ${new Date().toISOString().split('T')[0]}
---

${content}`;

    // Ensure the notes directory exists
    const notesDir = join(process.cwd(), 'src', 'content', 'notes');
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true });
    }

    // Save the file
    const filePath = join(notesDir, `${slug}.md`);
    writeFileSync(filePath, fileContent, 'utf-8');

    return new Response(
      JSON.stringify({ 
        success: true,
        slug 
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error saving note:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to save note' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}