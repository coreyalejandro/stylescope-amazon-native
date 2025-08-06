import { S3Client } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { ComprehendClient } from '@aws-sdk/client-comprehend'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}

// Initialize AWS Clients
export const s3Client = new S3Client(awsConfig)

export const dynamoDBClient = new DynamoDBClient(awsConfig)

export const comprehendClient = new ComprehendClient({
  region: process.env.COMPREHEND_REGION || 'us-east-1',
  credentials: awsConfig.credentials,
})

export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
  credentials: awsConfig.credentials,
})

// Product Advertising API Configuration
export const paapiConfig = {
  accessKey: process.env.PAAPI_ACCESS_KEY || '',
  secretKey: process.env.PAAPI_SECRET_KEY || '',
  partnerTag: process.env.PAAPI_PARTNER_TAG || '',
  host: process.env.PAAPI_HOST || 'webservices.amazon.com',
  region: process.env.PAAPI_REGION || 'us-east-1',
}

// Application Configuration
export const appConfig = {
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'stylescope-commentary-cache',
    region: process.env.S3_REGION || 'us-east-1',
  },
  dynamodb: {
    episodesTable: process.env.DYNAMODB_TABLE_EPISODES || 'stylescope-episodes',
    sentimentTable: process.env.DYNAMODB_TABLE_SENTIMENT || 'stylescope-sentiment-cache',
    region: process.env.DYNAMODB_REGION || 'us-east-1',
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
}

// Validate required environment variables
export function validateAWSConfig(): void {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'PAAPI_ACCESS_KEY',
    'PAAPI_SECRET_KEY',
    'PAAPI_PARTNER_TAG',
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}