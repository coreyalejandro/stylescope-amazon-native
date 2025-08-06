import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/ProductService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const { productId } = await params

    console.log(`📝 API: Fetching reviews for product ${productId}, limit: ${limit}`)

    const reviews = await productService.getProductReviews(productId, limit)

    const response = {
      success: true,
      data: {
        reviews,
        metadata: {
          productId,
          limit,
          count: reviews.length,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error fetching reviews:', error)
    
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