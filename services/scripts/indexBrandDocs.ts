#!/usr/bin/env npx tsx
/**
 * Index Brand Documents into Knowledge Base
 *
 * This script reads all brand documents from the brand-knowledge folder
 * and indexes them into the knowledge base for AI grounding.
 *
 * Usage: npx tsx scripts/indexBrandDocs.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import knowledgeBase, { BrandDocument } from '../src/services/pinecone';

const BRAND_KNOWLEDGE_DIR = path.join(__dirname, '..', '..', 'brand-knowledge', 'premier-nissan');
const TRUSTEYE_KNOWLEDGE_DIR = path.join(__dirname, '..', '..', 'brand-knowledge', 'trusteye');
const BRAND_ID = 'premier-nissan';

// Map filenames to document types
const FILE_TYPE_MAP: Record<string, BrandDocument['metadata']['type']> = {
  'Brand_Voice_Guidelines.md': 'guidelines',
  'Competitor_Analysis.md': 'competitor',
  'Customer_Personas.md': 'persona',
  'Marketing_Strategy_2025.md': 'strategy',
  'Q3_Campaign_Performance_Report.md': 'report',
  'Campaign_Taxonomy.md': 'system',
  'TrustEye_Capabilities.md': 'system',
  'TrustEye_FAQ.md': 'system'
};

// Split document into chunks for better retrieval
function chunkDocument(content: string, filename: string, maxChunkSize: number = 1500): { content: string; section: string }[] {
  const chunks: { content: string; section: string }[] = [];

  // Split by headers (## or ###)
  const sections = content.split(/(?=^#{2,3}\s)/m);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;

    // Get section title from first line if it's a header
    const firstLine = lines[0].trim();
    const sectionTitle = firstLine.startsWith('#')
      ? firstLine.replace(/^#+\s*/, '')
      : filename.replace('.md', '');

    // If section is small enough, keep it as one chunk
    if (section.length <= maxChunkSize) {
      if (section.trim().length > 50) { // Skip very small chunks
        chunks.push({
          content: section.trim(),
          section: sectionTitle
        });
      }
    } else {
      // Split large sections by paragraphs
      const paragraphs = section.split(/\n\n+/);
      let currentChunk = '';

      for (const para of paragraphs) {
        if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            section: sectionTitle
          });
          currentChunk = para;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
      }

      if (currentChunk.trim().length > 50) {
        chunks.push({
          content: currentChunk.trim(),
          section: sectionTitle
        });
      }
    }
  }

  return chunks;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 Brand Document Indexing Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  // Read all brand documents from both directories
  const allFiles: { dir: string; files: string[] }[] = [];

  if (fs.existsSync(BRAND_KNOWLEDGE_DIR)) {
    const files = fs.readdirSync(BRAND_KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
    allFiles.push({ dir: BRAND_KNOWLEDGE_DIR, files });
  }

  if (fs.existsSync(TRUSTEYE_KNOWLEDGE_DIR)) {
    const files = fs.readdirSync(TRUSTEYE_KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
    allFiles.push({ dir: TRUSTEYE_KNOWLEDGE_DIR, files });
  }

  const totalFiles = allFiles.reduce((sum, { files }) => sum + files.length, 0);
  console.log(`📂 Found ${totalFiles} documents across ${allFiles.length} directories:`);
  allFiles.forEach(({ dir, files }) => {
    const dirName = path.basename(dir);
    console.log(`   ${dirName}/`);
    files.forEach(f => console.log(`     - ${f}`));
  });
  console.log();

  // Process each file into chunks
  const documents: BrandDocument[] = [];

  for (const { dir, files } of allFiles) {
    for (const filename of files) {
      const filepath = path.join(dir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const docType = FILE_TYPE_MAP[filename] || 'general';

      // Chunk the document
      const chunks = chunkDocument(content, filename);

      console.log(`📄 ${filename}: ${chunks.length} chunks`);

      // Create document entries for each chunk
      chunks.forEach((chunk, i) => {
        documents.push({
          id: `${BRAND_ID}:${filename.replace('.md', '')}:${i}`,
          content: chunk.content,
          metadata: {
            filename,
            brandId: BRAND_ID,
            type: docType,
            section: chunk.section,
            lastUpdated: new Date().toISOString()
          }
        });
      });
    }
  }

  console.log();
  console.log(`📊 Total chunks to index: ${documents.length}`);
  console.log();
  console.log('🔄 Indexing documents into Pinecone...');
  console.log();

  // Index all documents
  try {
    const success = await knowledgeBase.indexDocuments(documents);

    if (success) {
      console.log();
      console.log('✅ Indexing complete!');

      // Get stats
      const stats = await knowledgeBase.getIndexStats();
      if (stats) {
        console.log(`📈 Knowledge base stats: ${stats.vectorCount} documents indexed`);
      }

      // Test query
      console.log();
      console.log('🔍 Testing query: "brand voice"');
      const results = await knowledgeBase.queryContext('What is the Premier Nissan brand voice?', 3);
      console.log(`   Found ${results.length} results:`);
      results.forEach((r, i) => {
        console.log(`   ${i + 1}. [${r.metadata.filename}] ${r.metadata.section} (score: ${r.score.toFixed(3)})`);
      });

      console.log();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Phase I1 Complete: Knowledge base setup done!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.error('❌ Indexing failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during indexing:', error);
    process.exit(1);
  }
}

main();
