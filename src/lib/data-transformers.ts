// Data transformation utilities for StyleScope
// Converts between Amazon service formats and our internal data models

import { 
  Product, 
  SentimentData, 
  CommentaryEpisode,
  AlexChenPersonality,
  TrendInsight,
  ProductSpotlight,
  SentimentSummary,
  AccessibilityHighlight
} from '@/types'

// ============================================================================
// AMAZON PRODUCT API TRANSFORMERS
// ============================================================================

export interface AmazonProductAPIResponse {
  ASIN: string
  ItemInfo: {
    Title: { DisplayValue: string }
    Features?: { DisplayValues: string[] }
    ByLineInfo?: {
      Brand?: { DisplayValue: string }
      Manufacturer?: { DisplayValue: string }
    }
  }
  Images: {
    Primary: { Large: { URL: string } }
    Variants?: Array<{ Large: { URL: string } }>
  }
  Offers: {
    Listings: Array<{
      Price: {
        Amount: number
        Currency: string
        DisplayAmount: string
      }
      SavingBasis?: {
        Amount: number
        Currency: string
      }
      Availability: {
        Message: string
        Type: string
      }
    }>
  }
  CustomerReviews?: {
    Count: number
    StarRating: {
      Value: number
    }
  }
  BrowseNodeInfo?: {
    BrowseNodes: Array<{
      DisplayName: string
    }>
  }
}

export function transformAmazonProductToProduct(apiResponse: AmazonProductAPIResponse): Product {
  const listing = apiResponse.Offers?.Listings?.[0]
  const originalPrice = listing?.SavingBasis?.Amount
  const currentPrice = listing?.Price?.Amount || 0
  
  return {
    asin: apiResponse.ASIN,
    title: apiResponse.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
    price: {
      current: currentPrice,
      currency: listing?.Price?.Currency || 'USD',
      ...(originalPrice && { original: originalPrice }),
      ...(originalPrice && { discount: originalPrice - currentPrice }),
      ...(originalPrice && { discountPercentage: Math.round(((originalPrice - currentPrice) / originalPrice) * 100) })
    },
    images: {
      primary: apiResponse.Images?.Primary?.Large?.URL || '',
      thumbnails: apiResponse.Images?.Variants?.map(v => v.Large.URL) || []
    },
    category: apiResponse.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || 'Fashion',
    rating: apiResponse.CustomerReviews?.StarRating?.Value || 0,
    reviewCount: apiResponse.CustomerReviews?.Count || 0,
    availability: transformAvailability(listing?.Availability?.Type || 'Unknown'),
    features: apiResponse.ItemInfo?.Features?.DisplayValues || [],
    ...(apiResponse.ItemInfo?.ByLineInfo?.Brand?.DisplayValue && { 
      brand: apiResponse.ItemInfo.ByLineInfo.Brand.DisplayValue 
    }),
    ...(!apiResponse.ItemInfo?.ByLineInfo?.Brand?.DisplayValue && 
        apiResponse.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue && { 
      brand: apiResponse.ItemInfo.ByLineInfo.Manufacturer.DisplayValue 
    })
  }
}

function transformAvailability(amazonAvailability: string): Product['availability'] {
  const availability = amazonAvailability.toLowerCase()
  if (availability.includes('in stock')) return 'in_stock'
  if (availability.includes('limited')) return 'limited'
  if (availability.includes('out of stock') || availability.includes('unavailable')) return 'out_of_stock'
  if (availability.includes('pre-order')) return 'pre_order'
  return 'in_stock' // default
}

// ============================================================================
// AMAZON COMPREHEND TRANSFORMERS
// ============================================================================

export interface ComprehendSentimentResponse {
  Sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'
  SentimentScore: {
    Positive: number
    Negative: number
    Neutral: number
    Mixed: number
  }
}

export interface ComprehendKeyPhrasesResponse {
  KeyPhrases: Array<{
    Text: string
    Score: number
    BeginOffset: number
    EndOffset: number
  }>
}

export function transformComprehendToSentimentData(
  sentimentResponse: ComprehendSentimentResponse,
  keyPhrasesResponse?: ComprehendKeyPhrasesResponse,
  reviewText?: string
): SentimentData {
  // Analyze themes from key phrases and review text
  const themes = analyzeThemesFromText(reviewText || '', keyPhrasesResponse?.KeyPhrases || [])
  
  return {
    overall: {
      positive: sentimentResponse.SentimentScore.Positive,
      negative: sentimentResponse.SentimentScore.Negative,
      neutral: sentimentResponse.SentimentScore.Neutral,
      mixed: sentimentResponse.SentimentScore.Mixed
    },
    themes,
    keyPhrases: keyPhrasesResponse?.KeyPhrases?.map(phrase => ({
      text: phrase.Text,
      score: phrase.Score,
      beginOffset: phrase.BeginOffset,
      endOffset: phrase.EndOffset
    })) || [],
    confidence: Math.max(...Object.values(sentimentResponse.SentimentScore)),
    processedAt: new Date(),
    languageCode: 'en'
  }
}

