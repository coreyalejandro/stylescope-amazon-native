// ProductService - Handles fashion product data for StyleScope
// Supports both mock data and real Amazon Product Advertising API integration

import { Product, Review } from '@/types'
import { mockProductService } from '@/lib/mock-product-data'
import { validateProduct, validateReview } from '@/lib/validation'
import { AmazonProductAPIService, createAmazonProductAPI, isAmazonProductAPIConfigured } from './AmazonProductAPI'

export interface ProductSearchOptions {
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: 'price' | 'rating' | 'popularity' | 'newest'
  limit?: number
}

export interface PricingData {
  current: number
  original?: number
  currency: string
  discount?: number
  discountPercentage?: number
}

export class ProductService {
  private mockService = mockProductService
  private amazonAPI?: AmazonProductAPIService
  private useRealAPI: boolean = false

  constructor() {
    this.initializeAmazonAPI()
  }

  /**
   * Initialize Amazon Product API if credentials are available
   */
  private initializeAmazonAPI() {
    const config = {
      accessKey: process.env.PAAPI_ACCESS_KEY || '',
      secretKey: process.env.PAAPI_SECRET_KEY || '',
      partnerTag: process.env.PAAPI_PARTNER_TAG || '',
      host: process.env.PAAPI_HOST || 'webservices.amazon.com',
      region: process.env.PAAPI_REGION || 'us-east-1'
    }

    if (isAmazonProductAPIConfigured(config)) {
      console.log('🔗 Amazon Product API credentials found, enabling real API mode')
      this.amazonAPI = createAmazonProductAPI(config)
      this.useRealAPI = true
    } else {
      console.log('🎭 Using mock product data (Amazon Product API credentials not configured)')
      this.useRealAPI = false
    }
  }

