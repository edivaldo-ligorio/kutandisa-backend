import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const favouritesRouter = Router();

favouritesRouter.use(requireAuth);

const destSelect = `
  SELECT d.id, d.name, d.province, d.category, d.rating, d.reviews, d.price, d.image, d.images, d.description, d.highlights, d.bestTime, d.duration, d.difficulty
  FROM favourites f
  JOIN destinations d ON d.id = f.destination_id
  WHERE f.user_id = ?
`;

// GET /favourites — lista os destinos favoritos do utilizador autenticado
favouritesRouter.get('/', (req, res) => {
  const rows = db.prepare(destSelect).all(req.auth!.id) as any[];
  const data = rows.map((r) => ({ ...r, images: JSON.parse(r.images), highlights: JSON.parse(r.highlights) }));
  res.json({ data, total: data.length });
});

const idParamSchema = z.object({ destinationId: z.coerce.number().int().positive() });

// POST /favourites/:destinationId — adiciona aos favoritos
favouritesRouter.post('/:destinationId', (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'ID de destino inválido' });

  const dest = db.prepare('SELECT id FROM destinations WHERE id = ?').get(parsed.data.destinationId);
  if (!dest) return res.status(404).json({ error: 'Destino não encontrado' });

  db.prepare('INSERT OR IGNORE INTO favourites (user_id, destination_id) VALUES (?, ?)').run(
    req.auth!.id,
    parsed.data.destinationId
  );
  res.status(201).json({ message: 'Adicionado aos favoritos' });
});

// DELETE /favourites/:destinationId — remove dos favoritos
favouritesRouter.delete('/:destinationId', (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'ID de destino inválido' });

  db.prepare('DELETE FROM favourites WHERE user_id = ? AND destination_id = ?').run(
    req.auth!.id,
    parsed.data.destinationId
  );
  res.json({ message: 'Removido dos favoritos' });
});
