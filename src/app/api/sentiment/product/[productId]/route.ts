import { NextRequest, NextResponse } from 'next/server'
import { createComprehendService, isComprehendConfigured } from '@/services/ComprehendService'
import { productService } from '@/services/ProductService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID'
        }
      }, { status: 400 })
    }

    console.log(`📊 API: Analyzing sentiment for product: ${productId}`)

    // Check if Comprehend is configured
    const config = {
      region: process.env.COMPREHEND_REGION || process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }

    if (!isComprehendConfigured(config)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Amazon Comprehend is not configured. Please set AWS credentials.',
          code: 'COMPREHEND_NOT_CONFIGURED'
        }
      }, { status: 503 })
    }

    // Get product reviews
    const reviews = await productService.getProductReviews(productId, 20)
    
    if (reviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: `No reviews found for product ${productId}`,
          code: 'NO_REVIEWS_FOUND'
        }
      }, { status: 404 })
    }

    const comprehendService = createComprehendService(config)
    
    // Analyze product reviews
    const sentimentData = await comprehendService.analyzeProductReviews(productId, reviews)
    
    // Analyze accessibility sentiment
    const accessibilitySentiment = await comprehendService.analyzeAccessibilitySentiment(reviews)

    const response = {
      success: true,
      data: {
        productId,
        sentimentData,
        accessibilitySentiment,
        metadata: {
          reviewsAnalyzed: reviews.length,
          timestamp: new Date().toISOString(),
          cached: false // TODO: Implement cache detection
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error analyzing product sentiment:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PRODUCT_SENTIMENT_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}