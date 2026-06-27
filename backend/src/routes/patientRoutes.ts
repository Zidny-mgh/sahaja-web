import { Router } from 'express';
import { getProfile, updateProfile, createBooking, getBookings, getProducts, getAvailability, rescheduleBooking, getServices } from '../controllers/patientController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Profile endpoints
router.get('/patients/me', authenticateJWT as any, getProfile as any);
router.put('/patients/me', authenticateJWT as any, updateProfile as any);

// Booking endpoints
router.get('/patients/availability', authenticateJWT as any, getAvailability as any);
router.get('/bookings', authenticateJWT as any, getBookings as any);
router.post('/bookings', authenticateJWT as any, createBooking as any);
router.put('/bookings/:id/reschedule', authenticateJWT as any, rescheduleBooking as any);

// Product endpoints
router.get('/products', authenticateJWT as any, getProducts as any);

// Service endpoints (Public)
router.get('/services', getServices as any);

export default router;
