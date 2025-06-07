/**
 * @file This is a configuration file for Jest, a popular JavaScript testing framework.
 * It tells Jest how to handle project files during the testing process.
 */

module.exports = {
  // The 'transform' property tells Jest how to process your source files before running tests.
  transform: {
    // This rule specifies that any file ending in '.js' should be processed by 'babel-jest'.
    // This is a common setup to transpile modern JavaScript (ES6+) into a version
    // that Node.js (which runs Jest) can understand.
    '^.+\\.js$': 'babel-jest'
  },

  // The 'transformIgnorePatterns' property lists files that should NOT be transformed by Babel.
  // By default, Jest does not transform anything inside the 'node_modules' directory for performance reasons.
  transformIgnorePatterns: [
    // This regular expression creates an exception to the default rule.
    // It's a negative lookahead that tells Jest: "Do NOT ignore these specific modules for transformation."
    // This forces Jest to transpile 'franc', 'trigram-utils', 'bad-words', and 'badwords-list'
    // because they are likely published with modern JavaScript syntax.
    'node_modules/(?!(franc|trigram-utils|bad-words|badwords-list)/)'
  ]
};
