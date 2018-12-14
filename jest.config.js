module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/*', '!**/__tests__/**'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100,
    },
  },
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).js'],
  roots: ['<rootDir>/src'],
}
