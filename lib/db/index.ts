// Database client - uses better-sqlite3 for proper persistence
import { getDatabase } from './client';

const db = getDatabase();

export default db;

