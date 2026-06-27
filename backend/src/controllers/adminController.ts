import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../prisma';
import { BookingStatus, Role } from '@prisma/client';

// ==========================================
// 1. DASHBOARD SUMMARY & ANALYTICS
// ==========================================
export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Total pasien terdaftar (User dengan role PASIEN)
    const totalPatients = await prisma.user.count({
      where: { role: Role.PASIEN },
    });

    // Jumlah booking berdasarkan status
    const bookingCounts = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const bookingsByStatus = {
      MENUNGGU_PEMBAYARAN: 0,
      MENUNGGU_KONFIRMASI_ADMIN: 0,
      TERAPIS_DITUGASKAN: 0,
      DALAM_PERJALANAN: 0,
      SELESAI: 0,
      DIBATALKAN: 0,
    };

    bookingCounts.forEach((group) => {
      if (group.status in bookingsByStatus) {
        bookingsByStatus[group.status as keyof typeof bookingsByStatus] = group._count._all;
      }
    });

    // Total pendapatan (Total booking dengan status pembayaran PAID)
    // Dihitung berdasarkan booking yang memiliki Payment dengan status PAID
    const paidBookings = await prisma.booking.findMany({
      where: {
        payment: {
          status: 'PAID',
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = paidBookings.reduce((sum, booking) => {
      return sum + Number(booking.totalAmount);
    }, 0);

    return res.json({
      summary: {
        totalPatients,
        bookingsByStatus,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error('getDashboardSummary Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data dashboard summary.' });
  }
};

// Get All Bookings for Admin
export const getAllBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        patient: {
          select: {
            fullName: true,
            phoneNumber: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        therapist: {
          select: {
            id: true,
            fullName: true,
          },
        },
        payment: true,
        therapyProgress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ bookings });
  } catch (error: any) {
    console.error('getAllBookings Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil seluruh daftar booking.' });
  }
};


// ==========================================
// 2. MANAJEMEN BOOKING & PENUGASAN
// ==========================================

// Validasi alur perubahan status booking
const isValidTransition = (current: BookingStatus, target: BookingStatus): boolean => {
  if (current === target) return true;
  if (current === BookingStatus.SELESAI || current === BookingStatus.DIBATALKAN) {
    return false; // Status akhir, tidak bisa diubah lagi
  }

  switch (current) {
    case BookingStatus.MENUNGGU_PEMBAYARAN:
      return target === BookingStatus.MENUNGGU_KONFIRMASI_ADMIN || target === BookingStatus.DIBATALKAN;
    case BookingStatus.MENUNGGU_KONFIRMASI_ADMIN:
      return target === BookingStatus.TERAPIS_DITUGASKAN || target === BookingStatus.DIBATALKAN;
    case BookingStatus.TERAPIS_DITUGASKAN:
      return target === BookingStatus.DALAM_PERJALANAN || target === BookingStatus.DIBATALKAN;
    case BookingStatus.DALAM_PERJALANAN:
      return target === BookingStatus.SELESAI || target === BookingStatus.DIBATALKAN;
    default:
      return false;
  }
};

// Update Status Booking Manual
export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({ message: 'Status booking tidak valid.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    }

    // Allow Super Admin full control to change status from any state to any state.


    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { fullName: true, phoneNumber: true } },
        service: true,
        therapist: true,
      },
    });

    return res.json({
      message: 'Status booking berhasil diperbarui.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('updateBookingStatus Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui status booking.' });
  }
};

// Tugaskan Terapis (Assign Therapist)
export const assignTherapist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string; // booking id
    const { therapistId } = req.body;

    if (!therapistId) {
      return res.status(400).json({ message: 'Therapist ID wajib diisi.' });
    }

    // Cek keberadaan booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    }

    // Cek keberadaan terapis yang aktif
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });

    if (!therapist || !therapist.isActive) {
      return res.status(404).json({ message: 'Terapis tidak ditemukan atau berstatus tidak aktif.' });
    }

    // Set status ke TERAPIS_DITUGASKAN apabila sebelumnya MENUNGGU_KONFIRMASI_ADMIN
    const targetStatus =
      booking.status === BookingStatus.MENUNGGU_KONFIRMASI_ADMIN
        ? BookingStatus.TERAPIS_DITUGASKAN
        : booking.status;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        therapistId,
        status: targetStatus,
      },
      include: {
        therapist: true,
      },
    });

    return res.json({
      message: `Terapis ${therapist.fullName} berhasil ditugaskan pada booking ini.`,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('assignTherapist Error:', error);
    return res.status(500).json({ message: 'Gagal menugaskan terapis.' });
  }
};

