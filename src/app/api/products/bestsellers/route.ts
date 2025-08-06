import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/ProductService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'fashion'
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`🛍️ API: Fetching bestsellers - category: ${category}, limit: ${limit}`)

    const products = await productService.fetchBestsellingItems(category, limit)

    const response = {
      success: true,
      data: {
        products,
        metadata: {
          category,
          limit,
          count: products.length,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error fetching bestsellers:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}