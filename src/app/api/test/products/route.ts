import { NextResponse } from 'next/server'
import { productService } from '@/services/ProductService'

export async function GET() {
  try {
    console.log('🧪 Running comprehensive product service tests...')
    
    const testResults = []

    // Test 1: Fetch bestsellers
    try {
      const bestsellers = await productService.fetchBestsellingItems('fashion', 5)
      testResults.push({
        test: 'fetchBestsellingItems',
        status: 'success',
        message: `Found ${bestsellers.length} bestselling products`,
        data: { count: bestsellers.length, sample: bestsellers[0]?.title }
      })
    } catch (error) {
      testResults.push({
        test: 'fetchBestsellingItems',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Get product reviews
    try {
      const reviews = await productService.getProductReviews('B08N5WRWNW', 3)
      testResults.push({
        test: 'getProductReviews',
        status: 'success',
        message: `Found ${reviews.length} reviews for test product`,
        data: { count: reviews.length, avgRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length }
      })
    } catch (error) {
      testResults.push({
        test: 'getProductReviews',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Get pricing
    try {
      const pricing = await productService.getProductPricing('B08N5WRWNW')
      testResults.push({
        test: 'getProductPricing',
        status: 'success',
        message: `Retrieved pricing: $${pricing.current} ${pricing.currency}`,
        data: pricing
      })
    } catch (error) {
      testResults.push({
        test: 'getProductPricing',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Search products
    try {
      const searchResults = await productService.searchProducts('jeans', { limit: 3 })
      testResults.push({
        test: 'searchProducts',
        status: 'success',
        message: `Found ${searchResults.length} products matching "jeans"`,
        data: { count: searchResults.length, titles: searchResults.map(p => p.title) }
      })
    } catch (error) {
      testResults.push({
        test: 'searchProducts',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Get trending categories
    try {
      const categories = await productService.getTrendingCategories()
      testResults.push({
        test: 'getTrendingCategories',
        status: 'success',
        message: `Found ${categories.length} trending categories`,
        data: { count: categories.length, categories: categories.slice(0, 5) }
      })
    } catch (error) {
      testResults.push({
        test: 'getTrendingCategories',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 6: Price analysis
    try {
      const priceAnalysis = await productService.getPriceAnalysis()
      testResults.push({
        test: 'getPriceAnalysis',
        status: 'success',
        message: `Price range: $${priceAnalysis.min}-$${priceAnalysis.max}, avg: $${priceAnalysis.average.toFixed(2)}`,
        data: priceAnalysis
      })
    } catch (error) {
      testResults.push({
        test: 'getPriceAnalysis',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 7: Health check
    try {
      const health = await productService.healthCheck()
      testResults.push({
        test: 'healthCheck',
        status: health.status === 'healthy' ? 'success' : 'error',
        message: health.message,
        data: health.details
      })
    } catch (error) {
      testResults.push({
        test: 'healthCheck',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    const successCount = testResults.filter(r => r.status === 'success').length
    const errorCount = testResults.filter(r => r.status === 'error').length

    const response = {
      timestamp: new Date().toISOString(),
      message: 'Product service tests completed',
      summary: {
        total: testResults.length,
        success: successCount,
        errors: errorCount,
        success_rate: `${Math.round((successCount / testResults.length) * 100)}%`
      },
      results: testResults
    }

    console.log(`✅ Product service tests completed: ${successCount}/${testResults.length} passed`)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ Product service test failed:', error)
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Product service test failed'
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}