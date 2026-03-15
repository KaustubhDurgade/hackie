import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import path from 'path';
import fs from 'fs';

const TEMPLATE_DIR = path.join(process.cwd(), 'lib', 'templates');

// POST /api/boilerplate — generate and return boilerplate as JSON file tree
// (ZIP assembly happens client-side with JSZip)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { template, projectName, sessionId, guestToken } = body;

  if (!template || !projectName || !sessionId) {
    return NextResponse.json({ error: 'template, projectName, sessionId required' }, { status: 400 });
  }

  if (!['A', 'B', 'C'].includes(template)) {
    return NextResponse.json({ error: 'template must be A, B, or C' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { userId } = await auth();
  const isOwner = userId && session.userId === userId;
  const isGuest = guestToken && session.guestToken === guestToken;
  if (!isOwner && !isGuest) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const templatePath = path.resolve(TEMPLATE_DIR, template);
  // Defense-in-depth: ensure resolved path is still inside TEMPLATE_DIR
  if (!templatePath.startsWith(path.resolve(TEMPLATE_DIR) + path.sep)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Read all files in template, replace {{PROJECT_NAME}} placeholder
  const files = readTemplateFiles(templatePath, projectName);

  return NextResponse.json({ files });
}

function readTemplateFiles(
  dir: string,
  projectName: string,
  base = ''
): Array<{ path: string; content: string }> {
  const result: Array<{ path: string; content: string }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath    = path.join(dir, entry.name);
    const relativePath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      result.push(...readTemplateFiles(fullPath, projectName, relativePath));
    } else {
      const raw     = fs.readFileSync(fullPath, 'utf-8');
      const content = raw.replaceAll('{{PROJECT_NAME}}', projectName);
      result.push({ path: relativePath, content });
    }
  }

  return result;
}
