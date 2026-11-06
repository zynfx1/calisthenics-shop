import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { env } from '../config/env';
import { slugify } from '../utils/slug';

const categories = ['Pull-up Bars', 'Gymnastic Rings', 'Resistance Bands', 'Parallettes', 'Apparel'];

// price in centavos
const products = [
  { category: 'Pull-up Bars', name: 'Doorway Pull-up Bar', description: 'No-screw doorway bar, 150kg rated.', price: 129900, stock: 25 },
  { category: 'Gymnastic Rings', name: 'Wooden Gymnastic Rings', description: '32mm birch rings with adjustable straps.', price: 185000, stock: 14 },
  { category: 'Resistance Bands', name: 'Resistance Band Set (5)', description: 'Five levels, latex loop bands.', price: 89900, stock: 40 },
  { category: 'Parallettes', name: 'Wooden Parallettes', description: 'Pair of 30cm parallettes for L-sits and planche work.', price: 249900, stock: 8 },
  { category: 'Apparel', name: 'Training T-Shirt', description: 'Breathable quick-dry tee.', price: 59900, stock: 50 },
];

async function main() {
  const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'ADMIN') ON CONFLICT (email) DO NOTHING`,
    [env.ADMIN_NAME, env.ADMIN_EMAIL.toLowerCase(), hash],
  );

  for (const name of categories) {
    await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [name, slugify(name)],
    );
  }

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (category_id, name, description, price, stock)
       SELECT c.id, $2::text, $3::text, $4::int, $5::int
         FROM categories c
        WHERE c.name = $1 AND NOT EXISTS (SELECT 1 FROM products WHERE name = $2::text)`,
      [p.category, p.name, p.description, p.price, p.stock],
    );
  }

  console.log(`Seed complete. Admin: ${env.ADMIN_EMAIL}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
