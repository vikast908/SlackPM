const ingestion = require('./ingestion');
const storage = require('./storage');
const franc = require('franc');
const chrono = require('chrono-node');
const nlp = require('compromise');
const logger = require('./logger');

const profaneWords = ['bad', 'crap', 'damn'];

function isProfane(text) {
  const lower = text.toLowerCase();
  return profaneWords.some(word => lower.includes(word));
}

// Metrics
let messagesProcessed = 0;
let tasksExtracted = 0;
let extractionFailures = 0;
let lastProcessedTime = Date.now();

// Simple hash for clustering
function simpleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Enhanced NLP pipeline
function runNLP(message) {
  // Language detection
  const language = franc(message.text || '');
  // Profanity filter
  const containsProfanity = isProfane(message.text || '');
  // Named-entity recognition (dates, people, products)
  const doc = nlp(message.text || '');
  const people = doc.people().out('array');
  const organizations = doc.organizations().out('array');
  // Date extraction
  const dates = chrono.parse(message.text || '');
  const dueDate = dates.length > 0 ? dates[0].start.date() : null;
  // Imperative verb detection
  const isTask = /\b(review|ship|fix|do|complete|finish|update|check|test|deploy)\b/i.test(message.text);
  // Project clustering (simple hash of thread or channel)
  const clusterKey = message.thread_ts || message.channel;
  const projectId = message.text.match(/[A-Z]{2,}-\d+/) ? message.text.match(/[A-Z]{2,}-\d+/)[0] : simpleHash(clusterKey).toString();

  return {
    summary: message.text.slice(0, 80),
    projectId,
    priority: 1, // Placeholder
    owner: message.user,
    dueDate,
    language,
    containsProfanity,
    entities: { people, organizations, dates },
    isTask
  };
}

function processQueue() {
  while (ingestion.size() > 0) {
    const message = ingestion.dequeue();
    messagesProcessed++;
    try {
      const metadata = runNLP(message);
      if (metadata.isTask) {
        tasksExtracted++;
        storage.saveMetadata(message.channel, message.ts, {
          source: { channel: message.channel, ts: message.ts },
          ...metadata
        });
        logger.info('Task extracted', { channel: message.channel, ts: message.ts, metadata });
      }
    } catch (error) {
      extractionFailures++;
      logger.error('Extraction failed', { error, message });
    }
  }

  // Log metrics every minute
  const now = Date.now();
  if (now - lastProcessedTime >= 60000) {
    logger.info('Metrics', {
      messagesProcessed,
      tasksExtracted,
      extractionFailures,
      backlogDepth: ingestion.size()
    });
    messagesProcessed = 0;
    tasksExtracted = 0;
    extractionFailures = 0;
    lastProcessedTime = now;
  }
}

// Run every second
setInterval(processQueue, 1000);

module.exports = {
  runNLP,
  processQueue
};
