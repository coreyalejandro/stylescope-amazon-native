import { NextResponse } from 'next/server'
import { createComprehendService, isComprehendConfigured } from '@/services/ComprehendService'
import { mockProductService } from '@/lib/mock-product-data'

export async function GET() {
  try {
    console.log('🧪 Running comprehensive Comprehend service tests...')
    
    const testResults = []

    // Check if Comprehend is configured
    const config = {
      region: process.env.COMPREHEND_REGION || process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }

    if (!isComprehendConfigured(config)) {
      testResults.push({
        test: 'comprehendConfiguration',
        status: 'error',
        message: 'Amazon Comprehend is not configured. Please set AWS credentials.',
        data: { configured: false }
      })
    } else {
      testResults.push({
        test: 'comprehendConfiguration',
        status: 'success',
        message: 'Amazon Comprehend is properly configured',
        data: { configured: true, region: config.region }
      })

      const comprehendService = createComprehendService(config)

      // Test 1: Basic sentiment analysis
      try {
        const basicSentiment = await comprehendService.analyzeSentiment({
          text: 'I love this product! It fits perfectly and the quality is amazing.',
          languageCode: 'en'
        })
        
        testResults.push({
          test: 'basicSentimentAnalysis',
          status: 'success',
          message: `Sentiment analysis successful: ${basicSentiment.sentiment}`,
          data: {
            sentiment: basicSentiment.sentiment,
            confidence: Math.max(...Object.values(basicSentiment.sentimentScore)),
            keyPhrasesCount: basicSentiment.keyPhrases?.length || 0
          }
        })
      } catch (error) {
        testResults.push({
          test: 'basicSentimentAnalysis',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 2: Batch sentiment analysis
      try {
        const batchTexts = [
          'This product is excellent quality and fits well.',
          'Poor quality, would not recommend.',
          'Average product, nothing special but okay.'
        ]
        
        const batchResults = await comprehendService.batchAnalyzeSentiment({
          textList: batchTexts,
          languageCode: 'en'
        })
        
        testResults.push({
          test: 'batchSentimentAnalysis',
          status: 'success',
          message: `Batch analysis successful: ${batchResults.length} results`,
          data: {
            resultsCount: batchResults.length,
            sentiments: batchResults.map(r => r.sentiment)
          }
        })
      } catch (error) {
        testResults.push({
          test: 'batchSentimentAnalysis',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 3: Product review analysis
      try {
        const testProductId = 'B08N5WRWNW' // Levi's jeans from mock data
        const reviews = await mockProductService.getProductReviews(testProductId, 5)
        
        const productSentiment = await comprehendService.analyzeProductReviews(testProductId, reviews)
        
        testResults.push({
          test: 'productReviewAnalysis',
          status: 'success',
          message: `Product sentiment analysis successful for ${reviews.length} reviews`,
          data: {
            productId: testProductId,
            reviewsAnalyzed: reviews.length,
            overallSentiment: productSentiment.overall.positive > 0.5 ? 'positive' : 'negative',
            confidence: productSentiment.confidence
          }
        })
      } catch (error) {
        testResults.push({
          test: 'productReviewAnalysis',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 4: Accessibility sentiment analysis
      try {
        const testReviews = await mockProductService.getProductReviews('B08N5WRWNW', 5)
        
        const accessibilitySentiment = await comprehendService.analyzeAccessibilitySentiment(testReviews)
        
        testResults.push({
          test: 'accessibilitySentimentAnalysis',
          status: 'success',
          message: `Accessibility sentiment analysis complete: ${accessibilitySentiment.overallAccessibilitySentiment}`,
          data: {
            overallSentiment: accessibilitySentiment.overallAccessibilitySentiment,
            mentionsCount: accessibilitySentiment.accessibilityMentions.length,
            accessibilityScore: accessibilitySentiment.accessibilityScore
          }
        })
      } catch (error) {
        testResults.push({
          test: 'accessibilitySentimentAnalysis',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 5: Service health check
      try {
        const healthCheck = await comprehendService.healthCheck()
        
        testResults.push({
          test: 'serviceHealthCheck',
          status: healthCheck.status === 'healthy' ? 'success' : 'error',
          message: healthCheck.message,
          data: healthCheck.details
        })
      } catch (error) {
        testResults.push({
          test: 'serviceHealthCheck',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = testResults.filter(r => r.status === 'success').length
    const errorCount = testResults.filter(r => r.status === 'error').length

    const response = {
      timestamp: new Date().toISOString(),
      message: 'Comprehend service tests completed',
      summary: {
        total: testResults.length,
        success: successCount,
        errors: errorCount,
        success_rate: `${Math.round((successCount / testResults.length) * 100)}%`
      },
      results: testResults
    }

    console.log(`✅ Comprehend service tests completed: ${successCount}/${testResults.length} passed`)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ Comprehend service test failed:', error)
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Comprehend service test failed'
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}