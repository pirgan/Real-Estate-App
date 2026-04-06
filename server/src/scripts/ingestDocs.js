#!/usr/bin/env node
/**
 * Reads all .md files from src/data/company-docs/,
 * splits each into ~500-word chunks, and upserts into DocumentChunk collection.
 * Run once after first deploy: node src/scripts/ingestDocs.js
 */
import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import DocumentChunk from '../models/DocumentChunk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '../data/company-docs');
const CHUNK_SIZE = 500; // target words per chunk

// Splits a string of text into an array of chunks, each containing at most `size` words.
// Used to break large Markdown documents into smaller pieces suitable for RAG indexing.
function chunkText(text, size) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(' '));
  }
  return chunks;
}

// Extracts the first Markdown heading found in the given text.
// Returns the heading text (without # characters) or an empty string if none is found.
// Used to label each DocumentChunk with the section it belongs to.
function extractSection(text, chunkWords) {
  // Return the nearest heading above the chunk content
  const headingMatch = text.match(/^#+\s+(.+)/m);
  return headingMatch ? headingMatch[1] : '';
}

// Main ingestion routine. Connects to MongoDB, reads all .md files from the company-docs
// directory, splits each into ~500-word chunks, and upserts every chunk into the
// DocumentChunk collection keyed by (source, chunkIndex). Run once after first deploy.
async function ingest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith('.md'));
  let total = 0;

  for (const file of files) {
    const raw = await readFile(path.join(DOCS_DIR, file), 'utf8');
    const chunks = chunkText(raw, CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      const wordCount = chunks[i].split(/\s+/).length;
      const section = extractSection(chunks[i], chunks[i]);

      await DocumentChunk.findOneAndUpdate(
        { source: file, chunkIndex: i },
        { source: file, section, chunkIndex: i, content: chunks[i], wordCount },
        { upsert: true, new: true }
      );
      total++;
    }
    console.log(`  ${file} → ${chunks.length} chunk(s)`);
  }

  console.log(`\nIngested ${total} chunks from ${files.length} documents.`);
  await mongoose.disconnect();
}

ingest().catch((err) => {
  console.error(err);
  process.exit(1);
});
