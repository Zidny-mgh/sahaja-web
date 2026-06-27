import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT as any, getMe as any);

export default router;
