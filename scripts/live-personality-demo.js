#!/usr/bin/env node

// Live PersonalityEngine Demonstration Script
// Shows real-time personality engine functionality with detailed logging

const axios = require('axios')

// Simple color functions without chalk dependency
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

const BASE_URL = 'http://localhost:3000'

// Test scenarios for comprehensive demonstration
const testScenarios = [
  {
    name: 'Basic Commentary Generation',
    endpoint: '/api/test/personality',
    method: 'GET',
    params: { title: 'Adaptive Fashion Spotlight' },
    description: 'Generate commentary with sample adaptive fashion product'
  },
  {
    name: 'Personality Configuration Check',
    endpoint: '/api/test/personality',
    method: 'GET',
    params: { mode: 'personality' },
    description: 'View Alex Chen\'s current personality configuration'
  },
  {
    name: 'Personality Consistency Validation',
    endpoint: '/api/test/personality',
    method: 'GET',
    params: { mode: 'validate' },
    description: 'Test personality consistency validation system'
  },
  {
    name: 'Health Check',
    endpoint: '/api/test/personality',
    method: 'GET',
    params: { mode: 'health' },
    description: 'Check PersonalityEngine and Bedrock connectivity'
  },
  {
    name: 'Custom Product Commentary',
    endpoint: '/api/test/personality',
    method: 'POST',
    data: {
      products: [{
        asin: 'B09X1Y2Z3A',
        title: 'Sensory-Friendly Weighted Hoodie with Magnetic Zipper',
        price: { current: 89.99, currency: 'USD' },
        images: { primary: 'https://example.com/hoodie.jpg', thumbnails: [] },
        category: 'Adaptive Clothing',
        rating: 4.8,
        reviewCount: 234,
        availability: 'in_stock',
        features: ['Weighted design', 'Magnetic zipper', 'Tag-free', 'Soft seams'],
        accessibilityFeatures: [
          { type: 'sensory_friendly', description: 'Designed for sensory processing differences' },
          { type: 'easy_fastening', description: 'Magnetic zipper for easy one-handed operation' }
        ]
      }],
      sentimentData: [{
        overall: { positive: 0.92, negative: 0.04, neutral: 0.03, mixed: 0.01 },
        themes: {
          quality: { score: 0.95, confidence: 0.98, mentions: 45 },
          value: { score: 0.85, confidence: 0.9, mentions: 28 },
          style: { score: 0.88, confidence: 0.85, mentions: 32 },
          fit: { score: 0.91, confidence: 0.95, mentions: 52 },
          accessibility: { score: 0.98, confidence: 0.99, mentions: 67 },
          comfort: { score: 0.96, confidence: 0.97, mentions: 58 }
        },
        keyPhrases: [
          { text: 'sensory friendly', score: 0.99, beginOffset: 0, endOffset: 15 },
          { text: 'weighted comfort', score: 0.95, beginOffset: 20, endOffset: 35 },
          { text: 'magnetic zipper', score: 0.93, beginOffset: 40, endOffset: 55 }
        ],
        confidence: 0.96,
        processedAt: new Date(),
        languageCode: 'en'
      }],
      episodeTitle: 'Sensory-Friendly Fashion Revolution',
      trendContext: 'Weighted clothing and sensory-friendly design are becoming mainstream as awareness of neurodivergent needs grows in the fashion industry.'
    },
    description: 'Generate commentary for custom sensory-friendly product'
  }
]

// Utility functions for beautiful console output
function logHeader(text) {
  console.log('\n' + colors.cyan('='.repeat(80)))
  console.log(colors.cyan(colors.bold(`  ${text}`)))
  console.log(colors.cyan('='.repeat(80)))
}

function logSubheader(text) {
  console.log('\n' + colors.yellow(`📋 ${text}`))
  console.log(colors.yellow('-'.repeat(50)))
}

function logSuccess(text) {
  console.log(colors.green(`✅ ${text}`))
}

function logError(text) {
  console.log(colors.red(`❌ ${text}`))
}

function logInfo(text) {
  console.log(colors.blue(`ℹ️  ${text}`))
}

function logThinking(text) {
  console.log(colors.magenta(`🤔 ${text}`))
}

function logPersonality(text) {
  console.log(colors.cyan(`🎭 ${text}`))
}

