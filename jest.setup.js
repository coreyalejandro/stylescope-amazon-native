// Jest setup file for StyleScope tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock environment variables
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'
process.env.COMPREHEND_REGION = 'us-east-1'

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z')
global.Date = jest.fn(() => mockDate)
global.Date.now = jest.fn(() => mockDate.getTime())
global.Date.UTC = Date.UTC
global.Date.parse = Date.parse
global.Date.prototype = Date.prototype

// Setup global test utilities
global.createMockReview = (overrides = {}) => ({
  id: 'test-review-1',
  productId: 'B08N5WRWNW',
  rating: 4,
  title: 'Great product',
  content: 'This is a great product with excellent quality.',
  author: { name: 'Test User', isVerifiedPurchaser: true },
  date: new Date('2024-01-10'),
  verified: true,
  ...overrides
})

global.createMockSentimentData = (overrides = {}) => ({
  overall: {
    positive: 0.7,
    negative: 0.2,
    neutral: 0.1,
    mixed: 0.0
  },
  themes: {
    quality: { score: 0.8, confidence: 0.9, mentions: 2 },
    value: { score: 0.6, confidence: 0.7, mentions: 1 },
    style: { score: 0.7, confidence: 0.8, mentions: 1 },
    fit: { score: 0.8, confidence: 0.9, mentions: 2 },
    accessibility: { score: 0.5, confidence: 0.3, mentions: 0 },
    comfort: { score: 0.7, confidence: 0.8, mentions: 1 }
  },
  keyPhrases: [
    { text: 'great product', score: 0.9, beginOffset: 0, endOffset: 13 },
    { text: 'excellent quality', score: 0.85, beginOffset: 20, endOffset: 37 }
  ],
  confidence: 0.85,
  processedAt: new Date(),
  languageCode: 'en',
  ...overrides
})