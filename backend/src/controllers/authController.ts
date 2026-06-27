import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'sahaja_super_secret_key_12345';
const JWT_EXPIRES_IN = '1h'; // short-lived access token
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'sahaja_refresh_secret_key_12345';

// Helper to generate access token
const generateAccessToken = (userId: string, role: Role, phoneNumber: string) => {
  return jwt.sign({ id: userId, role, phoneNumber }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper to generate refresh token
const generateRefreshToken = (userId: string, role: Role, phoneNumber: string) => {
  return jwt.sign({ id: userId, role, phoneNumber }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, phoneNumber, password } = req.body;

    // 1. Validasi Input
    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Semua field (Nama, No Telepon, Password) wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    // 2. Validasi Nomor Telepon Unik
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Nomor telepon sudah terdaftar.' });
    }

    // 3. Hash Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Buat User Baru (Role Default: PASIEN)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        phoneNumber,
        password: hashedPassword,
        role: Role.PASIEN,
        isProfileComplete: false,
      },
    });

    // 5. Generate Tokens
    const accessToken = generateAccessToken(newUser.id, newUser.role, newUser.phoneNumber);
    const refreshToken = generateRefreshToken(newUser.id, newUser.role, newUser.phoneNumber);

    // 6. Set Refresh Token/Access Token di HttpOnly Cookies (Opsional tapi direkomendasikan PRD)
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000, // 1 jam
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      sameSite: 'lax',
    });

    // 7. Respon sukses
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      message: 'Registrasi berhasil.',
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, password } = req.body;

    // 1. Validasi Input
    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Nomor telepon dan password wajib diisi.' });
    }

    // 2. Cari User berdasarkan Nomor Telepon
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return res.status(401).json({ message: 'Nomor telepon atau password salah.' });
    }

    // 3. Bandingkan Password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Nomor telepon atau password salah.' });
    }

    // 4. Generate Tokens
    const accessToken = generateAccessToken(user.id, user.role, user.phoneNumber);
    const refreshToken = generateRefreshToken(user.id, user.role, user.phoneNumber);

    // 5. Set HttpOnly Cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000, // 1 jam
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      sameSite: 'lax',
    });

    // 6. Respon sukses
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      message: 'Login berhasil.',
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logout berhasil.' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data user.' });
  }
};

