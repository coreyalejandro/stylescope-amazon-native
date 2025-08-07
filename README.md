# StyleScope - AI Fashion Commentary

AI-powered fashion commentary with Alex Chen - Amazon native implementation featuring adaptive fashion analysis and accessibility-first design.

## 🎯 Project Overview

Built for the **Code with Kiro Hackathon**, StyleScope demonstrates comprehensive integration with Amazon's service ecosystem while promoting authentic disability representation in fashion media.

## 🛠 Amazon Services Integration

- **Amazon Product Advertising API**: Real fashion product data and customer reviews
- **Amazon Bedrock**: AI-powered trend analysis and commentary generation  
- **Amazon Comprehend**: Sentiment analysis of customer reviews
- **Amazon S3**: Content storage and caching
- **Amazon DynamoDB**: Metadata and episode storage
- **Amazon CloudFront**: CDN for performance optimization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS Account with appropriate service access
- Amazon Product Advertising API credentials

### Installation

1. Clone the repository
```bash
git clone https://github.com/coreyalejandro/stylescope-amazon-native.git
cd stylescope-amazon-native
```

2. Install dependencies
```bash
npm install
```

3. Set up AWS credentials
```bash
# Run the setup helper
./scripts/setup-credentials.sh

# Or manually copy the template
cp .env.local.example .env.local
```

4. Configure your AWS credentials in `.env.local`:
```env
# Replace with your actual AWS credentials
AWS_ACCESS_KEY_ID=AKIA...your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key

# Product Advertising API (optional for initial development)
PAAPI_ACCESS_KEY=your_paapi_access_key
PAAPI_SECRET_KEY=your_paapi_secret_key
PAAPI_PARTNER_TAG=your_partner_tag
```

5. Test your AWS setup
```bash
npm run test:services
```

6. Run the development server
```bash
npm run dev
```

7. **🎭 Live Demo Pages**
- **Personality Engine Demo**: `http://localhost:3000/personality-demo`
- **Real-time Testing**: `http://localhost:3000/real-time`
- **Live Test Interface**: `http://localhost:3000/live-test`
- **Service Health**: `http://localhost:3000/api/health/services`

**📖 For detailed AWS setup instructions, see [AWS_SETUP.md](./AWS_SETUP.md)**

## ♿ Accessibility Features

StyleScope is built with accessibility as a core principle:

- **WCAG 2.1 AA Compliance**: Full accessibility standard compliance
- **Screen Reader Support**: Optimized for NVDA, JAWS, and VoiceOver
- **Keyboard Navigation**: Complete application navigation without mouse
- **High Contrast Mode**: Visual accessibility for users with vision differences
- **Text Scaling**: Adjustable text sizes for reading comfort
- **Neurodivergent-Friendly Design**: Reduced cognitive load and clear information hierarchy

## 🎨 Alex Chen - The AI Avatar

Alex Chen represents authentic disability representation in fashion media:

- **Neurodivergent Perspective**: Unique insights on fashion accessibility
- **Disability Advocacy**: Promotes inclusive fashion choices
- **Consistent Personality**: AI-powered character with authentic voice
- **Fashion Expertise**: Knowledgeable commentary on trends and accessibility

## 🏗 Architecture

StyleScope follows a modern, scalable architecture:

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with AWS SDK integration
- **AI Processing**: Amazon Bedrock for commentary generation
- **Data Analysis**: Amazon Comprehend for sentiment analysis
- **Storage**: Amazon S3 for content caching
- **Database**: Amazon DynamoDB for metadata storage

## 📁 Project Structure

```
stylescope/
├── .kiro/                    # Hackathon submission structure
│   ├── README.md            # Project documentation
│   └── settings/            # Project configuration
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── services/            # Amazon service integrations
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── README.md               # This file
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run accessibility tests
npm run test:a11y

# Run integration tests
npm run test:integration
```

## 🚀 Deployment

StyleScope is designed to deploy on Amazon's infrastructure:

- **Amazon ECS**: Container-based deployment
- **AWS Lambda**: Serverless API functions
- **Amazon CloudFront**: Global CDN distribution
- **Amazon Route 53**: DNS management

## 🤝 Contributing

This project is built for the Code with Kiro Hackathon. Contributions should focus on:

1. Amazon service integration improvements
2. Accessibility enhancements
3. Alex Chen personality development
4. Performance optimizations

## 📄 License

This project is created for the Code with Kiro Hackathon and demonstrates Amazon service integration capabilities.

## 🏆 Hackathon Goals

StyleScope aims to win the hackathon by demonstrating:

1. **Comprehensive Amazon Integration**: Using multiple services seamlessly
2. **Social Impact**: Authentic disability representation in tech
3. **Technical Innovation**: AI-powered fashion commentary
4. **Accessibility Excellence**: WCAG 2.1 AA compliance throughout
5. **Scalable Architecture**: Production-ready design patterns

---

Built with ❤️ for the Code with Kiro Hackathon
