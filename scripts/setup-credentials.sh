#!/bin/bash

# StyleScope AWS Credentials Setup Helper
# This script helps you configure your AWS credentials for development

echo "🚀 StyleScope - AWS Credentials Setup"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local file"
else
    echo "📋 Found existing .env.local file"
fi

echo ""
echo "🔑 AWS Credentials Configuration"
echo ""
echo "You need to update the following values in .env.local:"
echo ""
echo "1. AWS_ACCESS_KEY_ID=your_actual_access_key"
echo "2. AWS_SECRET_ACCESS_KEY=your_actual_secret_key"
echo ""
echo "For Product Advertising API (optional for initial development):"
echo "3. PAAPI_ACCESS_KEY=your_paapi_access_key"
echo "4. PAAPI_SECRET_KEY=your_paapi_secret_key"
echo "5. PAAPI_PARTNER_TAG=your_partner_tag"
echo ""

# Check if AWS CLI is available
if command -v aws &> /dev/null; then
    echo "🛠  AWS CLI detected. You can also use:"
    echo "   aws configure"
    echo "   to set up your credentials globally."
    echo ""
fi

echo "📖 For detailed setup instructions, see:"
echo "   - AWS_SETUP.md (comprehensive guide)"
echo "   - .env.local.example (configuration template)"
echo ""

echo "🧪 After configuring credentials, test with:"
echo "   npm run test:services"
echo "   or visit: http://localhost:3000/api/health/services"
echo ""

echo "🎯 Ready to proceed once you see all services showing 'success' status!"