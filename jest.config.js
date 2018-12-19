module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['dist/main/lib/**/*'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageDirectory: '<rootDir>/pages/coverage',
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     statements: 100,
  //     functions: 100,
  //     branches: 100,
  //   },
  // },
  reporters: ['default', 'jest-stare'],
  roots: ['<rootDir>/src/lib'],
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).js'],
  testResultsProcessor: './node_modules/jest-stare',
  transformIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  // moduleFileExtensions: ['ts', 'js'],
  // transform: {
  //   '^.+\\.(js)$': 'babel-jest',
  //   '^.+\\.(ts)$': 'ts-jest',
  // },
}
