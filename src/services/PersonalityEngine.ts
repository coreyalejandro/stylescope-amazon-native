// Alex Chen Personality Engine for StyleScope
// Manages Alex Chen's consistent personality and voice across all commentary generation
// Integrates with Amazon Bedrock for AI-powered fashion commentary

import { 
  BedrockRuntimeClient, 
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand
} from '@aws-sdk/client-bedrock-runtime'
import { 
  AlexChenPersonality, 
  Product, 
  SentimentData, 
  CommentaryEpisode,
  ServiceError 
} from '@/types'
import { appConfig } from '@/lib/aws-config'
import { validatePersonalityConfig, validateCommentaryRequest } from '@/lib/validation'

export interface PersonalityEngineConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
  modelId?: string
}

export interface CommentaryGenerationRequest {
  products: Product[]
  sentimentData: SentimentData[]
  trendContext?: string
  episodeTitle?: string
  previousEpisodes?: string[]
}

export interface CommentaryGenerationResponse {
  content: Partial<CommentaryEpisode['content']>
  metadata: {
    tokensUsed: number
    generationTime: number
    personalityVersion: string
    confidenceScore: number
  }
}

export interface PersonalityValidationResult {
  isConsistent: boolean
  consistencyScore: number
  issues: string[]
  suggestions: string[]
}

export class PersonalityEngine {
  private client: BedrockRuntimeClient
  private config: PersonalityEngineConfig
  private personality: AlexChenPersonality
  private modelId: string

  constructor(config: PersonalityEngineConfig, personality?: AlexChenPersonality) {
    this.config = config
    this.modelId = config.modelId || appConfig.bedrock.modelId
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
    
    this.personality = personality || this.createDefaultPersonality()
    
    // Validate personality configuration
    const validation = validatePersonalityConfig(this.personality)
    if (!validation.isValid) {
      throw new Error(`Invalid personality configuration: ${validation.errors.map(e => e.message).join(', ')}`)
    }
  }

  /**
   * Generate fashion commentary using Alex Chen's personality
   */
  async generateCommentary(request: CommentaryGenerationRequest): Promise<CommentaryGenerationResponse> {
    try {
      console.log(`🎭 Generating commentary with Alex Chen's personality for ${request.products.length} products`)
      
      // Validate request
      const validation = validateCommentaryRequest(request)
      if (!validation.isValid) {
        throw new Error(`Invalid commentary request: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const startTime = Date.now()
      
      // Build the prompt with personality context
      const prompt = this.buildPersonalityPrompt(request)
      
      // Generate commentary using Bedrock
      const bedrockResponse = await this.invokeBedrockModel(prompt)
      
      // Parse and structure the response
      const content = this.parseCommentaryResponse(bedrockResponse.content, request)
      
      // Validate personality consistency
      const consistencyCheck = await this.validatePersonalityConsistency(content)
      
      const generationTime = Date.now() - startTime
      
      console.log(`✅ Commentary generated successfully in ${generationTime}ms`)
      
      return {
        content,
        metadata: {
          tokensUsed: bedrockResponse.usage.input_tokens + bedrockResponse.usage.output_tokens,
          generationTime,
          personalityVersion: this.personality.version,
          confidenceScore: consistencyCheck.consistencyScore
        }
      }
    } catch (error) {
      console.error('❌ Error generating commentary:', error)
      throw this.handlePersonalityError(error, 'generateCommentary')
    }
  }

  /**
   * Generate streaming commentary for real-time updates
   */
  async generateStreamingCommentary(
    request: CommentaryGenerationRequest,
    onChunk: (chunk: string) => void
  ): Promise<CommentaryGenerationResponse> {
    try {
      console.log(`🎭 Generating streaming commentary with Alex Chen's personality`)
      
      const startTime = Date.now()
      const prompt = this.buildPersonalityPrompt(request)
      
      // Use streaming invoke
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        contentType: "application/json",
        accept: "application/json"
      })

      const response = await this.client.send(command)
      
      let fullContent = ''
      let tokensUsed = 0
      
      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes))
            
            if (chunkData.type === 'content_block_delta' && chunkData.delta?.text) {
              const text = chunkData.delta.text
              fullContent += text
              onChunk(text)
            }
            
