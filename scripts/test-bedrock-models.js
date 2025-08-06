#!/usr/bin/env node

// Test different Bedrock model IDs to find one that works

const models = [
  'anthropic.claude-3-haiku-20240307-v1:0',
  'anthropic.claude-3-sonnet-20240229-v1:0', 
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'anthropic.claude-instant-v1',
  'amazon.titan-text-express-v1',
  'amazon.titan-text-lite-v1'
]

async function testModel(modelId) {
  try {
    const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')
    
    const client = new BedrockRuntimeClient({ region: 'us-east-1' })
    
    let body
    if (modelId.includes('anthropic')) {
      body = JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }]
      })
    } else if (modelId.includes('titan')) {
      body = JSON.stringify({
        inputText: "Hi",
        textGenerationConfig: { maxTokenCount: 10 }
      })
    }
    
    const command = new InvokeModelCommand({
      modelId,
      body,
      contentType: 'application/json',
      accept: 'application/json'
    })
    
    await client.send(command)
    console.log(`✅ ${modelId} - WORKS!`)
    return modelId
  } catch (error) {
    console.log(`❌ ${modelId} - ${error.message}`)
    return null
  }
}

async function findWorkingModel() {
  console.log('🔍 Testing Bedrock models...')
  console.log('')
  
  for (const modelId of models) {
    const working = await testModel(modelId)
    if (working) {
      console.log('')
      console.log(`🎉 Found working model: ${working}`)
      console.log(`Update your .env.local:`)
      console.log(`BEDROCK_MODEL_ID=${working}`)
      return
    }
  }
  
  console.log('')
  console.log('❌ No working models found.')
  console.log('You need to request model access in AWS Console:')
  console.log('https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess')
}

findWorkingModel().catch(console.error)