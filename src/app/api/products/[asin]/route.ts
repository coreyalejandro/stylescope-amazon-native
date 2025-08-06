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

    console.log(`📦 API: Getting product by ASIN: ${asin}`)

    const product = await productService.getProductByASIN(asin)

    if (!product) {
      return NextResponse.json({
        success: false,
        error: {
          message: `Product with ASIN ${asin} not found`,
          code: 'PRODUCT_NOT_FOUND'
        }
      }, { status: 404 })
    }

    const response = {
      success: true,
      data: {
        product,
        metadata: {
          asin,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error getting product:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GET_PRODUCT_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}