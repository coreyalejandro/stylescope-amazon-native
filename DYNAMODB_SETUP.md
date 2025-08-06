# DynamoDB Setup for StyleScope

## Current Status
❌ **DynamoDB tables not created yet**
❌ **IAM permissions need to be configured**

## Quick Setup Options

### Option 1: AWS Console (Recommended for Hackathon)

1. **Go to DynamoDB Console**: https://console.aws.amazon.com/dynamodb/
2. **Create Table 1**: 
   - Table name: `stylescope-episodes`
   - Partition key: `id` (String)
   - Use default settings
   - Click "Create table"

3. **Create Table 2**:
   - Table name: `stylescope-sentiment-cache` 
   - Partition key: `productId` (String)
   - Use default settings
   - Click "Create table"

### Option 2: AWS CLI Commands

If you have AWS CLI configured:

```bash
# Create episodes table
aws dynamodb create-table \
    --table-name stylescope-episodes \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Create sentiment cache table  
aws dynamodb create-table \
    --table-name stylescope-sentiment-cache \
    --attribute-definitions AttributeName=productId,AttributeType=S \
    --key-schema AttributeName=productId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Option 3: Fix IAM Permissions

Add this policy to your `style-dev` IAM user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:ListTables", 
                "dynamodb:DescribeTable",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/stylescope-*"
            ]
        }
    ]
}
```

## Alternative: Skip DynamoDB for Now

Since you have a working mock product service, you can continue development without DynamoDB and add it later:

1. **Continue with Task 2**: Build data models and interfaces
2. **Use in-memory storage**: For hackathon demo reliability  
3. **Add DynamoDB later**: Once permissions are sorted

## Verification

After creating tables, test with:
```bash
npm run test:services
```

You should see DynamoDB show "success" instead of "error".

## Why DynamoDB is Needed

DynamoDB will store:
- **Commentary Episodes**: Alex Chen's generated fashion commentary
- **Sentiment Cache**: Processed review sentiment to avoid re-analysis
- **Metadata**: Episode timestamps, processing stats, etc.

For the hackathon demo, this provides:
- **Fast Loading**: Cached commentary loads instantly
- **Reliability**: No real-time processing delays during demo
- **Scalability**: Production-ready storage architecture