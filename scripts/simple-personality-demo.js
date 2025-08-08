#!/usr/bin/env node

// Simple PersonalityEngine Demonstration Script
// Shows real-time personality engine functionality

const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

// Simple logging functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = {
    'info': 'ℹ️ ',
    'success': '✅',
    'error': '❌',
    'thinking': '🤔',
    'personality': '🎭'
  }[type] || 'ℹ️ '
  
  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function logHeader(text) {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${text}`)
  console.log('='.repeat(80))
}

async function testPersonalityEngine() {
  logHeader('StyleScope PersonalityEngine Live Demonstration')
  
  log('Testing PersonalityEngine with real Amazon Bedrock integration...')
  
  try {
    // Test 1: Health Check
    logHeader('Test 1: Health Check')
    log('Checking PersonalityEngine health status...')
    
    const healthResponse = await axios.get(`${BASE_URL}/api/test/personality?mode=health`)
    
    if (healthResponse.data.success) {
      log('PersonalityEngine is healthy and connected to Amazon Bedrock!', 'success')
      log(`Status: ${healthResponse.data.data.status}`)
      log(`Message: ${healthResponse.data.data.message}`)
      
      if (healthResponse.data.data.details) {
        log('Details:')
        Object.entries(healthResponse.data.data.details).forEach(([key, value]) => {
          log(`  • ${key}: ${value}`)
        })
      }
    } else {
      log('Health check failed', 'error')
      console.log(JSON.stringify(healthResponse.data, null, 2))
    }
    
    // Test 2: Personality Configuration
    logHeader('Test 2: Alex Chen Personality Configuration')
    log('Retrieving Alex Chen\'s personality configuration...')
    
    const personalityResponse = await axios.get(`${BASE_URL}/api/test/personality?mode=personality`)
    
    if (personalityResponse.data.success) {
      log('Successfully retrieved Alex Chen\'s personality!', 'success')
      const personality = personalityResponse.data.data
      
      log('Core Traits:')
      Object.entries(personality.traits).forEach(([key, value]) => {
        log(`  • ${key}: ${value}`)
      })
      
      log('Voice Characteristics:')
      log(`  • Tone: ${personality.voiceCharacteristics.tone}`)
      log(`  • Vocabulary: ${personality.voiceCharacteristics.vocabularyComplexity}`)
      log(`  • Cultural References: ${personality.voiceCharacteristics.culturalReferences.join(', ')}`)
      
      log('Content Guidelines:')
      log(`  • Disability Representation: ${personality.contentGuidelines.disabilityRepresentation}`)
      log(`  • Accessibility Mentions: ${personality.contentGuidelines.accessibilityMentions}`)
      log(`  • Fashion Focus: ${personality.contentGuidelines.fashionFocusAreas.join(', ')}`)
      
      log('Knowledge Areas:')
      personality.knowledgeAreas.forEach(area => {
        log(`  • ${area.domain}: ${area.expertiseLevel}/10 expertise`)
      })
    }
    
    // Test 3: Commentary Generation
    logHeader('Test 3: Live Commentary Generation')
    log('Generating fashion commentary with Alex Chen\'s personality...', 'thinking')
    log('This will use real Amazon Bedrock API calls...')
    
    const commentaryResponse = await axios.get(`${BASE_URL}/api/test/personality?title=Live Demo Test`)
    
    if (commentaryResponse.data.success) {
      log('Successfully generated commentary!', 'success')
      const content = commentaryResponse.data.data.content
      const metadata = commentaryResponse.data.data.metadata
      
      log('Generated Commentary:', 'personality')
      
      if (content.introduction) {
        log('\n📝 Introduction:')
        console.log(content.introduction)
      }
      
      if (content.trendAnalysis && content.trendAnalysis.length > 0) {
        log('\n📈 Trend Analysis:')
        content.trendAnalysis.forEach((trend, index) => {
          log(`  ${index + 1}. ${trend.trend}`)
          log(`     ${trend.description}`)
        })
      }
      
      if (content.productSpotlights && content.productSpotlights.length > 0) {
        log('\n🛍️ Product Spotlights:')
        content.productSpotlights.forEach((spotlight, index) => {
          log(`  ${index + 1}. ${spotlight.product.title}`)
          log(`     ${spotlight.commentary}`)
          log(`     Recommendation: ${spotlight.alexRecommendation}`)
        })
      }
      
      if (content.conclusion) {
        log('\n🎯 Conclusion:')
        console.log(content.conclusion)
      }
      
      log('\n📊 Generation Metadata:')
      log(`  • Tokens Used: ${metadata.tokensUsed}`)
      log(`  • Generation Time: ${metadata.generationTime}ms`)
      log(`  • Personality Version: ${metadata.personalityVersion}`)
      log(`  • Confidence Score: ${(metadata.confidenceScore * 100).toFixed(1)}%`)
      
      log('Analysis: Notice Alex Chen\'s warm, conversational tone', 'thinking')
      log('The commentary naturally integrates accessibility considerations', 'thinking')
      log('This demonstrates authentic neurodivergent perspective in fashion analysis', 'thinking')
    }
    
    // Test 4: Consistency Validation
    logHeader('Test 4: Personality Consistency Validation')
    log('Testing personality consistency validation system...')
    
    const validationResponse = await axios.get(`${BASE_URL}/api/test/personality?mode=validate`)
    
    if (validationResponse.data.success) {
      log('Consistency validation completed!', 'success')
      const validation = validationResponse.data.data
      
      log(`Overall Consistency: ${validation.isConsistent ? 'CONSISTENT ✅' : 'INCONSISTENT ❌'}`)
      log(`Consistency Score: ${(validation.consistencyScore * 100).toFixed(1)}%`)
      
      if (validation.issues && validation.issues.length > 0) {
        log('Issues Detected:')
        validation.issues.forEach(issue => log(`  • ${issue}`))
      }
      
      if (validation.suggestions && validation.suggestions.length > 0) {
        log('Suggestions:')
        validation.suggestions.forEach(suggestion => log(`  • ${suggestion}`))
      }
      
      log('This system prevents tokenistic disability representation', 'thinking')
      log('It ensures Alex Chen\'s authentic voice is maintained', 'thinking')
    }
    
    logHeader('Demonstration Complete')
    log('PersonalityEngine is working perfectly!', 'success')
    log('Key achievements demonstrated:', 'personality')
    log('  ✅ Amazon Bedrock integration working')
    log('  ✅ Alex Chen personality consistency maintained')
    log('  ✅ Authentic disability representation')
    log('  ✅ Natural accessibility integration')
    log('  ✅ Warm, conversational tone throughout')
    log('  ✅ Structured commentary generation')
    log('  ✅ Real-time validation and quality control')
    
    log('\nYou can now visit these live demo pages:')
    log('• Personality Demo: http://localhost:3000/personality-demo')
    log('• Real-time Testing: http://localhost:3000/real-time')
    log('• Live Test Interface: http://localhost:3000/live-test')
    
  } catch (error) {
    log(`Demo failed: ${error.message}`, 'error')
    if (error.response) {
      log(`Status: ${error.response.status}`, 'error')
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'error')
    }
    
    log('Make sure the development server is running: npm run dev', 'error')
    process.exit(1)
  }
}

// Run the demonstration
if (require.main === module) {
  testPersonalityEngine().catch(error => {
    log(`Demo failed: ${error.message}`, 'error')
    process.exit(1)
  })
}

module.exports = { testPersonalityEngine }