// Bedrock model configuration and helpers

export const AVAILABLE_MODELS = {
  // Claude 3.5 Sonnet (most recent)
  'claude-3-5-sonnet-v2': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'claude-3-5-sonnet': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  
  // Claude 3 Sonnet
  'claude-3-sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
  
  // Claude 3 Haiku (faster, cheaper)
  'claude-3-haiku': 'anthropic.claude-3-haiku-20240307-v1:0',
  
  // Claude 3.5 Haiku
  'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0'
}

export const RECOMMENDED_MODELS = [
  AVAILABLE_MODELS['claude-3-5-sonnet-v2'],
  AVAILABLE_MODELS['claude-3-5-sonnet'],
  AVAILABLE_MODELS['claude-3-sonnet'],
  AVAILABLE_MODELS['claude-3-haiku']
]

export function getModelId(): string {
  return process.env.BEDROCK_MODEL_ID || AVAILABLE_MODELS['claude-3-5-sonnet-v2']
}

export function getModelDisplayName(modelId: string): string {
  const entry = Object.entries(AVAILABLE_MODELS).find(([_, id]) => id === modelId)
  return entry ? entry[0] : modelId
}