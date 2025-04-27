import * as SQLite from 'expo-sqlite';

// Database instance with initialization flag
let db;
let isInitialized = false;

// Initialize the database
const initDatabase = async () => {
  try {
    if (isInitialized) return db;
    
    // Open database connection
    db = await SQLite.openDatabaseAsync('FoodJournal.db');
    console.log('Database opened successfully');
    await db.execAsync('PRAGMA journal_mode = WAL');
    // forFOREIGN KEY
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.withTransactionAsync(async () => {

      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          email TEXT UNIQUE, 
          password TEXT
        );`
      );

      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS journals (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          userId INTEGER, 
          image TEXT, 
          description TEXT, 
          date TEXT, 
          category TEXT, 
          FOREIGN KEY(userId) REFERENCES users(id)
        );`
      );
    });

    isInitialized = true;
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Execute SQL queries with automatic initialization
const executeQuerySql = async (query, params=[]) => {
  try {
    if (!isInitialized) { 
      await initDatabase();
    }

      return await db.getAllAsync(query,params)

  } catch (error) {
    console.error('SQL Query execution error:', error);
    throw error;
  }
};

// Execute SQL DML with automatic initialization
const executeDMLSql = async (query, params=[]) => {
  try {
    if (!isInitialized) {
      await initDatabase();
    }
    
      return await db.runAsync(query, params)
  } catch (error) {
    console.error('SQL DML execution error:', error);
    throw error;
  }
};



export { initDatabase, executeQuerySql, executeDMLSql };