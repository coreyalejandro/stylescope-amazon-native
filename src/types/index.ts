// Core type definitions for StyleScope - AI Fashion Commentary System

// ============================================================================
// PRODUCT DATA MODELS
// ============================================================================

export interface Product {
  asin: string
  title: string
  price: PricingInfo
  images: ProductImages
  category: string
  rating: number
  reviewCount: number
  availability: ProductAvailability
  features: string[]
  brand?: string
  sizes?: string[]
  colors?: string[]
  materials?: string[]
  accessibilityFeatures?: AccessibilityFeature[]
}

export interface PricingInfo {
  current: number
  original?: number
  currency: string
  discount?: number
  discountPercentage?: number
  priceHistory?: PricePoint[]
}

export interface PricePoint {
  date: Date
  price: number
}

export interface ProductImages {
  primary: string
  thumbnails: string[]
  altText?: string[]
}

export type ProductAvailability = 'in_stock' | 'limited' | 'out_of_stock' | 'pre_order'

export interface AccessibilityFeature {
  type: 'adaptive_clothing' | 'easy_fastening' | 'sensory_friendly' | 'size_inclusive'
  description: string
}

// ============================================================================
// REVIEW AND SENTIMENT MODELS
// ============================================================================

export interface Review {
  id: string
  productId: string
  rating: number
  title: string
  content: string
  author: ReviewAuthor
  date: Date
  verified: boolean
  helpfulVotes?: number
  images?: string[]
  accessibilityMentions?: string[]
}

export interface ReviewAuthor {
  name: string
  isVerifiedPurchaser: boolean
  reviewCount?: number
}

export interface SentimentData {
  overall: SentimentScores
  themes: SentimentThemes
  keyPhrases: KeyPhrase[]
  confidence: number
  processedAt: Date
  languageCode: string
}

export interface SentimentScores {
  positive: number
  negative: number
  neutral: number
  mixed: number
}

export interface SentimentThemes {
  quality: SentimentScore
  value: SentimentScore
  style: SentimentScore
  fit: SentimentScore
  accessibility: SentimentScore
  comfort: SentimentScore
}

export interface SentimentScore {
  score: number
  confidence: number
  mentions: number
}

export interface KeyPhrase {
  text: string
  score: number
  beginOffset: number
  endOffset: number
}

// ============================================================================
// ALEX CHEN PERSONALITY AND AI MODELS
// ============================================================================

export interface AlexChenPersonality {
  version: string
  traits: PersonalityTraits
  voiceCharacteristics: VoiceCharacteristics
  contentGuidelines: ContentGuidelines
  knowledgeAreas: KnowledgeArea[]
  communicationPreferences: CommunicationPreferences
}

export interface PersonalityTraits {
  neurodivergentPerspective: boolean
  disabilityAdvocacy: boolean
  fashionExpertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  communicationStyle: 'conversational' | 'analytical' | 'educational' | 'entertaining'
  empathyLevel: 'high' | 'very_high'
  authenticityFocus: boolean
}

export interface VoiceCharacteristics {
  tone: 'warm' | 'professional' | 'enthusiastic' | 'thoughtful' | 'encouraging'
  vocabularyComplexity: 'accessible' | 'intermediate' | 'technical'
  culturalReferences: string[]
  humorStyle?: 'gentle' | 'witty' | 'observational'
  languagePatterns: string[]
}

export interface ContentGuidelines {
  disabilityRepresentation: 'authentic' | 'positive' | 'non_tokenistic' | 'educational'
  fashionFocusAreas: FashionCategory[]
  accessibilityMentions: 'natural' | 'educational' | 'prominent'
  inclusivityPriority: 'high' | 'very_high'
  avoidanceTopics: string[]
}

export interface KnowledgeArea {
  domain: string
  expertiseLevel: number // 1-10
  specializations: string[]
}

export interface CommunicationPreferences {
  preferredLength: 'concise' | 'moderate' | 'detailed'
  structureStyle: 'linear' | 'thematic' | 'narrative'
  exampleUsage: 'frequent' | 'moderate' | 'minimal'
  personalAnecdotes: boolean
}

export type FashionCategory = 
  | 'adaptive_fashion' 
  | 'inclusive_sizing' 
  | 'sensory_friendly' 
  | 'sustainable_fashion'
  | 'accessible_footwear'
  | 'mainstream_fashion'
  | 'luxury_fashion'
  | 'streetwear'
  | 'professional_wear'

// ============================================================================
// COMMENTARY AND CONTENT MODELS
// ============================================================================

export interface CommentaryEpisode {
  id: string
  title: string
  publishDate: Date
  status: EpisodeStatus
  content: EpisodeContent
  metadata: EpisodeMetadata
  accessibility: AccessibilityInfo
  seoData?: SEOData
}

