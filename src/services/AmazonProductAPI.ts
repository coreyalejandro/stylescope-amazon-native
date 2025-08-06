// Amazon Product Advertising API integration for StyleScope
// Handles real Amazon product data when credentials are available

import { Product, ServiceError } from '@/types'
import { validateAmazonProductResponse } from '@/lib/validation'
import { transformAmazonProductToProduct, AmazonProductAPIResponse } from '@/lib/data-transformers'

export interface ProductAPIConfig {
  accessKey: string
  secretKey: string
  partnerTag: string
  host: string
  region: string
}

export interface SearchItemsRequest {
  Keywords?: string
  SearchIndex?: string
  ItemCount?: number
  ItemPage?: number
  SortBy?: string
  BrowseNodeId?: string
  Brand?: string
  MinPrice?: number
  MaxPrice?: number
}

export interface GetItemsRequest {
  ItemIds: string[]
  ItemIdType?: 'ASIN' | 'UPC' | 'EAN' | 'ISBN'
  Resources?: string[]
}

interface AmazonAPIResponse {
  SearchResult?: {
    Items?: AmazonProductAPIResponse[]
  }
  ItemsResult?: {
    Items?: AmazonProductAPIResponse[]
  }
  VariationsResult?: {
    Items?: AmazonProductAPIResponse[]
  }
}

export class AmazonProductAPIService {
  private config: ProductAPIConfig
  private baseUrl: string

  constructor(config: ProductAPIConfig) {
    this.config = config
    this.baseUrl = `https://${config.host}/paapi5`
  }

  /**
   * Search for products using keywords
   */
  async searchItems(request: SearchItemsRequest): Promise<Product[]> {
    try {
      console.log(`🔍 Searching Amazon products: "${request.Keywords}"`)
      
      const payload = {
        PartnerTag: this.config.partnerTag,
        PartnerType: 'Associates',
        Operation: 'SearchItems',
        SearchIndex: request.SearchIndex || 'Fashion',
        Keywords: request.Keywords,
        ItemCount: Math.min(request.ItemCount || 10, 10), // Max 10 items per request
        ItemPage: request.ItemPage || 1,
        Resources: [
          'Images.Primary.Large',
          'Images.Variants.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ByLineInfo',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'Offers.Listings.Availability',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
          'BrowseNodeInfo.BrowseNodes'
        ],
        ...(request.SortBy && { SortBy: request.SortBy }),
        ...(request.BrowseNodeId && { BrowseNodeId: request.BrowseNodeId }),
        ...(request.Brand && { Brand: request.Brand }),
        ...(request.MinPrice && { MinPrice: request.MinPrice * 100 }), // Convert to cents
        ...(request.MaxPrice && { MaxPrice: request.MaxPrice * 100 })
      }

      const response = await this.makeAPIRequest('/searchitems', payload) as AmazonAPIResponse
      
      if (!response.SearchResult?.Items) {
        console.log('📭 No products found')
        return []
      }

      const products = response.SearchResult.Items
        .map((item: AmazonProductAPIResponse) => {
          const validation = validateAmazonProductResponse(item)
          if (!validation.success) {
            console.warn(`⚠️ Invalid product data for ASIN ${item.ASIN}:`, validation.error)
            return null
          }
          return transformAmazonProductToProduct(item)
        })
        .filter((product: Product | null): product is Product => product !== null)

      console.log(`✅ Found ${products.length} valid products`)
      return products
    } catch (error) {
      console.error('❌ Error searching products:', error)
      throw this.handleAPIError(error, 'searchItems')
    }
  }

  /**
   * Get specific products by ASIN
   */
  async getItems(request: GetItemsRequest): Promise<Product[]> {
    try {
      console.log(`📦 Getting Amazon products: ${request.ItemIds.join(', ')}`)
      
      const payload = {
        PartnerTag: this.config.partnerTag,
        PartnerType: 'Associates',
        Operation: 'GetItems',
        ItemIds: request.ItemIds.slice(0, 10), // Max 10 items per request
        ItemIdType: request.ItemIdType || 'ASIN',
        Resources: request.Resources || [
          'Images.Primary.Large',
          'Images.Variants.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ByLineInfo',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'Offers.Listings.Availability',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
          'BrowseNodeInfo.BrowseNodes'
        ]
      }

      const response = await this.makeAPIRequest('/getitems', payload) as AmazonAPIResponse
      
      if (!response.ItemsResult?.Items) {
        console.log('📭 No products found')
        return []
      }

      const products = response.ItemsResult.Items
        .map((item: AmazonProductAPIResponse) => {
          const validation = validateAmazonProductResponse(item)
          if (!validation.success) {
            console.warn(`⚠️ Invalid product data for ASIN ${item.ASIN}:`, validation.error)
            return null
          }
          return transformAmazonProductToProduct(item)
        })
        .filter((product: Product | null): product is Product => product !== null)

      console.log(`✅ Retrieved ${products.length} valid products`)
      return products
    } catch (error) {
      console.error('❌ Error getting products:', error)
      throw this.handleAPIError(error, 'getItems')
    }
  }

  /**
   * Get bestselling items in a category
   */
  async getBestsellers(category: string = 'Fashion', limit: number = 10): Promise<Product[]> {
    try {
      console.log(`🏆 Getting bestsellers in category: ${category}`)
      
      // Map category to Amazon browse node IDs
      const browseNodeMap: Record<string, string> = {
        'fashion': '7141123011', // Fashion
        'women': '7147441011', // Women's Fashion
        'men': '7147440011', // Men's Fashion
        'shoes': '7147440011', // Shoes
        'accessories': '7147441011', // Accessories
        'activewear': '16225009011' // Active & Performance
      }

      const browseNodeId = browseNodeMap[category.toLowerCase()] || browseNodeMap['fashion']

      return await this.searchItems({
        SearchIndex: 'Fashion',
        BrowseNodeId: browseNodeId,
        SortBy: 'Relevance', // Amazon's default relevance includes popularity
        ItemCount: limit
      })
    } catch (error) {
      console.error('❌ Error getting bestsellers:', error)
      throw this.handleAPIError(error, 'getBestsellers')
    }
  }

