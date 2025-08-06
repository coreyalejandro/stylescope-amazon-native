// Validation schemas for StyleScope using Zod
// Ensures data integrity across all Amazon service integrations

import { z } from 'zod'

// ============================================================================
// PRODUCT VALIDATION SCHEMAS
// ============================================================================

export const PricingInfoSchema = z.object({
  current: z.number().positive(),
  original: z.number().positive().optional(),
  currency: z.string().length(3), // ISO currency codes
  discount: z.number().nonnegative().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  priceHistory: z.array(z.object({
    date: z.date(),
    price: z.number().positive()
  })).optional()
})

export const ProductImagesSchema = z.object({
  primary: z.string().url(),
  thumbnails: z.array(z.string().url()),
  altText: z.array(z.string()).optional()
})

export const AccessibilityFeatureSchema = z.object({
  type: z.enum(['adaptive_clothing', 'easy_fastening', 'sensory_friendly', 'size_inclusive']),
  description: z.string().min(1)
})

export const ProductSchema = z.object({
  asin: z.string().regex(/^[A-Z0-9]{10}$/, 'Invalid ASIN format'),
  title: z.string().min(1).max(500),
  price: PricingInfoSchema,
  images: ProductImagesSchema,
  category: z.string().min(1),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().nonnegative(),
  availability: z.enum(['in_stock', 'limited', 'out_of_stock', 'pre_order']),
  features: z.array(z.string()),
  brand: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  accessibilityFeatures: z.array(AccessibilityFeatureSchema).optional()
})

// ============================================================================
// REVIEW AND SENTIMENT VALIDATION SCHEMAS
// ============================================================================

export const ReviewAuthorSchema = z.object({
  name: z.string().min(1),
  isVerifiedPurchaser: z.boolean(),
  reviewCount: z.number().nonnegative().optional()
})

export const ReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().regex(/^[A-Z0-9]{10}$/),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  author: ReviewAuthorSchema,
  date: z.date(),
  verified: z.boolean(),
  helpfulVotes: z.number().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  accessibilityMentions: z.array(z.string()).optional()
})

export const SentimentScoreSchema = z.object({
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  mentions: z.number().nonnegative()
})

export const SentimentThemesSchema = z.object({
  quality: SentimentScoreSchema,
  value: SentimentScoreSchema,
  style: SentimentScoreSchema,
  fit: SentimentScoreSchema,
  accessibility: SentimentScoreSchema,
  comfort: SentimentScoreSchema
})

export const KeyPhraseSchema = z.object({
  text: z.string().min(1),
  score: z.number().min(0).max(1),
  beginOffset: z.number().nonnegative(),
  endOffset: z.number().nonnegative()
})

export const SentimentDataSchema = z.object({
  overall: z.object({
    positive: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1),
    mixed: z.number().min(0).max(1)
  }),
  themes: SentimentThemesSchema,
  keyPhrases: z.array(KeyPhraseSchema),
  confidence: z.number().min(0).max(1),
  processedAt: z.date(),
  languageCode: z.string().length(2)
})

// ============================================================================
// ALEX CHEN PERSONALITY VALIDATION SCHEMAS
// ============================================================================

export const PersonalityTraitsSchema = z.object({
  neurodivergentPerspective: z.boolean(),
  disabilityAdvocacy: z.boolean(),
  fashionExpertiseLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  communicationStyle: z.enum(['conversational', 'analytical', 'educational', 'entertaining']),
  empathyLevel: z.enum(['high', 'very_high']),
  authenticityFocus: z.boolean()
})

export const VoiceCharacteristicsSchema = z.object({
  tone: z.enum(['warm', 'professional', 'enthusiastic', 'thoughtful', 'encouraging']),
  vocabularyComplexity: z.enum(['accessible', 'intermediate', 'technical']),
  culturalReferences: z.array(z.string()),
  humorStyle: z.enum(['gentle', 'witty', 'observational']).optional(),
  languagePatterns: z.array(z.string())
})

export const FashionCategorySchema = z.enum([
  'adaptive_fashion',
  'inclusive_sizing',
  'sensory_friendly',
  'sustainable_fashion',
  'accessible_footwear',
  'mainstream_fashion',
  'luxury_fashion',
  'streetwear',
  'professional_wear'
])