// Input Catatan Perkembangan (TherapyProgress)
export const createProgressNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string; // booking id
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: 'Catatan hasil terapi wajib diisi.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { therapyProgress: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    }

    if (booking.status !== BookingStatus.SELESAI) {
      return res.status(400).json({ message: 'Catatan perkembangan hanya bisa diinput untuk terapi yang sudah SELESAI.' });
    }

    let progress;
    if (booking.therapyProgress) {
      // Update jika sudah ada
      progress = await prisma.therapyProgress.update({
        where: { bookingId: id },
        data: {
          notes,
          adminId: req.user!.id,
        },
      });
    } else {
      // Create baru
      progress = await prisma.therapyProgress.create({
        data: {
          bookingId: id,
          patientId: booking.patientId,
          adminId: req.user!.id,
          notes,
        },
      });
    }

    return res.status(201).json({
      message: 'Catatan perkembangan hasil terapi berhasil disimpan.',
      progress,
    });
  } catch (error: any) {
    console.error('createProgressNote Error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan catatan perkembangan.' });
  }
};

// ==========================================
// 3. CRUD TERAPIS (Therapist)
// ==========================================
export const getTherapists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const therapists = await prisma.therapist.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ therapists });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal mengambil data terapis.' });
  }
};

export const createTherapist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, photoUrl, isActive, gender, dayOff } = req.body;
    if (!fullName) {
      return res.status(400).json({ message: 'Nama lengkap terapis wajib diisi.' });
    }

    const newTherapist = await prisma.therapist.create({
      data: {
        fullName,
        phoneNumber,
        photoUrl,
        isActive: isActive !== undefined ? isActive : true,
        gender: gender || undefined,
        dayOff: dayOff === 'Tidak Ada' || dayOff === '' ? null : dayOff,
      },
    });

    return res.status(201).json({
      message: 'Terapis baru berhasil ditambahkan.',
      therapist: newTherapist,
    });
  } catch (error: any) {
    console.error('createTherapist Error:', error);
    return res.status(500).json({ message: 'Gagal menambahkan terapis.' });
  }
};

export const updateTherapist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fullName, phoneNumber, photoUrl, isActive, gender, dayOff } = req.body;

    const existing = await prisma.therapist.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Terapis tidak ditemukan.' });
    }

    const updated = await prisma.therapist.update({
      where: { id },
      data: {
        fullName: fullName || existing.fullName,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existing.phoneNumber,
        photoUrl: photoUrl !== undefined ? photoUrl : existing.photoUrl,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        gender: gender !== undefined ? gender : existing.gender,
        dayOff: dayOff !== undefined ? (dayOff === 'Tidak Ada' || dayOff === '' ? null : dayOff) : existing.dayOff,
      },
    });

    return res.json({
      message: 'Data terapis berhasil diperbarui.',
      therapist: updated,
    });
  } catch (error: any) {
    console.error('updateTherapist Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data terapis.' });
  }
};

export const deleteTherapist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Untuk integritas data histori booking, kita ubah status terapis menjadi tidak aktif (Soft-delete/Deactivate)
    const updated = await prisma.therapist.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      message: 'Terapis berhasil dinonaktifkan.',
      therapist: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal menonaktifkan terapis.' });
  }
};

// ==========================================
// 4. MANAJEMEN KONTEN (Produk Herbal & Company Profile)
// ==========================================

// CRUD Produk Herbal
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ products });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal mengambil data produk.' });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, price, photoUrl, imageUrl, description, benefits, composition, usageGuide, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Nama produk dan harga wajib diisi.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        photoUrl,
        imageUrl,
        description: description || '',
        benefits,
        composition,
        usageGuide,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json({
      message: 'Produk herbal baru berhasil ditambahkan.',
      product: newProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal menambahkan produk.' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, price, photoUrl, imageUrl, description, benefits, composition, usageGuide, isActive } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        price: price !== undefined ? price : existing.price,
        photoUrl: photoUrl !== undefined ? photoUrl : existing.photoUrl,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        description: description !== undefined ? description : existing.description,
        benefits: benefits !== undefined ? benefits : existing.benefits,
        composition: composition !== undefined ? composition : existing.composition,
        usageGuide: usageGuide !== undefined ? usageGuide : existing.usageGuide,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return res.json({
      message: 'Produk berhasil diperbarui.',
      product: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal memperbarui produk.' });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Soft-deactivate produk agar tidak muncul di booking selanjutnya
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      message: 'Produk berhasil dinonaktifkan.',
      product: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal menonaktifkan produk.' });
  }
};

// Company Profile (Singleton Management)
export const getCompanyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      // Jika kosong, buat record inisiasi default pertama kali
      profile = await prisma.companyProfile.create({
        data: {
          slogan: 'Layanan Terapi Totok Punggung Terpercaya',
        },
      });
    }
    return res.json({ profile });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal mengambil data profil perusahaan.' });
  }
};

