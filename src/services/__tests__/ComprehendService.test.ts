// Unit tests for ComprehendService
// Tests sentiment analysis accuracy, error handling, and caching functionality

import { ComprehendService, createComprehendService, isComprehendConfigured } from '../ComprehendService'
import { SentimentData, Review } from '@/types'
import { database } from '@/lib/database'

// Mock AWS SDK
jest.mock('@aws-sdk/client-comprehend', () => ({
  ComprehendClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  DetectSentimentCommand: jest.fn(),
  DetectKeyPhrasesCommand: jest.fn(),
  DetectEntitiesCommand: jest.fn(),
  BatchDetectSentimentCommand: jest.fn(),
  BatchDetectKeyPhrasesCommand: jest.fn()
}))

// Mock database
jest.mock('@/lib/database', () => ({
  database: {
    sentimentCache: {
      getSentiment: jest.fn(),
      saveSentiment: jest.fn()
    }
  }
}))

// Mock validation and transformers
jest.mock('@/lib/validation', () => ({
  validateSentimentData: jest.fn().mockReturnValue({ success: true })
}))

jest.mock('@/lib/data-transformers', () => ({
  transformComprehendToSentimentData: jest.fn()
}))

describe('ComprehendService', () => {
  let comprehendService: ComprehendService
  let mockClient: any
  
  const mockConfig = {
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  }

  const mockReviews: Review[] = [
    {
      id: 'review-1',
      productId: 'B08N5WRWNW',
      rating: 5,
      title: 'Excellent quality!',
      content: 'This product exceeded my expectations. Great quality and perfect fit.',
      author: { name: 'John Doe', isVerifiedPurchaser: true },
      date: new Date('2024-01-15'),
      verified: true
    },
    {
      id: 'review-2',
      productId: 'B08N5WRWNW',
      rating: 2,
      title: 'Disappointed',
      content: 'Poor quality materials and sizing was off. Would not recommend.',
      author: { name: 'Jane Smith', isVerifiedPurchaser: true },
      date: new Date('2024-01-10'),
      verified: true
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock client
    const { ComprehendClient } = require('@aws-sdk/client-comprehend')
    mockClient = {
      send: jest.fn()
    }
    ComprehendClient.mockImplementation(() => mockClient)
    
    comprehendService = new ComprehendService(mockConfig)
  })

  describe('Configuration', () => {
    it('should validate complete configuration', () => {
      expect(isComprehendConfigured(mockConfig)).toBe(true)
    })

    it('should reject incomplete configuration', () => {
      expect(isComprehendConfigured({ region: 'us-east-1' })).toBe(false)
      expect(isComprehendConfigured({ 
        region: 'us-east-1', 
        accessKeyId: 'test' 
      })).toBe(false)
    })

    it('should create service with factory function', () => {
      const service = createComprehendService(mockConfig)
      expect(service).toBeInstanceOf(ComprehendService)
    })
  })

  describe('Basic Sentiment Analysis', () => {
    it('should analyze sentiment successfully', async () => {
      // Mock successful Comprehend responses
      mockClient.send
        .mockResolvedValueOnce({
          Sentiment: 'POSITIVE',
          SentimentScore: {
            Positive: 0.8,
            Negative: 0.1,
            Neutral: 0.05,
            Mixed: 0.05
          }
        })
        .mockResolvedValueOnce({
          KeyPhrases: [
            { Text: 'great quality', Score: 0.9, BeginOffset: 0, EndOffset: 13 },
            { Text: 'perfect fit', Score: 0.85, BeginOffset: 20, EndOffset: 31 }
          ]
        })
        .mockResolvedValueOnce({
          Entities: [
            { Text: 'product', Type: 'OTHER', Score: 0.7, BeginOffset: 40, EndOffset: 47 }
          ]
        })

      const result = await comprehendService.analyzeSentiment({
        text: 'This product has great quality and perfect fit!',
        languageCode: 'en'
      })

      expect(result.sentiment).toBe('POSITIVE')
      expect(result.sentimentScore.Positive).toBe(0.8)
      expect(result.keyPhrases).toHaveLength(2)
      expect(result.entities).toHaveLength(1)
    })

    it('should handle text length validation', async () => {
      const error = new Error('TextSizeLimitExceededException: Text too long')
      mockClient.send.mockRejectedValueOnce(error)
      
      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'validation_error'
      })
    })

    it('should handle missing sentiment response', async () => {
      mockClient.send
        .mockResolvedValueOnce({
          // Missing Sentiment and SentimentScore
        })

      // The service should handle this gracefully by throwing an error
      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toBeDefined()
    })
  })

  describe('Batch Sentiment Analysis', () => {
    it('should process multiple texts in batch', async () => {
      const testTexts = [
        'Great product, love it!',
        'Poor quality, disappointed.',
        'Average item, nothing special.'
      ]

      // Mock batch sentiment response
      mockClient.send
        .mockResolvedValueOnce({
          ResultList: [
            {
              Sentiment: 'POSITIVE',
              SentimentScore: { Positive: 0.9, Negative: 0.05, Neutral: 0.03, Mixed: 0.02 }
            },
            {
              Sentiment: 'NEGATIVE', 
              SentimentScore: { Positive: 0.1, Negative: 0.8, Neutral: 0.05, Mixed: 0.05 }
            },
            {
              Sentiment: 'NEUTRAL',
              SentimentScore: { Positive: 0.3, Negative: 0.2, Neutral: 0.5, Mixed: 0.0 }
            }
          ]
        })
        .mockResolvedValueOnce({
          ResultList: [
            { KeyPhrases: [{ Text: 'great product', Score: 0.9 }] },
            { KeyPhrases: [{ Text: 'poor quality', Score: 0.85 }] },
            { KeyPhrases: [{ Text: 'average item', Score: 0.7 }] }
          ]
        })

      const results = await comprehendService.batchAnalyzeSentiment({
        textList: testTexts
      })

      expect(results).toHaveLength(3)
      expect(results[0].sentiment).toBe('POSITIVE')
      expect(results[1].sentiment).toBe('NEGATIVE')
      expect(results[2].sentiment).toBe('NEUTRAL')
    })

    it('should handle large batches by chunking', async () => {
      const largeBatch = Array(50).fill('Test text')
      
      // Mock responses for 2 chunks (25 each)
      mockClient.send
        .mockResolvedValue({
          ResultList: Array(25).fill({
            Sentiment: 'NEUTRAL',
            SentimentScore: { Positive: 0.3, Negative: 0.2, Neutral: 0.5, Mixed: 0.0 }
          })
        })

      const results = await comprehendService.batchAnalyzeSentiment({
        textList: largeBatch
      })

      expect(results).toHaveLength(50)
      expect(mockClient.send).toHaveBeenCalledTimes(4) // 2 sentiment + 2 key phrases
    })

    it('should handle batch processing errors gracefully', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('Service unavailable'))

      await expect(
        comprehendService.batchAnalyzeSentiment({
          textList: ['test']
        })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'network_error'
      })
    })
  })

  describe('Product Review Analysis', () => {

    it('should analyze product reviews with caching', async () => {
      const productId = 'B08N5WRWNW'
      
      // Mock cache miss
      const mockGetSentiment = database.sentimentCache.getSentiment as jest.Mock
      mockGetSentiment.mockResolvedValueOnce(null)

      // Mock Comprehend response
      mockClient.send
        .mockResolvedValueOnce({
          Sentiment: 'MIXED',
          SentimentScore: { Positive: 0.4, Negative: 0.4, Neutral: 0.15, Mixed: 0.05 }
        })
        .mockResolvedValueOnce({
          KeyPhrases: [
            { Text: 'great quality', Score: 0.9 },
            { Text: 'poor quality', Score: 0.85 }
          ]
        })
        .mockResolvedValueOnce({
          Entities: []
        })

      // Mock transformer
      const mockTransform = require('@/lib/data-transformers').transformComprehendToSentimentData
      const mockSentimentData: SentimentData = {
        overall: { positive: 0.4, negative: 0.4, neutral: 0.15, mixed: 0.05 },
        themes: {
          quality: { score: 0.6, confidence: 0.8, mentions: 2 },
          value: { score: 0.5, confidence: 0.5, mentions: 0 },
          style: { score: 0.5, confidence: 0.5, mentions: 0 },
          fit: { score: 0.7, confidence: 0.7, mentions: 1 },
          accessibility: { score: 0.5, confidence: 0.3, mentions: 0 },
          comfort: { score: 0.5, confidence: 0.5, mentions: 0 }
        },
        keyPhrases: [
          { text: 'great quality', score: 0.9, beginOffset: 0, endOffset: 13 }
        ],
        confidence: 0.8,
        processedAt: new Date(),
        languageCode: 'en'
      }
      mockTransform.mockReturnValueOnce(mockSentimentData)

      const result = await comprehendService.analyzeProductReviews(productId, mockReviews)

      expect(result).toEqual(mockSentimentData)
      expect(database.sentimentCache.saveSentiment).toHaveBeenCalledWith(productId, mockSentimentData)
    })

    it('should use cached sentiment data when available', async () => {
      const productId = 'B08N5WRWNW'
      const cachedSentiment: SentimentData = {
        overall: { positive: 0.7, negative: 0.2, neutral: 0.1, mixed: 0.0 },
        themes: {
          quality: { score: 0.8, confidence: 0.9, mentions: 3 },
          value: { score: 0.6, confidence: 0.7, mentions: 2 },
          style: { score: 0.7, confidence: 0.8, mentions: 1 },
          fit: { score: 0.8, confidence: 0.9, mentions: 2 },
          accessibility: { score: 0.5, confidence: 0.3, mentions: 0 },
          comfort: { score: 0.7, confidence: 0.8, mentions: 1 }
        },
        keyPhrases: [],
        confidence: 0.85,
        processedAt: new Date(),
        languageCode: 'en'
      }

      const mockGetSentiment = database.sentimentCache.getSentiment as jest.Mock
      mockGetSentiment.mockResolvedValueOnce(cachedSentiment)

      const result = await comprehendService.analyzeProductReviews(productId, mockReviews)

      expect(result).toEqual(cachedSentiment)
      expect(mockClient.send).not.toHaveBeenCalled()
    })

    it('should handle empty reviews gracefully', async () => {
      const result = await comprehendService.analyzeProductReviews('test-product', [])

      expect(result.overall.positive).toBe(0.5)
      expect(result.confidence).toBe(0.3)
      expect(result.themes.quality.score).toBe(0.5)
    })

    it('should handle analysis errors gracefully', async () => {
      const mockGetSentiment = database.sentimentCache.getSentiment as jest.Mock
      mockGetSentiment.mockResolvedValueOnce(null)

      mockClient.send.mockRejectedValueOnce(new Error('Service error'))

      const result = await comprehendService.analyzeProductReviews('test-product', mockReviews)

      // Should return empty sentiment data on error
      expect(result.overall.positive).toBe(0.5)
      expect(result.confidence).toBe(0.3)
    })
  })

  describe('Batch Product Review Analysis', () => {
    it('should process multiple products in parallel', async () => {
      const productReviews = [
        { productId: 'product-1', reviews: [mockReviews[0]] },
        { productId: 'product-2', reviews: [mockReviews[1]] }
      ]

      // Mock cache misses
      const mockGetSentiment = database.sentimentCache.getSentiment as jest.Mock
      mockGetSentiment.mockResolvedValue(null)

      // Mock Comprehend responses
      mockClient.send.mockResolvedValue({
        Sentiment: 'POSITIVE',
        SentimentScore: { Positive: 0.8, Negative: 0.1, Neutral: 0.05, Mixed: 0.05 }
      })

      const mockTransform = require('@/lib/data-transformers').transformComprehendToSentimentData
      mockTransform.mockReturnValue({
        overall: { positive: 0.8, negative: 0.1, neutral: 0.05, mixed: 0.05 },
        themes: {
          quality: { score: 0.8, confidence: 0.9, mentions: 1 },
          value: { score: 0.5, confidence: 0.5, mentions: 0 },
          style: { score: 0.5, confidence: 0.5, mentions: 0 },
          fit: { score: 0.5, confidence: 0.5, mentions: 0 },
          accessibility: { score: 0.5, confidence: 0.3, mentions: 0 },
          comfort: { score: 0.5, confidence: 0.5, mentions: 0 }
        },
        keyPhrases: [],
        confidence: 0.8,
        processedAt: new Date(),
        languageCode: 'en'
      })

      const results = await comprehendService.batchAnalyzeProductReviews(productReviews)

      expect(results.size).toBe(2)
      expect(results.has('product-1')).toBe(true)
      expect(results.has('product-2')).toBe(true)
    })

    it('should handle individual product failures gracefully', async () => {
      const productReviews = [
        { productId: 'product-1', reviews: [mockReviews[0]] },
        { productId: 'product-2', reviews: [mockReviews[1]] }
      ]

      // Mock one success, one failure
      const mockGetSentiment = database.sentimentCache.getSentiment as jest.Mock
      mockGetSentiment
        .mockResolvedValueOnce(null) // product-1: cache miss
        .mockRejectedValueOnce(new Error('Cache error')) // product-2: cache error

      const results = await comprehendService.batchAnalyzeProductReviews(productReviews)

      expect(results.size).toBe(2)
      // Both should have results (empty sentiment data for failures)
      expect(results.get('product-1')).toBeDefined()
      expect(results.get('product-2')).toBeDefined()
    })
  })

  describe('Accessibility Sentiment Analysis', () => {
    const accessibilityReviews: Review[] = [
      {
        id: 'review-1',
        productId: 'B08N5WRWNW',
        rating: 5,
        title: 'Great for wheelchair users',
        content: 'This adaptive clothing is perfect for people with mobility issues. Easy to put on with one hand.',
        author: { name: 'Alex Chen', isVerifiedPurchaser: true },
        date: new Date('2024-01-15'),
        verified: true
      },
      {
        id: 'review-2',
        productId: 'B08N5WRWNW',
        rating: 4,
        title: 'Sensory friendly fabric',
        content: 'The fabric is soft and doesn\'t irritate my autistic child\'s skin. Great for sensory sensitivities.',
        author: { name: 'Parent Reviewer', isVerifiedPurchaser: true },
        date: new Date('2024-01-10'),
        verified: true
      }
    ]

    it('should identify and analyze accessibility-related reviews', async () => {
      // Mock batch sentiment analysis
      mockClient.send
        .mockResolvedValueOnce({
          ResultList: [
            {
              Sentiment: 'POSITIVE',
              SentimentScore: { Positive: 0.9, Negative: 0.05, Neutral: 0.03, Mixed: 0.02 }
            },
            {
              Sentiment: 'POSITIVE',
              SentimentScore: { Positive: 0.85, Negative: 0.1, Neutral: 0.03, Mixed: 0.02 }
            }
          ]
        })
        .mockResolvedValueOnce({
          ResultList: [
            { KeyPhrases: [{ Text: 'adaptive clothing', Score: 0.9 }, { Text: 'mobility issues', Score: 0.85 }] },
            { KeyPhrases: [{ Text: 'sensory friendly', Score: 0.9 }, { Text: 'autistic child', Score: 0.8 }] }
          ]
        })

      const result = await comprehendService.analyzeAccessibilitySentiment(accessibilityReviews)

      expect(result.overallAccessibilitySentiment).toBe('positive')
      expect(result.accessibilityMentions).toContain('adaptive clothing')
      expect(result.accessibilityMentions).toContain('sensory friendly')
      expect(result.accessibilityScore).toBeGreaterThan(0.5)
    })

    it('should handle reviews with no accessibility mentions', async () => {
      const regularReviews: Review[] = [
        {
          id: 'review-1',
          productId: 'B08N5WRWNW',
          rating: 4,
          title: 'Nice shirt',
          content: 'Good quality shirt, fits well and looks nice.',
          author: { name: 'Regular User', isVerifiedPurchaser: true },
          date: new Date('2024-01-15'),
          verified: true
        }
      ]

      const result = await comprehendService.analyzeAccessibilitySentiment(regularReviews)

      expect(result.overallAccessibilitySentiment).toBe('neutral')
      expect(result.accessibilityMentions).toHaveLength(0)
      expect(result.accessibilityScore).toBe(0.5)
    })

    it('should handle mixed accessibility sentiment', async () => {
      const mixedReviews = [
        ...accessibilityReviews,
        {
          id: 'review-3',
          productId: 'B08N5WRWNW',
          rating: 2,
          title: 'Difficult for arthritis',
          content: 'The buttons are too small and hard to manage with arthritis. Not accessible.',
          author: { name: 'Senior User', isVerifiedPurchaser: true },
          date: new Date('2024-01-05'),
          verified: true
        }
      ]

      mockClient.send
        .mockResolvedValueOnce({
          ResultList: [
            { Sentiment: 'POSITIVE', SentimentScore: { Positive: 0.9, Negative: 0.05, Neutral: 0.03, Mixed: 0.02 } },
            { Sentiment: 'POSITIVE', SentimentScore: { Positive: 0.85, Negative: 0.1, Neutral: 0.03, Mixed: 0.02 } },
            { Sentiment: 'NEGATIVE', SentimentScore: { Positive: 0.1, Negative: 0.8, Neutral: 0.05, Mixed: 0.05 } }
          ]
        })
        .mockResolvedValueOnce({
          ResultList: [
            { KeyPhrases: [{ Text: 'adaptive clothing', Score: 0.9 }] },
            { KeyPhrases: [{ Text: 'sensory friendly', Score: 0.9 }] },
            { KeyPhrases: [{ Text: 'arthritis', Score: 0.85 }, { Text: 'not accessible', Score: 0.8 }] }
          ]
        })

      const result = await comprehendService.analyzeAccessibilitySentiment(mixedReviews)

      expect(result.overallAccessibilitySentiment).toBe('positive') // 2 positive vs 1 negative
      expect(result.accessibilityMentions).toContain('arthritis')
      expect(result.accessibilityScore).toBeGreaterThan(0.3)
      expect(result.accessibilityScore).toBeLessThan(0.9)
    })
  })

  describe('Error Handling', () => {
    it('should handle TextSizeLimitExceededException', async () => {
      const error = new Error('TextSizeLimitExceededException: Text too long')
      mockClient.send.mockRejectedValueOnce(error)

      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'validation_error',
        retryable: false
      })
    })

    it('should handle ThrottlingException', async () => {
      const error = new Error('ThrottlingException: Rate limit exceeded')
      mockClient.send.mockRejectedValueOnce(error)

      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'rate_limit',
        retryable: true,
        retryAfter: 60
      })
    })

    it('should handle AccessDeniedException', async () => {
      const error = new Error('AccessDeniedException: Invalid credentials')
      mockClient.send.mockRejectedValueOnce(error)

      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'authentication',
        retryable: false
      })
    })

    it('should handle ServiceUnavailableException', async () => {
      const error = new Error('ServiceUnavailableException: Service down')
      mockClient.send.mockRejectedValueOnce(error)

      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'service_unavailable',
        retryable: true,
        retryAfter: 30
      })
    })

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error')
      mockClient.send.mockRejectedValueOnce(error)

      await expect(
        comprehendService.analyzeSentiment({ text: 'test' })
      ).rejects.toMatchObject({
        service: 'comprehend',
        type: 'network_error',
        retryable: true
      })
    })
  })

  describe('Health Check', () => {
    it('should return healthy status when service is working', async () => {
      mockClient.send
        .mockResolvedValueOnce({
          Sentiment: 'NEUTRAL',
          SentimentScore: { Positive: 0.3, Negative: 0.2, Neutral: 0.5, Mixed: 0.0 }
        })
        .mockResolvedValueOnce({
          KeyPhrases: []
        })
        .mockResolvedValueOnce({
          Entities: []
        })

      const result = await comprehendService.healthCheck()

      expect(result.status).toBe('healthy')
      expect(result.message).toBe('Comprehend service is working correctly')
      expect(result.details.region).toBe('us-east-1')
      expect(result.details.testSentiment).toBe('NEUTRAL')
    })

    it('should return unhealthy status when service fails', async () => {
      const error = new Error('Service unavailable')
      mockClient.send.mockRejectedValueOnce(error)

      const result = await comprehendService.healthCheck()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toBeDefined()
      expect(result.details.error).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should chunk arrays correctly', async () => {
      const largeArray = Array(30).fill('test')
      
      // Mock responses for chunked processing
      mockClient.send
        .mockResolvedValueOnce({
          ResultList: Array(25).fill({
            Sentiment: 'NEUTRAL',
            SentimentScore: { Positive: 0.3, Negative: 0.2, Neutral: 0.5, Mixed: 0.0 }
          })
        })
        .mockResolvedValueOnce({
          ResultList: Array(25).fill({ KeyPhrases: [] })
        })
        .mockResolvedValueOnce({
          ResultList: Array(5).fill({
            Sentiment: 'NEUTRAL',
            SentimentScore: { Positive: 0.3, Negative: 0.2, Neutral: 0.5, Mixed: 0.0 }
          })
        })
        .mockResolvedValueOnce({
          ResultList: Array(5).fill({ KeyPhrases: [] })
        })

      const results = await comprehendService.batchAnalyzeSentiment({
        textList: largeArray
      })

      expect(results).toHaveLength(30)
      // Should have made 4 calls (2 chunks × 2 operations each)
      expect(mockClient.send).toHaveBeenCalledTimes(4)
    })

    it('should create empty sentiment data with correct structure', async () => {
      const result = await comprehendService.analyzeProductReviews('test', [])

      expect(result.overall).toHaveProperty('positive')
      expect(result.overall).toHaveProperty('negative')
      expect(result.overall).toHaveProperty('neutral')
      expect(result.overall).toHaveProperty('mixed')
      expect(result.themes).toHaveProperty('quality')
      expect(result.themes).toHaveProperty('value')
      expect(result.themes).toHaveProperty('style')
      expect(result.themes).toHaveProperty('fit')
      expect(result.themes).toHaveProperty('accessibility')
      expect(result.themes).toHaveProperty('comfort')
      expect(result.keyPhrases).toEqual([])
      expect(result.confidence).toBe(0.3)
    })
  })
})