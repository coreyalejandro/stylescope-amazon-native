// Database operations for StyleScope using Amazon DynamoDB
// Handles all data persistence for commentary episodes and sentiment cache

import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  AttributeValue
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { CommentaryEpisode, SentimentData } from '@/types'
import { appConfig } from './aws-config'

const client = new DynamoDBClient({ region: appConfig.dynamodb.region })

// ============================================================================
// COMMENTARY EPISODES OPERATIONS
// ============================================================================

export class EpisodesRepository {
  private tableName = appConfig.dynamodb.episodesTable

  async saveEpisode(episode: CommentaryEpisode): Promise<void> {
    try {
      console.log(`💾 Saving episode to DynamoDB: ${episode.id}`)
      
      const item = marshall({
        id: episode.id,
        title: episode.title,
        publishDate: episode.publishDate.toISOString(),
        status: episode.status,
        content: episode.content,
        metadata: episode.metadata,
        accessibility: episode.accessibility,
        seoData: episode.seoData || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
      })

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: item
      })

      await client.send(command)
      console.log(`✅ Episode saved successfully: ${episode.id}`)
    } catch (error) {
      console.error(`❌ Error saving episode ${episode.id}:`, error)
      throw new Error(`Failed to save episode: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getEpisode(id: string): Promise<CommentaryEpisode | null> {
    try {
      console.log(`📖 Retrieving episode from DynamoDB: ${id}`)
      
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      })

      const response = await client.send(command)
      
      if (!response.Item) {
        console.log(`📭 Episode not found: ${id}`)
        return null
      }

      const item = unmarshall(response.Item)
      const episode = this.transformDynamoItemToEpisode(item)
      
      console.log(`✅ Episode retrieved successfully: ${id}`)
      return episode
    } catch (error) {
      console.error(`❌ Error retrieving episode ${id}:`, error)
      throw new Error(`Failed to retrieve episode: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLatestEpisode(): Promise<CommentaryEpisode | null> {
    try {
      console.log('📖 Getting latest episode from DynamoDB')
      
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#status = :published',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':published': 'published'
        })
      })

      const response = await client.send(command)
      
      if (!response.Items || response.Items.length === 0) {
        console.log('📭 No published episodes found')
        return null
      }

      // Sort by publishDate and get the latest
      const items = response.Items.map(item => unmarshall(item))
      const sortedItems = items.sort((a, b) => 
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      )

      const latestItem = sortedItems[0]
      const episode = this.transformDynamoItemToEpisode(latestItem)
      
      console.log(`✅ Latest episode retrieved: ${episode.id}`)
      return episode
    } catch (error) {
      console.error('❌ Error getting latest episode:', error)
      throw new Error(`Failed to get latest episode: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listEpisodes(limit: number = 10, status?: CommentaryEpisode['status']): Promise<CommentaryEpisode[]> {
    try {
      console.log(`📖 Listing ${limit} episodes from DynamoDB`)
      
      let command: ScanCommand
      
      if (status) {
        command = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: marshall({
            ':status': status
          }),
          Limit: limit * 2 // Get more items to account for filtering
        })
      } else {
        command = new ScanCommand({
          TableName: this.tableName,
          Limit: limit * 2
        })
      }

      const response = await client.send(command)
      
      if (!response.Items) {
        console.log('📭 No episodes found')
        return []
      }

      const items = response.Items.map(item => unmarshall(item))
      const episodes = items
        .map(item => this.transformDynamoItemToEpisode(item))
        .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
        .slice(0, limit)
      
      console.log(`✅ Retrieved ${episodes.length} episodes`)
      return episodes
    } catch (error) {
      console.error('❌ Error listing episodes:', error)
      throw new Error(`Failed to list episodes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateEpisodeStatus(id: string, status: CommentaryEpisode['status']): Promise<void> {
    try {
      console.log(`🔄 Updating episode status: ${id} -> ${status}`)
      
      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ id }),
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':status': status,
          ':updatedAt': new Date().toISOString()
        })
      })

      await client.send(command)
      console.log(`✅ Episode status updated: ${id}`)
    } catch (error) {
      console.error(`❌ Error updating episode status ${id}:`, error)
      throw new Error(`Failed to update episode status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteEpisode(id: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting episode: ${id}`)
      
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      })

      await client.send(command)
      console.log(`✅ Episode deleted: ${id}`)
    } catch (error) {
      console.error(`❌ Error deleting episode ${id}:`, error)
      throw new Error(`Failed to delete episode: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private transformDynamoItemToEpisode(item: Record<string, unknown>): CommentaryEpisode {
    const episode: CommentaryEpisode = {
      id: item.id as string,
      title: item.title as string,
      publishDate: new Date(item.publishDate as string),
      status: item.status as CommentaryEpisode['status'],
      content: item.content as CommentaryEpisode['content'],
      metadata: item.metadata as CommentaryEpisode['metadata'],
      accessibility: item.accessibility as CommentaryEpisode['accessibility']
    }
    
    if (item.seoData && item.seoData !== null) {
      episode.seoData = item.seoData as NonNullable<CommentaryEpisode['seoData']>
    }
    
    return episode
  }

  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      // Try to scan the table with a limit of 1 to check connectivity
      const command = new ScanCommand({
        TableName: this.tableName,
        Limit: 1
      })

      const response = await client.send(command)
      
      return {
        status: 'healthy',
        message: `Episodes table is accessible`,
        details: {
          tableName: this.tableName,
          itemCount: response.Count || 0,
          scannedCount: response.ScannedCount || 0
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { 
          tableName: this.tableName,
          error 
        }
      }
    }
  }
}

// ============================================================================
// SENTIMENT CACHE OPERATIONS
// ============================================================================

export class SentimentCacheRepository {
  private tableName = appConfig.dynamodb.sentimentTable

  async saveSentiment(productId: string, sentiment: SentimentData): Promise<void> {
    try {
      console.log(`💾 Caching sentiment for product: ${productId}`)
      
      const item = marshall({
        productId,
        sentiment,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours TTL
      }, {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
      })

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: item
      })

      await client.send(command)
      console.log(`✅ Sentiment cached successfully: ${productId}`)
    } catch (error) {
      console.error(`❌ Error caching sentiment for ${productId}:`, error)
      throw new Error(`Failed to cache sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSentiment(productId: string): Promise<SentimentData | null> {
    try {
      console.log(`📖 Retrieving cached sentiment for product: ${productId}`)
      
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ productId })
      })

      const response = await client.send(command)
      
      if (!response.Item) {
        console.log(`📭 Cached sentiment not found: ${productId}`)
        return null
      }

      const item = unmarshall(response.Item)
      
      // Check if cache has expired
      const expiresAt = new Date(item.expiresAt)
      if (expiresAt < new Date()) {
        console.log(`⏰ Cached sentiment expired for: ${productId}`)
        await this.deleteSentiment(productId) // Clean up expired cache
        return null
      }

      console.log(`✅ Cached sentiment retrieved: ${productId}`)
      return item.sentiment as SentimentData
    } catch (error) {
      console.error(`❌ Error retrieving cached sentiment for ${productId}:`, error)
      throw new Error(`Failed to retrieve cached sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteSentiment(productId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting cached sentiment: ${productId}`)
      
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ productId })
      })

      await client.send(command)
      console.log(`✅ Cached sentiment deleted: ${productId}`)
    } catch (error) {
      console.error(`❌ Error deleting cached sentiment for ${productId}:`, error)
      // Don't throw error for cache deletion failures
    }
  }

  async clearExpiredCache(): Promise<number> {
    try {
      console.log('🧹 Clearing expired sentiment cache entries')
      
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'expiresAt < :now',
        ExpressionAttributeValues: marshall({
          ':now': new Date().toISOString()
        })
      })

      const response = await client.send(command)
      
      if (!response.Items || response.Items.length === 0) {
        console.log('✅ No expired cache entries found')
        return 0
      }

      // Delete expired items
      const deletePromises = response.Items.map(item => {
        const unmarshalled = unmarshall(item)
        return this.deleteSentiment(unmarshalled.productId)
      })

      await Promise.all(deletePromises)
      
      console.log(`✅ Cleared ${response.Items.length} expired cache entries`)
      return response.Items.length
    } catch (error) {
      console.error('❌ Error clearing expired cache:', error)
      return 0
    }
  }

  async getCacheStats(): Promise<{ totalEntries: number; expiredEntries: number }> {
    try {
      // Get total entries
      const totalCommand = new ScanCommand({
        TableName: this.tableName,
        Select: 'COUNT'
      })
      const totalResponse = await client.send(totalCommand)
      
      // Get expired entries
      const expiredCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'expiresAt < :now',
        ExpressionAttributeValues: marshall({
          ':now': new Date().toISOString()
        }),
        Select: 'COUNT'
      })
      const expiredResponse = await client.send(expiredCommand)
      
      return {
        totalEntries: totalResponse.Count || 0,
        expiredEntries: expiredResponse.Count || 0
      }
    } catch (error) {
      console.error('❌ Error getting cache stats:', error)
      return { totalEntries: 0, expiredEntries: 0 }
    }
  }

  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      const stats = await this.getCacheStats()
      
      return {
        status: 'healthy',
        message: `Sentiment cache is accessible`,
        details: {
          tableName: this.tableName,
          totalEntries: stats.totalEntries,
          expiredEntries: stats.expiredEntries,
          activeEntries: stats.totalEntries - stats.expiredEntries
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { 
          tableName: this.tableName,
          error 
        }
      }
    }
  }
}