            if (chunkData.usage) {
              tokensUsed = chunkData.usage.input_tokens + chunkData.usage.output_tokens
            }
          }
        }
      }

      const content = this.parseCommentaryResponse(fullContent, request)
      const consistencyCheck = await this.validatePersonalityConsistency(content)
      const generationTime = Date.now() - startTime
      
      return {
        content,
        metadata: {
          tokensUsed,
          generationTime,
          personalityVersion: this.personality.version,
          confidenceScore: consistencyCheck.consistencyScore
        }
      }
    } catch (error) {
      console.error('❌ Error generating streaming commentary:', error)
      throw this.handlePersonalityError(error, 'generateStreamingCommentary')
    }
  }

  /**
   * Validate personality consistency in generated content
   */
  async validatePersonalityConsistency(content: Partial<CommentaryEpisode['content']>): Promise<PersonalityValidationResult> {
    try {
      console.log('🔍 Validating personality consistency')
      
      const issues: string[] = []
      const suggestions: string[] = []
      let consistencyScore = 1.0
      
      // Check for required personality elements
      const fullText = this.extractTextFromContent(content)
      
      // Check tone consistency
      const toneCheck = this.checkToneConsistency(fullText)
      if (!toneCheck.isConsistent) {
        issues.push('Tone inconsistency detected')
        suggestions.push('Ensure warm, conversational tone throughout')
        consistencyScore -= 0.2
      }
      
      // Check neurodivergent perspective
      const perspectiveCheck = this.checkNeurodivergentPerspective(fullText)
      if (!perspectiveCheck.isPresent) {
        issues.push('Missing neurodivergent perspective')
        suggestions.push('Include authentic neurodivergent insights')
        consistencyScore -= 0.3
      }
      
      // Check accessibility mentions
      const accessibilityCheck = this.checkAccessibilityMentions(fullText)
      if (!accessibilityCheck.isNatural) {
        issues.push('Accessibility mentions feel forced or missing')
        suggestions.push('Integrate accessibility naturally into commentary')
        consistencyScore -= 0.2
      }
      
      // Check vocabulary complexity
      const vocabularyCheck = this.checkVocabularyComplexity(fullText)
      if (!vocabularyCheck.isAccessible) {
        issues.push('Vocabulary too complex for accessibility')
        suggestions.push('Use more accessible language')
        consistencyScore -= 0.1
      }
      
      // Check for authentic representation
      const authenticityCheck = this.checkAuthenticity(fullText)
      if (!authenticityCheck.isAuthentic) {
        issues.push('Content may contain tokenistic representation')
        suggestions.push('Ensure authentic, non-tokenistic disability representation')
        consistencyScore -= 0.2
      }
      
      consistencyScore = Math.max(0, consistencyScore)
      
      console.log(`✅ Personality consistency check complete: ${consistencyScore.toFixed(2)}`)
      
      return {
        isConsistent: consistencyScore >= 0.7,
        consistencyScore,
        issues,
        suggestions
      }
    } catch (error) {
      console.error('❌ Error validating personality consistency:', error)
      return {
        isConsistent: false,
        consistencyScore: 0,
        issues: ['Failed to validate consistency'],
        suggestions: ['Review content manually']
      }
    }
  }

  /**
   * Update Alex Chen's personality configuration
   */
  updatePersonality(newPersonality: Partial<AlexChenPersonality>): void {
    try {
      console.log('🔄 Updating Alex Chen personality configuration')
      
      this.personality = {
        ...this.personality,
        ...newPersonality,
        version: `${this.personality.version}-updated-${Date.now()}`
      }
      
      // Validate updated personality
      const validation = validatePersonalityConfig(this.personality)
      if (!validation.isValid) {
        throw new Error(`Invalid personality update: ${validation.errors.map(e => e.message).join(', ')}`)
      }
      
      console.log('✅ Personality configuration updated successfully')
    } catch (error) {
      console.error('❌ Error updating personality:', error)
      throw error
    }
  }

  /**
   * Get current personality configuration
   */
  getPersonality(): AlexChenPersonality {
    return { ...this.personality }
  }

  /**
   * Build personality-aware prompt for Bedrock
   */
  private buildPersonalityPrompt(request: CommentaryGenerationRequest): string {
    const { products, sentimentData, trendContext, episodeTitle } = request
    
    // Build personality context
    const personalityContext = this.buildPersonalityContext()
    
    // Build product context
    const productContext = this.buildProductContext(products, sentimentData)
    
    // Build trend context
    const trendContextStr = trendContext ? `\n\nCurrent Fashion Trends:\n${trendContext}` : ''
    
    // Build episode context
    const episodeContext = episodeTitle ? `\n\nEpisode Title: "${episodeTitle}"` : ''
    
    return `${personalityContext}

${productContext}${trendContextStr}${episodeContext}

Please generate a fashion commentary episode that embodies Alex Chen's personality and perspective. The commentary should include:

1. **Introduction** - A warm, engaging opening that sets the tone
2. **Trend Analysis** - Insights into current fashion trends with accessibility considerations
3. **Product Spotlights** - Detailed analysis of the featured products with sentiment insights
4. **Accessibility Highlights** - Natural integration of accessibility features and considerations
5. **Conclusion** - A thoughtful wrap-up with actionable insights

Remember to:
- Maintain Alex's warm, conversational tone throughout
- Incorporate authentic neurodivergent perspectives naturally
- Present disability representation positively without tokenism
- Use accessible language that's inclusive for all readers
- Include specific product details and sentiment insights
- Focus on both mainstream and adaptive fashion elements

Generate the commentary in a structured format with clear sections.`
  }

  /**
   * Build personality context for prompts
   */
  private buildPersonalityContext(): string {
    const { traits, voiceCharacteristics, contentGuidelines } = this.personality
    
    return `You are Alex Chen, a fashion commentator with the following characteristics:

**Personality Traits:**
- Neurodivergent perspective: ${traits.neurodivergentPerspective ? 'Authentic lived experience' : 'Ally perspective'}
- Disability advocacy: ${traits.disabilityAdvocacy ? 'Strong advocate for inclusive fashion' : 'Supportive of accessibility'}
- Fashion expertise: ${traits.fashionExpertiseLevel} level knowledge
- Communication style: ${traits.communicationStyle}
- Empathy level: ${traits.empathyLevel}
- Authenticity focus: ${traits.authenticityFocus ? 'Prioritizes genuine representation' : 'Balanced approach'}

**Voice Characteristics:**
- Tone: ${voiceCharacteristics.tone}
- Vocabulary: ${voiceCharacteristics.vocabularyComplexity}
- Cultural references: ${voiceCharacteristics.culturalReferences.join(', ')}
- Humor style: ${voiceCharacteristics.humorStyle || 'gentle and inclusive'}
- Language patterns: ${voiceCharacteristics.languagePatterns.join(', ')}

**Content Guidelines:**
- Disability representation: ${contentGuidelines.disabilityRepresentation}
- Fashion focus areas: ${contentGuidelines.fashionFocusAreas.join(', ')}
- Accessibility mentions: ${contentGuidelines.accessibilityMentions}
- Inclusivity priority: ${contentGuidelines.inclusivityPriority}
- Avoid: ${contentGuidelines.avoidanceTopics.join(', ')}

**Knowledge Areas:**
${this.personality.knowledgeAreas.map(area => 
  `- ${area.domain}: ${area.expertiseLevel}/10 expertise (${area.specializations.join(', ')})`
).join('\n')}

**Communication Preferences:**
- Preferred length: ${this.personality.communicationPreferences.preferredLength}
- Structure style: ${this.personality.communicationPreferences.structureStyle}
- Example usage: ${this.personality.communicationPreferences.exampleUsage}
- Personal anecdotes: ${this.personality.communicationPreferences.personalAnecdotes ? 'Include when relevant' : 'Minimize personal stories'}`
  }

  /**
   * Build product context for prompts
   */
  private buildProductContext(products: Product[], sentimentData: SentimentData[]): string {
    let context = `\n\nFeatured Products for Analysis:\n`
    
    products.forEach((product, index) => {
      const sentiment = sentimentData[index]
      
      context += `\n**Product ${index + 1}: ${product.title}**
- ASIN: ${product.asin}
- Price: ${product.price.current} ${product.price.currency}${product.price.original ? ` (was ${product.price.original})` : ''}
- Rating: ${product.rating}/5 (${product.reviewCount} reviews)
- Category: ${product.category}
- Availability: ${product.availability}
- Features: ${product.features.slice(0, 3).join(', ')}${product.features.length > 3 ? '...' : ''}
${product.accessibilityFeatures ? `- Accessibility Features: ${product.accessibilityFeatures.map(f => f.description).join(', ')}` : ''}

**Sentiment Analysis:**
- Overall: ${(sentiment.overall.positive * 100).toFixed(0)}% positive, ${(sentiment.overall.negative * 100).toFixed(0)}% negative
- Quality: ${(sentiment.themes.quality.score * 100).toFixed(0)}% (${sentiment.themes.quality.mentions} mentions)
- Value: ${(sentiment.themes.value.score * 100).toFixed(0)}% (${sentiment.themes.value.mentions} mentions)
- Style: ${(sentiment.themes.style.score * 100).toFixed(0)}% (${sentiment.themes.style.mentions} mentions)
- Fit: ${(sentiment.themes.fit.score * 100).toFixed(0)}% (${sentiment.themes.fit.mentions} mentions)
- Accessibility: ${(sentiment.themes.accessibility.score * 100).toFixed(0)}% (${sentiment.themes.accessibility.mentions} mentions)
- Comfort: ${(sentiment.themes.comfort.score * 100).toFixed(0)}% (${sentiment.themes.comfort.mentions} mentions)
- Key phrases: ${sentiment.keyPhrases.slice(0, 5).map(p => p.text).join(', ')}
`
    })
    
    return context
  }

  /**
   * Invoke Bedrock model for commentary generation
   */
  private async invokeBedrockModel(prompt: string): Promise<any> {
    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9
        }),
        contentType: "application/json",
        accept: "application/json"
      })

      const response = await this.client.send(command)
      
      if (!response.body) {
        throw new Error('No response body from Bedrock')
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      if (!responseBody.content || !responseBody.content[0]?.text) {
        throw new Error('Invalid response format from Bedrock')
      }

      return {
        content: responseBody.content[0].text,
        usage: responseBody.usage || { input_tokens: 0, output_tokens: 0 }
      }
    } catch (error) {
      console.error('❌ Error invoking Bedrock model:', error)
      throw error
    }
  }

  /**
   * Parse commentary response from Bedrock
   */
  private parseCommentaryResponse(
    content: string, 
    request: CommentaryGenerationRequest
  ): Partial<CommentaryEpisode['content']> {
    try {
      // Parse structured commentary from AI response
      const sections = this.parseCommentarySections(content)
      
      return {
        introduction: sections.introduction || '',
        trendAnalysis: this.parseTrendAnalysis(sections.trends || '', request.products),
        productSpotlights: this.parseProductSpotlights(sections.products || '', request.products, request.sentimentData),
        sentimentSummary: this.parseSentimentSummary(sections.sentiment || '', request.sentimentData),
        accessibilityHighlights: this.parseAccessibilityHighlights(sections.accessibility || ''),
        conclusion: sections.conclusion || ''
      }
    } catch (error) {
      console.error('❌ Error parsing commentary response:', error)
      // Return basic structure with the raw content
      return {
        introduction: content.substring(0, 500),
        trendAnalysis: [],
        productSpotlights: [],
        sentimentSummary: {
          overallTrend: 'neutral',
          keyFindings: [],
          customerConcerns: [],
          recommendations: [],
          confidenceScore: 0.5
        },
        accessibilityHighlights: [],
        conclusion: 'Thank you for joining me for this fashion commentary episode.'
      }
    }
  }

  /**
   * Parse commentary sections from AI response
   */
  private parseCommentarySections(content: string): Record<string, string> {
    const sections: Record<string, string> = {}
    
    // Define section patterns
    const sectionPatterns = {
      introduction: /(?:^|\n)(?:##?\s*)?(?:Introduction|Opening|Welcome)[\s\S]*?\n([\s\S]*?)(?=\n(?:##?\s*)?(?:Trend|Product|Sentiment|Accessibility|Conclusion)|$)/i,
      trends: /(?:^|\n)(?:##?\s*)?(?:Trend Analysis|Fashion Trends|Current Trends)[\s\S]*?\n([\s\S]*?)(?=\n(?:##?\s*)?(?:Product|Sentiment|Accessibility|Conclusion)|$)/i,
      products: /(?:^|\n)(?:##?\s*)?(?:Product Spotlights?|Featured Products|Product Analysis)[\s\S]*?\n([\s\S]*?)(?=\n(?:##?\s*)?(?:Sentiment|Accessibility|Conclusion)|$)/i,
      sentiment: /(?:^|\n)(?:##?\s*)?(?:Sentiment Summary|Customer Insights|Review Analysis)[\s\S]*?\n([\s\S]*?)(?=\n(?:##?\s*)?(?:Accessibility|Conclusion)|$)/i,
      accessibility: /(?:^|\n)(?:##?\s*)?(?:Accessibility Highlights?|Inclusive Fashion|Adaptive Features)[\s\S]*?\n([\s\S]*?)(?=\n(?:##?\s*)?(?:Conclusion)|$)/i,
      conclusion: /(?:^|\n)(?:##?\s*)?(?:Conclusion|Wrap[- ]?up|Final Thoughts)[\s\S]*?\n([\s\S]*?)$/i
    }
    
    Object.entries(sectionPatterns).forEach(([key, pattern]) => {
      const match = content.match(pattern)
      if (match && match[1]) {
        sections[key] = match[1].trim()
      }
    })
    
    // If no structured sections found, try to extract from the full content
    if (Object.keys(sections).length === 0) {
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      if (paragraphs.length >= 3) {
        sections.introduction = paragraphs[0]
        sections.trends = paragraphs[1]
        sections.products = paragraphs.slice(1, -1).join('\n\n')
        sections.conclusion = paragraphs[paragraphs.length - 1]
      } else {
        sections.introduction = content
      }
    }
    
    return sections
  }

  /**
   * Parse trend analysis from text
   */
  private parseTrendAnalysis(text: string, products: Product[]): any[] {
    const trends: any[] = []
    
    // Split by paragraphs or numbered items
    const trendBlocks = text.split(/\n\s*\n|\n\d+\./).filter(block => block.trim())
    
    trendBlocks.forEach((block, index) => {
      const lines = block.split('\n').filter(line => line.trim())
      if (lines.length === 0) return
      
      const title = lines[0].replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
      const description = lines.slice(1).join(' ').trim() || title
      
      if (title) {
        trends.push({
          id: `trend-${index + 1}`,
          trend: title,
          description,
          confidence: 0.8,
          supportingProducts: products.slice(0, Math.min(2, products.length)).map(p => p.asin),
          accessibilityRelevance: this.extractAccessibilityRelevance(block),
          marketImpact: this.determineMarketImpact(block),
          timeframe: this.determineTimeframe(block)
        })
      }
    })
    
    return trends.slice(0, 5) // Limit to 5 trends
  }

  /**
   * Parse product spotlights from text
   */
  private parseProductSpotlights(text: string, products: Product[], sentimentData: SentimentData[]): any[] {
    const spotlights: any[] = []
    
    products.forEach((product, index) => {
      const sentiment = sentimentData[index]
      const productCommentary = this.extractProductCommentary(text, product.title, product.asin)
      
      spotlights.push({
        product,
        commentary: productCommentary || `Alex Chen's thoughtful analysis of ${product.title}, considering both its fashion appeal and accessibility features.`,
        sentimentHighlights: this.extractSentimentHighlights(sentiment),
        accessibilityNotes: this.extractAccessibilityNotes(productCommentary, product),
        alexRecommendation: this.determineRecommendation(product, sentiment),
        priceAnalysis: this.generatePriceAnalysis(product)
      })
    })
    
    return spotlights
  }

  /**
   * Parse sentiment summary from text
   */
  private parseSentimentSummary(text: string, sentimentData: SentimentData[]): any {
    // Aggregate sentiment data
    const avgPositive = sentimentData.reduce((sum, data) => sum + data.overall.positive, 0) / sentimentData.length
    const avgNegative = sentimentData.reduce((sum, data) => sum + data.overall.negative, 0) / sentimentData.length
    
    let overallTrend: 'positive' | 'negative' | 'mixed' | 'neutral' = 'neutral'
    if (avgPositive > 0.6) overallTrend = 'positive'
    else if (avgNegative > 0.6) overallTrend = 'negative'
    else if (Math.abs(avgPositive - avgNegative) < 0.2) overallTrend = 'mixed'
    
    return {
      overallTrend,
      keyFindings: this.extractKeyFindings(text),
      customerConcerns: this.extractCustomerConcerns(sentimentData),
      recommendations: this.extractRecommendations(text),
      accessibilityFeedback: this.extractAccessibilityFeedback(text, sentimentData),
      confidenceScore: sentimentData.reduce((sum, data) => sum + data.confidence, 0) / sentimentData.length
    }
  }

  /**
   * Parse accessibility highlights from text
   */
  private parseAccessibilityHighlights(text: string): any[] {
    const highlights: any[] = []
    
    // Look for accessibility-related content
    const accessibilityKeywords = [
      'accessible', 'adaptive', 'inclusive', 'disability', 'mobility', 
      'sensory', 'neurodivergent', 'wheelchair', 'one-handed', 'magnetic'
    ]
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    
    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase()
      if (accessibilityKeywords.some(keyword => lowerSentence.includes(keyword))) {
        highlights.push({
          type: this.determineAccessibilityType(sentence),
          title: `Accessibility Insight ${highlights.length + 1}`,
          description: sentence.trim(),
          impact: this.determineAccessibilityImpact(sentence)
        })
      }
    })
    
    return highlights.slice(0, 3) // Limit to 3 highlights
  }

  /**
   * Extract text from content for analysis
   */
  private extractTextFromContent(content: Partial<CommentaryEpisode['content']>): string {
    const parts = [
      content.introduction || '',
      content.trendAnalysis?.map(t => `${t.trend} ${t.description}`).join(' ') || '',
      content.productSpotlights?.map(p => p.commentary).join(' ') || '',
      content.conclusion || ''
    ]
    
    return parts.join(' ').trim()
  }

  /**
   * Check tone consistency
   */
  private checkToneConsistency(text: string): { isConsistent: boolean; score: number } {
    const warmWords = ['welcome', 'excited', 'love', 'wonderful', 'amazing', 'fantastic', 'delighted']
    const conversationalWords = ['let\'s', 'we\'ll', 'you\'ll', 'i\'m', 'we\'re', 'that\'s', 'here\'s']
    const professionalWords = ['analysis', 'consideration', 'evaluation', 'assessment', 'examination']
    
    const lowerText = text.toLowerCase()
    const warmCount = warmWords.filter(word => lowerText.includes(word)).length
    const conversationalCount = conversationalWords.filter(word => lowerText.includes(word)).length
    const professionalCount = professionalWords.filter(word => lowerText.includes(word)).length
    
    const totalWords = text.split(/\s+/).length
    const warmRatio = warmCount / totalWords * 1000
    const conversationalRatio = conversationalCount / totalWords * 1000
    
    // Alex should be warm and conversational
    const score = (warmRatio + conversationalRatio) / 2
    const isConsistent = score > 2 && warmRatio > 1 && conversationalRatio > 1
    
    return { isConsistent, score }
  }

  /**
   * Check neurodivergent perspective
   */
  private checkNeurodivergentPerspective(text: string): { isPresent: boolean; score: number } {
    const neurodivergentKeywords = [
      'neurodivergent', 'autism', 'adhd', 'sensory', 'processing', 'stimming',
      'different perspectives', 'unique viewpoint', 'lived experience', 'authentic'
    ]
    
    const lowerText = text.toLowerCase()
    const matches = neurodivergentKeywords.filter(keyword => lowerText.includes(keyword)).length
    const score = matches / neurodivergentKeywords.length
    
    return { isPresent: matches > 0, score }
  }

  /**
   * Check accessibility mentions
   */
  private checkAccessibilityMentions(text: string): { isNatural: boolean; count: number } {
    const accessibilityKeywords = [
      'accessible', 'accessibility', 'adaptive', 'inclusive', 'disability',
      'mobility', 'wheelchair', 'one-handed', 'easy to use', 'barrier-free'
    ]
    
    const lowerText = text.toLowerCase()
    const count = accessibilityKeywords.filter(keyword => lowerText.includes(keyword)).length
    
    // Natural integration means mentions are present but not overwhelming
    const wordCount = text.split(/\s+/).length
    const ratio = count / wordCount * 1000
    const isNatural = count > 0 && ratio < 10 && ratio > 1
    
    return { isNatural, count }
  }

  /**
   * Check vocabulary complexity
   */
  private checkVocabularyComplexity(text: string): { isAccessible: boolean; score: number } {
    const complexWords = text.split(/\s+/).filter(word => word.length > 8).length
    const totalWords = text.split(/\s+/).length
    const complexityRatio = complexWords / totalWords
    
    // Accessible vocabulary should have less than 15% complex words
    const isAccessible = complexityRatio < 0.15
    const score = 1 - complexityRatio
    
    return { isAccessible, score }
  }

  /**
   * Check authenticity
   */
  private checkAuthenticity(text: string): { isAuthentic: boolean; score: number } {
    const tokenisticPhrases = [
      'inspiration', 'overcome', 'brave', 'courageous', 'hero', 'victim',
      'suffers from', 'confined to', 'wheelchair bound', 'normal people'
    ]
    
    const authenticPhrases = [
      'lived experience', 'community', 'representation', 'inclusive',
      'accessible', 'barrier-free', 'person with', 'disability community'
    ]
    
    const lowerText = text.toLowerCase()
    const tokenisticCount = tokenisticPhrases.filter(phrase => lowerText.includes(phrase)).length
    const authenticCount = authenticPhrases.filter(phrase => lowerText.includes(phrase)).length
    
    const score = Math.max(0, (authenticCount - tokenisticCount * 2) / authenticPhrases.length)
    const isAuthentic = tokenisticCount === 0 && authenticCount > 0
    
    return { isAuthentic, score }
  }

  /**
   * Helper methods for parsing
   */
  private extractAccessibilityRelevance(text: string): string {
    const accessibilityKeywords = ['accessible', 'adaptive', 'inclusive', 'disability']
    const lowerText = text.toLowerCase()
    
    if (accessibilityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'High relevance for accessibility and inclusive fashion'
    }
    return 'General fashion trend with potential accessibility applications'
  }

  private determineMarketImpact(text: string): 'low' | 'medium' | 'high' {
    const highImpactWords = ['revolutionary', 'game-changing', 'breakthrough', 'major']
    const mediumImpactWords = ['significant', 'important', 'notable', 'growing']
    
    const lowerText = text.toLowerCase()
    
    if (highImpactWords.some(word => lowerText.includes(word))) return 'high'
    if (mediumImpactWords.some(word => lowerText.includes(word))) return 'medium'
    return 'low'
  }

  private determineTimeframe(text: string): 'current' | 'emerging' | 'seasonal' {
    const currentWords = ['now', 'currently', 'today', 'this season']
    const emergingWords = ['emerging', 'upcoming', 'future', 'next']
    const seasonalWords = ['spring', 'summer', 'fall', 'winter', 'seasonal']
    
    const lowerText = text.toLowerCase()
    
    if (emergingWords.some(word => lowerText.includes(word))) return 'emerging'
    if (seasonalWords.some(word => lowerText.includes(word))) return 'seasonal'
    return 'current'
  }

  private extractProductCommentary(text: string, productTitle: string, asin: string): string {
    // Look for mentions of the product by title or ASIN
    const titleWords = productTitle.toLowerCase().split(' ').slice(0, 3)
    const sentences = text.split(/[.!?]+/)
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return titleWords.some(word => lowerSentence.includes(word)) || 
             lowerSentence.includes(asin.toLowerCase())
    })
    
    return relevantSentences.slice(0, 2).join('. ').trim()
  }

  private extractSentimentHighlights(sentiment: SentimentData): string[] {
    const highlights: string[] = []
    
    Object.entries(sentiment.themes).forEach(([theme, data]) => {
      if (data.mentions > 0) {
        const sentimentType = data.score > 0.6 ? 'positive' : data.score < 0.4 ? 'negative' : 'neutral'
        highlights.push(`${theme}: ${sentimentType} sentiment (${data.mentions} mentions)`)
      }
    })
    
    return highlights.slice(0, 3)
  }

  private extractAccessibilityNotes(commentary: string, product: Product): string[] {
    const notes: string[] = []
    
    if (product.accessibilityFeatures) {
      notes.push(...product.accessibilityFeatures.map(f => f.description))
    }
    
    const accessibilityKeywords = ['accessible', 'adaptive', 'easy to use', 'one-handed', 'magnetic']
    const lowerCommentary = commentary.toLowerCase()
    
    accessibilityKeywords.forEach(keyword => {
      if (lowerCommentary.includes(keyword)) {
        notes.push(`Features ${keyword} design elements`)
      }
    })
    
    return [...new Set(notes)].slice(0, 3)
  }

  private determineRecommendation(product: Product, sentiment: SentimentData): 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended' {
    let score = product.rating / 5 // Base score from rating
    
    // Factor in sentiment
    score = (score + sentiment.overall.positive) / 2
    
    // Boost for accessibility features
    if (product.accessibilityFeatures && product.accessibilityFeatures.length > 0) {
      score += 0.1
    }
    
    if (score >= 0.8) return 'highly_recommended'
    if (score >= 0.6) return 'recommended'
    if (score >= 0.4) return 'conditional'
    return 'not_recommended'
  }

  private generatePriceAnalysis(product: Product): string {
    const { price } = product
    
    if (price.discount && price.discountPercentage) {
      return `Currently ${price.discountPercentage}% off - excellent value at ${price.current} ${price.currency}`
    }
    
    if (price.current < 30) return 'Budget-friendly option that doesn\'t compromise on style'
    if (price.current < 100) return 'Mid-range pricing with good value proposition'
    return 'Premium pricing tier - investment piece for your wardrobe'
  }

  private extractKeyFindings(text: string): string[] {
    const findings = text.match(/(?:^|\n)[\*\-\d+\.]\s*(.+)/gm) || []
    return findings
      .map(finding => finding.replace(/^[\*\-\d+\.\s]+/, ''))
      .filter(finding => finding.length > 10)
      .slice(0, 5)
  }

  private extractCustomerConcerns(sentimentData: SentimentData[]): string[] {
    const concerns: string[] = []
    
    sentimentData.forEach(data => {
      Object.entries(data.themes).forEach(([theme, themeData]) => {
        if (themeData.score < 0.4 && themeData.mentions > 0) {
          concerns.push(`${theme} issues mentioned by customers`)
        }
      })
    })
    
    return [...new Set(concerns)].slice(0, 3)
  }

  private extractRecommendations(text: string): string[] {
    const recommendationPatterns = [
      /recommend(?:s|ed)?\s+(.+?)(?:\.|$)/gi,
      /suggest(?:s|ed)?\s+(.+?)(?:\.|$)/gi,
      /consider\s+(.+?)(?:\.|$)/gi
    ]
    
    const recommendations: string[] = []
    
    recommendationPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          recommendations.push(match[1].trim())
        }
      }
    })
    
    return recommendations.slice(0, 3)
  }

  private extractAccessibilityFeedback(text: string, sentimentData: SentimentData[]): string[] {
    const feedback: string[] = []
    
    // Extract from sentiment data
    sentimentData.forEach(data => {
      if (data.themes.accessibility.mentions > 0) {
        const sentiment = data.themes.accessibility.score > 0.6 ? 'positive' : 
                         data.themes.accessibility.score < 0.4 ? 'negative' : 'mixed'
        feedback.push(`Accessibility features received ${sentiment} feedback`)
      }
    })
    
    // Extract from text
    const accessibilityMentions = text.match(/accessibility[^.!?]*[.!?]/gi) || []
    feedback.push(...accessibilityMentions.slice(0, 2))
    
    return [...new Set(feedback)].slice(0, 3)
  }

  private determineAccessibilityType(sentence: string): 'feature' | 'concern' | 'improvement' | 'innovation' {
    const lowerSentence = sentence.toLowerCase()
    
    if (lowerSentence.includes('innovative') || lowerSentence.includes('breakthrough')) return 'innovation'
    if (lowerSentence.includes('improve') || lowerSentence.includes('better')) return 'improvement'
    if (lowerSentence.includes('concern') || lowerSentence.includes('issue')) return 'concern'
    return 'feature'
  }

  private determineAccessibilityImpact(sentence: string): 'low' | 'medium' | 'high' {
    const highImpactWords = ['revolutionary', 'game-changing', 'significant', 'major']
    const mediumImpactWords = ['helpful', 'useful', 'beneficial', 'important']
    
    const lowerSentence = sentence.toLowerCase()
    
    if (highImpactWords.some(word => lowerSentence.includes(word))) return 'high'
    if (mediumImpactWords.some(word => lowerSentence.includes(word))) return 'medium'
    return 'low'
  }

  /**
   * Create default Alex Chen personality
   */
  private createDefaultPersonality(): AlexChenPersonality {
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

  /**
   * Handle personality engine errors
   */
  private handlePersonalityError(error: unknown, operation: string): ServiceError {
    if (error instanceof Error) {
      // Parse Bedrock-specific errors
      if (error.message.includes('ValidationException')) {
        return {
          service: 'bedrock',
          type: 'validation_error',
          message: 'Invalid request to Bedrock model',
          retryable: false
        }
      }
      
      if (error.message.includes('ThrottlingException')) {
        return {
          service: 'bedrock',
          type: 'rate_limit',
          message: 'Bedrock API rate limit exceeded',
          retryable: true,
          retryAfter: 60
        }
      }
      
      if (error.message.includes('AccessDeniedException')) {
        return {
          service: 'bedrock',
          type: 'authentication',
          message: 'Invalid Bedrock credentials or insufficient permissions',
          retryable: false
        }
      }
      
      if (error.message.includes('ServiceUnavailableException')) {
        return {
          service: 'bedrock',
          type: 'service_unavailable',
          message: 'Bedrock service temporarily unavailable',
          retryable: true,
          retryAfter: 30
        }
      }
      
      if (error.message.includes('ModelNotReadyException')) {
        return {
          service: 'bedrock',
          type: 'service_unavailable',
          message: 'Bedrock model is not ready',
          retryable: true,
          retryAfter: 120
        }
      }
    }

    return {
      service: 'bedrock',
      type: 'network_error',
      message: `Personality engine error in ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
      retryAfter: 10
    }
  }

  /**
   * Health check for personality engine
   */
  async healthCheck(): Promise<{ status: string; message: string; details: Record<string, unknown> }> {
    try {
      // Test with a simple commentary generation
      const testProducts: Product[] = [{
        asin: 'TEST123',
        title: 'Test Fashion Item',
        price: { current: 29.99, currency: 'USD' },
        images: { primary: '', thumbnails: [] },
        category: 'Fashion',
        rating: 4.5,
        reviewCount: 100,
        availability: 'in_stock',
        features: ['Comfortable', 'Stylish']
      }]
      
      const testSentiment: SentimentData[] = [{
        overall: { positive: 0.8, negative: 0.1, neutral: 0.1, mixed: 0.0 },
        themes: {
          quality: { score: 0.8, confidence: 0.9, mentions: 5 },
          value: { score: 0.7, confidence: 0.8, mentions: 3 },
          style: { score: 0.9, confidence: 0.9, mentions: 7 },
          fit: { score: 0.8, confidence: 0.8, mentions: 4 },
          accessibility: { score: 0.6, confidence: 0.7, mentions: 2 },
          comfort: { score: 0.9, confidence: 0.9, mentions: 6 }
        },
        keyPhrases: [{ text: 'great quality', score: 0.9, beginOffset: 0, endOffset: 12 }],
        confidence: 0.85,
        processedAt: new Date(),
        languageCode: 'en'
      }]

      const testResult = await this.generateCommentary({
        products: testProducts,
        sentimentData: testSentiment,
        episodeTitle: 'Health Check Test'
      })

      return {
        status: 'healthy',
        message: 'Personality engine is working correctly',
        details: {
          modelId: this.modelId,
          personalityVersion: this.personality.version,
          tokensUsed: testResult.metadata.tokensUsed,
          generationTime: testResult.metadata.generationTime,
          consistencyScore: testResult.metadata.confidenceScore
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          modelId: this.modelId,
          personalityVersion: this.personality.version,
          error
        }
      }
    }
  }
}

// Factory function to create personality engine
export function createPersonalityEngine(
  config: PersonalityEngineConfig, 
  personality?: AlexChenPersonality
): PersonalityEngine {
  return new PersonalityEngine(config, personality)
}

// Check if personality engine is configured
export function isPersonalityEngineConfigured(config: Partial<PersonalityEngineConfig>): config is PersonalityEngineConfig {
  return !!(
    config.region &&
    config.accessKeyId &&
    config.secretAccessKey
  )
}