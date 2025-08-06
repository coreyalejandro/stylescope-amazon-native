#!/usr/bin/env node

// Script to check available Bedrock models

const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock')

const client = new BedrockClient({ region: 'us-east-1' })

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking available Bedrock models...')
    
    const command = new ListFoundationModelsCommand({})
    const response = await client.send(command)
    
    console.log(`\n✅ Found ${response.modelSummaries?.length || 0} available models:`)
    
    const anthropicModels = response.modelSummaries?.filter(model => 
      model.modelId?.includes('anthropic')
    ) || []
    
    if (anthropicModels.length > 0) {
      console.log('\n🤖 Available Anthropic models:')
      anthropicModels.forEach(model => {
        console.log(`   - ${model.modelId}`)
        console.log(`     Name: ${model.modelName}`)
        console.log(`     Provider: ${model.providerName}`)
        console.log('')
      })
      
      console.log('💡 Recommended for StyleScope:')
      const recommended = anthropicModels.find(m => 
        m.modelId?.includes('claude-3-haiku') || 
        m.modelId?.includes('claude-3-sonnet')
      )
      
      if (recommended) {
        console.log(`   Use: ${recommended.modelId}`)
        console.log(`   Update your .env.local: BEDROCK_MODEL_ID=${recommended.modelId}`)
      }
    } else {
      console.log('\n❌ No Anthropic models available.')
      console.log('You may need to request access to Claude models in the AWS Console.')
    }
    
  } catch (error) {
    console.error('❌ Error checking models:', error.message)
    
    if (error.name === 'AccessDeniedException') {
      console.log('\n🔑 Access Issue Detected!')
      console.log('You need to request access to Bedrock models:')
      console.log('1. Go to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess')
      console.log('2. Click "Request model access"')
      console.log('3. Select Claude models (Anthropic)')
      console.log('4. Submit request (usually approved instantly)')
    }
  }
}

checkAvailableModels()