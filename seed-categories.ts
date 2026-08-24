import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const categories = [
  { name: 'Vegetables', slug: 'vegetables', icon_name: '🥬', sort_order: 1 },
  { name: 'Fruits', slug: 'fruits', icon_name: '🍎', sort_order: 2 },
  { name: 'Grains & Cereals', slug: 'grains-cereals', icon_name: '🌾', sort_order: 3 },
  { name: 'Pulses & Lentils', slug: 'pulses-lentils', icon_name: '🫘', sort_order: 4 },
  { name: 'Spices', slug: 'spices', icon_name: '🌶️', sort_order: 5 },
  { name: 'Dairy Products', slug: 'dairy-products', icon_name: '🥛', sort_order: 6 },
  { name: 'Oils & Ghee', slug: 'oils-ghee', icon_name: '🫒', sort_order: 7 },
  { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', icon_name: '🥜', sort_order: 8 },
  { name: 'Herbs & Leaves', slug: 'herbs-leaves', icon_name: '🌿', sort_order: 9 },
  { name: 'Flowers', slug: 'flowers', icon_name: '🌸', sort_order: 10 },
  { name: 'Seeds', slug: 'seeds', icon_name: '🌱', sort_order: 11 },
  { name: 'Organic Products', slug: 'organic-products', icon_name: '♻️', sort_order: 12 },
  { name: 'Fertilizers & Manure', slug: 'fertilizers-manure', icon_name: '🧪', sort_order: 13 },
  { name: 'Animal Feed', slug: 'animal-feed', icon_name: '🐄', sort_order: 14 },
  { name: 'Others', slug: 'others', icon_name: '📦', sort_order: 15 },
];

async function seedCategories() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Seeding default categories...\n');

    for (const cat of categories) {
      // Skip if already exists
      const check = await client.query('SELECT id FROM marketplace_categories WHERE slug = $1', [cat.slug]);
      if (check.rows.length > 0) {
        console.log(`  ⏭️  "${cat.name}" already exists`);
        continue;
      }
      await client.query(
        `INSERT INTO marketplace_categories (name, slug, sort_order, is_active) VALUES ($1, $2, $3, true)`,
        [cat.name, cat.slug, cat.sort_order]
      );
      console.log(`  ✅ "${cat.name}" added`);
    }

    console.log('\n🎉 Default categories seeded successfully!');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

seedCategories();