export const ContentGuidelinesSchema = z.object({
  disabilityRepresentation: z.enum(['authentic', 'positive', 'non_tokenistic', 'educational']),
  fashionFocusAreas: z.array(FashionCategorySchema),
  accessibilityMentions: z.enum(['natural', 'educational', 'prominent']),
  inclusivityPriority: z.enum(['high', 'very_high']),
  avoidanceTopics: z.array(z.string())
})

export const AlexChenPersonalitySchema = z.object({
  version: z.string().min(1),
  traits: PersonalityTraitsSchema,
  voiceCharacteristics: VoiceCharacteristicsSchema,
  contentGuidelines: ContentGuidelinesSchema,
  knowledgeAreas: z.array(z.object({
    domain: z.string(),
    expertiseLevel: z.number().min(1).max(10),
    specializations: z.array(z.string())
  })),
  communicationPreferences: z.object({
    preferredLength: z.enum(['concise', 'moderate', 'detailed']),
    structureStyle: z.enum(['linear', 'thematic', 'narrative']),
    exampleUsage: z.enum(['frequent', 'moderate', 'minimal']),
    personalAnecdotes: z.boolean()
  })
})

// ============================================================================
// COMMENTARY EPISODE VALIDATION SCHEMAS
// ============================================================================

export const TrendInsightSchema = z.object({
  id: z.string().min(1),
  trend: z.string().min(1),
  description: z.string().min(1),
  confidence: z.number().min(0).max(1),
  supportingProducts: z.array(z.string()),
  accessibilityRelevance: z.string().optional(),
  marketImpact: z.enum(['low', 'medium', 'high']),
  timeframe: z.enum(['current', 'emerging', 'seasonal'])
})

export const ProductSpotlightSchema = z.object({
  product: ProductSchema,
  commentary: z.string().min(1),
  sentimentHighlights: z.array(z.string()),
  accessibilityNotes: z.array(z.string()).optional(),
  alexRecommendation: z.enum(['highly_recommended', 'recommended', 'conditional', 'not_recommended']),
  priceAnalysis: z.string().optional()
})

export const SentimentSummarySchema = z.object({
  overallTrend: z.enum(['positive', 'negative', 'mixed', 'neutral']),
  keyFindings: z.array(z.string()),
  customerConcerns: z.array(z.string()),
  recommendations: z.array(z.string()),
  accessibilityFeedback: z.array(z.string()).optional(),
  confidenceScore: z.number().min(0).max(1)
})

export const AccessibilityHighlightSchema = z.object({
  type: z.enum(['feature', 'concern', 'improvement', 'innovation']),
  title: z.string().min(1),
  description: z.string().min(1),
  products: z.array(z.string()).optional(),
  impact: z.enum(['low', 'medium', 'high'])
})

export const EpisodeContentSchema = z.object({
  introduction: z.string().min(1),
  trendAnalysis: z.array(TrendInsightSchema),
  productSpotlights: z.array(ProductSpotlightSchema),
  sentimentSummary: SentimentSummarySchema,
  accessibilityHighlights: z.array(AccessibilityHighlightSchema),
  conclusion: z.string().min(1),
  callToAction: z.string().optional()
})

export const AccessibilityInfoSchema = z.object({
  altText: z.array(z.string()),
  transcription: z.string().optional(),
  readingLevel: z.number().min(1).max(20),
  screenReaderOptimized: z.boolean(),
  keyboardNavigable: z.boolean(),
  colorContrastCompliant: z.boolean(),
  cognitiveLoadScore: z.number().min(1).max(10)
})

export const CommentaryEpisodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  publishDate: z.date(),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  content: EpisodeContentSchema,
  metadata: z.object({
    productsAnalyzed: z.number().nonnegative(),
    reviewsProcessed: z.number().nonnegative(),
    generationTime: z.number().positive(),
    alexPersonalityVersion: z.string(),
    aiModelUsed: z.string(),
    processingStats: z.object({
      sentimentAnalysisTime: z.number().nonnegative(),
      aiGenerationTime: z.number().nonnegative(),
      totalTokensUsed: z.number().nonnegative(),
      cacheHitRate: z.number().min(0).max(1)
    }),
    tags: z.array(z.string()),
    categories: z.array(FashionCategorySchema)
  }),
  accessibility: AccessibilityInfoSchema,
  seoData: z.object({
    metaTitle: z.string().min(1).max(60),
    metaDescription: z.string().min(1).max(160),
    keywords: z.array(z.string()),
    canonicalUrl: z.string().url().optional(),
    structuredData: z.record(z.string(), z.unknown()).optional()
  }).optional()
})

