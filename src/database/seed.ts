import { getDatabaseUserVersion, initDatabase, seedDatabase, setDatabaseUserVersion } from './db';
import type { SeedData } from './types';

const seedVersion = 1;
let seedPromise: Promise<void> | null = null;

export async function seedFromJsonAsset() {
    if (seedPromise) {
        return seedPromise;
    }

    seedPromise = (async () => {
        await initDatabase();

        if (await getDatabaseUserVersion() >= seedVersion) {
            return;
        }

        const data = require('../../assets/data-source/calculator-data.json') as SeedData;
        await seedDatabase(data);
        await setDatabaseUserVersion(seedVersion);
    })();

    try {
        await seedPromise;
    } catch (error) {
        seedPromise = null;
        throw error;
    }
}
