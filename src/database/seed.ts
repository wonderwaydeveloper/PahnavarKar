import { initDatabase, seedDatabase } from './db';
import type { SeedData } from './types';

export async function seedFromJsonAsset() {
    await initDatabase();

    const data = require('../../assets/data-source/calculator-data.json') as SeedData;

    await seedDatabase(data);
}
