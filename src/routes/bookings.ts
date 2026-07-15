import { Router } from 'express';
import { z } from 'zod';
import { db, KZ_PER_POINT_REDEEMED, KZ_PER_POINT_EARNED } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const bookingsRouter = Router();

const bookingSelect = `
  SELECT
    b.id, b.client_id as clientId, u.name as clientName,
    b.destination_id as destinationId, d.name as destination,
    b.operator_id as operatorId, o.name as operator,
    b.date, b.status, b.amount, b.people,
    b.points_redeemed as pointsRedeemed, b.points_earned as pointsEarned
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
  pointsToRedeem: z.number().int().nonnegative().optional().default(0),
});

// POST /bookings — só clientes autenticados criam reservas para si próprios
bookingsRouter.post('/', requireAuth, requireRole('client'), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  }
  const { destinationId, operatorId, date, amount, people, pointsToRedeem } = parsed.data;

  const dest = db.prepare('SELECT id FROM destinations WHERE id = ?').get(destinationId);
  if (!dest) return res.status(404).json({ error: 'Destino não encontrado' });

  const clientUser = db.prepare('SELECT points FROM users WHERE id = ?').get(req.auth!.id) as { points: number };

  if (pointsToRedeem > clientUser.points) {
    return res.status(400).json({ error: 'Não tens pontos suficientes para resgatar essa quantidade.' });
  }

  const discount = pointsToRedeem * KZ_PER_POINT_REDEEMED;
  const finalAmount = Math.max(0, amount - discount);

  const createBooking = db.transaction(() => {
    const info = db
      .prepare(
        'INSERT INTO bookings (client_id, destination_id, operator_id, date, status, amount, people, points_redeemed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(req.auth!.id, destinationId, operatorId ?? null, date, 'pending', finalAmount, people, pointsToRedeem);

    if (pointsToRedeem > 0) {
      db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(pointsToRedeem, req.auth!.id);
    }
    return info.lastInsertRowid;
  });

  const bookingId = createBooking();
  const booking = db.prepare(bookingSelect + ' WHERE b.id = ?').get(bookingId);
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

  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as
    | { operator_id: number | null; client_id: number; amount: number; points_redeemed: number; points_earned: number; points_settled: number; status: string }
    | undefined;
  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada' });

  if (req.auth!.role === 'operator') {
    const op = db.prepare('SELECT id FROM operators WHERE user_id = ?').get(req.auth!.id) as { id: number } | undefined;
    if (!op || existing.operator_id !== op.id) {
      return res.status(403).json({ error: 'Não podes alterar reservas de outro operador' });
    }
  }

  const newStatus = parsed.data.status;

  const applyStatusChange = db.transaction(() => {
    // Ganhar pontos ao confirmar (só uma vez por reserva)
    if (newStatus === 'confirmed' && !existing.points_settled) {
      const earned = Math.floor(existing.amount / KZ_PER_POINT_EARNED);
      db.prepare('UPDATE bookings SET status = ?, points_earned = ?, points_settled = 1 WHERE id = ?').run(
        newStatus,
        earned,
        req.params.id
      );
      if (earned > 0) {
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(earned, existing.client_id);
      }
      return;
    }

    // Cancelar: reverte pontos ganhos (se já tinha sido confirmada) e devolve pontos resgatados
    if (newStatus === 'cancelled') {
      if (existing.points_settled && existing.points_earned > 0) {
        db.prepare('UPDATE users SET points = MAX(0, points - ?) WHERE id = ?').run(existing.points_earned, existing.client_id);
      }
      if (existing.points_redeemed > 0) {
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(existing.points_redeemed, existing.client_id);
      }
      db.prepare('UPDATE bookings SET status = ?, points_earned = 0, points_settled = 0, points_redeemed = 0 WHERE id = ?').run(
        newStatus,
        req.params.id
      );
      return;
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(newStatus, req.params.id);
  });

  applyStatusChange();

  const booking = db.prepare(bookingSelect + ' WHERE b.id = ?').get(req.params.id);
  res.json({ booking });
});
