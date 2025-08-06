#!/usr/bin/env node

// Script to create required DynamoDB tables for StyleScope

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb')

const client = new DynamoDBClient({ region: 'us-east-1' })

const tables = [
  {
    TableName: 'stylescope-episodes',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'StyleScope' },
      { Key: 'Environment', Value: 'Development' },
      { Key: 'Purpose', Value: 'Commentary Episodes Storage' }
    ]
  },
  {
    TableName: 'stylescope-sentiment-cache',
    KeySchema: [
      { AttributeName: 'productId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'productId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'StyleScope' },
      { Key: 'Environment', Value: 'Development' },
      { Key: 'Purpose', Value: 'Sentiment Analysis Cache' }
    ]
  }
]

async function createTable(tableConfig) {
  try {
    console.log(`🔨 Creating table: ${tableConfig.TableName}`)
    
    const command = new CreateTableCommand(tableConfig)
    const response = await client.send(command)
    
    console.log(`✅ Table ${tableConfig.TableName} created successfully`)
    console.log(`   Status: ${response.TableDescription.TableStatus}`)
    console.log(`   ARN: ${response.TableDescription.TableArn}`)
    
    return true
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table ${tableConfig.TableName} already exists`)
      return true
    } else {
      console.error(`❌ Error creating table ${tableConfig.TableName}:`, error.message)
      return false
    }
  }
}

async function listExistingTables() {
  try {
    console.log('📋 Checking existing tables...')
    const command = new ListTablesCommand({})
    const response = await client.send(command)
    
    console.log(`Found ${response.TableNames.length} existing tables:`)
    response.TableNames.forEach(name => {
      console.log(`   - ${name}`)
    })
    
    return response.TableNames
  } catch (error) {
    console.error('❌ Error listing tables:', error.message)
    if (error.name === 'AccessDeniedException') {
      console.log('\n🔑 Permission Issue Detected!')
      console.log('Your IAM user needs DynamoDB permissions. Add this policy:')
      console.log(JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "dynamodb:CreateTable",
              "dynamodb:ListTables",
              "dynamodb:DescribeTable",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ],
            "Resource": [
              "arn:aws:dynamodb:*:*:table/stylescope-*"
            ]
          }
        ]
      }, null, 2))
    }
    return []
  }
}

async function main() {
  console.log('🚀 StyleScope DynamoDB Setup')
  console.log('============================')
  console.log('')
  
  // List existing tables first
  const existingTables = await listExistingTables()
  console.log('')
  
  if (existingTables.length === 0 && existingTables !== null) {
    console.log('❌ Cannot proceed due to permission issues.')
    console.log('Please add DynamoDB permissions to your IAM user first.')
    process.exit(1)
  }
  
  // Create required tables
  let successCount = 0
  for (const tableConfig of tables) {
    const success = await createTable(tableConfig)
    if (success) successCount++
    console.log('')
  }
  
  console.log('📊 Summary:')
  console.log(`   Tables to create: ${tables.length}`)
  console.log(`   Successfully created/verified: ${successCount}`)
  
  if (successCount === tables.length) {
    console.log('✅ All DynamoDB tables are ready!')
    console.log('')
    console.log('🧪 Test your setup with:')
    console.log('   npm run test:services')
    console.log('   or visit: http://localhost:3000/api/health/services')
  } else {
    console.log('❌ Some tables failed to create. Check the errors above.')
    process.exit(1)
  }
}

main().catch(console.error)