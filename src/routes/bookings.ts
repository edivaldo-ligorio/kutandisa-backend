import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const bookingsRouter = Router();

const bookingSelect = `
  SELECT
    b.id, b.client_id as clientId, u.name as clientName,
    b.destination_id as destinationId, d.name as destination,
    b.operator_id as operatorId, o.name as operator,
    b.date, b.status, b.amount, b.people
  FROM bookings b
  JOIN users u ON u.id = b.client_id
  JOIN destinations d ON d.id = b.destination_id
  LEFT JOIN operators o ON o.id = b.operator_id
`;

// GET /bookings — clientes veem só as suas, operadores/admins veem todas (ou filtram por status)
bookingsRouter.get('/', requireAuth, (req, res) => {
  const { status } = req.query as Record<string, string | undefined>;
  const { id, role } = req.auth!;

  let query = bookingSelect + ' WHERE 1=1';
  const params: unknown[] = [];

  if (role === 'client') {
    query += ' AND b.client_id = ?';
    params.push(id);
  }
  if (role === 'operator') {
    const op = db.prepare('SELECT id FROM operators WHERE user_id = ?').get(id) as { id: number } | undefined;
    query += ' AND b.operator_id = ?';
    params.push(op?.id ?? -1);
  }
  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }
  query += ' ORDER BY b.created_at DESC';

  const data = db.prepare(query).all(...params);
  res.json({ data, total: data.length });
});

const createSchema = z.object({
  destinationId: z.number().int().positive(),
  operatorId: z.number().int().positive().optional(),
  date: z.string().min(1),
  amount: z.number().nonnegative(),
  people: z.number().int().positive().default(1),
});

// POST /bookings — só clientes autenticados criam reservas para si próprios
bookingsRouter.post('/', requireAuth, requireRole('client'), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  }
  const { destinationId, operatorId, date, amount, people } = parsed.data;

  const dest = db.prepare('SELECT id FROM destinations WHERE id = ?').get(destinationId);
  if (!dest) return res.status(404).json({ error: 'Destino não encontrado' });

  const info = db
    .prepare('INSERT INTO bookings (client_id, destination_id, operator_id, date, status, amount, people) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.auth!.id, destinationId, operatorId ?? null, date, 'pending', amount, people);

  const booking = db.prepare(bookingSelect + ' WHERE b.id = ?').get(info.lastInsertRowid);
  res.status(201).json(booking);
});

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

// PATCH /bookings/:id/status — operador dono ou admin confirma/cancela
bookingsRouter.patch('/:id/status', requireAuth, requireRole('operator', 'admin'), (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as { operator_id: number | null } | undefined;
  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada' });

  if (req.auth!.role === 'operator') {
    const op = db.prepare('SELECT id FROM operators WHERE user_id = ?').get(req.auth!.id) as { id: number } | undefined;
    if (!op || existing.operator_id !== op.id) {
      return res.status(403).json({ error: 'Não podes alterar reservas de outro operador' });
    }
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  const booking = db.prepare(bookingSelect + ' WHERE b.id = ?').get(req.params.id);
  res.json({ booking });
});
