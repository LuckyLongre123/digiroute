import { Router } from 'express';
import { login, logout, register } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/logout', logout);

router.get('/me', verifyJWT, (req, res) => {
  res.status(200).json({ success: true, userId: req.user?.id });
});

export default router;
