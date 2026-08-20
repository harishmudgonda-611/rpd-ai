import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export type RPDProject = {
  id: string;
  title: string;
  productUrl: string;
  template: string;
  product: any;
  generation: any;
  slides: any[];
  createdAt: string;
  updatedAt: string;
};

const PROJECTS_DIR = join(process.cwd(), 'data', 'projects');

async function ensureDir() {
  await mkdir(PROJECTS_DIR, { recursive: true });
}

export async function listProjects(): Promise<RPDProject[]> {
  await ensureDir();
  const files = await readdir(PROJECTS_DIR);
  const projects: RPDProject[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const raw = await readFile(join(PROJECTS_DIR, file), 'utf8');
        projects.push(JSON.parse(raw));
      } catch {
        // Skip invalid file
      }
    }
  }

  return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function saveProject(project: Partial<RPDProject> & { id?: string }): Promise<RPDProject> {
  await ensureDir();
  const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let existing: RPDProject | null = null;
  const filePath = join(PROJECTS_DIR, `${id}.json`);

  try {
    const raw = await readFile(filePath, 'utf8');
    existing = JSON.parse(raw);
  } catch {
    existing = null;
  }

  const saved: RPDProject = {
    id,
    title: project.title || existing?.title || project.product?.title?.value || 'Untitled Carousel',
    productUrl: project.productUrl || existing?.productUrl || '',
    template: project.template || existing?.template || 'rpd-editorial',
    product: project.product || existing?.product || null,
    generation: project.generation || existing?.generation || null,
    slides: project.slides || existing?.slides || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await writeFile(filePath, JSON.stringify(saved, null, 2), 'utf8');
  return saved;
}

export async function getProject(id: string): Promise<RPDProject | null> {
  await ensureDir();
  const filePath = join(PROJECTS_DIR, `${id}.json`);
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  await ensureDir();
  const filePath = join(PROJECTS_DIR, `${id}.json`);
  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
