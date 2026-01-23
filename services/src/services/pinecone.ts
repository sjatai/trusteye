// Knowledge Base Service
// For AI grounding with brand knowledge
// Uses in-memory storage with TF-IDF-like retrieval for the demo
// Can be upgraded to use real vector embeddings later

import fs from 'fs';
import path from 'path';
import cache from './cache';

// In-memory document store
const documentStore: Map<string, BrandDocument> = new Map();

export interface BrandDocument {
  id: string;
  content: string;
  metadata: {
    filename: string;
    brandId: string;
    type: 'guidelines' | 'competitor' | 'persona' | 'strategy' | 'report' | 'general';
    section?: string;
    lastUpdated?: string;
    // Allow additional metadata for marketing patterns
    [key: string]: string | string[] | undefined;
  };
}

export interface QueryResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

// Tokenize and normalize text
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Calculate term frequency
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

// Calculate simple relevance score between query and document
function calculateRelevance(query: string, document: string): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  const docTf = termFrequency(docTokens);

  let score = 0;
  const matchedTerms = new Set<string>();

  for (const queryToken of queryTokens) {
    // Exact match
    if (docTf.has(queryToken)) {
      score += docTf.get(queryToken)! * 2;
      matchedTerms.add(queryToken);
    }

    // Partial match (contains)
    for (const docToken of docTokens) {
      if (docToken.includes(queryToken) || queryToken.includes(docToken)) {
        if (!matchedTerms.has(docToken)) {
          score += 1;
          matchedTerms.add(docToken);
        }
      }
    }
  }

  // Normalize by document length
  const normalizedScore = score / Math.sqrt(docTokens.length + 1);

  // Boost for matching multiple query terms
  const matchRatio = matchedTerms.size / queryTokens.length;
  return normalizedScore * (1 + matchRatio);
}

// Index brand documents (stores in memory)
export async function indexDocuments(documents: BrandDocument[]): Promise<boolean> {
  try {
    // Clear existing documents for the brand
    if (documents.length > 0) {
      const brandId = documents[0].metadata.brandId;
      for (const [id] of documentStore) {
        if (id.startsWith(brandId)) {
          documentStore.delete(id);
        }
      }
    }

    // Add new documents
    for (const doc of documents) {
      documentStore.set(doc.id, doc);
    }

    console.log(`✅ Indexed ${documents.length} documents in memory`);

    // Persist to disk for demo reliability
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const storePath = path.join(dataDir, 'brand-knowledge.json');
    const storeData = Array.from(documentStore.entries());
    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2));
    console.log(`✅ Persisted to ${storePath}`);

    return true;
  } catch (error) {
    console.error('Error indexing documents:', error);
    return false;
  }
}

// Load persisted documents on startup
export function loadPersistedDocuments(): void {
  try {
    const storePath = path.join(__dirname, '..', '..', 'data', 'brand-knowledge.json');
    if (fs.existsSync(storePath)) {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      for (const [id, doc] of storeData) {
        documentStore.set(id, doc);
      }
      console.log(`📂 Loaded ${documentStore.size} documents from disk`);
    }
  } catch (error) {
    console.error('Error loading persisted documents:', error);
  }
}

// Query for relevant context
export async function queryContext(
  query: string,
  topK: number = 5,
  filter?: { brandId?: string; type?: string }
): Promise<QueryResult[]> {
  // Check cache first
  const cached = cache.knowledge.get(query, filter);
  if (cached) {
    return cached;
  }

  // Load persisted documents if store is empty
  if (documentStore.size === 0) {
    loadPersistedDocuments();
  }

  const results: QueryResult[] = [];

  for (const [id, doc] of documentStore) {
    // Apply filters
    if (filter?.brandId && doc.metadata.brandId !== filter.brandId) continue;
    if (filter?.type && doc.metadata.type !== filter.type) continue;

    const score = calculateRelevance(query, doc.content);

    if (score > 0) {
      results.push({
        id,
        score,
        content: doc.content,
        metadata: doc.metadata
      });
    }
  }

  // Sort by score descending and take top K
  results.sort((a, b) => b.score - a.score);
  const finalResults = results.slice(0, topK);

  // Cache results
  cache.knowledge.set(query, filter, finalResults);

  return finalResults;
}

// Get all documents for a brand (useful for Claude context)
export function getAllDocuments(brandId?: string): BrandDocument[] {
  if (documentStore.size === 0) {
    loadPersistedDocuments();
  }

  const docs: BrandDocument[] = [];
  for (const [, doc] of documentStore) {
    if (!brandId || doc.metadata.brandId === brandId) {
      docs.push(doc);
    }
  }
  return docs;
}

// Delete documents by filter
export async function deleteDocuments(filter: { brandId?: string }): Promise<boolean> {
  try {
    for (const [id, doc] of documentStore) {
      if (filter.brandId && doc.metadata.brandId === filter.brandId) {
        documentStore.delete(id);
      }
    }
    console.log('✅ Documents deleted');
    return true;
  } catch (error) {
    console.error('Error deleting documents:', error);
    return false;
  }
}

// Get index stats
export async function getIndexStats(): Promise<{ vectorCount: number; dimension: number }> {
  if (documentStore.size === 0) {
    loadPersistedDocuments();
  }

  return {
    vectorCount: documentStore.size,
    dimension: 0 // Not using vectors in this implementation
  };
}

// Get documents by type
export function getDocumentsByType(type: BrandDocument['metadata']['type'], brandId?: string): BrandDocument[] {
  if (documentStore.size === 0) {
    loadPersistedDocuments();
  }

  const docs: BrandDocument[] = [];
  for (const [, doc] of documentStore) {
    if (doc.metadata.type === type) {
      if (!brandId || doc.metadata.brandId === brandId) {
        docs.push(doc);
      }
    }
  }
  return docs;
}

export default {
  indexDocuments,
  queryContext,
  deleteDocuments,
  getIndexStats,
  getAllDocuments,
  getDocumentsByType,
  loadPersistedDocuments
};