// ============================================================================
// API VALIDATION SCHEMAS
// ============================================================================

export const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  retryable: z.boolean(),
  retryAfter: z.number().optional()
})

export const APIResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: APIErrorSchema.optional(),
  metadata: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    processingTime: z.number(),
    cacheHit: z.boolean(),
    rateLimit: z.object({
      limit: z.number(),
      remaining: z.number(),
      resetTime: z.date()
    }).optional()
  }).optional()
})

// ============================================================================
// SEARCH AND FILTERING VALIDATION SCHEMAS
// ============================================================================

export const PriceRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().positive(),
  currency: z.string().length(3)
}).refine(data => data.max > data.min, {
  message: "Max price must be greater than min price"
})

export const SearchFiltersSchema = z.object({
  categories: z.array(FashionCategorySchema).optional(),
  priceRange: PriceRangeSchema.optional(),
  rating: z.number().min(1).max(5).optional(),
  availability: z.array(z.enum(['in_stock', 'limited', 'out_of_stock', 'pre_order'])).optional(),
  accessibility: z.boolean().optional(),
  brands: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional()
})

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  filters: SearchFiltersSchema,
  sort: z.object({
    field: z.enum(['relevance', 'price', 'rating', 'date', 'popularity']),
    direction: z.enum(['asc', 'desc'])
  }),
  pagination: z.object({
    page: z.number().positive(),
    limit: z.number().min(1).max(100),
    offset: z.number().nonnegative().optional()
  })
})

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data)
}

export function validateReview(data: unknown) {
  return ReviewSchema.safeParse(data)
}

export function validateSentimentData(data: unknown) {
  return SentimentDataSchema.safeParse(data)
}

export function validateCommentaryEpisode(data: unknown) {
  return CommentaryEpisodeSchema.safeParse(data)
}

export function validateAlexPersonality(data: unknown) {
  return AlexChenPersonalitySchema.safeParse(data)
}

export function validateSearchQuery(data: unknown) {
  return SearchQuerySchema.safeParse(data)
}

// Custom validation for Amazon service responses
export function validateAmazonProductResponse(data: unknown) {
  // Amazon Product API specific validation
  const amazonProductSchema = ProductSchema.extend({
    asin: z.string().regex(/^[A-Z0-9]{10}$/, 'Invalid Amazon ASIN'),
    // Add Amazon-specific fields
    detailPageURL: z.string().url().optional(),
    customerReviews: z.object({
      count: z.number().nonnegative(),
      starRating: z.object({
        value: z.number().min(0).max(5)
      })
    }).optional()
  })
  
  return amazonProductSchema.safeParse(data)
}

export function validateComprehendResponse(data: unknown) {
  // Amazon Comprehend specific validation
  const comprehendSchema = z.object({
    Sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']),
    SentimentScore: z.object({
      Positive: z.number().min(0).max(1),
      Negative: z.number().min(0).max(1),
      Neutral: z.number().min(0).max(1),
      Mixed: z.number().min(0).max(1)
    }),
    KeyPhrases: z.array(z.object({
      Text: z.string(),
      Score: z.number().min(0).max(1),
      BeginOffset: z.number().nonnegative(),
      EndOffset: z.number().nonnegative()
    })).optional()
  })
  
  return comprehendSchema.safeParse(data)
}

export function validateBedrockResponse(data: unknown) {
  // Amazon Bedrock specific validation
  const bedrockSchema = z.object({
    content: z.array(z.object({
      text: z.string(),
      type: z.literal('text')
    })),
    id: z.string(),
    model: z.string(),
    role: z.literal('assistant'),
    stop_reason: z.string().optional(),
    stop_sequence: z.string().optional(),
    type: z.literal('message'),
    usage: z.object({
      input_tokens: z.number().nonnegative(),
      output_tokens: z.number().nonnegative()
    })
  })
  
  return bedrockSchema.safeParse(data)
}

// Validation error formatting
export function formatValidationErrors(errors: z.ZodError) {
  return errors.issues.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }))
}// =====
=======================================================================
// PERSONALITY ENGINE VALIDATION SCHEMAS
// ============================================================================

export const PersonalityTraitsSchema = z.object({
  neurodivergentPerspective: z.boolean(),
  disabilityAdvocacy: z.boolean(),
  fashionExpertiseLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  communicationStyle: z.enum(['conversational', 'analytical', 'educational', 'entertaining']),
  empathyLevel: z.enum(['high', 'very_high']),
  authenticityFocus: z.boolean()
})

