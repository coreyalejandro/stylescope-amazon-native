// Service connection test utilities for StyleScope

import { s3Client, dynamoDBClient, comprehendClient, bedrockClient } from './aws-config'
import { ListBucketsCommand } from '@aws-sdk/client-s3'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DetectSentimentCommand } from '@aws-sdk/client-comprehend'
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export interface ServiceTestResult {
  service: string
  status: 'success' | 'error' | 'not_configured'
  message: string
  details?: Record<string, unknown>
}

export async function testS3Connection(): Promise<ServiceTestResult> {
  try {
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    return {
      service: 'Amazon S3',
      status: 'success',
      message: `Connected successfully. Found ${response.Buckets?.length || 0} buckets.`,
      details: {
        buckets: response.Buckets?.map(b => b.Name).slice(0, 5) // Show first 5 bucket names
      }
    }
  } catch (error) {
    return {
      service: 'Amazon S3',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

export async function testDynamoDBConnection(): Promise<ServiceTestResult> {
  try {
    const command = new ListTablesCommand({})
    const response = await dynamoDBClient.send(command)
    
    // Check if our required tables exist
    const requiredTables = ['stylescope-episodes', 'stylescope-sentiment-cache']
    const existingTables = response.TableNames || []
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      return {
        service: 'Amazon DynamoDB',
        status: 'error',
        message: `Connected but missing required tables: ${missingTables.join(', ')}. Please create them.`,
        details: {
          existing_tables: existingTables.length,
          missing_tables: missingTables,
          required_tables: requiredTables
        }
      }
    }
    
    return {
      service: 'Amazon DynamoDB',
      status: 'success',
      message: `Connected successfully. Found ${existingTables.length} tables including required StyleScope tables.`,
      details: {
        tables: existingTables.slice(0, 5),
        stylescope_tables_ready: true
      }
    }
  } catch (error) {
    return {
      service: 'Amazon DynamoDB',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

export async function testComprehendConnection(): Promise<ServiceTestResult> {
  try {
    const testText = "This is a test message to verify Amazon Comprehend connectivity."
    const command = new DetectSentimentCommand({
      Text: testText,
      LanguageCode: 'en'
    })
    
    const response = await comprehendClient.send(command)
    
    return {
      service: 'Amazon Comprehend',
      status: 'success',
      message: `Connected successfully. Test sentiment: ${response.Sentiment}`,
      details: {
        sentiment: response.Sentiment,
        confidence: response.SentimentScore
      }
    }
  } catch (error) {
    return {
      service: 'Amazon Comprehend',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

export async function testBedrockConnection(): Promise<ServiceTestResult> {
  const { RECOMMENDED_MODELS, getModelId, getModelDisplayName } = await import('./bedrock-models')
  
  // Try the configured model first
  const primaryModelId = getModelId()
  
  try {
    const prompt = "Test prompt for Amazon Bedrock connectivity check."
    const command = new InvokeModelCommand({
      modelId: primaryModelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })
    
    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    return {
      service: 'Amazon Bedrock',
      status: 'success',
      message: `Connected successfully using ${getModelDisplayName(primaryModelId)}. Model responded with ${responseBody.content?.[0]?.text?.length || 0} characters.`,
      details: {
        modelId: primaryModelId,
        modelName: getModelDisplayName(primaryModelId),
        responsePreview: responseBody.content?.[0]?.text?.substring(0, 100) + '...'
      }
    }
  } catch (error) {
    // If primary model fails, try to suggest alternatives
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('ValidationException') || errorMessage.includes('model')) {
      return {
        service: 'Amazon Bedrock',
        status: 'error',
        message: `Model ${getModelDisplayName(primaryModelId)} not available. ${errorMessage}`,
        details: { 
          error,
          currentModel: primaryModelId,
          suggestedModels: RECOMMENDED_MODELS,
          note: 'Try updating BEDROCK_MODEL_ID in .env.local with one of the suggested models'
        }
      }
    }
    
    return {
      service: 'Amazon Bedrock',
      status: 'error',
      message: errorMessage,
      details: { error, modelId: primaryModelId }
    }
  }
}

export async function testProductAdvertisingAPI(): Promise<ServiceTestResult> {
  try {
    // Import mock service for testing
    const { mockProductService } = await import('./mock-product-data')
    
    // Test mock product service functionality
    const products = await mockProductService.fetchBestsellingItems('fashion', 3)
    const categories = await mockProductService.getTrendingCategories()
    
    if (products.length === 0) {
      throw new Error('Mock product service returned no products')
    }
    
    // Test review functionality
    const firstProductReviews = await mockProductService.getProductReviews(products[0].asin, 2)
    
    return {
      service: 'Mock Product Service (Amazon-style)',
      status: 'success',
      message: `Mock service working perfectly. Found ${products.length} products, ${categories.length} categories, ${firstProductReviews.length} reviews.`,
      details: {
        mode: 'mock_data',
        products_available: products.length,
        categories_available: categories.length,
        sample_product: products[0].title,
        reviews_available: firstProductReviews.length,
        note: 'Using realistic mock data for hackathon demo reliability'
      }
    }
  } catch (error) {
    return {
      service: 'Mock Product Service (Amazon-style)',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    }
  }
}

export async function runAllServiceTests(): Promise<ServiceTestResult[]> {
  console.log('🧪 Running Amazon service connectivity tests...')
  
  const tests = [
    testS3Connection(),
    testDynamoDBConnection(),
    testComprehendConnection(),
    testBedrockConnection(),
    testProductAdvertisingAPI()
  ]
  
  const results = await Promise.all(tests)
  
  // Log results
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
    console.log(`${icon} ${result.service}: ${result.message}`)
  })
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const notConfiguredCount = results.filter(r => r.status === 'not_configured').length
  
  console.log(`\n📊 Test Summary: ${successCount} success, ${errorCount} errors, ${notConfiguredCount} not configured`)
  
  return results
}

// Individual service test functions for API endpoints
export async function getServiceHealth() {
  try {
    const results = await runAllServiceTests()
    
    const overallStatus = results.every(r => r.status === 'success') ? 'healthy' : 
                         results.some(r => r.status === 'error') ? 'unhealthy' : 'partial'
    
    return {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      services: results.reduce((acc, result) => {
        acc[result.service.toLowerCase().replace(/\s+/g, '_')] = {
          status: result.status,
          message: result.message,
          details: result.details
        }
        return acc
      }, {} as Record<string, unknown>)
    }
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}