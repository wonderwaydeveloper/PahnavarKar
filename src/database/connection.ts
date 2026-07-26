import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export const databaseName = 'pahnavarkar.db';

let db: SQLiteDatabase | null = null;
let dbOperationQueue: Promise<void> = Promise.resolve();

export async function getDatabase(): Promise<SQLiteDatabase> {
    if (!db) {
        db = await openDatabaseAsync(databaseName);
        await db.execAsync('PRAGMA foreign_keys = ON;');
        await db.execAsync('PRAGMA busy_timeout = 5000;');
    }

    return db;
}

export async function runWithDatabaseLock<T>(operation: (database: SQLiteDatabase) => Promise<T>): Promise<T> {
    const previous = dbOperationQueue;
    let release: (() => void) | undefined;
    const current = new Promise<void>((resolve) => {
        release = resolve;
    });

    dbOperationQueue = previous.then(() => current);

    await previous;

    try {
        const database = await getDatabase();
        return await operation(database);
    } finally {
        release?.();
    }
}
