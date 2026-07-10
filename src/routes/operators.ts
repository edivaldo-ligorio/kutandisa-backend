import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const operatorsRouter = Router();

operatorsRouter.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const data = db.prepare('SELECT * FROM operators').all();
  res.json({ data, total: data.length });
});

const statusSchema = z.object({ status: z.enum(['active', 'inactive', 'suspended']) });

operatorsRouter.patch('/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Estado inválido' });

  const existing = db.prepare('SELECT id FROM operators WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Operador não encontrado' });

  db.prepare('UPDATE operators SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  const operator = db.prepare('SELECT * FROM operators WHERE id = ?').get(req.params.id);
  res.json({ operator });
});
