// In-memory metadata storage
const store = new Map();

function makeKey(channel, ts) {
  return `${channel}:${ts}`;
}

function saveMetadata(channel, ts, metadata) {
  store.set(makeKey(channel, ts), metadata);
}

function getMetadata(channel, ts) {
  return store.get(makeKey(channel, ts));
}

function deleteMetadata(channel, ts) {
  store.delete(makeKey(channel, ts));
}

module.exports = { saveMetadata, getMetadata, deleteMetadata, store }; 
