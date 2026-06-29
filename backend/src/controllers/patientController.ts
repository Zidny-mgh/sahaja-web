import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../prisma';
import { BookingStatus, Gender, TimeSlot } from '@prisma/client';
import { sendAdminNotification } from '../utils/email';

// 1. Ambil Profil Pasien
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const patient = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Profil pasien tidak ditemukan.' });
    }

    const { password: _, ...patientWithoutPassword } = patient;
    return res.json({ patient: patientWithoutPassword });
  } catch (error: any) {
    console.error('getProfile Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data profil.' });
  }
};

// 2. Update Profil Pasien
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const { birthDate, gender, mainAddress, phoneNumber, fullName } = req.body;

    // Persiapkan data update
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) {
      // Cek apakah nomor telepon sudah digunakan user lain
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          NOT: { id: req.user.id },
        },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Nomor telepon sudah digunakan oleh akun lain.' });
      }
      updateData.phoneNumber = phoneNumber;
    }

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }
    if (gender) {
      if (!Object.values(Gender).includes(gender)) {
        return res.status(400).json({ message: 'Jenis kelamin tidak valid.' });
      }
      updateData.gender = gender;
    }
    if (mainAddress) {
      updateData.mainAddress = mainAddress;
    }

    // Ambil profil saat ini untuk kalkulasi isProfileComplete
    const currentProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentProfile) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Hitung apakah profil lengkap
    const finalBirthDate = updateData.birthDate || currentProfile.birthDate;
    const finalGender = updateData.gender || currentProfile.gender;
    const finalMainAddress = updateData.mainAddress || currentProfile.mainAddress;

    const isComplete = !!(finalBirthDate && finalGender && finalMainAddress);
    updateData.isProfileComplete = isComplete;

    // Lakukan update database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.json({
      message: 'Profil berhasil diperbarui.',
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('updateProfile Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui profil.' });
  }
};

// 3. Buat Booking Baru
export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const { serviceId, scheduledDate, scheduledTime, therapyAddress, productIds } = req.body;

    // 1. Validasi Input Dasar
    if (!serviceId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'Service, tanggal, dan jam wajib diisi.' });
    }

    // Cek format enum TimeSlot
    if (!Object.values(TimeSlot).includes(scheduledTime)) {
      return res.status(400).json({ message: 'Slot jam tidak valid.' });
    }

    // Parse Tanggal
    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Format tanggal tidak valid.' });
    }

    // Batasi tidak boleh memilih tanggal lampau (hari kemarin)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(parsedDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      return res.status(400).json({ message: 'Tidak dapat memesan jadwal untuk tanggal lampau.' });
    }

    // 2. Dapatkan data Pasien untuk validasi kelengkapan profil & alamat fallback
    const patient = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Data pasien tidak ditemukan.' });
    }

    if (!patient.isProfileComplete) {
      return res.status(400).json({
        message: 'Profil Anda belum lengkap. Silakan lengkapi profil (Tanggal Lahir, Jenis Kelamin, Alamat) terlebih dahulu untuk melakukan booking.',
      });
    }

    // Tentukan alamat terapi
    const finalAddress = therapyAddress || patient.mainAddress;
    if (!finalAddress) {
      return res.status(400).json({ message: 'Alamat terapi wajib diisi atau diset di profil.' });
    }

    // 3. Cari Data Layanan (Service)
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan atau tidak aktif.' });
    }

    // Load products
    let productsTotal = 0;
    let selectedProducts: any[] = [];
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      selectedProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        }
      });
      productsTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);
    }

    // 4. Validasi Ketersediaan Jadwal & Terapis Dinamis
    // Safe conversion of date to Indonesian day name
    const dateObj = new Date(parsedDate);
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daysIndo[dateObj.getDay()];

    const activeTherapists = await prisma.therapist.findMany({
      where: {
        isActive: true,
        gender: patient.gender || undefined,
        OR: [
          { dayOff: null },
          {
            NOT: {
              dayOff: {
                equals: dayName,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
    });
    const totalCapacity = activeTherapists.length;

    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookingsInSlotCount = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        scheduledTime,
        status: {
          not: BookingStatus.DIBATALKAN,
        },
        patient: {
          gender: patient.gender,
        },
      },
    });

    if (bookingsInSlotCount >= totalCapacity) {
      return res.status(400).json({
        message: 'Maaf, slot untuk jadwal ini sudah penuh.',
      });
    }

    // 5. Generate Kode Booking unik (TPS-YYYYMMDD-XXXX)
    const dateFormatted = parsedDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Hitung jumlah booking hari ini untuk sequence generator
    const randomSequence = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `TPS-${dateFormatted}-${randomSequence}`;

    const totalAmount = Number(service.price) + productsTotal;

    // 6. Buat Transaksi Booking baru
    const newBooking = await prisma.booking.create({
      data: {
        bookingCode,
        patientId: req.user.id,
        serviceId,
        scheduledDate: parsedDate,
        scheduledTime,
        therapyAddress: finalAddress,
        status: BookingStatus.MENUNGGU_KONFIRMASI_ADMIN,
        servicePriceSnapshot: service.price,
        productsTotalSnapshot: productsTotal,
        totalAmount: totalAmount,
        payment: {
          create: {
            amount: totalAmount,
            method: 'QRIS',
            status: 'PAID',
          },
        },
        bookingProducts: {
          create: selectedProducts.map(p => ({
            productId: p.id,
            priceAtPurchase: p.price,
            quantity: 1,
          })),
        },
      },
      include: {
        service: true,
      },
    });

    // Kirim notifikasi email ke Admin secara async (fire-and-forget)
    sendAdminNotification(
      {
        serviceName: newBooking.service?.name || 'Terapi Totok Punggung',
        scheduledDate: newBooking.scheduledDate,
        scheduledTime: newBooking.scheduledTime,
        totalAmount: Number(newBooking.totalAmount),
      },
      patient.fullName || 'Pasien',
      patient.phoneNumber
    ).catch(err => {
      console.error('[EmailNotification] Async notification error:', err);
    });

    return res.status(201).json({
      message: 'Booking berhasil dibuat dan pembayaran terkonfirmasi.',
      booking: newBooking,
    });
  } catch (error: any) {
    console.error('createBooking Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server saat membuat booking.' });
  }
};

