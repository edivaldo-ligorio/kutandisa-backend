import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { initSchema } from './db.js';
import { authRouter } from './routes/auth.js';
import { destinationsRouter } from './routes/destinations.js';
import { bookingsRouter } from './routes/bookings.js';
import { usersRouter } from './routes/users.js';
import { operatorsRouter } from './routes/operators.js';
import { paymentsRouter } from './routes/payments.js';
import { favouritesRouter } from './routes/favourites.js';
import { contactRouter } from './routes/contact.js';
import { loyaltyRouter } from './routes/loyalty.js';

initSchema();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kutandisa-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/operators', operatorsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/favourites', favouritesRouter);
app.use('/api/contact', contactRouter);
app.use('/api/loyalty', loyaltyRouter);

// 404
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler de erros genérico
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kutandisa backend a correr em http://localhost:${PORT}/api`);
  console.log(`   CORS liberado para: ${CORS_ORIGIN}`);
});
