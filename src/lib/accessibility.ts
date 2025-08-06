// Accessibility utilities and configuration for StyleScope

export interface AccessibilityPreferences {
  highContrast: boolean
  textSize: 'small' | 'medium' | 'large' | 'extra-large'
  reducedMotion: boolean
  screenReaderOptimized: boolean
}

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  highContrast: false,
  textSize: 'medium',
  reducedMotion: false,
  screenReaderOptimized: false,
}

// WCAG 2.1 AA Color Contrast Ratios
export const colorContrast = {
  normal: {
    minimum: 4.5, // AA standard for normal text
    enhanced: 7.0, // AAA standard for normal text
  },
  large: {
    minimum: 3.0, // AA standard for large text (18pt+ or 14pt+ bold)
    enhanced: 4.5, // AAA standard for large text
  },
}

// Accessibility-focused CSS classes
export const accessibilityClasses = {
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white p-2',
  screenReaderOnly: 'sr-only',
  focusVisible: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  highContrast: {
    background: 'bg-black text-white',
    text: 'text-white',
    link: 'text-yellow-300 hover:text-yellow-100',
    button: 'bg-white text-black border-2 border-white hover:bg-gray-200',
  },
  textSizes: {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
  },
}

// Screen reader announcements
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management utilities
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey)
  firstElement?.focus()
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// Keyboard navigation helpers
export const keyboardShortcuts = {
  skipToMain: 'Alt+M',
  skipToNavigation: 'Alt+N',
  toggleHighContrast: 'Alt+H',
  increaseTextSize: 'Alt+Plus',
  decreaseTextSize: 'Alt+Minus',
}

// ARIA label generators for dynamic content
export function generateAriaLabel(type: 'episode' | 'product' | 'sentiment', data: Record<string, unknown>): string {
  switch (type) {
    case 'episode':
      return `Fashion commentary episode from ${data.date}, titled ${data.title}`
    case 'product':
      return `${data.title}, priced at ${data.price}, rated ${data.rating} out of 5 stars`
    case 'sentiment':
      return `Customer sentiment: ${data.overall}% positive, based on ${data.reviewCount} reviews`
    default:
      return ''
  }
}