export const updateCompanyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      logoUrl,
      slogan,
      aboutText,
      heroImage,
      address,
      openingHours,
      phoneNumber,
      whatsappNumber,
      email,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
    } = req.body;

    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          logoUrl,
          slogan,
          aboutText,
          heroImage,
          address,
          openingHours,
          phoneNumber,
          whatsappNumber,
          email,
          instagramUrl,
          facebookUrl,
          tiktokUrl,
        },
      });
    } else {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          logoUrl: logoUrl !== undefined ? logoUrl : profile.logoUrl,
          slogan: slogan !== undefined ? slogan : profile.slogan,
          aboutText: aboutText !== undefined ? aboutText : profile.aboutText,
          heroImage: heroImage !== undefined ? heroImage : profile.heroImage,
          address: address !== undefined ? address : profile.address,
          openingHours: openingHours !== undefined ? openingHours : profile.openingHours,
          phoneNumber: phoneNumber !== undefined ? phoneNumber : profile.phoneNumber,
          whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : profile.whatsappNumber,
          email: email !== undefined ? email : profile.email,
          instagramUrl: instagramUrl !== undefined ? instagramUrl : profile.instagramUrl,
          facebookUrl: facebookUrl !== undefined ? facebookUrl : profile.facebookUrl,
          tiktokUrl: tiktokUrl !== undefined ? tiktokUrl : profile.tiktokUrl,
        },
      });
    }

    return res.json({
      message: 'Profil perusahaan/konten landing page berhasil diperbarui.',
      profile,
    });
  } catch (error: any) {
    console.error('updateCompanyProfile Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui profil perusahaan.' });
  }
};

// 5. CRUD Layanan Utama (Admin)
export const createService = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, durationMin, price } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama layanan wajib diisi.' });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Harga tidak valid.' });
    }
    if (durationMin === undefined || durationMin === null || isNaN(Number(durationMin))) {
      return res.status(400).json({ message: 'Durasi tidak valid.' });
    }

    const newService = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        durationMin: Number(durationMin),
        price: Number(price),
        isActive: true
      }
    });

    return res.status(201).json({
      message: 'Layanan berhasil dibuat.',
      service: newService
    });
  } catch (error: any) {
    console.error('createService Error:', error);
    return res.status(500).json({ message: 'Gagal membuat layanan baru.' });
  }
};

export const updateService = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, durationMin, price } = req.body;

    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Nama layanan tidak boleh kosong.' });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    if (durationMin !== undefined) {
      if (isNaN(Number(durationMin))) {
        return res.status(400).json({ message: 'Durasi tidak valid.' });
      }
      updateData.durationMin = Number(durationMin);
    }
    if (price !== undefined) {
      if (isNaN(Number(price))) {
        return res.status(400).json({ message: 'Harga tidak valid.' });
      }
      updateData.price = Number(price);
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData
    });

    return res.json({
      message: 'Layanan berhasil diperbarui.',
      service: updatedService
    });
  } catch (error: any) {
    console.error('updateService Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data layanan.' });
  }
};

export const deleteService = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }

    // Check if there are bookings referencing this service
    const bookingCount = await prisma.booking.count({
      where: { serviceId: id }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        message: 'Layanan tidak bisa dihapus karena sudah memiliki riwayat pemesanan.'
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    return res.json({
      message: 'Layanan berhasil dihapus.'
    });
  } catch (error: any) {
    console.error('deleteService Error:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Layanan tidak bisa dihapus karena sudah memiliki riwayat pemesanan.'
      });
    }
    return res.status(500).json({ message: 'Gagal menghapus layanan.' });
  }
};