export const VoiceCharacteristicsSchema = z.object({
  tone: z.enum(['warm', 'professional', 'enthusiastic', 'thoughtful', 'encouraging']),
  vocabularyComplexity: z.enum(['accessible', 'intermediate', 'technical']),
  culturalReferences: z.array(z.string()),
  humorStyle: z.enum(['gentle', 'witty', 'observational']).optional(),
  languagePatterns: z.array(z.string())
})

export const ContentGuidelinesSchema = z.object({
  disabilityRepresentation: z.enum(['authentic', 'positive', 'non_tokenistic', 'educational']),
  fashionFocusAreas: z.array(z.enum([
    'adaptive_fashion', 'inclusive_sizing', 'sensory_friendly', 'sustainable_fashion',
    'accessible_footwear', 'mainstream_fashion', 'luxury_fashion', 'streetwear', 'professional_wear'
  ])),
  accessibilityMentions: z.enum(['natural', 'educational', 'prominent']),
  inclusivityPriority: z.enum(['high', 'very_high']),
  avoidanceTopics: z.array(z.string())
})

export const KnowledgeAreaSchema = z.object({
  domain: z.string().min(1),
  expertiseLevel: z.number().min(1).max(10),
  specializations: z.array(z.string())
})

export const CommunicationPreferencesSchema = z.object({
  preferredLength: z.enum(['concise', 'moderate', 'detailed']),
  structureStyle: z.enum(['linear', 'thematic', 'narrative']),
  exampleUsage: z.enum(['frequent', 'moderate', 'minimal']),
  personalAnecdotes: z.boolean()
})

export const AlexChenPersonalitySchema = z.object({
  version: z.string().min(1),
  traits: PersonalityTraitsSchema,
  voiceCharacteristics: VoiceCharacteristicsSchema,
  contentGuidelines: ContentGuidelinesSchema,
  knowledgeAreas: z.array(KnowledgeAreaSchema),
  communicationPreferences: CommunicationPreferencesSchema
})

export const CommentaryGenerationRequestSchema = z.object({
  products: z.array(ProductSchema).min(1).max(10),
  sentimentData: z.array(SentimentDataSchema).min(1).max(10),
  trendContext: z.string().optional(),
  episodeTitle: z.string().optional(),
  previousEpisodes: z.array(z.string()).optional()
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Alex Chen personality configuration
 */
export function validatePersonalityConfig(personality: unknown): ValidationResult {
  try {
    AlexChenPersonalitySchema.parse(personality)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Unknown validation error',
        code: 'unknown'
      }]
    }
  }
}

/**
 * Validate commentary generation request
 */
export function validateCommentaryRequest(request: unknown): ValidationResult {
  try {
    CommentaryGenerationRequestSchema.parse(request)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Unknown validation error',
        code: 'unknown'
      }]
    }
  }
}

/**
 * Validate personality consistency in generated content
 */
export function validatePersonalityConsistency(
  content: string,
  personality: AlexChenPersonality
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  // Check for required personality elements
  const lowerContent = content.toLowerCase()
  
  // Check for warm tone
  const warmWords = ['welcome', 'excited', 'love', 'wonderful', 'amazing']
  const hasWarmTone = warmWords.some(word => lowerContent.includes(word))
  if (!hasWarmTone && personality.voiceCharacteristics.tone === 'warm') {
    warnings.push({
      field: 'tone',
      message: 'Content may lack warm tone expected from Alex Chen',
      suggestion: 'Include more warm, welcoming language'
    })
  }
  
  // Check for accessibility mentions
  const accessibilityWords = ['accessible', 'inclusive', 'adaptive', 'disability']
  const hasAccessibilityMentions = accessibilityWords.some(word => lowerContent.includes(word))
  if (!hasAccessibilityMentions && personality.contentGuidelines.accessibilityMentions !== 'minimal') {
    warnings.push({
      field: 'accessibility',
      message: 'Content lacks accessibility mentions',
      suggestion: 'Include natural accessibility references'
    })
  }
  
  // Check for ableist language
  const ableistPhrases = ['suffers from', 'confined to', 'wheelchair bound', 'normal people']
  const hasAbleistLanguage = ableistPhrases.some(phrase => lowerContent.includes(phrase))
  if (hasAbleistLanguage) {
    errors.push({
      field: 'language',
      message: 'Content contains ableist language',
      code: 'ableist_language'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}