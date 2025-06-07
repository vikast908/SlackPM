// Mock franc
jest.mock('franc', () => () => 'en');

const { runNLP } = require('../worker');

describe('NLP Pipeline', () => {
  test('detects imperative verbs as tasks', () => {
    const message = { text: 'Please review the PR', user: 'U123', channel: 'C123', ts: '1234567890.123456' };
    const result = runNLP(message);
    expect(result.isTask).toBe(true);
    expect(result.summary).toBe('Please review the PR');
  });

  test('detects Jira ticket patterns', () => {
    const message = { text: 'Fix PROJ-123 bug', user: 'U123', channel: 'C123', ts: '1234567890.123456' };
    const result = runNLP(message);
    expect(result.projectId).toBe('PROJ-123');
  });

  test('extracts due dates', () => {
    const message = { text: 'Ship by 2023-12-31', user: 'U123', channel: 'C123', ts: '1234567890.123456' };
    const result = runNLP(message);
    expect(result.dueDate).toBeInstanceOf(Date);
  });

  test('detects profanity', () => {
    const message = { text: 'This is a bad word', user: 'U123', channel: 'C123', ts: '1234567890.123456' };
    const result = runNLP(message);
    expect(result.containsProfanity).toBe(true);
  });
}); 