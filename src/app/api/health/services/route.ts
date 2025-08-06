import { NextResponse } from 'next/server'
import { validateAWSConfig } from '@/lib/aws-config'
import { getServiceHealth } from '@/lib/service-test'

export async function GET() {
  try {
    // Validate AWS configuration first
    validateAWSConfig()
    
    // Run comprehensive service tests
    const healthStatus = await getServiceHealth()
    
    // Add environment information
    const response = {
      ...healthStatus,
      environment: {
        node_env: process.env.NODE_ENV,
        aws_region: process.env.AWS_REGION,
        bedrock_region: process.env.BEDROCK_REGION,
        comprehend_region: process.env.COMPREHEND_REGION,
        s3_region: process.env.S3_REGION,
        dynamodb_region: process.env.DYNAMODB_REGION
      }
    }
    
    const statusCode = response.status === 'healthy' ? 200 : 
                      response.status === 'partial' ? 206 : 500
    
    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        aws_config: 'error'
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}