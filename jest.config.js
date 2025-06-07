module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(franc|trigram-utils)/)'
  ]
}; 