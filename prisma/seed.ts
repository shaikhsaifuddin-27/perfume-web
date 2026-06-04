import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@maisonelara.com' },
    update: {},
    create: {
      email: 'admin@maisonelara.com',
      name: 'Maison Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', adminUser.email);

  const category1 = await prisma.category.upsert({
    where: { name: 'Signature' },
    update: {},
    create: { name: 'Signature', description: 'Our core collection.' },
  });

  const category2 = await prisma.category.upsert({
    where: { name: 'Élixir' },
    update: {},
    create: { name: 'Élixir', description: 'Intense and concentrated.' },
  });

  const category3 = await prisma.category.upsert({
    where: { name: 'Les Exclusifs' },
    update: {},
    create: { name: 'Les Exclusifs', description: 'Rare and limited editions.' },
  });

  const p1 = await prisma.product.upsert({
    where: { name: 'Noir Absolu' },
    update: {
      isBestSeller: true,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: 'Noir Absolu',
      tagline: 'The essence of midnight',
      description: 'A deep, complex fragrance built around rare black orchids and smoked vanilla. Noir Absolu is our darkest composition, designed for those who command the room. It lingers for hours, leaving an unforgettable, hypnotic trail.',
      ingredients: 'Alcohol Denat., Fragrance (Parfum), Water (Aqua), Benzyl Salicylate, Linalool, Hexyl Cinnamal, Coumarin.',
      image: '/product_noir.png',
      badge: 'Best Seller',
      isBestSeller: true,
      isActive: true,
      categoryId: category1.id,
      sizes: {
        create: [
          { ml: 30, price: 185 },
          { ml: 50, price: 245 },
          { ml: 100, price: 340 },
        ]
      },
      notes: {
        create: [
          { name: 'Black Orchid', type: 'TOP' },
          { name: 'Bergamot', type: 'TOP' },
          { name: 'Smoked Vanilla', type: 'HEART' },
          { name: 'Dark Patchouli', type: 'HEART' },
          { name: 'Oud Wood', type: 'BASE' },
          { name: 'Leather', type: 'BASE' },
        ]
      }
    }
  });

  const p2 = await prisma.product.upsert({
    where: { name: 'Jasmine Absolue' },
    update: {
      isBestSeller: true,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: 'Jasmine Absolue',
      tagline: 'A bloom in the dark',
      description: 'Sourced from the finest night-blooming jasmine in Grasse, this luminous floral composition is grounded by warm amber and white woods. It is a study in contrasts: delicate yet powerful, innocent yet deeply sensual.',
      image: '/product_jasmine.png',
      isBestSeller: true,
      isActive: true,
      categoryId: category1.id,
      sizes: {
        create: [
          { ml: 50, price: 210 },
          { ml: 100, price: 295 },
        ]
      },
      notes: {
        create: [
          { name: 'Grasse Jasmine', type: 'HEART' },
          { name: 'White Amber', type: 'BASE' },
        ]
      }
    }
  });

  const p3 = await prisma.product.upsert({
    where: { name: 'Oud Rose Élixir' },
    update: {},
    create: {
      name: 'Oud Rose Élixir',
      tagline: 'Ancient royalty',
      description: 'A traditional Middle Eastern pairing elevated to modern luxury. We use 100% pure agarwood oil blended with Damask rose absolute. It is a rich, velvety masterpiece that commands reverence.',
      image: '/product_oud_rose.png',
      badge: 'New',
      isNew: true,
      categoryId: category2.id,
      sizes: {
        create: [
          { ml: 50, price: 340 },
          { ml: 100, price: 480 },
        ]
      },
      notes: {
        create: [
          { name: 'Damask Rose', type: 'TOP' },
          { name: 'Pure Agarwood', type: 'BASE' },
        ]
      }
    }
  });

  const p4 = await prisma.product.upsert({
    where: { name: 'Amber Nuit' },
    update: {
      isBestSeller: true,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: 'Amber Nuit',
      tagline: 'Warmth of the evening',
      description: 'A cozy, enveloping amber fragrance spiced with cardamom and softened by iris. It wraps around you like a cashmere coat on a brisk autumn evening.',
      image: '/product_amber.png',
      isBestSeller: true,
      isActive: true,
      categoryId: category1.id,
      sizes: {
        create: [
          { ml: 50, price: 195 },
          { ml: 100, price: 275 },
        ]
      },
      notes: {
        create: [
          { name: 'Cardamom', type: 'TOP' },
          { name: 'Iris', type: 'HEART' },
          { name: 'Amber', type: 'BASE' },
        ]
      }
    }
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
