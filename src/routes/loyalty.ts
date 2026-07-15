import { Router } from 'express';
import { db, KZ_PER_POINT_EARNED, KZ_PER_POINT_REDEEMED } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const loyaltyRouter = Router();

loyaltyRouter.use(requireAuth);

// GET /loyalty — saldo de pontos do utilizador autenticado e as regras do programa
loyaltyRouter.get('/', (req, res) => {
  const row = db.prepare('SELECT points FROM users WHERE id = ?').get(req.auth!.id) as { points: number } | undefined;
  res.json({
    points: row?.points ?? 0,
    kzPerPointRedeemed: KZ_PER_POINT_REDEEMED,
    kzPerPointEarned: KZ_PER_POINT_EARNED,
  });
});