export type EpisodeStatus = 'draft' | 'review' | 'published' | 'archived'

export interface EpisodeContent {
  introduction: string
  trendAnalysis: TrendInsight[]
  productSpotlights: ProductSpotlight[]
  sentimentSummary: SentimentSummary
  accessibilityHighlights: AccessibilityHighlight[]
  conclusion: string
  callToAction?: string
}

export interface TrendInsight {
  id: string
  trend: string
  description: string
  confidence: number
  supportingProducts: string[]
  accessibilityRelevance?: string
  marketImpact: 'low' | 'medium' | 'high'
  timeframe: 'current' | 'emerging' | 'seasonal'
}

export interface ProductSpotlight {
  product: Product
  commentary: string
  sentimentHighlights: string[]
  accessibilityNotes?: string[]
  alexRecommendation: RecommendationLevel
  priceAnalysis?: string
}

export type RecommendationLevel = 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended'

export interface SentimentSummary {
  overallTrend: 'positive' | 'negative' | 'mixed' | 'neutral'
  keyFindings: string[]
  customerConcerns: string[]
  recommendations: string[]
  accessibilityFeedback?: string[]
  confidenceScore: number
}

export interface AccessibilityHighlight {
  type: 'feature' | 'concern' | 'improvement' | 'innovation'
  title: string
  description: string
  products?: string[]
  impact: 'low' | 'medium' | 'high'
}

export interface EpisodeMetadata {
  productsAnalyzed: number
  reviewsProcessed: number
  generationTime: number
  alexPersonalityVersion: string
  aiModelUsed: string
  processingStats: ProcessingStats
  tags: string[]
  categories: FashionCategory[]
}

export interface ProcessingStats {
  sentimentAnalysisTime: number
  aiGenerationTime: number
  totalTokensUsed: number
  cacheHitRate: number
}

export interface AccessibilityInfo {
  altText: string[]
  transcription?: string
  readingLevel: number
  screenReaderOptimized: boolean
  keyboardNavigable: boolean
  colorContrastCompliant: boolean
  cognitiveLoadScore: number // 1-10, lower is better
}

export interface SEOData {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  canonicalUrl?: string
  structuredData?: Record<string, unknown>
}

// ============================================================================
// API AND SERVICE MODELS
// ============================================================================

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
  metadata?: ResponseMetadata
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
  retryable: boolean
  retryAfter?: number
}

export interface ResponseMetadata {
  timestamp: string
  requestId: string
  processingTime: number
  cacheHit: boolean
  rateLimit?: RateLimitInfo
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: Date
}

export interface ServiceError {
  service: ServiceType
  type: ErrorType
  message: string
  retryable: boolean
  retryAfter?: number
  context?: Record<string, unknown>
}

export type ServiceType = 'product-api' | 'bedrock' | 'comprehend' | 's3' | 'dynamodb' | 'mock-service'

export type ErrorType = 
  | 'rate_limit' 
  | 'service_unavailable' 
  | 'authentication' 
  | 'quota_exceeded'
  | 'validation_error'
  | 'network_error'
  | 'timeout'

// ============================================================================
// SEARCH AND FILTERING MODELS
// ============================================================================

export interface SearchQuery {
  query: string
  filters: SearchFilters
  sort: SortOptions
  pagination: PaginationOptions
}

export interface SearchFilters {
  categories?: FashionCategory[]
  priceRange?: PriceRange
  rating?: number
  availability?: ProductAvailability[]
  accessibility?: boolean
  brands?: string[]
  sizes?: string[]
  colors?: string[]
}

export interface PriceRange {
  min: number
  max: number
  currency: string
}

export interface SortOptions {
  field: 'relevance' | 'price' | 'rating' | 'date' | 'popularity'
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface SearchResults<T> {
  items: T[]
  totalCount: number
  hasMore: boolean
  facets?: SearchFacets
  suggestions?: string[]
}

export interface SearchFacets {
  categories: FacetCount[]
  brands: FacetCount[]
  priceRanges: FacetCount[]
  ratings: FacetCount[]
}

export interface FacetCount {
  value: string
  count: number
}

// ============================================================================
// UTILITY AND VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Type guards for runtime type checking
export function isProduct(obj: unknown): obj is Product {
  return typeof obj === 'object' && obj !== null && 'asin' in obj && 'title' in obj
}

export function isCommentaryEpisode(obj: unknown): obj is CommentaryEpisode {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'content' in obj
}

export function isSentimentData(obj: unknown): obj is SentimentData {
  return typeof obj === 'object' && obj !== null && 'overall' in obj && 'confidence' in obj
}