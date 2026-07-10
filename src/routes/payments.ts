import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth, requireRole('admin'));

paymentsRouter.get('/', (req, res) => {
  const data = db
    .prepare(`
      SELECT p.id, p.booking_id as bookingId, u.name as clientName, p.amount, p.method, p.status, p.date
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN users u ON u.id = b.client_id
      ORDER BY p.date DESC
    `)
    .all();
  res.json({ data, total: data.length });
});

paymentsRouter.get('/stats', (req, res) => {
  const totalUsers = (db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'client'").get() as { n: number }).n;
  const totalOperators = (db.prepare('SELECT COUNT(*) as n FROM operators').get() as { n: number }).n;
  const totalBookings = (db.prepare('SELECT COUNT(*) as n FROM bookings').get() as { n: number }).n;
  const confirmedBookings = (db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status = 'confirmed'").get() as { n: number }).n;
  const pendingBookings = (db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status = 'pending'").get() as { n: number }).n;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status = 'completed'").get() as { s: number }).s;

  res.json({ totalUsers, totalOperators, totalBookings, totalRevenue, confirmedBookings, pendingBookings });
});
