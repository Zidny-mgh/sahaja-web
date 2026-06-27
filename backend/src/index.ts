import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import adminRoutes from './routes/adminRoutes';
import prisma from './prisma';
import bcrypt from 'bcrypt';
import { Role, Prisma } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-seed function to ensure Services & Products exist in the DB
async function seedDatabase() {
  try {
    console.log('Seeding/updating default services...');
    const servicesData = [
      {
        id: 's1',
        name: 'Terapi Totok Punggung',
        description: 'Terapi menyeluruh pada bagian punggung untuk menstimulasi saraf dan mengurai sumbatan aliran darah.',
        price: new Prisma.Decimal(200000),
        durationMin: 60,
        isActive: true
      },
      {
        id: 's2',
        name: 'Terapi Totok Punggung + Bekam',
        description: 'Kombinasi terapi totok punggung dengan bekam syar\'i untuk melancarkan sirkulasi darah dan mengeluarkan angin.',
        price: new Prisma.Decimal(340000),
        durationMin: 60,
        isActive: true
      },
      {
        id: 's3',
        name: 'Terapi Totok Anak (Di bawah 5 Tahun)',
        description: 'Terapi totok punggung lembut yang dirancang khusus untuk mengoptimalkan tumbuh kembang anak di bawah 5 tahun.',
        price: new Prisma.Decimal(250000),
        durationMin: 45,
        isActive: true
      }
    ];

    for (const service of servicesData) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          description: service.description,
          price: service.price,
          durationMin: service.durationMin,
          isActive: service.isActive
        },
        create: service
      });
    }
    console.log('Default services seeded/updated successfully!');

    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log('Seeding default products...');
      await prisma.product.createMany({
        data: [
          {
            id: 'p1',
            name: 'Minyak Herba Sinergi',
            price: 45000,
            benefits: 'Meredakan pegal linu dan otot tegang saat terapi.',
            composition: 'Rempah alami Pilihan',
            usageGuide: 'Oleskan secukupnya pada bagian yang pegal.',
            isActive: true
          },
          {
            id: 'p2',
            name: 'Madu Murni Sahaja',
            price: 85000,
            benefits: 'Memulihkan stamina dan kekebalan tubuh pasca terapi.',
            composition: 'Madu hutan murni',
            usageGuide: 'Minum 2 sendok makan setiap pagi.',
            isActive: true
          },
          {
            id: 'p3',
            name: 'Teh Herbal Rempah',
            price: 35000,
            benefits: 'Detoksifikasi alami sisa sumbatan tubuh.',
            composition: 'Rempah rempah pilihan',
            usageGuide: 'Seduh dengan air panas.',
            isActive: true
          }
        ]
      });
      console.log('Default products seeded successfully!');
    }

    // Seed default admin user
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN }
    });
    if (adminCount === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          fullName: 'Super Admin',
          phoneNumber: '0888111222',
          password: hashedPassword,
          role: Role.ADMIN,
          isProfileComplete: true
        }
      });
      console.log('Default admin user seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// CORS configuration to allow access from Front-End (Vite running on port 5173)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Routes registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', patientRoutes);

app.get('/', (req, res) => {
  res.send('Server Back-End Totok Punggung Sahaja berjalan.');
});

// Basic Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Terjadi kesalahan internal pada server.',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Seed database then start listening
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server Back-End berjalan di port ${PORT}`);
  });
});

