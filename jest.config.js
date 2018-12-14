module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/*', '!**/__tests__/**'],
  coverageDirectory: 'pages/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100,
    },
  },
  reporters: ['default', 'jest-stare'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).js'],
  testResultsProcessor: './node_modules/jest-stare',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
}
