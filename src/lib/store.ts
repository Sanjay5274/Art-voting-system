import fs from 'fs';
import path from 'path';
import { query, isDatabaseConfigured } from './neon';

export interface DrawingItem {
  id: string;
  drawing_number: string;
  drawing_title: string;
  image_path: string;
  votes: number;
  liked_by?: string;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'drawings.json');

function ensureLocalDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch {
    // Ignore on read-only environments
  }
}

function getLocalDrawings(): DrawingItem[] {
  ensureLocalDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        return items.sort((a, b) => a.drawing_number.localeCompare(b.drawing_number));
      }
    }
  } catch (err) {
    console.error('Error reading local drawings:', err);
  }
  return [];
}

function saveLocalDrawings(drawings: DrawingItem[]): void {
  try {
    ensureLocalDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(drawings, null, 2), 'utf-8');
  } catch {
    // Ignore on read-only environments
  }
}

export function parseLikedBy(likedBy?: string): string[] {
  if (!likedBy) return [];
  return likedBy
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatLikedBy(names: string[]): string {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    const key = n.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(n.trim());
    }
  }
  return unique.join(', ');
}

export async function getAllDrawings(): Promise<DrawingItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await query<DrawingItem>(
        `SELECT id, drawing_number, drawing_title, image_path, votes, COALESCE(liked_by, '') as liked_by, created_at 
         FROM drawings 
         ORDER BY drawing_number ASC`
      );
      return rows;
    } catch (err) {
      console.error('Neon query failed, falling back to local store:', err);
    }
  }
  return getLocalDrawings();
}

export async function addDrawings(
  newFiles: Array<{ filename?: string; image_path: string; title?: string }>
): Promise<DrawingItem[]> {
  const current = await getAllDrawings();

  // Find max sequence
  let maxSeq = 0;
  for (const item of current) {
    const match = item.drawing_number.match(/^DRW-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }

  const added: DrawingItem[] = [];

  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    maxSeq++;
    const drawingNumber = `DRW-${String(maxSeq).padStart(3, '0')}`;
    const item: DrawingItem = {
      id: `drw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      drawing_number: drawingNumber,
      drawing_title: file.title || `Drawing ${drawingNumber}`,
      image_path: file.image_path,
      votes: 0,
      liked_by: '',
      created_at: new Date().toISOString(),
    };

    if (isDatabaseConfigured()) {
      try {
        await query(
          `INSERT INTO drawings (id, drawing_number, drawing_title, image_path, votes, liked_by, created_at)
           VALUES ($1, $2, $3, $4, 0, '', NOW())`,
          [item.id, item.drawing_number, item.drawing_title, item.image_path]
        );
      } catch (err) {
        console.error('Neon insert failed, saving locally:', err);
      }
    }

    added.push(item);
  }

  // Also save locally as a backup
  const allUpdated = [...current, ...added];
  saveLocalDrawings(allUpdated);

  return added;
}

export async function voteDrawing(
  id: string,
  directorName: string,
  action: 'like' | 'unlike' = 'like'
): Promise<{ success: boolean; drawing?: DrawingItem; totalVotes?: number; liked_by?: string }> {
  const cleanName = (directorName || '').trim();
  if (!cleanName) {
    return { success: false };
  }

  const current = await getAllDrawings();
  const existing = current.find((d) => d.id === id);
  if (!existing) {
    return { success: false };
  }

  let names = parseLikedBy(existing.liked_by);

  if (action === 'like') {
    const alreadyLiked = names.some((n) => n.toLowerCase() === cleanName.toLowerCase());
    if (!alreadyLiked) {
      names.push(cleanName);
    }
  } else {
    names = names.filter((n) => n.toLowerCase() !== cleanName.toLowerCase());
  }

  const newVotes = names.length;
  const newLikedBy = formatLikedBy(names);

  if (isDatabaseConfigured()) {
    try {
      const rows = await query<DrawingItem>(
        `UPDATE drawings 
         SET votes = $1, liked_by = $2 
         WHERE id = $3 
         RETURNING id, drawing_number, drawing_title, image_path, votes, liked_by, created_at`,
        [newVotes, newLikedBy, id]
      );
      if (rows && rows.length > 0) {
        return {
          success: true,
          drawing: rows[0],
          totalVotes: rows[0].votes,
          liked_by: rows[0].liked_by,
        };
      }
    } catch (err) {
      console.error('Neon vote update failed, falling back to local store:', err);
    }
  }

  // Local fallback
  const localList = getLocalDrawings();
  const localItem = localList.find((d) => d.id === id);
  if (localItem) {
    localItem.votes = newVotes;
    localItem.liked_by = newLikedBy;
    saveLocalDrawings(localList);
    return {
      success: true,
      drawing: localItem,
      totalVotes: localItem.votes,
      liked_by: localItem.liked_by,
    };
  }

  return { success: false };
}

export async function deleteDrawing(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      await query('DELETE FROM drawings WHERE id = $1', [id]);
    } catch (err) {
      console.error('Neon delete failed:', err);
    }
  }

  const current = getLocalDrawings();
  const filtered = current.filter((d) => d.id !== id);
  saveLocalDrawings(filtered);
  return true;
}

export async function clearAllDrawings(): Promise<void> {
  if (isDatabaseConfigured()) {
    try {
      await query('DELETE FROM drawings');
    } catch (err) {
      console.error('Neon clear all failed:', err);
    }
  }
  saveLocalDrawings([]);
}

export async function resetAllVotes(): Promise<void> {
  if (isDatabaseConfigured()) {
    try {
      await query("UPDATE drawings SET votes = 0, liked_by = ''");
    } catch (err) {
      console.error('Neon reset votes failed:', err);
    }
  }

  const current = getLocalDrawings();
  for (const item of current) {
    item.votes = 0;
    item.liked_by = '';
  }
  saveLocalDrawings(current);
}

export async function getLeaderboard(): Promise<Array<DrawingItem & { rank: number }>> {
  const current = await getAllDrawings();
  const sorted = [...current].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.drawing_number.localeCompare(b.drawing_number);
  });

  let currentRank = 1;
  return sorted.map((item, index) => {
    if (index > 0 && item.votes < sorted[index - 1].votes) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });
}
