// Mock Amazon Product Data Service for StyleScope
// Simulates realistic Amazon fashion product responses for hackathon demo

import { Product, Review } from '@/types'

// Realistic fashion product data based on actual Amazon listings
export const mockFashionProducts: Product[] = [
  {
    asin: 'B08N5WRWNW',
    title: 'Levi\'s Women\'s 501 Original Fit Jeans',
    price: {
      current: 59.50,
      original: 69.50,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/41234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/51234567890.jpg'
      ]
    },
    category: 'Women\'s Jeans',
    rating: 4.3,
    reviewCount: 12847,
    availability: 'in_stock',
    features: [
      '100% Cotton',
      'Button closure',
      'Machine Wash',
      'Classic 5-pocket styling',
      'Sits at waist'
    ]
  },
  {
    asin: 'B07XJBQZPX',
    title: 'Amazon Essentials Women\'s Lightweight Long-Sleeve Water-Resistant Puffer Jacket',
    price: {
      current: 45.90,
      original: 55.90,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/81234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/61234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg'
      ]
    },
    category: 'Women\'s Outerwear',
    rating: 4.1,
    reviewCount: 8934,
    availability: 'in_stock',
    features: [
      'Water-resistant',
      'Lightweight fill',
      'Full zip closure',
      'Side pockets',
      'Machine washable'
    ]
  },
  {
    asin: 'B09MTXYZ12',
    title: 'Nike Women\'s Air Force 1 \'07 Sneaker',
    price: {
      current: 90.00,
      original: 90.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/91234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/81234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg'
      ]
    },
    category: 'Women\'s Sneakers',
    rating: 4.5,
    reviewCount: 15623,
    availability: 'in_stock',
    features: [
      'Leather upper',
      'Rubber sole',
      'Low-top design',
      'Perforated toe box',
      'Classic basketball style'
    ]
  },
  {
    asin: 'B08HJKLMNO',
    title: 'Hanes Women\'s Relaxed Fit ComfortSoft EcoSmart Crewneck Sweatshirt',
    price: {
      current: 12.48,
      original: 18.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/61234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/51234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/41234567890.jpg'
      ]
    },
    category: 'Women\'s Sweatshirts',
    rating: 4.2,
    reviewCount: 6789,
    availability: 'in_stock',
    features: [
      '50% Cotton, 50% Polyester',
      'EcoSmart fleece',
      'Relaxed fit',
      'Ribbed cuffs and hem',
      'Machine washable'
    ]
  },
  {
    asin: 'B07QRSTUVW',
    title: 'Calvin Klein Women\'s Invisibles Hipster Underwear Multipack',
    price: {
      current: 24.95,
      original: 32.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/61234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/51234567890.jpg'
      ]
    },
    category: 'Women\'s Underwear',
    rating: 4.0,
    reviewCount: 4521,
    availability: 'in_stock',
    features: [
      'Seamless construction',
      'Laser-cut edges',
      'No-show under clothing',
      '3-pack',
      'Machine washable'
    ]
  },
  {
    asin: 'B09ABCDEFG',
    title: 'Adidas Women\'s Essentials 3-Stripes Tricot Track Jacket',
    price: {
      current: 65.00,
      original: 65.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/81234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/61234567890.jpg'
      ]
    },
    category: 'Women\'s Athletic Wear',
    rating: 4.4,
    reviewCount: 9876,
    availability: 'in_stock',
    features: [
      '100% Recycled polyester tricot',
      'Full zip',
      'Ribbed cuffs and hem',
      '3-Stripes on sleeves',
      'Regular fit'
    ]
  },
  {
    asin: 'B08ZYXWVUT',
    title: 'Lululemon Align High-Rise Pant 28"',
    price: {
      current: 128.00,
      original: 128.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/91234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/81234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg'
      ]
    },
    category: 'Women\'s Activewear',
    rating: 4.6,
    reviewCount: 11234,
    availability: 'limited',
    features: [
      'Nulu fabric',
      'High-rise design',
      '28" inseam',
      'Four-way stretch',
      'Sweat-wicking'
    ]
  },
  {
    asin: 'B07MNOPQRS',
    title: 'UGG Women\'s Scuffette II Slipper',
    price: {
      current: 90.00,
      original: 100.00,
      currency: 'USD'
    },
    images: {
      primary: 'https://images-na.ssl-images-amazon.com/images/I/71234567890.jpg',
      thumbnails: [
        'https://images-na.ssl-images-amazon.com/images/I/61234567890.jpg',
        'https://images-na.ssl-images-amazon.com/images/I/51234567890.jpg'
      ]
    },
    category: 'Women\'s Slippers',
    rating: 4.3,
    reviewCount: 7654,
    availability: 'in_stock',
    features: [
      'Suede upper',
      'UGGpure wool lining',
      'Molded rubber outsole',
      'Slip-on style',
      'Woven heel label'
    ]
  }
]

