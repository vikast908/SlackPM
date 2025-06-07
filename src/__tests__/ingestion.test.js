const ingestion = require('../ingestion');
const storage = require('../storage');

describe('Ingestion Queue', () => {
  test('enqueues and dequeues messages', () => {
    const message = { text: 'Test message', user: 'U123', channel: 'C123', ts: '1234567890.123456' };
    ingestion.enqueue(message);
    expect(ingestion.size()).toBe(1);
    const dequeued = ingestion.dequeue();
    expect(dequeued).toEqual(message);
    expect(ingestion.size()).toBe(0);
  });
});

describe('Storage', () => {
  test('saves and retrieves metadata', () => {
    const metadata = { summary: 'Test task', projectId: 'PROJ-123', owner: 'U123', dueDate: null };
    storage.saveMetadata('C123', '1234567890.123456', metadata);
    const retrieved = storage.getMetadata('C123', '1234567890.123456');
    expect(retrieved).toEqual(metadata);
  });

  test('deletes metadata', () => {
    const metadata = { summary: 'Test task', projectId: 'PROJ-123', owner: 'U123', dueDate: null };
    storage.saveMetadata('C123', '1234567890.123456', metadata);
    storage.deleteMetadata('C123', '1234567890.123456');
    const retrieved = storage.getMetadata('C123', '1234567890.123456');
    expect(retrieved).toBeUndefined();
  });
}); 