// 4. Ambil Daftar Booking Pasien
export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const { type } = req.query;

    let statusCondition: any = undefined;
    if (type === 'active') {
      statusCondition = {
        notIn: [BookingStatus.SELESAI, BookingStatus.DIBATALKAN],
      };
    } else if (type === 'history') {
      statusCondition = {
        in: [BookingStatus.SELESAI, BookingStatus.DIBATALKAN],
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        patientId: req.user.id,
        status: statusCondition,
      },
      include: {
        service: true,
        therapist: {
          select: {
            fullName: true,
          },
        },
        therapyProgress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ bookings });
  } catch (error: any) {
    console.error('getBookings Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar booking.' });
  }
};

// 6. Cek Ketersediaan Slot Terapi (Dynamic Scheduling)
export const getAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Tanggal wajib diisi (?date=YYYY-MM-DD).' });
    }

    const parsedDate = new Date(date as string);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Format tanggal tidak valid.' });
    }

    // Ambil data pasien untuk melihat gender
    const patient = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Profil pasien tidak ditemukan.' });
    }

    if (!patient.gender) {
      return res.status(400).json({ message: 'Gender profil Anda belum diatur. Harap lengkapi profil terlebih dahulu.' });
    }
    // Safe conversion of date to Indonesian day name
    const dateObj = new Date(parsedDate);
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daysIndo[dateObj.getDay()];

    // Ambil total terapis aktif dengan gender sama yang hari liburnya bukan hari terpilih
    const activeTherapists = await prisma.therapist.findMany({
      where: {
        isActive: true,
        gender: patient.gender,
        OR: [
          { dayOff: null },
          {
            NOT: {
              dayOff: {
                equals: dayName,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
    });
    const totalCapacity = activeTherapists.length;

    // Hitung booking aktif hari ini untuk gender sama
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: BookingStatus.DIBATALKAN,
        },
        patient: {
          gender: patient.gender,
        },
      },
      select: {
        scheduledTime: true,
      },
    });

    // Petakan ketersediaan per slot
    const slots = Object.values(TimeSlot);
    const availability: Record<string, { available: boolean; remaining: number }> = {};

    slots.forEach(slot => {
      const bookingsInSlot = bookings.filter(b => b.scheduledTime === slot).length;
      const remaining = Math.max(0, totalCapacity - bookingsInSlot);
      availability[slot] = {
        available: remaining > 0,
        remaining,
      };
    });

    return res.json({ availability });
  } catch (error: any) {
    console.error('getAvailability Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memeriksa ketersediaan jadwal.' });
  }
};

// 5. Ambil Daftar Produk Aktif (Pasien)
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ products });
  } catch (error: any) {
    console.error('getProducts Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data produk.' });
  }
};

// 7. Reschedule Booking (Pasien)
export const rescheduleBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }

    const bookingId = req.params.id as string;
    const { scheduledDate, scheduledTime } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'Tanggal dan waktu baru wajib diisi.' });
    }

    // Cek format enum TimeSlot
    if (!Object.values(TimeSlot).includes(scheduledTime)) {
      return res.status(400).json({ message: 'Slot jam tidak valid.' });
    }

    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Format tanggal tidak valid.' });
    }

    // Ambil data booking saat ini
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: true,
        service: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    }

    // Pastikan booking milik user bersangkutan
    if (booking.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk mereschedule booking ini.' });
    }

    // Update booking ke database
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        scheduledDate: parsedDate,
        scheduledTime,
        status: BookingStatus.MENUNGGU_KONFIRMASI_ADMIN,
      },
      include: {
        service: true,
        patient: true,
      },
    }) as any;

    // Kirim email notifikasi ke admin secara async
    sendAdminNotification(
      {
        serviceName: updatedBooking.service?.name || 'Terapi Totok Punggung',
        scheduledDate: updatedBooking.scheduledDate,
        scheduledTime: updatedBooking.scheduledTime,
        totalAmount: Number(updatedBooking.totalAmount),
      },
      updatedBooking.patient.fullName || 'Pasien',
      updatedBooking.patient.phoneNumber,
      true // parameter isReschedule = true
    ).catch(err => {
      console.error('[EmailNotification] Async reschedule notification error:', err);
    });

    return res.json({
      message: 'Jadwal berhasil diubah dan sedang menunggu konfirmasi admin.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('rescheduleBooking Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat mengubah jadwal booking.' });
  }
};

// 8. Ambil Daftar Layanan Aktif (Pasien & Publik)
export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' }
    });
    return res.json({ services });
  } catch (error: any) {
    console.error('getServices Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data layanan.' });
  }
};