// ============================================================================
// REPOSITORY FACTORY AND UTILITIES
// ============================================================================

export class DatabaseManager {
  public episodes: EpisodesRepository
  public sentimentCache: SentimentCacheRepository

  constructor() {
    this.episodes = new EpisodesRepository()
    this.sentimentCache = new SentimentCacheRepository()
  }

  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      const [episodesHealth, sentimentHealth] = await Promise.all([
        this.episodes.healthCheck(),
        this.sentimentCache.healthCheck()
      ])

      const isHealthy = episodesHealth.status === 'healthy' && sentimentHealth.status === 'healthy'

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'All database operations are working' : 'Some database operations are failing',
        details: {
          episodes: episodesHealth,
          sentimentCache: sentimentHealth
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error }
      }
    }
  }

  async performMaintenance(): Promise<{ cleaned: number; errors: string[] }> {
    console.log('🔧 Performing database maintenance')
    const errors: string[] = []
    let cleaned = 0

    try {
      // Clear expired sentiment cache
      cleaned = await this.sentimentCache.clearExpiredCache()
    } catch (error) {
      errors.push(`Failed to clear expired cache: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log(`✅ Database maintenance completed: ${cleaned} items cleaned, ${errors.length} errors`)
    return { cleaned, errors }
  }
}

// Export singleton instance
export const database = new DatabaseManager()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateEpisodeId(): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8)
  return `episode-${timestamp}-${random}`
}

export function generateCacheKey(productId: string, analysisType: string = 'sentiment'): string {
  return `${analysisType}-${productId}`
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  
  throw lastError!
}

// Type-safe DynamoDB operations
export function createDynamoDBItem<T extends Record<string, unknown>>(item: T) {
  return marshall(item, {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  })
}

export function parseDynamoDBItem<T>(item: Record<string, AttributeValue>): T {
  return unmarshall(item) as T
}