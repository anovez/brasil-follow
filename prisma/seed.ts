import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

async function main() {
  console.log('Seeding database...');

  // 1. Create admin user
  const hashedPassword = await hash('Admin@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@brasilfollow.com' },
    update: {},
    create: {
      email: 'admin@brasilfollow.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      status: 'ACTIVE',
      level: 'BRONZE',
      balance: 0,
      totalSpent: 0,
      affiliateCode: generateToken(8),
      apiKey: generateToken(32),
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // 2. Create default settings
  const defaultSettings: Array<{ key: string; value: string }> = [
    { key: 'site_name', value: 'Brasil Follow' },
    { key: 'site_url', value: 'https://brasilfollow.com' },
    { key: 'efi_client_id', value: '' },
    { key: 'efi_client_secret', value: '' },
    { key: 'efi_pix_key', value: '' },
    { key: 'efi_sandbox', value: 'true' },
    { key: 'affiliate_enabled', value: 'true' },
    { key: 'affiliate_percentage', value: '5' },
    { key: 'min_deposit', value: '5.00' },
    { key: 'default_currency', value: 'BRL' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'cron_secret', value: generateToken(32) },
    { key: 'google_client_id', value: '' },
    { key: 'google_client_secret', value: '' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }

  console.log(`${defaultSettings.length} settings created.`);

  // 3. Create sample categories
  const categories: Array<{ name: string; slug: string; sortOrder: number }> = [
    { name: 'Instagram Seguidores', slug: 'instagram-seguidores', sortOrder: 1 },
    { name: 'Instagram Curtidas', slug: 'instagram-curtidas', sortOrder: 2 },
    { name: 'Instagram Visualizações', slug: 'instagram-visualizacoes', sortOrder: 3 },
    { name: 'Instagram Comentários', slug: 'instagram-comentarios', sortOrder: 4 },
    { name: 'TikTok Seguidores', slug: 'tiktok-seguidores', sortOrder: 5 },
    { name: 'TikTok Curtidas', slug: 'tiktok-curtidas', sortOrder: 6 },
    { name: 'TikTok Visualizações', slug: 'tiktok-visualizacoes', sortOrder: 7 },
    { name: 'YouTube Inscritos', slug: 'youtube-inscritos', sortOrder: 8 },
    { name: 'YouTube Visualizações', slug: 'youtube-visualizacoes', sortOrder: 9 },
    { name: 'YouTube Curtidas', slug: 'youtube-curtidas', sortOrder: 10 },
    { name: 'Twitter/X Seguidores', slug: 'twitter-seguidores', sortOrder: 11 },
    { name: 'Twitter/X Curtidas', slug: 'twitter-curtidas', sortOrder: 12 },
    { name: 'Facebook Curtidas', slug: 'facebook-curtidas', sortOrder: 13 },
    { name: 'Facebook Seguidores', slug: 'facebook-seguidores', sortOrder: 14 },
    { name: 'Telegram Membros', slug: 'telegram-membros', sortOrder: 15 },
    { name: 'Spotify Plays', slug: 'spotify-plays', sortOrder: 16 },
    { name: 'Kwai Seguidores', slug: 'kwai-seguidores', sortOrder: 17 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`${categories.length} categories created.`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