function analyzeThemesFromText(text: string, keyPhrases: Array<{ Text: string; Score: number }>) {
  const lowerText = text.toLowerCase()
  const phrases = keyPhrases.map(p => p.Text.toLowerCase())
  
  // Theme detection keywords
  const themeKeywords = {
    quality: ['quality', 'durable', 'well made', 'cheap', 'flimsy', 'sturdy', 'construction'],
    value: ['price', 'worth', 'expensive', 'cheap', 'value', 'money', 'cost', 'affordable'],
    style: ['style', 'look', 'fashion', 'trendy', 'cute', 'ugly', 'beautiful', 'design'],
    fit: ['fit', 'size', 'tight', 'loose', 'small', 'large', 'comfortable', 'sizing'],
    accessibility: ['accessible', 'easy', 'difficult', 'adaptive', 'disability', 'mobility'],
    comfort: ['comfort', 'soft', 'hard', 'cozy', 'uncomfortable', 'breathable', 'itchy']
  }
  
  const themes: SentimentData['themes'] = {} as SentimentData['themes']
  
  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    const mentions = keywords.filter(keyword => 
      lowerText.includes(keyword) || phrases.some(phrase => phrase.includes(keyword))
    ).length
    
    // Simple sentiment scoring based on keyword presence
    let score = 0.5 // neutral default
    const positiveKeywords = ['quality', 'durable', 'well made', 'worth', 'trendy', 'comfortable', 'soft', 'easy']
    const negativeKeywords = ['cheap', 'flimsy', 'expensive', 'ugly', 'tight', 'difficult', 'uncomfortable', 'itchy']
    
    const positiveMatches = keywords.filter(k => positiveKeywords.includes(k) && lowerText.includes(k)).length
    const negativeMatches = keywords.filter(k => negativeKeywords.includes(k) && lowerText.includes(k)).length
    
    if (positiveMatches > negativeMatches) {
      score = 0.7 + (positiveMatches * 0.1)
    } else if (negativeMatches > positiveMatches) {
      score = 0.3 - (negativeMatches * 0.1)
    }
    
    themes[theme as keyof SentimentData['themes']] = {
      score: Math.max(0, Math.min(1, score)),
      confidence: mentions > 0 ? 0.8 : 0.3,
      mentions
    }
  })
  
  return themes
}

// ============================================================================
// AMAZON BEDROCK TRANSFORMERS
// ============================================================================

export interface BedrockResponse {
  content: Array<{
    text: string
    type: 'text'
  }>
  id: string
  model: string
  role: 'assistant'
  stop_reason?: string
  type: 'message'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export function extractTextFromBedrockResponse(response: BedrockResponse): string {
  return response.content
    .filter(content => content.type === 'text')
    .map(content => content.text)
    .join('\n')
}

export function parseCommentaryFromBedrockResponse(
  response: BedrockResponse,
  products: Product[],
  sentimentData: SentimentData[]
): Partial<CommentaryEpisode['content']> {
  const text = extractTextFromBedrockResponse(response)
  
  // Parse structured commentary from AI response
  // This is a simplified parser - in production, you'd want more robust parsing
  const sections = parseCommentarySections(text)
  
  return {
    introduction: sections.introduction || '',
    trendAnalysis: parseTrendAnalysis(sections.trends || '', products),
    productSpotlights: parseProductSpotlights(sections.products || '', products, sentimentData),
    sentimentSummary: parseSentimentSummary(sections.sentiment || '', sentimentData),
    accessibilityHighlights: parseAccessibilityHighlights(sections.accessibility || ''),
    conclusion: sections.conclusion || ''
  }
}

function parseCommentarySections(text: string) {
  const sections: Record<string, string> = {}
  
  // Simple section parsing based on headers
  const sectionHeaders = {
    introduction: /## Introduction\s*\n([\s\S]*?)(?=\n##|\n$)/,
    trends: /## Trend Analysis\s*\n([\s\S]*?)(?=\n##|\n$)/,
    products: /## Product Spotlights?\s*\n([\s\S]*?)(?=\n##|\n$)/,
    sentiment: /## Sentiment Summary\s*\n([\s\S]*?)(?=\n##|\n$)/,
    accessibility: /## Accessibility Highlights?\s*\n([\s\S]*?)(?=\n##|\n$)/,
    conclusion: /## Conclusion\s*\n([\s\S]*?)(?=\n##|\n$)/
  }
  
  Object.entries(sectionHeaders).forEach(([key, regex]) => {
    const match = text.match(regex)
    if (match) {
      sections[key] = match[1].trim()
    }
  })
  
  return sections
}

function parseTrendAnalysis(text: string, products: Product[]): TrendInsight[] {
  // Parse trend insights from text
  const trends: TrendInsight[] = []
  const trendBlocks = text.split(/\n\s*\n/).filter(block => block.trim())
  
  trendBlocks.forEach((block, index) => {
    const lines = block.split('\n')
    const title = lines[0]?.replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '')
    const description = lines.slice(1).join(' ').trim()
    
    if (title && description) {
      trends.push({
        id: `trend-${index + 1}`,
        trend: title,
        description,
        confidence: 0.8, // Default confidence
        supportingProducts: products.slice(0, 2).map(p => p.asin), // Link to first few products
        marketImpact: 'medium',
        timeframe: 'current'
      })
    }
  })
  
