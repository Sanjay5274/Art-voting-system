import fs from 'fs';
import path from 'path';

export interface DrawingItem {
  id: string;
  drawing_number: string;
  drawing_title: string;
  image_path: string;
  votes: number;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'drawings.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllDrawings(): DrawingItem[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.sort((a, b) => a.drawing_number.localeCompare(b.drawing_number));
  } catch (err) {
    console.error('Error reading drawings file:', err);
    return [];
  }
}

function saveAllDrawings(drawings: DrawingItem[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(drawings, null, 2), 'utf-8');
}

export function addDrawings(
  newFiles: Array<{ filename: string; image_path: string; title?: string }>
): DrawingItem[] {
  const current = getAllDrawings();
  
  // Find the highest sequence number
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
      created_at: new Date().toISOString(),
    };
    current.push(item);
    added.push(item);
  }

  saveAllDrawings(current);
  return added;
}

export function voteDrawing(
  id: string,
  action: 'like' | 'unlike' = 'like'
): { success: boolean; drawing?: DrawingItem; totalVotes?: number } {
  const current = getAllDrawings();
  const item = current.find((d) => d.id === id);
  if (!item) {
    return { success: false };
  }
  if (action === 'unlike') {
    item.votes = Math.max(0, (item.votes || 0) - 1);
  } else {
    item.votes = (item.votes || 0) + 1;
  }
  saveAllDrawings(current);
  return { success: true, drawing: item, totalVotes: item.votes };
}

export function deleteDrawing(id: string): boolean {
  const current = getAllDrawings();
  const filtered = current.filter((d) => d.id !== id);
  if (filtered.length === current.length) return false;
  saveAllDrawings(filtered);
  return true;
}

export function clearAllDrawings(): void {
  saveAllDrawings([]);
}

export function resetAllVotes(): void {
  const current = getAllDrawings();
  for (const item of current) {
    item.votes = 0;
  }
  saveAllDrawings(current);
}

export function getLeaderboard(): Array<DrawingItem & { rank: number }> {
  const current = getAllDrawings();
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

