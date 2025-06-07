/**
 * @file This module handles the Natural Language Processing (NLP) pipeline
 * for ingesting and analyzing messages to extract tasks.
 */

const ingestion = require('./ingestion');
const storage = require('./storage');
const franc = require('franc');
const chrono = require('chrono-node');
const nlp = require('compromise');
const logger = require('./logger');

// A simple, custom list of profane words for filtering.
const profaneWords = ['bad', 'crap', 'damn'];

/**
 * Checks if a given text contains any of the words from the profaneWords list.
 * @param {string} text The text to check.
 * @returns {boolean} True if the text contains profanity, false otherwise.
 */
function isProfane(text) {
  const lower = text.toLowerCase();
  return profaneWords.some(word => lower.includes(word));
}

// Metrics to track processing performance.
let messagesProcessed = 0;
let tasksExtracted = 0;
let extractionFailures = 0;
let lastProcessedTime = Date.now();

/**
 * Creates a simple numeric hash from a string for clustering.
 * @param {string} str The input string.
 * @returns {number} A non-negative integer hash.
 */
function simpleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Runs the NLP pipeline on a single message to extract metadata.
 * @param {object} message The message object to process.
 * @returns {object} Extracted metadata including summary, project ID, entities, etc.
 */
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
  // Imperative verb detection to identify potential tasks
  const isTask = /\b(review|ship|fix|do|complete|finish|update|check|test|deploy)\b/i.test(message.text);
  // Project clustering (simple hash of thread or channel)
  const clusterKey = message.thread_ts || message.channel;
  const projectId = message.text.match(/[A-Z]{2,}-\d+/) ? message.text.match(/[A-Z]{2,}-\d+/)[0] : simpleHash(clusterKey).toString();

  return {
    summary: message.text.slice(0, 80),
    projectId,
    priority: 1, // Placeholder for priority logic
    owner: message.user,
    dueDate,
    language,
    containsProfanity,
    entities: { people, organizations, dates },
    isTask
  };
}

/**
 * Processes the message queue, runs NLP, and stores tasks.
 */
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

  // Log metrics periodically (e.g., every minute).
  const now = Date.now();
  if (now - lastProcessedTime >= 60000) {
    logger.info('Metrics', {
      messagesProcessed,
      tasksExtracted,
      extractionFailures,
      backlogDepth: ingestion.size()
    });
    // Reset counters after logging
    messagesProcessed = 0;
    tasksExtracted = 0;
    extractionFailures = 0;
    lastProcessedTime = now;
  }
}

// Run the processor every second, but only if not in a 'test' environment
// to prevent interference with automated tests.
if (process.env.NODE_ENV !== 'test') {
  setInterval(processQueue, 1000);
}

// Export functions for testing or use in other modules.
module.exports = { runNLP, processQueue };