  /**
   * Get product variations (different sizes, colors, etc.)
   */
  async getVariations(parentASIN: string): Promise<Product[]> {
    try {
      console.log(`🔄 Getting variations for product: ${parentASIN}`)
      
      const payload = {
        PartnerTag: this.config.partnerTag,
        PartnerType: 'Associates',
        Operation: 'GetVariations',
        ASIN: parentASIN,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'Offers.Listings.Price',
          'Offers.Listings.Availability',
          'VariationSummary.Price.HighestPrice',
          'VariationSummary.Price.LowestPrice'
        ]
      }

      const response = await this.makeAPIRequest('/getvariations', payload) as AmazonAPIResponse
      
      if (!response.VariationsResult?.Items) {
        console.log('📭 No variations found')
        return []
      }

      const variations = response.VariationsResult.Items
        .map((item: AmazonProductAPIResponse) => transformAmazonProductToProduct(item))

      console.log(`✅ Found ${variations.length} variations`)
      return variations
    } catch (error) {
      console.error('❌ Error getting variations:', error)
      throw this.handleAPIError(error, 'getVariations')
    }
  }

  /**
   * Make authenticated API request to Amazon Product Advertising API
   */
  private async makeAPIRequest(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const timestamp = new Date().toISOString()
    const headers = await this.generateHeaders(endpoint, payload, timestamp)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Amazon API Error ${response.status}: ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Generate AWS Signature Version 4 headers for authentication
   */
  private async generateHeaders(endpoint: string, payload: Record<string, unknown>, timestamp: string): Promise<Record<string, string>> {
    // This is a simplified version - in production, you'd use a proper AWS signature library
    // For now, we'll use basic headers that would work with proper AWS signing
    
    // const payloadHash = await this.sha256(JSON.stringify(payload)) // Will be used in full implementation
    
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Encoding': 'amz-1.0',
      'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1${endpoint.replace('/', '')}`,
      'X-Amz-Date': timestamp.replace(/[:\-]|\.\d{3}/g, ''),
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.config.accessKey}/${this.getDateStamp(timestamp)}/${this.config.region}/ProductAdvertisingAPI/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${await this.generateSignature(endpoint, payload, timestamp)}`,
      'Host': this.config.host
    }
  }

  /**
   * Generate AWS Signature V4 signature
   */
  private async generateSignature(_endpoint: string, payload: Record<string, unknown>, timestamp: string): Promise<string> {
    // Simplified signature generation - in production, use aws4 library or similar
    // This is a placeholder that demonstrates the structure
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp.replace(/[:\-]|\.\d{3}/g, ''),
      `${this.getDateStamp(timestamp)}/${this.config.region}/ProductAdvertisingAPI/aws4_request`,
      await this.sha256(JSON.stringify(payload))
    ].join('\n')

    // In production, this would use proper HMAC-SHA256 signing
    return 'placeholder_signature_' + Buffer.from(stringToSign).toString('base64').substring(0, 32)
  }

  /**
   * SHA256 hash utility
   */
  private async sha256(data: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    
    // Fallback for environments without crypto.subtle
    return Buffer.from(data).toString('base64').substring(0, 32)
  }

  /**
   * Get date stamp for AWS signature
   */
  private getDateStamp(timestamp: string): string {
    return timestamp.split('T')[0].replace(/-/g, '')
  }

  /**
   * Handle API errors and convert to ServiceError
   */
  private handleAPIError(error: unknown, operation: string): ServiceError {
    if (error instanceof Error) {
      // Parse Amazon API error responses
      if (error.message.includes('403')) {
        return {
          service: 'product-api',
          type: 'authentication',
          message: 'Invalid Amazon Product API credentials',
          retryable: false
        }
      }
      
      if (error.message.includes('429')) {
        return {
          service: 'product-api',
          type: 'rate_limit',
          message: 'Amazon Product API rate limit exceeded',
          retryable: true,
          retryAfter: 60
        }
      }
      
      if (error.message.includes('500') || error.message.includes('503')) {
        return {
          service: 'product-api',
          type: 'service_unavailable',
          message: 'Amazon Product API temporarily unavailable',
          retryable: true,
          retryAfter: 30
        }
      }
    }

    return {
      service: 'product-api',
      type: 'network_error',
      message: `Amazon Product API error in ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
      retryAfter: 10
    }
  }

  /**
   * Health check for Amazon Product API
   */
  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      // Try to get a single item to test connectivity
      await this.searchItems({
        Keywords: 'test',
        ItemCount: 1
      })

      return {
        status: 'healthy',
        message: 'Amazon Product API is accessible',
        details: {
          endpoint: this.baseUrl,
          region: this.config.region,
          partnerTag: this.config.partnerTag,
          testQuery: 'successful'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          endpoint: this.baseUrl,
          region: this.config.region,
          error
        }
      }
    }
  }
}

// Factory function to create Amazon Product API service
export function createAmazonProductAPI(config: ProductAPIConfig): AmazonProductAPIService {
  return new AmazonProductAPIService(config)
}

// Check if Amazon Product API credentials are configured
export function isAmazonProductAPIConfigured(config: Partial<ProductAPIConfig>): config is ProductAPIConfig {
  return !!(
    config.accessKey && 
    config.secretKey && 
    config.partnerTag && 
    config.host && 
    config.region
  )
}