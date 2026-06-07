export default {
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/db.js",
    "!src/swagger.js"
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
