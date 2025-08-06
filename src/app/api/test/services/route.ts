import { NextResponse } from 'next/server'
import { runAllServiceTests } from '@/lib/service-test'

export async function GET() {
  try {
    console.log('🧪 Running service tests via API endpoint...')
    
    const results = await runAllServiceTests()
    
    const response = {
      timestamp: new Date().toISOString(),
      message: 'Service connectivity tests completed',
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length,
        not_configured: results.filter(r => r.status === 'not_configured').length
      }
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Service test failed'
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function POST() {
  // Same as GET but allows for future parameterization
  return GET()
}