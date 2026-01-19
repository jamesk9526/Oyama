// Temporary in-memory database store
// TODO: Replace with proper SQLite implementation

type Store = {
  [key: string]: any[];
};

class InMemoryDB {
  private store: Store = {};

  prepare(sql: string) {
    // Simple mock implementation for development
    return {
      run: (...params: any[]) => ({ changes: 1 }),
      get: (...params: any[]) => undefined,
      all: (...params: any[]) => [],
    };
  }

  exec(sql: string) {
    // Mock exec
    console.log('DB exec:', sql.substring(0, 100) + '...');
  }

  pragma(pragma: string) {
    // Mock pragma
  }
}

const db = new InMemoryDB();

export default db;
