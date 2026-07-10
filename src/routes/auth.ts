import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export const authRouter = Router();

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'client' | 'operator' | 'admin';
  status: string;
  joined: string;
  avatar: string | null;
}

function toPublicUser(row: UserRow) {
  const bookingsCount = (db
    .prepare('SELECT COUNT(*) as n FROM bookings WHERE client_id = ?')
    .get(row.id) as { n: number }).n;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    joined: row.joined,
    bookings: bookingsCount,
    avatar: row.avatar ?? undefined,
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email ou password inválidos' });
  }
  const { email, password } = parsed.data;

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  if (row.status !== 'active') {
    return res.status(403).json({ error: 'Conta inativa. Contacta o suporte.' });
  }

  const token = signToken({ id: row.id, role: row.role });
  res.json({ token, user: toPublicUser(row), message: 'Login efetuado com sucesso' });
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['client', 'operator']).optional().default('client'),
});

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  }
  const { name, email, password, role } = parsed.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Este email já está registado' });
  }

  const info = db
    .prepare(`INSERT INTO users (name, email, password_hash, role, status, joined) VALUES (?, ?, ?, ?, 'active', date('now'))`)
    .run(name, email, bcrypt.hashSync(password, 10), role);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as UserRow;
  const token = signToken({ id: row.id, role: row.role });
  res.status(201).json({ token, user: toPublicUser(row), message: 'Conta criada com sucesso' });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow | undefined;
  if (!row) return res.status(404).json({ error: 'Utilizador não encontrado' });
  res.json(toPublicUser(row));
});
