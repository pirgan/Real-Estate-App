#!/usr/bin/env node
/**
 * Checks every .env value by actually connecting to each service.
 * Run once to verify credentials: node src/scripts/checkEnv.js
 * Safe to delete afterwards.
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';
import { v2 as cloudinary } from 'cloudinary';

const OK   = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m!\x1b[0m';

function check(label, value, pattern) {
  if (!value) {
    console.log(`${FAIL}  ${label}: MISSING`);
    return false;
  }
  if (pattern && !pattern.test(value)) {
    console.log(`${WARN}  ${label}: present but format looks wrong → ${value.slice(0, 20)}…`);
    return false;
  }
  return true;
}

// ── 1. Format checks (no network) ─────────────────────────────────────────
console.log('\n── Format checks ─────────────────────────────────────────');
check('MONGODB_URI',            process.env.MONGODB_URI,            /^mongodb(\+srv)?:\/\/.+\/.+/);
check('ANTHROPIC_API_KEY',      process.env.ANTHROPIC_API_KEY,      /^sk-ant-/);
check('JWT_SECRET',             process.env.JWT_SECRET,             /.{8,}/);
check('CLOUDINARY_CLOUD_NAME',  process.env.CLOUDINARY_CLOUD_NAME,  /\S+/);
check('CLOUDINARY_API_KEY',     process.env.CLOUDINARY_API_KEY,     /^\d+$/);
check('CLOUDINARY_API_SECRET',  process.env.CLOUDINARY_API_SECRET,  /\S{10,}/);
check('PORT',                   process.env.PORT,                   /^\d+$/);
console.log('  (format checks done)\n');

// ── 2. MongoDB ─────────────────────────────────────────────────────────────
process.stdout.write('── MongoDB Atlas ──────────────────────────────────────────\n');
try {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db   = client.db();
  const name = db.databaseName;
  const cols = await db.listCollections().toArray();
  console.log(`${OK}  Connected to database: "${name}"`);
  console.log(`     Collections: ${cols.length ? cols.map(c => c.name).join(', ') : '(none yet)'}`);
  await client.close();
} catch (err) {
  console.log(`${FAIL}  MongoDB connection failed: ${err.message}`);
}

// ── 3. Anthropic ───────────────────────────────────────────────────────────
console.log('\n── Anthropic Claude ───────────────────────────────────────');
try {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',   // cheapest model for the ping
    max_tokens: 5,
    messages: [{ role: 'user', content: 'Hi' }],
  });
  console.log(`${OK}  API key valid — model responded (${msg.usage.input_tokens} input tokens used)`);
} catch (err) {
  console.log(`${FAIL}  Anthropic API failed: ${err.message}`);
}

// ── 4. Cloudinary ──────────────────────────────────────────────────────────
console.log('\n── Cloudinary ─────────────────────────────────────────────');
try {
  cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
  });
  const result = await cloudinary.api.ping();
  console.log(`${OK}  Cloudinary reachable — status: ${result.status}`);
} catch (err) {
  console.log(`${FAIL}  Cloudinary failed: ${err.message}`);
}

// ── 5. JWT secret quality ──────────────────────────────────────────────────
console.log('\n── JWT Secret ─────────────────────────────────────────────');
const secret = process.env.JWT_SECRET ?? '';
if (secret.length < 32) {
  console.log(`${WARN}  JWT_SECRET is only ${secret.length} chars — recommend ≥ 32 for production`);
} else {
  console.log(`${OK}  JWT_SECRET length: ${secret.length} chars`);
}

console.log('\n───────────────────────────────────────────────────────────\n');