  return trends
}

function parseProductSpotlights(text: string, products: Product[], sentimentData: SentimentData[]): ProductSpotlight[] {
  const spotlights: ProductSpotlight[] = []
  
  products.forEach((product, index) => {
    if (index < 3) { // Limit to first 3 products
      const sentiment = sentimentData[index]
      const productText = extractProductCommentary(text, product.title)
      
      spotlights.push({
        product,
        commentary: productText || `Alex Chen's analysis of ${product.title}...`,
        sentimentHighlights: extractSentimentHighlights(sentiment),
        alexRecommendation: determineRecommendation(product, sentiment),
        priceAnalysis: generatePriceAnalysis(product)
      })
    }
  })
  
  return spotlights
}

function extractProductCommentary(text: string, productTitle: string): string {
  // Extract commentary specific to a product
  const productKeywords = productTitle.toLowerCase().split(' ').slice(0, 3)
  const sentences = text.split(/[.!?]+/)
  
  const relevantSentences = sentences.filter(sentence => 
    productKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  )
  
  return relevantSentences.slice(0, 2).join('. ').trim()
}

function extractSentimentHighlights(sentiment?: SentimentData): string[] {
  if (!sentiment) return []
  
  const highlights: string[] = []
  
  // Extract key positive/negative themes
  Object.entries(sentiment.themes).forEach(([theme, data]) => {
    if (data.mentions > 0) {
      const sentiment_type = data.score > 0.6 ? 'positive' : data.score < 0.4 ? 'negative' : 'neutral'
      highlights.push(`${theme}: ${sentiment_type} (${data.mentions} mentions)`)
    }
  })
  
  return highlights.slice(0, 3) // Limit to top 3
}

function determineRecommendation(product: Product, sentiment?: SentimentData): ProductSpotlight['alexRecommendation'] {
  let score = product.rating / 5 // Base score from rating
  
  if (sentiment) {
    score = (score + sentiment.overall.positive) / 2
  }
  
  if (score >= 0.8) return 'highly_recommended'
  if (score >= 0.6) return 'recommended'
  if (score >= 0.4) return 'conditional'
  return 'not_recommended'
}

function generatePriceAnalysis(product: Product): string {
  const { price } = product
  
  if (price.discount && price.discountPercentage) {
    return `Currently ${price.discountPercentage}% off - great value at $${price.current}`
  }
  
  if (price.current < 30) return 'Budget-friendly option'
  if (price.current < 100) return 'Mid-range pricing'
  return 'Premium pricing tier'
}

function parseSentimentSummary(text: string, sentimentData: SentimentData[]): SentimentSummary {
  // Aggregate sentiment data
  const overallPositive = sentimentData.reduce((sum, data) => sum + data.overall.positive, 0) / sentimentData.length
  const overallNegative = sentimentData.reduce((sum, data) => sum + data.overall.negative, 0) / sentimentData.length
  
  let overallTrend: SentimentSummary['overallTrend'] = 'neutral'
  if (overallPositive > 0.6) overallTrend = 'positive'
  else if (overallNegative > 0.6) overallTrend = 'negative'
  else if (Math.abs(overallPositive - overallNegative) < 0.2) overallTrend = 'mixed'
  
  return {
    overallTrend,
    keyFindings: extractKeyFindings(text),
    customerConcerns: extractCustomerConcerns(sentimentData),
    recommendations: extractRecommendations(text),
    confidenceScore: sentimentData.reduce((sum, data) => sum + data.confidence, 0) / sentimentData.length
  }
}

