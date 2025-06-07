// In-memory ingestion queue abstraction
const queue = [];

function enqueue(event) {
  queue.push(event);
}

function dequeue() {
  return queue.shift();
}

function size() {
  return queue.length;
}

module.exports = { enqueue, dequeue, size }; 