// Realistic customer reviews for sentiment analysis
export const mockProductReviews: Record<string, Review[]> = {
  'B08N5WRWNW': [ // Levi's Jeans
    {
      id: 'R1234567890',
      productId: 'B08N5WRWNW',
      rating: 5,
      title: 'Perfect fit and classic style!',
      content: 'These jeans are exactly what I was looking for. The fit is true to size and the quality is outstanding. I love the classic 501 style - it never goes out of fashion. The denim feels substantial but not too heavy. Highly recommend!',
      author: {
        name: 'Sarah M.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-15'),
      verified: true
    },
    {
      id: 'R1234567891',
      productId: 'B08N5WRWNW',
      rating: 4,
      title: 'Good quality but runs small',
      content: 'The quality of these jeans is great and they look exactly like the photos. However, they definitely run small. I usually wear a size 8 but had to exchange for a 10. Once I got the right size, they fit perfectly. The color is beautiful and they seem very durable.',
      author: {
        name: 'Jennifer K.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-10'),
      verified: true
    },
    {
      id: 'R1234567892',
      productId: 'B08N5WRWNW',
      rating: 3,
      title: 'Decent jeans but not for curvy figures',
      content: 'These are well-made jeans with good quality denim. However, the fit is quite straight and doesn\'t work well for curvy body types. The waist gaps in the back and the legs are too loose. If you have a straighter figure, these would probably work great.',
      author: {
        name: 'Maria L.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-08'),
      verified: true
    }
  ],
  'B07XJBQZPX': [ // Amazon Essentials Jacket
    {
      id: 'R2234567890',
      productId: 'B07XJBQZPX',
      rating: 4,
      title: 'Great value for the price',
      content: 'This jacket is perfect for mild weather. It\'s lightweight but still keeps me warm during my morning walks. The water-resistant feature works well in light rain. For the price, you really can\'t beat it. The fit is true to size.',
      author: {
        name: 'Amanda R.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-12'),
      verified: true
    },
    {
      id: 'R2234567891',
      productId: 'B07XJBQZPX',
      rating: 5,
      title: 'Exceeded expectations!',
      content: 'I was skeptical about buying a jacket online, especially from Amazon Essentials, but this completely exceeded my expectations. The quality is excellent, the fit is flattering, and it\'s so versatile. I\'ve worn it with jeans, dresses, and workout clothes.',
      author: {
        name: 'Lisa T.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-09'),
      verified: true
    }
  ],
  'B09MTXYZ12': [ // Nike Air Force 1
    {
      id: 'R3234567890',
      productId: 'B09MTXYZ12',
      rating: 5,
      title: 'Classic sneaker that never goes out of style',
      content: 'These are the perfect white sneakers. They go with everything and are incredibly comfortable. The quality is exactly what you\'d expect from Nike. I\'ve had mine for 6 months and they still look great with regular cleaning.',
      author: {
        name: 'Taylor S.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-14'),
      verified: true
    },
    {
      id: 'R3234567891',
      productId: 'B09MTXYZ12',
      rating: 4,
      title: 'Comfortable but show dirt easily',
      content: 'Love these sneakers! They\'re super comfortable and the classic design is timeless. My only complaint is that they show dirt and scuffs easily, so you need to clean them regularly to keep them looking fresh. Still worth it though.',
      author: {
        name: 'Alex P.',
        isVerifiedPurchaser: true
      },
      date: new Date('2024-01-11'),
      verified: true
    }
  ]
}

