const { runMigrations } = require('../lib/db/migrations.ts');

try {
  runMigrations();
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
