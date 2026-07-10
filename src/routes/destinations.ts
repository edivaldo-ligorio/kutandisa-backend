import { Router } from 'express';
import { db } from '../db.js';

export const destinationsRouter = Router();

interface DestRow {
  id: number;
  name: string;
  province: string;
  category: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  images: string;
  lat: number | null;
  lng: number | null;
  description: string;
  highlights: string;
  bestTime: string;
  duration: string;
  difficulty: string;
}

function toPublicDest(row: DestRow) {
  return {
    ...row,
    images: JSON.parse(row.images),
    highlights: JSON.parse(row.highlights),
  };
}

destinationsRouter.get('/', (req, res) => {
  const { province, category, search } = req.query as Record<string, string | undefined>;

  let query = 'SELECT * FROM destinations WHERE 1=1';
  const params: unknown[] = [];

  if (province) {
    query += ' AND province = ?';
    params.push(province);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = db.prepare(query).all(...params) as DestRow[];
  const data = rows.map(toPublicDest);
  res.json({ data, total: data.length });
});

destinationsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id) as DestRow | undefined;
  if (!row) return res.status(404).json({ error: 'Destino não encontrado' });
  res.json(toPublicDest(row));
});
