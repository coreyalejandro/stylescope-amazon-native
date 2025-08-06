import { NextRequest, NextResponse } from 'next/server'
import { productService, ProductSearchOptions } from '@/services/ProductService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRating = searchParams.get('minRating')
    const sortBy = searchParams.get('sortBy')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Query parameter is required',
          code: 'MISSING_QUERY'
        }
      }, { status: 400 })
    }

    console.log(`🔍 API: Searching products - query: "${query}", limit: ${limit}`)

    const options: ProductSearchOptions = {
      limit,
      ...(category && { category }),
      ...(minPrice && { minPrice: parseFloat(minPrice) }),
      ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
      ...(minRating && { minRating: parseFloat(minRating) }),
      ...(sortBy && ['price', 'rating', 'popularity', 'newest'].includes(sortBy) && { 
        sortBy: sortBy as 'price' | 'rating' | 'popularity' | 'newest' 
      })
    }

    const products = await productService.searchProducts(query, options)

    const response = {
      success: true,
      data: {
        products,
        metadata: {
          query,
          options,
          count: products.length,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ API Error searching products:', error)
    
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'SEARCH_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}