// Amazon Comprehend sentiment analysis service for StyleScope
// Analyzes customer reviews to provide insights for Alex Chen's fashion commentary

import { 
  ComprehendClient, 
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectEntitiesCommand,
  BatchDetectSentimentCommand,
  BatchDetectKeyPhrasesCommand,
  SentimentType,
  Entity,
  KeyPhrase
} from '@aws-sdk/client-comprehend'
import { SentimentData, Review, ServiceError } from '@/types'
import { validateComprehendResponse, validateSentimentData } from '@/lib/validation'
import { transformComprehendToSentimentData } from '@/lib/data-transformers'
import { database } from '@/lib/database'

export interface ComprehendConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface SentimentAnalysisRequest {
  text: string
  languageCode?: string
}

export interface BatchSentimentRequest {
  textList: string[]
  languageCode?: string
}

export interface ComprehendResponse {
  sentiment: SentimentType
  sentimentScore: {
    Positive: number
    Negative: number
    Neutral: number
    Mixed: number
  }
  keyPhrases?: KeyPhrase[]
  entities?: Entity[]
}

export class ComprehendService {
  private client: ComprehendClient
  private config: ComprehendConfig

  constructor(config: ComprehendConfig) {
    this.config = config
    this.client = new ComprehendClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<ComprehendResponse> {
    try {
      console.log(`🔍 Analyzing sentiment for text (${request.text.length} chars)`)
      
      const languageCode = request.languageCode || 'en'
      
      // Detect sentiment
      const sentimentCommand = new DetectSentimentCommand({
        Text: request.text,
        LanguageCode: languageCode
      })
      
      const sentimentResponse = await this.client.send(sentimentCommand)
      
      if (!sentimentResponse.Sentiment || !sentimentResponse.SentimentScore) {
        throw new Error('Invalid sentiment response from Comprehend')
      }

      // Detect key phrases
      const keyPhrasesCommand = new DetectKeyPhrasesCommand({
        Text: request.text,
        LanguageCode: languageCode
      })
      
      const keyPhrasesResponse = await this.client.send(keyPhrasesCommand)

      // Detect entities
      const entitiesCommand = new DetectEntitiesCommand({
        Text: request.text,
        LanguageCode: languageCode
      })
      
      const entitiesResponse = await this.client.send(entitiesCommand)

      const result: ComprehendResponse = {
        sentiment: sentimentResponse.Sentiment,
        sentimentScore: {
          Positive: sentimentResponse.SentimentScore.Positive || 0,
          Negative: sentimentResponse.SentimentScore.Negative || 0,
          Neutral: sentimentResponse.SentimentScore.Neutral || 0,
          Mixed: sentimentResponse.SentimentScore.Mixed || 0
        },
        keyPhrases: keyPhrasesResponse.KeyPhrases || [],
        entities: entitiesResponse.Entities || []
      }

      console.log(`✅ Sentiment analysis complete: ${result.sentiment}`)
      return result
    } catch (error) {
      console.error('❌ Error analyzing sentiment:', error)
      throw this.handleComprehendError(error, 'analyzeSentiment')
    }
  }

  /**
   * Analyze sentiment for multiple texts in batch
   */
  async batchAnalyzeSentiment(request: BatchSentimentRequest): Promise<ComprehendResponse[]> {
    try {
      console.log(`🔍 Batch analyzing sentiment for ${request.textList.length} texts`)
      
      const languageCode = request.languageCode || 'en'
      
      // Batch detect sentiment (max 25 items per batch)
      const batches = this.chunkArray(request.textList, 25)
      const allResults: ComprehendResponse[] = []

      for (const batch of batches) {
        const sentimentCommand = new BatchDetectSentimentCommand({
          TextList: batch,
          LanguageCode: languageCode
        })
        
        const sentimentResponse = await this.client.send(sentimentCommand)
        
        // Batch detect key phrases
        const keyPhrasesCommand = new BatchDetectKeyPhrasesCommand({
          TextList: batch,
          LanguageCode: languageCode
        })
        
        const keyPhrasesResponse = await this.client.send(keyPhrasesCommand)

        // Combine results
        if (sentimentResponse.ResultList) {
          sentimentResponse.ResultList.forEach((sentiment, index) => {
            const keyPhrases = keyPhrasesResponse.ResultList?.[index]?.KeyPhrases || []
            
            allResults.push({
              sentiment: sentiment.Sentiment || 'NEUTRAL',
              sentimentScore: {
                Positive: sentiment.SentimentScore?.Positive || 0,
                Negative: sentiment.SentimentScore?.Negative || 0,
                Neutral: sentiment.SentimentScore?.Neutral || 0,
                Mixed: sentiment.SentimentScore?.Mixed || 0
              },
              keyPhrases,
              entities: [] // Entities not available in batch mode
            })
          })
        }
      }

      console.log(`✅ Batch sentiment analysis complete: ${allResults.length} results`)
      return allResults
    } catch (error) {
      console.error('❌ Error in batch sentiment analysis:', error)
      throw this.handleComprehendError(error, 'batchAnalyzeSentiment')
    }
  }

  /**
   * Analyze reviews for a specific product
   */
  async analyzeProductReviews(productId: string, reviews: Review[]): Promise<SentimentData> {
    try {
      console.log(`📝 Analyzing sentiment for ${reviews.length} reviews of product ${productId}`)
      
      // Check cache first
      const cachedSentiment = await database.sentimentCache.getSentiment(productId)
      if (cachedSentiment) {
        console.log(`✅ Using cached sentiment data for product ${productId}`)
        return cachedSentiment
      }

      if (reviews.length === 0) {
        console.log('📭 No reviews to analyze')
        return this.createEmptySentimentData()
      }

      // Combine all review content for analysis
      const reviewTexts = reviews.map(review => `${review.title} ${review.content}`)
      const combinedText = reviewTexts.join(' ')

      // Analyze combined sentiment
      const comprehendResponse = await this.analyzeSentiment({
        text: combinedText.substring(0, 5000), // Limit to 5000 chars for API limits
        languageCode: 'en'
      })

      // Transform to our internal format
      const sentimentData = transformComprehendToSentimentData(
        {
          Sentiment: comprehendResponse.sentiment,
          SentimentScore: comprehendResponse.sentimentScore
        },
        {
          KeyPhrases: comprehendResponse.keyPhrases || []
        },
        combinedText
      )

      // Validate the result
      const validation = validateSentimentData(sentimentData)
      if (!validation.success) {
        console.warn('⚠️ Invalid sentiment data generated:', validation.error)
        return this.createEmptySentimentData()
      }

      // Cache the result
      await database.sentimentCache.saveSentiment(productId, sentimentData)

      console.log(`✅ Sentiment analysis complete for product ${productId}`)
      return sentimentData
    } catch (error) {
      console.error(`❌ Error analyzing product reviews for ${productId}:`, error)
      
      // Return empty sentiment data on error to prevent blocking
      return this.createEmptySentimentData()
    }
  }

  /**
   * Analyze multiple products' reviews in batch
   */
  async batchAnalyzeProductReviews(productReviews: Array<{ productId: string; reviews: Review[] }>): Promise<Map<string, SentimentData>> {
    try {
      console.log(`📊 Batch analyzing sentiment for ${productReviews.length} products`)
      
      const results = new Map<string, SentimentData>()
      
      // Process in parallel with concurrency limit
      const concurrencyLimit = 3
      const chunks = this.chunkArray(productReviews, concurrencyLimit)
      
      for (const chunk of chunks) {
        const promises = chunk.map(({ productId, reviews }) => 
          this.analyzeProductReviews(productId, reviews)
            .then(sentiment => ({ productId, sentiment }))
            .catch(error => {
              console.error(`❌ Error analyzing product ${productId}:`, error)
              return { productId, sentiment: this.createEmptySentimentData() }
            })
        )
        
        const chunkResults = await Promise.all(promises)
        chunkResults.forEach(({ productId, sentiment }) => {
          results.set(productId, sentiment)
        })
      }

      console.log(`✅ Batch sentiment analysis complete: ${results.size} products processed`)
      return results
    } catch (error) {
      console.error('❌ Error in batch product review analysis:', error)
      return new Map()
    }
  }

  /**
   * Extract accessibility-related sentiment from reviews
   */
  async analyzeAccessibilitySentiment(reviews: Review[]): Promise<{
    overallAccessibilitySentiment: 'positive' | 'negative' | 'neutral'
    accessibilityMentions: string[]
    accessibilityScore: number
  }> {
    try {
      console.log(`♿ Analyzing accessibility sentiment from ${reviews.length} reviews`)
      
      // Filter reviews that mention accessibility-related terms
      const accessibilityKeywords = [
        'accessible', 'accessibility', 'adaptive', 'disability', 'disabled',
        'mobility', 'wheelchair', 'easy to put on', 'easy to wear',
        'magnetic', 'velcro', 'zipper', 'button', 'one handed',
        'arthritis', 'dexterity', 'sensory', 'autism', 'sensory friendly'
      ]
      
      const accessibilityReviews = reviews.filter(review => {
        const text = `${review.title} ${review.content}`.toLowerCase()
        return accessibilityKeywords.some(keyword => text.includes(keyword))
      })

      if (accessibilityReviews.length === 0) {
        return {
          overallAccessibilitySentiment: 'neutral',
          accessibilityMentions: [],
          accessibilityScore: 0.5
        }
      }

      // Analyze sentiment of accessibility-related reviews
      const accessibilityTexts = accessibilityReviews.map(review => 
        `${review.title} ${review.content}`
      )
      
      const batchResults = await this.batchAnalyzeSentiment({
        textList: accessibilityTexts
      })

      // Calculate overall accessibility sentiment
      const positiveCount = batchResults.filter(r => r.sentiment === 'POSITIVE').length
      const negativeCount = batchResults.filter(r => r.sentiment === 'NEGATIVE').length
      
      let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
      if (positiveCount > negativeCount) {
        overallSentiment = 'positive'
      } else if (negativeCount > positiveCount) {
        overallSentiment = 'negative'
      }

      // Extract accessibility mentions
      const accessibilityMentions = batchResults
        .flatMap(result => result.keyPhrases || [])
        .filter(phrase => 
          accessibilityKeywords.some(keyword => 
            phrase.Text?.toLowerCase().includes(keyword)
          )
        )
        .map(phrase => phrase.Text || '')
        .filter(text => text.length > 0)
        .slice(0, 10) // Limit to top 10 mentions

      // Calculate accessibility score (0-1)
      const totalSentimentScore = batchResults.reduce((sum, result) => 
        sum + result.sentimentScore.Positive - result.sentimentScore.Negative, 0
      )
      const accessibilityScore = Math.max(0, Math.min(1, 
        0.5 + (totalSentimentScore / batchResults.length)
      ))

      console.log(`✅ Accessibility sentiment analysis complete: ${overallSentiment}`)
      return {
        overallAccessibilitySentiment: overallSentiment,
        accessibilityMentions: [...new Set(accessibilityMentions)], // Remove duplicates
        accessibilityScore
      }
    } catch (error) {
      console.error('❌ Error analyzing accessibility sentiment:', error)
      return {
        overallAccessibilitySentiment: 'neutral',
        accessibilityMentions: [],
        accessibilityScore: 0.5
      }
    }
  }

  /**
   * Create empty sentiment data for error cases
   */
  private createEmptySentimentData(): SentimentData {
    return {
      overall: {
        positive: 0.5,
        negative: 0.25,
        neutral: 0.25,
        mixed: 0
      },
      themes: {
        quality: { score: 0.5, confidence: 0.3, mentions: 0 },
        value: { score: 0.5, confidence: 0.3, mentions: 0 },
        style: { score: 0.5, confidence: 0.3, mentions: 0 },
        fit: { score: 0.5, confidence: 0.3, mentions: 0 },
        accessibility: { score: 0.5, confidence: 0.3, mentions: 0 },
        comfort: { score: 0.5, confidence: 0.3, mentions: 0 }
      },
      keyPhrases: [],
      confidence: 0.3,
      processedAt: new Date(),
      languageCode: 'en'
    }
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Handle Comprehend service errors
   */
  private handleComprehendError(error: unknown, operation: string): ServiceError {
    if (error instanceof Error) {
      // Parse Comprehend-specific errors
      if (error.message.includes('TextSizeLimitExceededException')) {
        return {
          service: 'comprehend',
          type: 'validation_error',
          message: 'Text too long for Comprehend analysis (max 5000 bytes)',
          retryable: false
        }
      }
      
      if (error.message.includes('ThrottlingException')) {
        return {
          service: 'comprehend',
          type: 'rate_limit',
          message: 'Comprehend API rate limit exceeded',
          retryable: true,
          retryAfter: 60
        }
      }
      
      if (error.message.includes('AccessDeniedException')) {
        return {
          service: 'comprehend',
          type: 'authentication',
          message: 'Invalid Comprehend credentials or insufficient permissions',
          retryable: false
        }
      }
      
      if (error.message.includes('ServiceUnavailableException')) {
        return {
          service: 'comprehend',
          type: 'service_unavailable',
          message: 'Comprehend service temporarily unavailable',
          retryable: true,
          retryAfter: 30
        }
      }
    }

    return {
      service: 'comprehend',
      type: 'network_error',
      message: `Comprehend error in ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
      retryAfter: 10
    }
  }

  /**
   * Health check for Comprehend service
   */
  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      // Test with a simple sentiment analysis
      const testResult = await this.analyzeSentiment({
        text: 'This is a test message for health check.',
        languageCode: 'en'
      })

      return {
        status: 'healthy',
        message: 'Comprehend service is working correctly',
        details: {
          region: this.config.region,
          testSentiment: testResult.sentiment,
          testConfidence: Math.max(...Object.values(testResult.sentimentScore))
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          region: this.config.region,
          error
        }
      }
    }
  }
}

// Factory function to create Comprehend service
export function createComprehendService(config: ComprehendConfig): ComprehendService {
  return new ComprehendService(config)
}

// Check if Comprehend is configured
export function isComprehendConfigured(config: Partial<ComprehendConfig>): config is ComprehendConfig {
  return !!(
    config.region &&
    config.accessKeyId &&
    config.secretAccessKey
  )
}