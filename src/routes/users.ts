import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', (req, res) => {
  const { search, status, role } = req.query as Record<string, string | undefined>;

  let query = 'SELECT id, name, email, role, status, joined, avatar FROM users WHERE 1=1';
  const params: unknown[] = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  const rows = db.prepare(query).all(...params) as any[];
  const data = rows.map((u) => ({
    ...u,
    bookings: (db.prepare('SELECT COUNT(*) as n FROM bookings WHERE client_id = ?').get(u.id) as { n: number }).n,
  }));
  res.json({ data, total: data.length });
});

const statusSchema = z.object({ status: z.enum(['active', 'inactive', 'suspended']) });

usersRouter.patch('/:id/status', (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Estado inválido' });

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Utilizador não encontrado' });

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  const user = db.prepare('SELECT id, name, email, role, status, joined, avatar FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

usersRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Utilizador não encontrado' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Utilizador removido com sucesso' });
});
