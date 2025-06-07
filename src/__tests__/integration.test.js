const { App } = require('@slack/bolt');
jest.mock('franc', () => () => 'en');
const ingestion = require('../ingestion');
const storage = require('../storage');
const { processQueue } = require('../worker');

// Mock franc to avoid ESM issues in tests
jest.mock('franc', () => () => 'en');
jest.mock('bad-words', () => {
  return jest.fn().mockImplementation(() => ({
    isProfane: () => true
  }));
});

// Mock Slack app
const app = new App({
  token: 'xoxb-test-token',
  signingSecret: 'test-signing-secret',
  socketMode: true,
  appToken: 'xapp-test-token'
});

// Anonymised Slack event payloads
const mockEvents = [
  {
    type: 'message',
    text: 'Please review the PR',
    user: 'U123',
    channel: 'C123',
    ts: '1234567890.123456'
  },
  {
    type: 'message',
    text: 'Fix PROJ-123 bug',
    user: 'U123',
    channel: 'C123',
    ts: '1234567890.123457'
  }
];

describe('Integration Tests', () => {
  beforeEach(() => {
    // Clear ingestion queue and storage
    while (ingestion.size() > 0) {
      ingestion.dequeue();
    }
    for (const key of storage.store.keys()) {
      storage.deleteMetadata(key.split(':')[0], key.split(':')[1]);
    }
  });

  test('processes Slack events and extracts tasks', async () => {
    // Simulate receiving events
    for (const event of mockEvents) {
      // Manually enqueue the event
      ingestion.enqueue(event);
    }
    // Process queued events synchronously
    // Process the queue immediately
    processQueue();

    // Assert tasks are extracted and stored
    const tasks = [];
    for (const [key, metadata] of storage.store.entries()) {
      if (metadata.isTask) {
        tasks.push(metadata);
      }
    }
    expect(tasks.length).toBe(2);
    expect(tasks[0].summary).toBe('Please review the PR');
    expect(tasks[1].projectId).toBe('PROJ-123');
  });
}); 
