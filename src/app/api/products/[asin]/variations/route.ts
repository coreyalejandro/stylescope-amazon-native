import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/ProductService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const { asin } = await params

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid ASIN format. ASIN must be 10 alphanumeric characters.',
          code: 'INVALID_ASIN'
        }
      }, { status: 400 })
    }

    console.log(`🔄 API: Getting variations for product: ${asin}`)

    const variations = await productService.getProductVariations(asin)

    const response = {
      success: true,
      data: {
        variations,
        metadata: {
          parentASIN: asin,
          count: variations.length,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error getting product variations:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GET_VARIATIONS_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}