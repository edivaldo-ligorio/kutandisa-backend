import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().min(2, 'Nome demasiado curto'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Assunto demasiado curto'),
  message: z.string().min(10, 'Mensagem demasiado curta'),
});

// POST /contact — guarda a mensagem de contacto
contactRouter.post('/', (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  }
  const { name, email, subject, message } = parsed.data;

  db.prepare(
    'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
  ).run(name, email, subject, message);

  res.status(201).json({ message: 'Mensagem enviada com sucesso. Entraremos em contacto brevemente.' });
});
