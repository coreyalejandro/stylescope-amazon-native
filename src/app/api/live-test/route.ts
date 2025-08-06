// Real-time streaming test endpoint that shows actual PersonalityEngine execution
// This will make REAL calls to Bedrock and stream the results back

import { NextRequest } from 'next/server'
import { PersonalityEngine } from '@/services/PersonalityEngine'
import { appConfig } from '@/lib/aws-config'

// Create a real PersonalityEngine instance (not mocked)
const personalityEngine = new PersonalityEngine({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  modelId: appConfig.bedrock.modelId
})

// Test data
const testProducts = [
  {
    asin: 'B08N5WRWNW',
    title: 'Adaptive Magnetic Closure Button-Down Shirt',
    price: { current: 45.99, currency: 'USD' },
    images: { primary: 'https://example.com/shirt.jpg', thumbnails: [] },
    category: 'Adaptive Fashion',
    rating: 4.7,
    reviewCount: 156,
    availability: 'in_stock' as const,
    features: ['Magnetic closures', 'Easy dressing', 'Professional look'],
    accessibilityFeatures: [
      { type: 'adaptive_clothing' as const, description: 'Magnetic closures for one-handed dressing' }
    ]
  }
]

const testSentiment = [
  {
    overall: { positive: 0.85, negative: 0.08, neutral: 0.05, mixed: 0.02 },
    themes: {
      quality: { score: 0.92, confidence: 0.95, mentions: 23 },
      value: { score: 0.78, confidence: 0.85, mentions: 12 },
      style: { score: 0.83, confidence: 0.88, mentions: 18 },
      fit: { score: 0.89, confidence: 0.92, mentions: 31 },
      accessibility: { score: 0.96, confidence: 0.98, mentions: 45 },
      comfort: { score: 0.91, confidence: 0.93, mentions: 28 }
    },
    keyPhrases: [
      { text: 'magnetic closures', score: 0.98, beginOffset: 0, endOffset: 16 }
    ],
    confidence: 0.92,
    processedAt: new Date(),
    languageCode: 'en'
  }
]

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        send({ type: 'log', level: 'info', message: '🚀 Starting REAL PersonalityEngine test' })
        send({ type: 'log', level: 'info', message: '📋 This will make actual calls to Amazon Bedrock' })

        // Test 1: Health Check
        send({ type: 'log', level: 'info', message: '🏥 Testing PersonalityEngine health...' })
        const startHealth = Date.now()
        
        try {
          const healthResult = await personalityEngine.healthCheck()
          const healthDuration = Date.now() - startHealth
          
          send({ 
            type: 'log', 
            level: healthResult.status === 'healthy' ? 'success' : 'error', 
            message: `Health check: ${healthResult.status} (${healthDuration}ms)`,
            data: healthResult
          })
        } catch (error) {
          send({ 
            type: 'log', 
            level: 'error', 
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          })
        }

        // Test 2: Personality Configuration
        send({ type: 'log', level: 'info', message: '👤 Checking personality configuration...' })
        try {
          const personality = personalityEngine.getPersonality()
          send({ 
            type: 'log', 
            level: 'success', 
            message: `Personality loaded: v${personality.version}`,
            data: {
              version: personality.version,
              traits: personality.traits,
              voiceCharacteristics: personality.voiceCharacteristics
            }
          })
        } catch (error) {
          send({ 
            type: 'log', 
            level: 'error', 
            message: `Personality check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          })
        }

        // Test 3: REAL Commentary Generation
        send({ type: 'log', level: 'info', message: '🎭 Generating commentary with REAL Bedrock API call...' })
        send({ type: 'log', level: 'debug', message: `Using model: ${appConfig.bedrock.modelId}` })
        send({ type: 'log', level: 'debug', message: `Products: ${testProducts.length}, Sentiment analyses: ${testSentiment.length}` })

        const startGeneration = Date.now()
        
        try {
          const result = await personalityEngine.generateCommentary({
            products: testProducts,
            sentimentData: testSentiment,
            episodeTitle: 'LIVE TEST - Adaptive Fashion Spotlight',
            trendContext: 'Real-time testing of adaptive fashion trends with magnetic closures leading innovation.'
          })

          const generationDuration = Date.now() - startGeneration

          send({ 
            type: 'log', 
            level: 'success', 
            message: `✅ Commentary generated successfully! (${generationDuration}ms)` 
          })
          
          send({ 
            type: 'log', 
            level: 'info', 
            message: `📊 Tokens used: ${result.metadata.tokensUsed}` 
          })
          
          send({ 
            type: 'log', 
            level: 'info', 
            message: `🎯 Confidence score: ${(result.metadata.confidenceScore * 100).toFixed(1)}%` 
          })

          // Show actual generated content
          if (result.content.introduction) {
            send({ 
              type: 'log', 
              level: 'success', 
              message: `📝 Generated introduction: "${result.content.introduction.substring(0, 100)}..."` 
            })
          }

          if (result.content.trendAnalysis && result.content.trendAnalysis.length > 0) {
            send({ 
              type: 'log', 
              level: 'success', 
              message: `📈 Generated ${result.content.trendAnalysis.length} trend insights` 
            })
          }

          if (result.content.productSpotlights && result.content.productSpotlights.length > 0) {
            send({ 
              type: 'log', 
              level: 'success', 
              message: `🛍️ Generated ${result.content.productSpotlights.length} product spotlights` 
            })
          }

          // Send the full result
          send({ 
            type: 'result', 
            success: true,
            data: result,
            totalDuration: Date.now() - startHealth
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const errorStack = error instanceof Error ? error.stack : undefined
          
          send({ 
            type: 'log', 
            level: 'error', 
            message: `❌ Commentary generation FAILED: ${errorMessage}` 
          })

          if (errorStack) {
            send({ 
              type: 'log', 
              level: 'debug', 
              message: `Stack trace: ${errorStack}` 
            })
          }

          send({ 
            type: 'result', 
            success: false,
            error: errorMessage,
            stack: errorStack
          })
        }

        // Test 4: Personality Consistency Validation
        send({ type: 'log', level: 'info', message: '✅ Testing personality consistency validation...' })
        
        try {
          const sampleContent = {
            introduction: 'Welcome to StyleScope! I\'m Alex Chen, and I\'m excited to share some wonderful adaptive fashion finds.',
            trendAnalysis: [{
              trend: 'Magnetic Closures Revolution',
              description: 'These innovative systems are making fashion more accessible for our community.'
            }],
            productSpotlights: [{
              commentary: 'This adaptive shirt represents thoughtful inclusive design for the disability community.'
            }],
            conclusion: 'Thank you for celebrating inclusive fashion with me!'
          }

          const validationResult = await personalityEngine.validatePersonalityConsistency(sampleContent)
          
          send({ 
            type: 'log', 
            level: validationResult.isConsistent ? 'success' : 'error', 
            message: `Consistency validation: ${validationResult.isConsistent ? 'PASSED' : 'FAILED'} (${(validationResult.consistencyScore * 100).toFixed(1)}%)`,
            data: validationResult
          })

        } catch (error) {
          send({ 
            type: 'log', 
            level: 'error', 
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          })
        }

        send({ type: 'log', level: 'success', message: '🎉 All tests completed!' })
        send({ type: 'complete' })

      } catch (error) {
        send({ 
          type: 'log', 
          level: 'error', 
          message: `💥 Test suite crashed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        })
        send({ type: 'complete' })
      }

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}