// Mock service class that simulates Amazon Product Advertising API
export class MockProductService {
  private products: Product[] = mockFashionProducts
  private reviews: Record<string, Review[]> = mockProductReviews

  async fetchBestsellingItems(category: string = 'fashion', limit: number = 10): Promise<Product[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Filter by category if specified
    let filteredProducts = this.products
    if (category !== 'fashion') {
      filteredProducts = this.products.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    }
    
    // Sort by rating and review count (simulate bestsellers)
    const bestsellers = filteredProducts
      .sort((a, b) => (b.rating * Math.log(b.reviewCount)) - (a.rating * Math.log(a.reviewCount)))
      .slice(0, limit)
    
    return bestsellers
  }

  async getProductReviews(productId: string, limit: number = 10): Promise<Review[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const reviews = this.reviews[productId] || []
    return reviews.slice(0, limit)
  }

  async getProductPricing(productId: string): Promise<{ current: number; original?: number; currency: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const product = this.products.find(p => p.asin === productId)
    if (!product) {
      throw new Error(`Product ${productId} not found`)
    }
    
    return product.price
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const searchResults = this.products.filter(product =>
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.features.some(feature => 
        feature.toLowerCase().includes(query.toLowerCase())
      )
    ).slice(0, limit)
    
    return searchResults
  }

  // Helper method to get trending categories
  async getTrendingCategories(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const categories = [...new Set(this.products.map(p => p.category))]
    return categories.sort()
  }

  // Helper method to get price ranges for analysis
  async getPriceAnalysis(): Promise<{ min: number; max: number; average: number }> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const prices = this.products.map(p => p.price.current)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    }
  }
}

// Export singleton instance
export const mockProductService = new MockProductService()

// Helper function to generate realistic review text for sentiment analysis
export function generateAdditionalReviews(productId: string, count: number = 5): Review[] {
  const reviewTemplates = [
    {
      rating: 5,
      title: 'Love this product!',
      content: 'Exactly what I was looking for. Great quality and fast shipping. Would definitely buy again!'
    },
    {
      rating: 4,
      title: 'Good value for money',
      content: 'Pretty happy with this purchase. Good quality for the price, though there are a few minor issues.'
    },
    {
      rating: 3,
      title: 'It\'s okay',
      content: 'The product is decent but not amazing. It does what it\'s supposed to do but nothing special.'
    },
    {
      rating: 2,
      title: 'Not what I expected',
      content: 'The quality isn\'t great and it doesn\'t match the description. Probably won\'t buy again.'
    },
    {
      rating: 1,
      title: 'Disappointed',
      content: 'Poor quality and doesn\'t work as advertised. Would not recommend this product.'
    }
  ]

  const authors = ['John D.', 'Emily R.', 'Michael S.', 'Jessica W.', 'David L.', 'Rachel M.', 'Chris P.', 'Anna K.']
  
  return Array.from({ length: count }, (_, index) => {
    const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)]
    return {
      id: `R${productId}_${Date.now()}_${index}`,
      productId,
      rating: template.rating,
      title: template.title,
      content: template.content,
      author: {
        name: authors[Math.floor(Math.random() * authors.length)],
        isVerifiedPurchaser: Math.random() > 0.2 // 80% verified purchases
      },
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      verified: Math.random() > 0.2 // 80% verified purchases
    }
  })
}