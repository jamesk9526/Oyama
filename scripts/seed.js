const { runMigrations } = require('../lib/db/migrations.ts');
const { seedDatabase } = require('../lib/db/seed.ts');

try {
  runMigrations();
  seedDatabase();
  process.exit(0);
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}
