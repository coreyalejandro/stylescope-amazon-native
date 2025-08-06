# AWS Setup Guide for StyleScope

This guide will help you configure all the Amazon services needed for StyleScope.

## 🔑 Required AWS Services

StyleScope integrates with these Amazon services:
- **Amazon S3**: Content storage and caching
- **Amazon DynamoDB**: Metadata and episode storage  
- **Amazon Comprehend**: Sentiment analysis
- **Amazon Bedrock**: AI-powered commentary generation
- **Amazon Product Advertising API**: Fashion product data

## 📋 Prerequisites

1. **AWS Account**: You need an active AWS account
2. **IAM User**: Create an IAM user with programmatic access
3. **Product Advertising API**: Separate registration required

## 🛠 Step 1: Create IAM User and Policies

### Create IAM User
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Username: `stylescope-dev`
4. Select "Programmatic access"
5. Click "Next"

### Attach Policies
Create and attach these policies to your user:

#### S3 Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::stylescope-*",
                "arn:aws:s3:::stylescope-*/*"
            ]
        }
    ]
}
```

#### DynamoDB Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:ListTables"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/stylescope-*"
            ]
        }
    ]
}
```

#### Comprehend Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "comprehend:DetectSentiment",
                "comprehend:DetectKeyPhrases",
                "comprehend:DetectEntities"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Bedrock Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:ListFoundationModels"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🔧 Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your credentials:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Amazon Product Advertising API (separate registration required)
PAAPI_ACCESS_KEY=your_paapi_access_key
PAAPI_SECRET_KEY=your_paapi_secret_key
PAAPI_PARTNER_TAG=your_partner_tag

# Other services use the main AWS credentials above
```

## 📦 Step 3: Create Required AWS Resources

### S3 Bucket
```bash
aws s3 mb s3://stylescope-commentary-cache --region us-east-1
```

### DynamoDB Tables
```bash
# Episodes table
aws dynamodb create-table \
    --table-name stylescope-episodes \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Sentiment cache table
aws dynamodb create-table \
    --table-name stylescope-sentiment-cache \
    --attribute-definitions AttributeName=productId,AttributeType=S \
    --key-schema AttributeName=productId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

## 🛍 Step 4: Product Advertising API Setup

The Product Advertising API requires separate registration:

1. **Register**: Go to https://webservices.amazon.com/paapi5/documentation/
2. **Apply**: Submit application for API access
3. **Wait**: Approval can take several days
4. **Get Credentials**: Once approved, get your access keys

**Note**: For hackathon development, you can proceed without PAAPI initially. The app will use mock data until credentials are available.

## 🧪 Step 5: Test Your Setup

Run the service connectivity test:

```bash
npm run test:services
```

Or test via the web interface:
```bash
npm run dev
# Visit: http://localhost:3000/api/health/services
```

## 🔍 Troubleshooting

### Common Issues

**"Access Denied" Errors**
- Check IAM policies are attached correctly
- Verify AWS credentials are correct
- Ensure regions match in configuration

**"Table Not Found" Errors**
- Create DynamoDB tables as shown above
- Check table names match environment variables

**"Model Not Found" (Bedrock)**
- Ensure you have access to Claude models in your region
- Some models require additional access requests

**PAAPI Errors**
- PAAPI requires separate approval process
- Can take several days to get approved
- Use mock data during development if needed

## 🎯 Verification Checklist

- [ ] AWS IAM user created with programmatic access
- [ ] All required policies attached to user
- [ ] Environment variables configured in `.env.local`
- [ ] S3 bucket created
- [ ] DynamoDB tables created
- [ ] Service connectivity test passes
- [ ] Health check endpoint returns success

## 🚀 Ready for Development

Once all services show "success" in the connectivity test, you're ready to proceed with StyleScope development!

The health check endpoint at `/api/health/services` will show the status of all services and help you identify any remaining configuration issues.