// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover',
    'html'
  ],
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'ts',
    'tsx'
  ],
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  testPathIgnorePatterns: [
    '/dev/',
    '/scripts/',
  ],
  coveragePathIgnorePatterns: [
    '/scripts/',
    '/__tests__/',
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  rootDir: __dirname,
  testMatch: [
    // '<rootDir>/src/__tests__/**/*.test.[jt]s?(x)'
    '<rootDir>/src/__tests__/main.test.ts',
    '<rootDir>/src/__tests__/create_app.test.ts',
    '<rootDir>/src/__tests__/micro_app_element.test.ts',
    '<rootDir>/src/__tests__/micro_app.test.ts',
    '<rootDir>/src/__tests__/unit/utils.test.ts',
    '<rootDir>/src/__tests__/interact/index.test.ts',
    '<rootDir>/src/__tests__/source/scoped_css.test.ts',
    '<rootDir>/src/__tests__/sandbox/event-options.test.ts',
  ],
  globals: {
    __DEV__: true,
    __TEST__: true,
    'ts-jest': {
      tsconfig: {
        target: 'ES2017',
        noUnusedLocals: true,
        strictNullChecks: true,
        noUnusedParameters: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
      }
    }
  }
}
