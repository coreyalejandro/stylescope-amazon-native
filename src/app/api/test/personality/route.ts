// Test endpoint for PersonalityEngine
// Comprehensive testing with detailed execution tracking and real analysis

import { NextRequest, NextResponse } from 'next/server'
import { PersonalityEngine } from '@/services/PersonalityEngine'
import { PersonalityTester } from '@/lib/personality-tester'
import { appConfig } from '@/lib/aws-config'
import { Product, SentimentData } from '@/types'

const personalityEngine = new PersonalityEngine({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  modelId: appConfig.bedrock.modelId
})

// Sample test data
const sampleProducts: Product[] = [
  {
    asin: 'B08N5WRWNW',
    title: 'Adaptive Magnetic Closure Button-Down Shirt',
    price: { current: 45.99, currency: 'USD' },
    images: { primary: 'https://example.com/shirt.jpg', thumbnails: [] },
    category: 'Adaptive Fashion',
    rating: 4.7,
    reviewCount: 156,
    availability: 'in_stock',
    features: ['Magnetic closures', 'Easy dressing', 'Professional look', 'Machine washable'],
    accessibilityFeatures: [
      { type: 'adaptive_clothing', description: 'Magnetic closures for one-handed dressing' },
      { type: 'easy_fastening', description: 'No traditional buttons required' }
    ]
  }
]

const sampleSentiment: SentimentData[] = [
  {
    overall: { positive: 0.85, negative: 0.08, neutral: 0.05, mixed: 0.02 },
    themes: {
      quality: { score: 0.9, confidence: 0.95, mentions: 23 },
      value: { score: 0.75, confidence: 0.8, mentions: 12 },
      style: { score: 0.8, confidence: 0.85, mentions: 18 },
      fit: { score: 0.88, confidence: 0.9, mentions: 31 },
      accessibility: { score: 0.95, confidence: 0.98, mentions: 45 },
      comfort: { score: 0.92, confidence: 0.9, mentions: 28 }
    },
    keyPhrases: [
      { text: 'magnetic closures', score: 0.98, beginOffset: 0, endOffset: 16 },
      { text: 'easy to dress', score: 0.95, beginOffset: 20, endOffset: 33 },
      { text: 'one-handed', score: 0.92, beginOffset: 40, endOffset: 50 },
      { text: 'professional appearance', score: 0.88, beginOffset: 55, endOffset: 78 },
      { text: 'great quality', score: 0.9, beginOffset: 85, endOffset: 98 }
    ],
    confidence: 0.92,
    processedAt: new Date(),
    languageCode: 'en'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Running comprehensive PersonalityEngine tests')

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'generate'
    
    const tester = new PersonalityTester()

    if (mode === 'health') {
      console.log('🏥 Running health check test')
      const result = await tester.testHealthCheck()
      return NextResponse.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      })
    }

    if (mode === 'personality') {
      const personality = personalityEngine.getPersonality()
      return NextResponse.json({
        success: true,
        data: personality,
        timestamp: new Date().toISOString()
      })
    }

    if (mode === 'validate') {
      console.log('✅ Running personality consistency test')
      const result = await tester.testPersonalityConsistency()
      return NextResponse.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      })
    }

    if (mode === 'comprehensive') {
      console.log('🔬 Running comprehensive test suite')
      const results = await tester.runAllTests()
      return NextResponse.json({
        success: results.every(r => r.success),
        data: {
          summary: {
            totalTests: results.length,
            passed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            averageScore: results.reduce((sum, r) => sum + (r.metrics?.overallQuality || 0), 0) / results.length
          },
          results
        },
        timestamp: new Date().toISOString()
      })
    }

    // Default: Generate commentary with detailed analysis
    console.log('🎭 Running commentary generation test')
    const result = await tester.testCommentaryGeneration()
    
    return NextResponse.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ PersonalityEngine test error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'personality_engine_error',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, sentimentData, episodeTitle, trendContext, mode } = body

    if (mode === 'streaming') {
      // For streaming, we'll return a simple response since we can't stream in this test endpoint
      const result = await personalityEngine.generateCommentary({
        products: products || sampleProducts,
        sentimentData: sentimentData || sampleSentiment,
        episodeTitle,
        trendContext
      })

      return NextResponse.json({
        success: true,
        data: result,
        note: 'Streaming mode would normally return chunks in real-time',
        timestamp: new Date().toISOString()
      })
    }

    if (mode === 'update_personality') {
      const { personalityUpdates } = body
      personalityEngine.updatePersonality(personalityUpdates)
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Personality updated successfully',
          newPersonality: personalityEngine.getPersonality()
        },
        timestamp: new Date().toISOString()
      })
    }

    // Default: Generate commentary with custom data
    const result = await personalityEngine.generateCommentary({
      products: products || sampleProducts,
      sentimentData: sentimentData || sampleSentiment,
      episodeTitle,
      trendContext
    })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ PersonalityEngine POST test error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'personality_engine_error'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}