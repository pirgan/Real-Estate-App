#!/usr/bin/env node
/**
 * One-off migration script.
 *
 * Copies every collection from the `test` database to the `meridian` database
 * on the same Atlas cluster.  Run once, then delete this file.
 *
 * Usage:
 *   cd server
 *   node src/scripts/migrateToMeridian.js
 *
 * Safe to re-run: uses insertMany with `ordered: false` so duplicate _id errors
 * are silently skipped (existing docs in meridian are left untouched).
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

// Derive the base URI (strip any trailing database name) then append each db name.
const baseURI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/$1');

const SOURCE_DB = 'test';
const TARGET_DB = 'meridian';

async function migrate() {
  const client = new MongoClient(baseURI);
  await client.connect();
  console.log('Connected to Atlas cluster\n');

  const sourceDb = client.db(SOURCE_DB);
  const targetDb = client.db(TARGET_DB);

  const collections = await sourceDb.listCollections().toArray();

  if (collections.length === 0) {
    console.log(`No collections found in "${SOURCE_DB}". Nothing to migrate.`);
    await client.close();
    return;
  }

  console.log(`Found ${collections.length} collection(s) in "${SOURCE_DB}":\n`);

  for (const { name } of collections) {
    const docs = await sourceDb.collection(name).find({}).toArray();

    if (docs.length === 0) {
      console.log(`  ${name}: empty — skipped`);
      continue;
    }

    try {
      const result = await targetDb
        .collection(name)
        .insertMany(docs, { ordered: false });
      console.log(`  ${name}: ${result.insertedCount} / ${docs.length} documents copied`);
    } catch (err) {
      // ordered:false — err.result contains partial success details
      const inserted = err.result?.nInserted ?? 0;
      const skipped  = docs.length - inserted;
      console.log(`  ${name}: ${inserted} copied, ${skipped} already existed (skipped)`);
    }
  }

  console.log(`\nMigration complete. Database "${TARGET_DB}" is ready.`);
  await client.close();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
