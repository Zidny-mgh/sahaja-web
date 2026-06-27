import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const logPath = 'C:\\Users\\Din Al Fatih\\.gemini\\antigravity-ide\\brain\\71ae5cf7-ca0b-4ecb-86a4-f3e7a26b5487\\db_diagnostic.txt';
  let output = 'Starting diagnostic...\n';
  try {
    const services = await prisma.service.findMany();
    output += `Current services: ${JSON.stringify(services)}\n`;

    const res = await prisma.service.upsert({
      where: { id: 's1' },
      update: {
        name: 'Terapi Totok Punggung',
        description: 'Terapi Punggung',
        price: new Prisma.Decimal(200000),
        durationMin: 60,
        isActive: true
      },
      create: {
        id: 's1',
        name: 'Terapi Totok Punggung',
        description: 'Terapi Punggung',
        price: new Prisma.Decimal(200000),
        durationMin: 60,
        isActive: true
      }
    });
    output += `Upsert success: ${JSON.stringify(res)}\n`;
  } catch (err: any) {
    output += `Upsert error: ${err.message}\nStack: ${err.stack}\n`;
  }
  fs.writeFileSync(logPath, output);
}

main()
  .catch(async (e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