  /**
   * Fetch bestselling fashion items
   * Uses real Amazon API if available, falls back to mock data
   */
  async fetchBestsellingItems(category: string = 'fashion', limit: number = 10): Promise<Product[]> {
    try {
      console.log(`🛍️ Fetching ${limit} bestselling items in category: ${category}`)
      
      if (this.useRealAPI && this.amazonAPI) {
        try {
          const products = await this.amazonAPI.getBestsellers(category, limit)
          console.log(`✅ Found ${products.length} bestselling products from Amazon API`)
          return products
        } catch (error) {
          console.warn('⚠️ Amazon API failed, falling back to mock data:', error)
          // Fall through to mock service
        }
      }

      const products = await this.mockService.fetchBestsellingItems(category, limit)
      console.log(`✅ Found ${products.length} bestselling products from mock data`)
      return products
    } catch (error) {
      console.error('❌ Error fetching bestselling items:', error)
      throw new Error(`Failed to fetch bestselling items: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get customer reviews for a specific product
   * Uses mock data (Amazon Product API doesn't provide review content)
   */
  async getProductReviews(productId: string, limit: number = 10): Promise<Review[]> {
    try {
      console.log(`📝 Fetching ${limit} reviews for product: ${productId}`)
      
      // Note: Amazon Product API only provides review counts and ratings, not review content
      // For StyleScope, we use mock reviews that simulate real customer feedback
      const reviews = await this.mockService.getProductReviews(productId, limit)
      
      // Validate each review
      const validatedReviews = reviews.filter(review => {
        const validation = validateReview(review)
        if (!validation.success) {
          console.warn(`⚠️ Invalid review data for ${review.id}:`, validation.error)
          return false
        }
        return true
      })
      
      console.log(`✅ Found ${validatedReviews.length} valid reviews`)
      return validatedReviews
    } catch (error) {
      console.error('❌ Error fetching product reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get pricing information for a product
   * Uses real Amazon API if available, falls back to mock data
   */
  async getProductPricing(productId: string): Promise<PricingData> {
    try {
      console.log(`💰 Fetching pricing for product: ${productId}`)
      
      if (this.useRealAPI && this.amazonAPI) {
        try {
          // Get product details including pricing from Amazon API
          const products = await this.amazonAPI.getItems({ ItemIds: [productId] })
          if (products.length > 0) {
            const product = products[0]
            const pricingData: PricingData = {
              current: product.price.current,
              currency: product.price.currency,
              ...(product.price.original && { original: product.price.original }),
              ...(product.price.discount && { discount: product.price.discount }),
              ...(product.price.discountPercentage && { discountPercentage: product.price.discountPercentage })
            }
            console.log(`✅ Retrieved pricing from Amazon API: $${pricingData.current} ${pricingData.currency}`)
            return pricingData
          }
        } catch (error) {
          console.warn('⚠️ Amazon API pricing failed, falling back to mock data:', error)
          // Fall through to mock service
        }
      }

      const pricing = await this.mockService.getProductPricing(productId)
      
      // Calculate discount information
      const discount = pricing.original ? pricing.original - pricing.current : 0
      const discountPercentage = pricing.original ? 
        Math.round((discount / pricing.original) * 100) : 0

      const pricingData: PricingData = {
        ...pricing,
        ...(discount > 0 && { discount }),
        ...(discountPercentage > 0 && { discountPercentage })
      }
      
      console.log(`✅ Retrieved pricing from mock data: $${pricing.current} ${pricing.currency}`)
      return pricingData
    } catch (error) {
      console.error('❌ Error fetching product pricing:', error)
      throw new Error(`Failed to fetch pricing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Search for products by query
   * Uses real Amazon API if available, falls back to mock data
   */
  async searchProducts(query: string, options: ProductSearchOptions = {}): Promise<Product[]> {
    try {
      const { limit = 10 } = options
      console.log(`🔍 Searching for products: "${query}" (limit: ${limit})`)
      
      if (this.useRealAPI && this.amazonAPI) {
        try {
          const searchRequest = {
            Keywords: query,
            ItemCount: limit,
            ...(options.category && { SearchIndex: this.mapCategoryToSearchIndex(options.category) }),
            ...(options.minPrice && { MinPrice: options.minPrice }),
            ...(options.maxPrice && { MaxPrice: options.maxPrice }),
            ...(options.sortBy && { SortBy: this.mapSortByToAmazon(options.sortBy) })
          }

          let products = await this.amazonAPI.searchItems(searchRequest)
          
          // Apply additional filters not supported by Amazon API
          if (options.minRating) {
            products = products.filter(p => p.rating >= options.minRating!)
          }
          
          // Validate products
          products = products.filter(product => {
            const validation = validateProduct(product)
            if (!validation.success) {
              console.warn(`⚠️ Invalid product data for ${product.asin}:`, validation.error)
              return false
            }
            return true
          })
          
          console.log(`✅ Found ${products.length} matching products from Amazon API`)
          return products
        } catch (error) {
          console.warn('⚠️ Amazon API search failed, falling back to mock data:', error)
          // Fall through to mock service
        }
      }

      let products = await this.mockService.searchProducts(query, limit * 2) // Get more for filtering
      
      // Apply filters
      if (options.category) {
        products = products.filter(p => 
          p.category.toLowerCase().includes(options.category!.toLowerCase())
        )
      }
      
      if (options.minPrice) {
        products = products.filter(p => p.price.current >= options.minPrice!)
      }
      
      if (options.maxPrice) {
        products = products.filter(p => p.price.current <= options.maxPrice!)
      }
      
      if (options.minRating) {
        products = products.filter(p => p.rating >= options.minRating!)
      }
      
      // Apply sorting
      if (options.sortBy) {
        products = this.sortProducts(products, options.sortBy)
      }
      
      // Apply limit
      products = products.slice(0, limit)
      
      console.log(`✅ Found ${products.length} matching products from mock data`)
      return products
    } catch (error) {
      console.error('❌ Error searching products:', error)
      throw new Error(`Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get trending fashion categories
   * Useful for Alex Chen's trend analysis
   */
  async getTrendingCategories(): Promise<string[]> {
    try {
      console.log('📊 Fetching trending categories')
      
      const categories = await this.mockService.getTrendingCategories()
      
      console.log(`✅ Found ${categories.length} trending categories`)
      return categories
    } catch (error) {
      console.error('❌ Error fetching trending categories:', error)
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get price analysis for market insights
   * Helps Alex Chen understand pricing trends
   */
  async getPriceAnalysis(): Promise<{ min: number; max: number; average: number; median: number }> {
    try {
      console.log('💹 Analyzing price trends')
      
      const analysis = await this.mockService.getPriceAnalysis()
      
      // Get all products for median calculation
      const allProducts = await this.mockService.fetchBestsellingItems('fashion', 100)
      const prices = allProducts.map(p => p.price.current).sort((a, b) => a - b)
      const median = prices[Math.floor(prices.length / 2)]
      
      const result = {
        ...analysis,
        median
      }
      
      console.log(`✅ Price analysis complete: $${result.min}-$${result.max}, avg: $${result.average.toFixed(2)}`)
      return result
    } catch (error) {
      console.error('❌ Error analyzing prices:', error)
      throw new Error(`Failed to analyze prices: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get products by availability status
   * Useful for inventory-based trend analysis
   */
  async getProductsByAvailability(availability: 'in_stock' | 'limited' | 'out_of_stock'): Promise<Product[]> {
    try {
      console.log(`📦 Fetching products with availability: ${availability}`)
      
      const allProducts = await this.mockService.fetchBestsellingItems('fashion', 100)
      const filteredProducts = allProducts.filter(p => p.availability === availability)
      
      console.log(`✅ Found ${filteredProducts.length} products with ${availability} status`)
      return filteredProducts
    } catch (error) {
      console.error('❌ Error fetching products by availability:', error)
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get product recommendations based on a seed product
   * Simulates Amazon's recommendation engine
   */
  async getRecommendations(seedProductId: string, limit: number = 5): Promise<Product[]> {
    try {
      console.log(`🎯 Getting recommendations for product: ${seedProductId}`)
      
      const allProducts = await this.mockService.fetchBestsellingItems('fashion', 50)
      const seedProduct = allProducts.find(p => p.asin === seedProductId)
      
      if (!seedProduct) {
        throw new Error('Seed product not found')
      }
      
      // Simple recommendation logic: same category, similar price range
      const recommendations = allProducts
        .filter(p => p.asin !== seedProductId)
        .filter(p => p.category === seedProduct.category)
        .filter(p => Math.abs(p.price.current - seedProduct.price.current) < 50)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit)
      
      console.log(`✅ Found ${recommendations.length} recommendations`)
      return recommendations
    } catch (error) {
      console.error('❌ Error getting recommendations:', error)
      throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Private helper method to sort products
   */
  private sortProducts(products: Product[], sortBy: string): Product[] {
    switch (sortBy) {
      case 'price':
        return products.sort((a, b) => a.price.current - b.price.current)
      case 'rating':
        return products.sort((a, b) => b.rating - a.rating)
      case 'popularity':
        return products.sort((a, b) => b.reviewCount - a.reviewCount)
      case 'newest':
        // For mock data, we'll use review count as a proxy for newness
        return products.sort((a, b) => a.reviewCount - b.reviewCount)
      default:
        return products
    }
  }

  /**
   * Map category to Amazon search index
   */
  private mapCategoryToSearchIndex(category: string): string {
    const categoryMap: Record<string, string> = {
      'fashion': 'Fashion',
      'women': 'FashionWomen',
      'men': 'FashionMen',
      'shoes': 'Shoes',
      'jewelry': 'Jewelry',
      'watches': 'Watches',
      'bags': 'Fashion'
    }
    return categoryMap[category.toLowerCase()] || 'Fashion'
  }

  /**
   * Map sort option to Amazon API sort parameter
   */
  private mapSortByToAmazon(sortBy: string): string {
    const sortMap: Record<string, string> = {
      'price': 'Price:LowToHigh',
      'rating': 'AvgCustomerReviews',
      'popularity': 'Relevance',
      'newest': 'NewestArrivals',
      'relevance': 'Relevance'
    }
    return sortMap[sortBy] || 'Relevance'
  }

  /**
   * Get product by ASIN
   */
  async getProductByASIN(asin: string): Promise<Product | null> {
    try {
      console.log(`📦 Getting product by ASIN: ${asin}`)
      
      if (this.useRealAPI && this.amazonAPI) {
        try {
          const products = await this.amazonAPI.getItems({ ItemIds: [asin] })
          if (products.length > 0) {
            const product = products[0]
            const validation = validateProduct(product)
            if (validation.success) {
              console.log(`✅ Retrieved product from Amazon API: ${product.title}`)
              return product
            }
          }
        } catch (error) {
          console.warn('⚠️ Amazon API getProduct failed, falling back to mock data:', error)
        }
      }

      // Try to find in mock data
      const allProducts = await this.mockService.fetchBestsellingItems('fashion', 100)
      const product = allProducts.find(p => p.asin === asin)
      
      if (product) {
        console.log(`✅ Retrieved product from mock data: ${product.title}`)
        return product
      }
      
      console.log(`📭 Product not found: ${asin}`)
      return null
    } catch (error) {
      console.error('❌ Error getting product by ASIN:', error)
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get product variations (sizes, colors, etc.)
   */
  async getProductVariations(asin: string): Promise<Product[]> {
    try {
      console.log(`🔄 Getting variations for product: ${asin}`)
      
      if (this.useRealAPI && this.amazonAPI) {
        try {
          const variations = await this.amazonAPI.getVariations(asin)
          console.log(`✅ Found ${variations.length} variations from Amazon API`)
          return variations
        } catch (error) {
          console.warn('⚠️ Amazon API variations failed, using mock data:', error)
        }
      }

      // For mock data, return similar products as "variations"
      const baseProduct = await this.getProductByASIN(asin)
      if (!baseProduct) return []

      const similarProducts = await this.searchProducts(baseProduct.title.split(' ')[0], { limit: 3 })
      const variations = similarProducts.filter(p => p.asin !== asin)
      
      console.log(`✅ Found ${variations.length} mock variations`)
      return variations
    } catch (error) {
      console.error('❌ Error getting product variations:', error)
      return []
    }
  }

  /**
   * Health check method for service testing
   */
  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      const details: Record<string, unknown> = {
        api_mode: this.useRealAPI ? 'amazon_api' : 'mock_data',
        mock_service_available: true
      }

      if (this.useRealAPI && this.amazonAPI) {
        try {
          const amazonHealth = await this.amazonAPI.healthCheck()
          details.amazon_api_status = amazonHealth.status
          details.amazon_api_details = amazonHealth.details
        } catch (error) {
          details.amazon_api_status = 'error'
          details.amazon_api_error = error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test mock service
      const products = await this.mockService.fetchBestsellingItems('fashion', 1)
      const categories = await this.mockService.getTrendingCategories()
      
      details.mock_products_available = products.length > 0
      details.mock_categories_available = categories.length

      const isHealthy = products.length > 0 && categories.length > 0
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Product service is working correctly' : 'Product service has issues',
        details
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { 
          error,
          api_mode: this.useRealAPI ? 'amazon_api' : 'mock_data'
        }
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService()