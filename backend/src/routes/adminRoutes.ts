import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  getDashboardSummary,
  getAllBookings,
  updateBookingStatus,
  assignTherapist,
  createProgressNote,
  getTherapists,
  createTherapist,
  updateTherapist,
  deleteTherapist,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCompanyProfile,
  updateCompanyProfile,
  createService,
  updateService,
  deleteService,
} from '../controllers/adminController';

const router = Router();

// Apply JWT authentication and Admin role check globally to all admin routes
router.use(authenticateJWT as any);
router.use(requireRole([Role.ADMIN]) as any);

// Dashboard Summary
router.get('/dashboard/summary', getDashboardSummary as any);

// Bookings & Assignments
router.get('/bookings', getAllBookings as any);
router.put('/bookings/:id/status', updateBookingStatus as any);
router.put('/bookings/:id/assign-therapist', assignTherapist as any);
router.post('/bookings/:id/progress-note', createProgressNote as any);

// Therapist Management
router.get('/therapists', getTherapists as any);
router.post('/therapists', createTherapist as any);
router.put('/therapists/:id', updateTherapist as any);
router.delete('/therapists/:id', deleteTherapist as any);

// Product Management
router.get('/products', getProducts as any);
router.post('/products', createProduct as any);
router.put('/products/:id', updateProduct as any);
router.delete('/products/:id', deleteProduct as any);

// Company Profile Management
router.get('/company-profile', getCompanyProfile as any);
router.put('/company-profile', updateCompanyProfile as any);

// Service Management
router.post('/services', createService as any);
router.put('/services/:id', updateService as any);
router.delete('/services/:id', deleteService as any);

export default router;