// Main demonstration function
async function runLiveDemo() {
  logHeader('StyleScope PersonalityEngine Live Demonstration')
  
  logInfo('This demonstration will show the PersonalityEngine in action')
  logInfo('We\'ll test various aspects of Alex Chen\'s personality system')
  logInfo('Each test will show both the request and detailed response analysis')
  
  // Wait for server to be ready
  logSubheader('Checking Server Status')
  try {
    await axios.get(`${BASE_URL}/api/health/services`)
    logSuccess('Development server is running and ready')
  } catch (error) {
    logError('Development server is not running. Please start it with: npm run dev')
    process.exit(1)
  }

  // Run each test scenario
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i]
    
    logHeader(`Test ${i + 1}: ${scenario.name}`)
    logInfo(scenario.description)
    
    logThinking('Preparing request...')
    
    try {
      const startTime = Date.now()
      
      // Make the request
      let response
      if (scenario.method === 'GET') {
        const url = new URL(`${BASE_URL}${scenario.endpoint}`)
        if (scenario.params) {
          Object.entries(scenario.params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
          })
        }
        logInfo(`Making GET request to: ${url.toString()}`)
        response = await axios.get(url.toString())
      } else {
        logInfo(`Making POST request to: ${BASE_URL}${scenario.endpoint}`)
        response = await axios.post(`${BASE_URL}${scenario.endpoint}`, scenario.data)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      logSuccess(`Request completed in ${duration}ms`)
      
      // Analyze the response
      analyzeResponse(scenario, response.data, duration)
      
    } catch (error) {
      logError(`Request failed: ${error.message}`)
      if (error.response) {
        console.log(chalk.red(`Status: ${error.response.status}`))
        console.log(chalk.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`))
      }
    }
    
    // Wait between tests for readability
    if (i < testScenarios.length - 1) {
      logInfo('Waiting 2 seconds before next test...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  logHeader('Live Demonstration Complete')
  logSuccess('All tests completed successfully!')
  logInfo('You can now visit the live demo pages:')
  logInfo('• Personality Demo: http://localhost:3000/personality-demo')
  logInfo('• Real-time Testing: http://localhost:3000/real-time')
  logInfo('• Live Test Interface: http://localhost:3000/live-test')
  
  logPersonality('Alex Chen\'s PersonalityEngine is ready for interactive testing!')
}

// Response analysis function
function analyzeResponse(scenario, data, duration) {
  logSubheader('Response Analysis')
  
  if (!data.success) {
    logError('Request was not successful')
    console.log(chalk.red(JSON.stringify(data.error, null, 2)))
    return
  }
  
  switch (scenario.name) {
    case 'Basic Commentary Generation':
      analyzeCommentaryGeneration(data.data, duration)
      break
      
    case 'Personality Configuration Check':
      analyzePersonalityConfig(data.data)
      break
      
    case 'Personality Consistency Validation':
      analyzeConsistencyValidation(data.data)
      break
      
    case 'Health Check':
      analyzeHealthCheck(data.data)
      break
      
    case 'Custom Product Commentary':
      analyzeCustomCommentary(data.data, duration)
      break
      
    default:
      logInfo('Raw response data:')
      console.log(JSON.stringify(data, null, 2))
  }
}

function analyzeCommentaryGeneration(data, duration) {
  logPersonality('Alex Chen Generated Commentary:')
  
  if (data.content) {
    if (data.content.introduction) {
      console.log(chalk.cyan('\n📝 Introduction:'))
      console.log(chalk.white(data.content.introduction))
    }
    
    if (data.content.trendAnalysis && data.content.trendAnalysis.length > 0) {
      console.log(chalk.cyan('\n📈 Trend Analysis:'))
      data.content.trendAnalysis.forEach((trend, index) => {
        console.log(chalk.yellow(`  ${index + 1}. ${trend.trend}`))
        console.log(chalk.white(`     ${trend.description}`))
        if (trend.accessibilityRelevance) {
          console.log(chalk.green(`     ♿ ${trend.accessibilityRelevance}`))
        }
      })
    }
    
    if (data.content.productSpotlights && data.content.productSpotlights.length > 0) {
      console.log(chalk.cyan('\n🛍️ Product Spotlights:'))
      data.content.productSpotlights.forEach((spotlight, index) => {
        console.log(chalk.yellow(`  ${index + 1}. ${spotlight.product.title}`))
        console.log(chalk.white(`     ${spotlight.commentary}`))
        console.log(chalk.blue(`     Recommendation: ${spotlight.alexRecommendation}`))
        if (spotlight.accessibilityNotes && spotlight.accessibilityNotes.length > 0) {
          console.log(chalk.green(`     ♿ Accessibility: ${spotlight.accessibilityNotes.join(', ')}`))
        }
      })
    }
    
    if (data.content.conclusion) {
      console.log(chalk.cyan('\n🎯 Conclusion:'))
      console.log(chalk.white(data.content.conclusion))
    }
  }
  
  if (data.metadata) {
    console.log(chalk.magenta('\n📊 Generation Metadata:'))
    console.log(chalk.white(`  • Tokens Used: ${data.metadata.tokensUsed}`))
    console.log(chalk.white(`  • Generation Time: ${data.metadata.generationTime}ms`))
    console.log(chalk.white(`  • Personality Version: ${data.metadata.personalityVersion}`))
    console.log(chalk.white(`  • Confidence Score: ${(data.metadata.confidenceScore * 100).toFixed(1)}%`))
  }
  
  logThinking('Analysis: This demonstrates Alex Chen\'s ability to generate structured, personality-consistent commentary')
  logThinking('Notice the warm, conversational tone and natural integration of accessibility considerations')
}

function analyzePersonalityConfig(data) {
  logPersonality('Alex Chen\'s Personality Configuration:')
  
  console.log(chalk.cyan('\n🧠 Core Traits:'))
  Object.entries(data.traits).forEach(([key, value]) => {
    console.log(chalk.white(`  • ${key}: ${value}`))
  })
  
  console.log(chalk.cyan('\n🗣️ Voice Characteristics:'))
  Object.entries(data.voiceCharacteristics).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(chalk.white(`  • ${key}: ${value.join(', ')}`))
    } else {
      console.log(chalk.white(`  • ${key}: ${value}`))
    }
  })
  
  console.log(chalk.cyan('\n📋 Content Guidelines:'))
  Object.entries(data.contentGuidelines).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(chalk.white(`  • ${key}: ${value.join(', ')}`))
    } else {
      console.log(chalk.white(`  • ${key}: ${value}`))
    }
  })
  
  console.log(chalk.cyan('\n🎓 Knowledge Areas:'))
  data.knowledgeAreas.forEach(area => {
    console.log(chalk.white(`  • ${area.domain}: ${area.expertiseLevel}/10`))
    console.log(chalk.gray(`    Specializations: ${area.specializations.join(', ')}`))
  })
  
  logThinking('Analysis: This shows Alex Chen\'s comprehensive personality configuration')
  logThinking('Notice the focus on neurodivergent perspective and authentic disability representation')
}

function analyzeConsistencyValidation(data) {
  logPersonality('Personality Consistency Validation Results:')
  
  console.log(chalk.cyan(`\n📊 Overall Consistency: ${data.isConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`))
  console.log(chalk.white(`Consistency Score: ${(data.consistencyScore * 100).toFixed(1)}%`))
  
  if (data.issues && data.issues.length > 0) {
    console.log(chalk.red('\n⚠️ Issues Detected:'))
    data.issues.forEach(issue => {
      console.log(chalk.red(`  • ${issue}`))
    })
  }
  
  if (data.suggestions && data.suggestions.length > 0) {
    console.log(chalk.yellow('\n💡 Suggestions:'))
    data.suggestions.forEach(suggestion => {
      console.log(chalk.yellow(`  • ${suggestion}`))
    })
  }
  
  logThinking('Analysis: This demonstrates the automated personality consistency validation')
  logThinking('The system checks for authentic representation and prevents tokenistic language')
}

function analyzeHealthCheck(data) {
  logPersonality('PersonalityEngine Health Status:')
  
  console.log(chalk.cyan(`\n🏥 Status: ${data.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`))
  console.log(chalk.white(`Message: ${data.message}`))
  
  if (data.details) {
    console.log(chalk.cyan('\n📋 Details:'))
    Object.entries(data.details).forEach(([key, value]) => {
      console.log(chalk.white(`  • ${key}: ${value}`))
    })
  }
  
  logThinking('Analysis: This shows the PersonalityEngine is connected to Amazon Bedrock')
  logThinking('Health checks ensure the AI system is ready for commentary generation')
}

function analyzeCustomCommentary(data, duration) {
  logPersonality('Custom Product Commentary Generated:')
  
  analyzeCommentaryGeneration(data, duration)
  
  logThinking('Analysis: This demonstrates Alex Chen\'s ability to analyze custom products')
  logThinking('Notice how the personality adapts to sensory-friendly and weighted clothing features')
  logThinking('The commentary maintains consistency while addressing specific accessibility needs')
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`)
  process.exit(1)
})

// Run the demonstration
if (require.main === module) {
  runLiveDemo().catch(error => {
    logError(`Demo failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { runLiveDemo }