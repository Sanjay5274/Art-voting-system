import { PublicDrawing, CompetitionSettings } from '@/types';

export const DEMO_SETTINGS: CompetitionSettings = {
  id: 1,
  competition_name: 'ArtVista Annual Drawing Competition',
  max_selections: 3,
  voting_open: true,
  results_published: false,
};

export const DEMO_CATEGORIES = [
  'Watercolor',
  'Oil Painting',
  'Charcoal Sketch',
  'Landscape',
  'Wildlife',
  'Modern Abstract',
  'Digital Art',
  'Pastel',
];

export const DEMO_DRAWINGS: PublicDrawing[] = [
  {
    id: 'demo-001',
    drawing_number: 'DRW-001',
    drawing_title: 'Sunset Over the Serene Valley',
    category: 'Watercolor',
    image_path: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T10:00:00Z').toISOString(),
  },
  {
    id: 'demo-002',
    drawing_number: 'DRW-002',
    drawing_title: 'Whispering Forest in Winter',
    category: 'Landscape',
    image_path: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T10:15:00Z').toISOString(),
  },
  {
    id: 'demo-003',
    drawing_number: 'DRW-003',
    drawing_title: 'Abstract Waves of Emotion',
    category: 'Modern Abstract',
    image_path: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T10:30:00Z').toISOString(),
  },
  {
    id: 'demo-004',
    drawing_number: 'DRW-004',
    drawing_title: 'Flight of the Blue Jay',
    category: 'Wildlife',
    image_path: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T10:45:00Z').toISOString(),
  },
  {
    id: 'demo-005',
    drawing_number: 'DRW-005',
    drawing_title: 'Golden Light on Still Waters',
    category: 'Oil Painting',
    image_path: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T11:00:00Z').toISOString(),
  },
  {
    id: 'demo-006',
    drawing_number: 'DRW-006',
    drawing_title: 'Architectural Shadows',
    category: 'Charcoal Sketch',
    image_path: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T11:15:00Z').toISOString(),
  },
  {
    id: 'demo-007',
    drawing_number: 'DRW-007',
    drawing_title: 'Neon Cyber Odyssey',
    category: 'Digital Art',
    image_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T11:30:00Z').toISOString(),
  },
  {
    id: 'demo-008',
    drawing_number: 'DRW-008',
    drawing_title: 'Spring Garden Blossom',
    category: 'Pastel',
    image_path: 'https://images.unsplash.com/photo-1576769267415-9642010aa962?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T11:45:00Z').toISOString(),
  },
  {
    id: 'demo-009',
    drawing_number: 'DRW-009',
    drawing_title: 'Quiet Harbour at Dawn',
    category: 'Watercolor',
    image_path: 'https://images.unsplash.com/photo-1582561141978-8edda9f47345?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T12:00:00Z').toISOString(),
  },
  {
    id: 'demo-010',
    drawing_number: 'DRW-010',
    drawing_title: 'Misty Alpine Ridge',
    category: 'Landscape',
    image_path: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T12:15:00Z').toISOString(),
  },
  {
    id: 'demo-011',
    drawing_number: 'DRW-011',
    drawing_title: 'Ethereal Constellation',
    category: 'Digital Art',
    image_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T12:30:00Z').toISOString(),
  },
  {
    id: 'demo-012',
    drawing_number: 'DRW-012',
    drawing_title: 'Reminiscence of Heritage',
    category: 'Oil Painting',
    image_path: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=800&auto=format&fit=crop&q=80',
    created_at: new Date('2026-11-01T12:45:00Z').toISOString(),
  },
];

// In-memory set for demo single-use voting codes
const usedDemoTokens = new Set<string>();

export function isDemoTokenUsed(code: string): boolean {
  return usedDemoTokens.has(code.toUpperCase().trim());
}

export function markDemoTokenUsed(code: string): void {
  usedDemoTokens.add(code.toUpperCase().trim());
}

