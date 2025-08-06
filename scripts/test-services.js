#!/usr/bin/env node

// Test script to verify Amazon service connections
// This script calls the API endpoint since we can't easily import TS modules in Node

const http = require('http')

async function main() {
  console.log('🚀 StyleScope - Amazon Services Connectivity Test')
  console.log('=' .repeat(50))
  
  try {
    console.log('📡 Testing services via API endpoint...')
    
    // Make request to our test endpoint
    const response = await fetch('http://localhost:3000/api/test/services')
    const data = await response.json()
    
    if (data.results) {
      // Display results
      data.results.forEach(result => {
        const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
        console.log(`${icon} ${result.service}: ${result.message}`)
      })
      
      console.log(`\n📊 Test Summary: ${data.summary.success} success, ${data.summary.errors} errors, ${data.summary.not_configured} not configured`)
      
      if (data.summary.errors > 0) {
        console.log('\n❌ Some services have connection errors.')
        console.log('Please check your AWS credentials and service configurations.')
        process.exit(1)
      } else if (data.summary.not_configured > 0) {
        console.log('\n⚠️  Some services are not configured.')
        console.log('This is expected for services that require additional setup.')
        process.exit(0)
      } else {
        console.log('\n✅ All services are connected successfully!')
        console.log('StyleScope is ready for development.')
        process.exit(0)
      }
    } else {
      console.error('❌ Unexpected response format:', data)
      process.exit(1)
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💥 Cannot connect to development server.')
      console.error('Please run "npm run dev" first, then try again.')
    } else {
      console.error('\n💥 Test script failed:', error.message)
    }
    process.exit(1)
  }
}

main()