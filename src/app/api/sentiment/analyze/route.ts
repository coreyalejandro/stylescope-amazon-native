import { NextRequest, NextResponse } from 'next/server'
import { createComprehendService, isComprehendConfigured } from '@/services/ComprehendService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, languageCode = 'en' } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Text parameter is required and must be a string',
          code: 'MISSING_TEXT'
        }
      }, { status: 400 })
    }

    if (text.length > 5000) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Text must be 5000 characters or less',
          code: 'TEXT_TOO_LONG'
        }
      }, { status: 400 })
    }

    console.log(`🔍 API: Analyzing sentiment for text (${text.length} chars)`)

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

    const comprehendService = createComprehendService(config)
    const result = await comprehendService.analyzeSentiment({
      text,
      languageCode
    })

    const response = {
      success: true,
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        keyPhrases: result.keyPhrases?.slice(0, 10), // Limit to top 10
        entities: result.entities?.slice(0, 10), // Limit to top 10
        metadata: {
          textLength: text.length,
          languageCode,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error analyzing sentiment:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'SENTIMENT_ANALYSIS_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}