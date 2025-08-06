// Unit tests for PersonalityEngine
// Tests Alex Chen personality consistency, Bedrock integration, and commentary generation

import { PersonalityEngine, createPersonalityEngine, isPersonalityEngineConfigured } from '../PersonalityEngine'
import { AlexChenPersonality, Product, SentimentData } from '@/types'

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeModelCommand: jest.fn(),
  InvokeModelWithResponseStreamCommand: jest.fn()
}))

// Mock validation functions
jest.mock('@/lib/validation', () => ({
  validatePersonalityConfig: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCommentaryRequest: jest.fn().mockReturnValue({ isValid: true, errors: [] })
}))

describe('PersonalityEngine', () => {
  let personalityEngine: PersonalityEngine
  let mockClient: any
  
  const mockConfig = {
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  }

  const mockProducts: Product[] = [
    {
      asin: 'B08N5WRWNW',
      title: 'Adaptive Magnetic Closure Shirt',
      price: { current: 45.99, currency: 'USD' },
      images: { primary: 'https://example.com/image.jpg', thumbnails: [] },
      category: 'Adaptive Fashion',
      rating: 4.5,
      reviewCount: 127,
      availability: 'in_stock',
      features: ['Magnetic closures', 'Easy dressing', 'Soft fabric'],
      accessibilityFeatures: [
        { type: 'adaptive_clothing', description: 'Magnetic closures for one-handed dressing' }
      ]
    }
  ]

  const mockSentimentData: SentimentData[] = [
    {
      overall: { positive: 0.8, negative: 0.1, neutral: 0.1, mixed: 0.0 },
      themes: {
        quality: { score: 0.9, confidence: 0.9, mentions: 15 },
        value: { score: 0.7, confidence: 0.8, mentions: 8 },
        style: { score: 0.8, confidence: 0.8, mentions: 12 },
        fit: { score: 0.9, confidence: 0.9, mentions: 18 },
        accessibility: { score: 0.95, confidence: 0.9, mentions: 22 },
        comfort: { score: 0.9, confidence: 0.9, mentions: 16 }
      },
      keyPhrases: [
        { text: 'magnetic closures', score: 0.95, beginOffset: 0, endOffset: 16 },
        { text: 'easy to dress', score: 0.9, beginOffset: 20, endOffset: 33 },
        { text: 'great quality', score: 0.85, beginOffset: 40, endOffset: 53 }
      ],
      confidence: 0.9,
      processedAt: new Date(),
      languageCode: 'en'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock client
    const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime')
    mockClient = {
      send: jest.fn()
    }
    BedrockRuntimeClient.mockImplementation(() => mockClient)
    
    personalityEngine = new PersonalityEngine(mockConfig)
  })

  describe('Configuration', () => {
    it('should validate complete configuration', () => {
      expect(isPersonalityEngineConfigured(mockConfig)).toBe(true)
    })

    it('should reject incomplete configuration', () => {
      expect(isPersonalityEngineConfigured({ region: 'us-east-1' })).toBe(false)
      expect(isPersonalityEngineConfigured({ 
        region: 'us-east-1', 
        accessKeyId: 'test' 
      })).toBe(false)
    })

    it('should create engine with factory function', () => {
      const engine = createPersonalityEngine(mockConfig)
      expect(engine).toBeInstanceOf(PersonalityEngine)
    })

    it('should create engine with custom personality', () => {
      const customPersonality: AlexChenPersonality = {
        version: '2.0.0',
        traits: {
          neurodivergentPerspective: true,
          disabilityAdvocacy: true,
          fashionExpertiseLevel: 'expert',
          communicationStyle: 'analytical',
          empathyLevel: 'very_high',
          authenticityFocus: true
        },
        voiceCharacteristics: {
          tone: 'professional',
          vocabularyComplexity: 'technical',
          culturalReferences: ['academic fashion theory'],
          humorStyle: 'witty',
          languagePatterns: ['technical terminology', 'analytical framing']
        },
        contentGuidelines: {
          disabilityRepresentation: 'educational',
          fashionFocusAreas: ['adaptive_fashion', 'sustainable_fashion'],
          accessibilityMentions: 'prominent',
          inclusivityPriority: 'very_high',
          avoidanceTopics: ['ableist language', 'inspiration porn']
        },
        knowledgeAreas: [
          {
            domain: 'Fashion Theory',
            expertiseLevel: 10,
            specializations: ['academic research', 'disability studies']
          }
        ],
        communicationPreferences: {
          preferredLength: 'detailed',
          structureStyle: 'linear',
          exampleUsage: 'frequent',
          personalAnecdotes: false
        }
      }

      const engine = createPersonalityEngine(mockConfig, customPersonality)
      expect(engine.getPersonality().version).toBe('2.0.0')
      expect(engine.getPersonality().traits.fashionExpertiseLevel).toBe('expert')
    })
  })

  describe('Commentary Generation', () => {
    it('should generate commentary successfully', async () => {
      // Mock successful Bedrock response
      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: `## Introduction
Welcome to this week's fashion commentary! I'm Alex Chen, and I'm excited to share some insights about adaptive fashion that's making waves in the industry.

## Trend Analysis
The magnetic closure trend is revolutionizing accessible fashion. This innovative approach to fastening systems is making clothing more inclusive for people with dexterity challenges, arthritis, or those who dress with one hand.

## Product Spotlights
The Adaptive Magnetic Closure Shirt represents a breakthrough in inclusive design. With its thoughtfully engineered magnetic fastening system, this piece demonstrates how fashion can be both stylish and accessible. Customer feedback has been overwhelmingly positive, particularly praising the ease of use and quality construction.

## Accessibility Highlights
This shirt features magnetic closures that eliminate the need for traditional buttons, making it perfect for individuals with limited dexterity. The design maintains the classic shirt aesthetic while incorporating adaptive technology seamlessly.

## Conclusion
It's wonderful to see fashion brands embracing inclusive design principles. These innovations benefit everyone, not just the disability community, and represent the future of thoughtful fashion design.`
          }],
          usage: { input_tokens: 500, output_tokens: 300 }
        }))
      })

      const result = await personalityEngine.generateCommentary({
        products: mockProducts,
        sentimentData: mockSentimentData,
        episodeTitle: 'Adaptive Fashion Spotlight'
      })

      expect(result.content.introduction).toContain('Alex Chen')
      expect(result.content.introduction).toContain('excited')
      expect(result.content.trendAnalysis).toBeDefined()
      expect(result.content.productSpotlights).toBeDefined()
      expect(result.content.accessibilityHighlights).toBeDefined()
      expect(result.content.conclusion).toBeDefined()
      expect(result.metadata.tokensUsed).toBe(800)
      expect(result.metadata.personalityVersion).toBe('1.0.0')
    })

    it('should include personality context in prompts', async () => {
      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Test commentary response with Alex Chen personality' }],
          usage: { input_tokens: 100, output_tokens: 50 }
        }))
      })

      const result = await personalityEngine.generateCommentary({
        products: mockProducts,
        sentimentData: mockSentimentData
      })

      // Check that the client was called with Bedrock
      expect(mockClient.send).toHaveBeenCalledTimes(1)
      
      // Check that commentary was generated with personality context
      expect(result.content).toBeDefined()
      expect(result.metadata.personalityVersion).toBe('1.0.0')
      expect(result.metadata.tokensUsed).toBe(150)
    })

    it('should handle multiple products in commentary', async () => {
      const multipleProducts = [
        ...mockProducts,
        {
          asin: 'B09X1Y2Z3A',
          title: 'Sensory-Friendly Hoodie',
          price: { current: 39.99, currency: 'USD' },
          images: { primary: 'https://example.com/hoodie.jpg', thumbnails: [] },
          category: 'Sensory Friendly',
          rating: 4.7,
          reviewCount: 89,
          availability: 'in_stock',
          features: ['Tag-free', 'Soft seams', 'Weighted option'],
          accessibilityFeatures: [
            { type: 'sensory_friendly', description: 'Designed for sensory sensitivities' }
          ]
        }
      ]

      const multipleSentiment = [
        ...mockSentimentData,
        {
          overall: { positive: 0.9, negative: 0.05, neutral: 0.05, mixed: 0.0 },
          themes: {
            quality: { score: 0.95, confidence: 0.9, mentions: 12 },
            value: { score: 0.8, confidence: 0.8, mentions: 6 },
            style: { score: 0.85, confidence: 0.8, mentions: 8 },
            fit: { score: 0.9, confidence: 0.9, mentions: 10 },
            accessibility: { score: 0.98, confidence: 0.95, mentions: 18 },
            comfort: { score: 0.95, confidence: 0.9, mentions: 14 }
          },
          keyPhrases: [
            { text: 'sensory friendly', score: 0.98, beginOffset: 0, endOffset: 15 },
            { text: 'no tags', score: 0.9, beginOffset: 20, endOffset: 27 }
          ],
          confidence: 0.95,
          processedAt: new Date(),
          languageCode: 'en'
        }
      ]

      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Multi-product commentary with both adaptive and sensory-friendly options' }],
          usage: { input_tokens: 600, output_tokens: 400 }
        }))
      })

      const result = await personalityEngine.generateCommentary({
        products: multipleProducts,
        sentimentData: multipleSentiment
      })

      expect(result.content.productSpotlights).toHaveLength(2)
      expect(result.metadata.tokensUsed).toBe(1000)
    })

    it('should handle Bedrock errors gracefully', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('ValidationException: Invalid request'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'validation_error',
        retryable: false
      })
    })

    it('should handle rate limiting errors', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('ThrottlingException: Rate limit exceeded'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'rate_limit',
        retryable: true,
        retryAfter: 60
      })
    })
  })

  describe('Streaming Commentary Generation', () => {
    it('should generate streaming commentary', async () => {
      const chunks: string[] = []
      const onChunk = (chunk: string) => chunks.push(chunk)

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            chunk: {
              bytes: new TextEncoder().encode(JSON.stringify({
                type: 'content_block_delta',
                delta: { text: 'Welcome to ' }
              }))
            }
          }
          yield {
            chunk: {
              bytes: new TextEncoder().encode(JSON.stringify({
                type: 'content_block_delta',
                delta: { text: 'this week\'s fashion commentary!' }
              }))
            }
          }
          yield {
            chunk: {
              bytes: new TextEncoder().encode(JSON.stringify({
                usage: { input_tokens: 200, output_tokens: 100 }
              }))
            }
          }
        }
      }

      mockClient.send.mockResolvedValueOnce({
        body: mockStream
      })

      const result = await personalityEngine.generateStreamingCommentary({
        products: mockProducts,
        sentimentData: mockSentimentData
      }, onChunk)

      expect(chunks).toEqual(['Welcome to ', 'this week\'s fashion commentary!'])
      expect(result.metadata.tokensUsed).toBe(300)
    })

    it('should handle streaming errors', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('ServiceUnavailableException'))

      await expect(
        personalityEngine.generateStreamingCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        }, () => {})
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'service_unavailable',
        retryable: true
      })
    })
  })

  describe('Personality Consistency Validation', () => {
    it('should validate consistent personality', async () => {
      const consistentContent = {
        introduction: 'Welcome everyone! I\'m excited to share some wonderful adaptive fashion finds with you today.',
        trendAnalysis: [
          {
            trend: 'Magnetic Closures',
            description: 'These innovative fastening systems are making fashion more accessible for everyone.',
            accessibilityRelevance: 'High relevance for people with dexterity challenges'
          }
        ],
        productSpotlights: [
          {
            commentary: 'This adaptive shirt represents thoughtful inclusive design that benefits the entire disability community.',
            accessibilityNotes: ['Magnetic closures for easy dressing']
          }
        ],
        conclusion: 'Thank you for joining me in celebrating inclusive fashion design!'
      }

      const result = await personalityEngine.validatePersonalityConsistency(consistentContent)

      expect(result.isConsistent).toBeDefined()
      expect(result.consistencyScore).toBeGreaterThan(0.3)
      expect(result.issues).toBeDefined()
    })

    it('should detect personality inconsistencies', async () => {
      const inconsistentContent = {
        introduction: 'Today we will analyze fashion products using technical methodologies.',
        trendAnalysis: [],
        productSpotlights: [
          {
            commentary: 'This product suffers from poor design for wheelchair-bound individuals.',
            accessibilityNotes: []
          }
        ],
        conclusion: 'Analysis complete.'
      }

      const result = await personalityEngine.validatePersonalityConsistency(inconsistentContent)

      expect(result.isConsistent).toBe(false)
      expect(result.consistencyScore).toBeLessThan(0.7)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should check for warm tone', async () => {
      const coldContent = {
        introduction: 'Product analysis follows.',
        conclusion: 'End of report.'
      }

      const result = await personalityEngine.validatePersonalityConsistency(coldContent)

      expect(result.issues).toContain('Tone inconsistency detected')
      expect(result.suggestions).toContain('Ensure warm, conversational tone throughout')
    })

    it('should check for neurodivergent perspective', async () => {
      const genericContent = {
        introduction: 'Fashion review of standard products.',
        conclusion: 'These are good products.'
      }

      const result = await personalityEngine.validatePersonalityConsistency(genericContent)

      expect(result.issues).toContain('Missing neurodivergent perspective')
      expect(result.suggestions).toContain('Include authentic neurodivergent insights')
    })

    it('should check for accessibility mentions', async () => {
      const nonAccessibleContent = {
        introduction: 'Fashion trends for this season.',
        conclusion: 'Great styles available.'
      }

      const result = await personalityEngine.validatePersonalityConsistency(nonAccessibleContent)

      expect(result.issues).toContain('Accessibility mentions feel forced or missing')
      expect(result.suggestions).toContain('Integrate accessibility naturally into commentary')
    })
  })

  describe('Personality Management', () => {
    it('should get current personality', () => {
      const personality = personalityEngine.getPersonality()

      expect(personality.version).toBe('1.0.0')
      expect(personality.traits.neurodivergentPerspective).toBe(true)
      expect(personality.traits.disabilityAdvocacy).toBe(true)
      expect(personality.voiceCharacteristics.tone).toBe('warm')
      expect(personality.contentGuidelines.disabilityRepresentation).toBe('authentic')
    })

    it('should update personality configuration', () => {
      const updates = {
        traits: {
          fashionExpertiseLevel: 'expert' as const,
          communicationStyle: 'analytical' as const
        }
      }

      personalityEngine.updatePersonality(updates)
      const updatedPersonality = personalityEngine.getPersonality()

      expect(updatedPersonality.traits.fashionExpertiseLevel).toBe('expert')
      expect(updatedPersonality.traits.communicationStyle).toBe('analytical')
      expect(updatedPersonality.version).toContain('updated')
    })

    it('should validate personality updates', () => {
      const invalidUpdates = {
        traits: {
          fashionExpertiseLevel: 'invalid_level' as any
        }
      }

      // Mock validation to return error
      const mockValidation = require('@/lib/validation')
      mockValidation.validatePersonalityConfig.mockReturnValueOnce({
        isValid: false,
        errors: [{ field: 'traits.fashionExpertiseLevel', message: 'Invalid expertise level' }]
      })

      expect(() => {
        personalityEngine.updatePersonality(invalidUpdates)
      }).toThrow('Invalid personality update')
    })
  })

  describe('Health Check', () => {
    it('should return healthy status when working', async () => {
      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Health check commentary generated successfully' }],
          usage: { input_tokens: 50, output_tokens: 25 }
        }))
      })

      const result = await personalityEngine.healthCheck()

      expect(result.status).toBe('healthy')
      expect(result.message).toBe('Personality engine is working correctly')
      expect(result.details.modelId).toBe('anthropic.claude-3-5-sonnet-20241022-v2:0')
      expect(result.details.personalityVersion).toBe('1.0.0')
      expect(result.details.tokensUsed).toBe(75)
    })

    it('should return unhealthy status when failing', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('Service unavailable'))

      const result = await personalityEngine.healthCheck()

      expect(result.status).toBe('unhealthy')
      expect(result.message).toBeDefined()
      expect(result.details.error).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle ValidationException', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('ValidationException: Invalid model input'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'validation_error',
        retryable: false
      })
    })

    it('should handle AccessDeniedException', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('AccessDeniedException: Insufficient permissions'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'authentication',
        retryable: false
      })
    })

    it('should handle ModelNotReadyException', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('ModelNotReadyException: Model is loading'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'service_unavailable',
        retryable: true,
        retryAfter: 120
      })
    })

    it('should handle unknown errors', async () => {
      mockClient.send.mockRejectedValueOnce(new Error('Unknown error'))

      await expect(
        personalityEngine.generateCommentary({
          products: mockProducts,
          sentimentData: mockSentimentData
        })
      ).rejects.toMatchObject({
        service: 'bedrock',
        type: 'network_error',
        retryable: true
      })
    })
  })

  describe('Content Parsing', () => {
    it('should parse structured commentary sections', async () => {
      const structuredResponse = `## Introduction
Welcome to StyleScope! I'm Alex Chen.

## Trend Analysis
Magnetic closures are revolutionizing adaptive fashion.

## Product Spotlights
The featured shirt demonstrates excellent inclusive design.

## Accessibility Highlights
This product features one-handed dressing capabilities.

## Conclusion
Thank you for joining me today!`

      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: structuredResponse }],
          usage: { input_tokens: 200, output_tokens: 150 }
        }))
      })

      const result = await personalityEngine.generateCommentary({
        products: mockProducts,
        sentimentData: mockSentimentData
      })

      expect(result.content.introduction).toContain('Alex Chen')
      expect(result.content.trendAnalysis).toBeDefined()
      expect(result.content.trendAnalysis![0].trend).toContain('Magnetic')
      expect(result.content.productSpotlights).toBeDefined()
      expect(result.content.accessibilityHighlights).toBeDefined()
      expect(result.content.conclusion).toContain('Thank you')
    })

    it('should handle unstructured commentary', async () => {
      const unstructuredResponse = 'This is a simple commentary about fashion without clear sections.'

      mockClient.send.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: unstructuredResponse }],
          usage: { input_tokens: 100, output_tokens: 50 }
        }))
      })

      const result = await personalityEngine.generateCommentary({
        products: mockProducts,
        sentimentData: mockSentimentData
      })

      expect(result.content.introduction).toBeDefined()
      expect(result.content.trendAnalysis).toEqual([])
      expect(result.content.productSpotlights).toBeDefined()
      expect(result.content.conclusion).toBeDefined()
    })
  })
})