function extractKeyFindings(text: string): string[] {
  // Extract bullet points or numbered lists as key findings
  const findings = text.match(/(?:^|\n)[\*\-\d+\.]\s*(.+)/gm) || []
  return findings.map(finding => finding.replace(/^[\*\-\d+\.\s]+/, '')).slice(0, 5)
}

function extractCustomerConcerns(sentimentData: SentimentData[]): string[] {
  const concerns: string[] = []
  
  sentimentData.forEach(data => {
    Object.entries(data.themes).forEach(([theme, themeData]) => {
      if (themeData.score < 0.4 && themeData.mentions > 0) {
        concerns.push(`${theme} issues mentioned by customers`)
      }
    })
  })
  
  return [...new Set(concerns)].slice(0, 3) // Remove duplicates and limit
}

function extractRecommendations(text: string): string[] {
  // Look for recommendation patterns in text
  const recommendationPatterns = [
    /recommend(?:s|ed)?\s+(.+?)(?:\.|$)/gi,
    /suggest(?:s|ed)?\s+(.+?)(?:\.|$)/gi,
    /consider\s+(.+?)(?:\.|$)/gi
  ]
  
  const recommendations: string[] = []
  
  recommendationPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        recommendations.push(match[1].trim())
      }
    }
  })
  
  return recommendations.slice(0, 3)
}

function parseAccessibilityHighlights(text: string): AccessibilityHighlight[] {
  const highlights: AccessibilityHighlight[] = []
  
  // Look for accessibility-related content
  const accessibilityKeywords = ['accessible', 'adaptive', 'inclusive', 'disability', 'mobility', 'sensory']
  const sentences = text.split(/[.!?]+/)
  
  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase()
    if (accessibilityKeywords.some(keyword => lowerSentence.includes(keyword))) {
      highlights.push({
        type: 'feature',
        title: `Accessibility Insight ${index + 1}`,
        description: sentence.trim(),
        impact: 'medium'
      })
    }
  })
  
  return highlights.slice(0, 3)
}

// ============================================================================
// ALEX CHEN PERSONALITY TRANSFORMERS
// ============================================================================

export function createDefaultAlexPersonality(): AlexChenPersonality {
  return {
    version: '1.0.0',
    traits: {
      neurodivergentPerspective: true,
      disabilityAdvocacy: true,
      fashionExpertiseLevel: 'advanced',
      communicationStyle: 'conversational',
      empathyLevel: 'very_high',
      authenticityFocus: true
    },
    voiceCharacteristics: {
      tone: 'warm',
      vocabularyComplexity: 'accessible',
      culturalReferences: ['pop culture', 'disability community', 'fashion history'],
      humorStyle: 'gentle',
      languagePatterns: ['inclusive language', 'person-first language', 'positive framing']
    },
    contentGuidelines: {
      disabilityRepresentation: 'authentic',
      fashionFocusAreas: ['adaptive_fashion', 'inclusive_sizing', 'sensory_friendly', 'mainstream_fashion'],
      accessibilityMentions: 'natural',
      inclusivityPriority: 'very_high',
      avoidanceTopics: ['ableist language', 'inspiration porn', 'medical model language']
    },
    knowledgeAreas: [
      {
        domain: 'Adaptive Fashion',
        expertiseLevel: 9,
        specializations: ['magnetic closures', 'seated wear', 'one-handed dressing']
      },
      {
        domain: 'Inclusive Design',
        expertiseLevel: 8,
        specializations: ['universal design', 'sensory considerations', 'mobility aids']
      },
      {
        domain: 'Fashion Trends',
        expertiseLevel: 7,
        specializations: ['sustainable fashion', 'accessibility trends', 'mainstream fashion']
      }
    ],
    communicationPreferences: {
      preferredLength: 'moderate',
      structureStyle: 'thematic',
      exampleUsage: 'frequent',
      personalAnecdotes: true
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function sanitizeTextForAI(text: string): string {
  // Clean and prepare text for AI processing
  return text
    .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 4000) // Limit length for AI processing
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export function calculateReadingLevel(text: string): number {
  // Simple reading level calculation (Flesch-Kincaid approximation)
  const sentences = text.split(/[.!?]+/).length
  const words = text.split(/\s+/).length
  const syllables = text.split(/[aeiouAEIOU]/).length - 1
  
  if (sentences === 0 || words === 0) return 1
  
  const avgWordsPerSentence = words / sentences
  const avgSyllablesPerWord = syllables / words
  
  const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
  
  return Math.max(1, Math.min(20, Math.round(fleschKincaid)))
}