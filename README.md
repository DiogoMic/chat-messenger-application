# Chat Messenger Application - AWS Deployment Guide

A modern, real-time chat messenger application built with React and deployed on AWS with WebSocket support, object storage, and persistent chat history.

## Architecture Overview
![architecture-diagram drawio](https://github.com/user-attachments/assets/28653a9f-93be-4380-afbf-a7bc87f6fa74)


### AWS Services Used:
- **Frontend**: CloudFront + S3 (Static hosting)
- **Backend API**: API Gateway + Lambda functions
- **WebSocket**: API Gateway WebSocket API + Lambda
- **Database**: DynamoDB (Chat history, user data, connections)
- **Media Storage**: S3 + CloudFront CDN
- **Authentication**: AWS Cognito (optional)

### Key Features:
- Real-time messaging via WebSocket
- Persistent chat history in DynamoDB
- Media file uploads to S3
- Scalable serverless architecture
- CDN-delivered static assets

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Node.js** (v18 or later)
3. **AWS Account** with permissions for:
   - CloudFormation
   - Lambda
   - API Gateway
   - DynamoDB
   - S3
   - CloudFront
   - IAM

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and preferred region
```

### 3. Deploy Infrastructure
```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to staging environment
npm run deploy:staging

# Deploy to production environment
npm run deploy:prod
```

### 4. Manual Configuration (First Time Only)

#### Set up DynamoDB Tables:
The CloudFormation template creates the tables automatically, but you may want to verify:

- **ChatMessages**: Stores all chat messages
- **ChatRooms**: Stores chat room metadata
- **WebSocketConnections**: Tracks active WebSocket connections

#### Configure S3 Buckets:
- **Frontend Bucket**: Hosts the React application
- **Media Bucket**: Stores uploaded files (images, documents, etc.)

### 5. Environment Variables

The deployment script automatically creates environment variables:

```env
REACT_APP_WEBSOCKET_URL=wss://your-websocket-api.execute-api.region.amazonaws.com/dev
REACT_APP_API_URL=https://your-rest-api.execute-api.region.amazonaws.com/dev
REACT_APP_MEDIA_BUCKET=your-media-bucket-name
REACT_APP_ENVIRONMENT=dev
```

## API Endpoints

### REST API Endpoints:
- `GET /chats?userId={userId}` - Get user's chats
- `GET /chats/{chatId}/messages` - Get chat messages
- `POST /chats` - Create new chat
- `POST /upload-url` - Get signed URL for file upload

### WebSocket Routes:
- `$connect` - Handle new connections
- `$disconnect` - Handle disconnections
- `sendMessage` - Send message to chat
- `joinChat` - Join a specific chat room

## Database Schema

### ChatMessages Table
```json
{
  "chatId": "string",      // Partition key
  "timestamp": "number",   // Sort key
  "messageId": "string",
  "userId": "string",
  "message": "string",
  "createdAt": "string",
  "delivered": "boolean",
  "read": "boolean"
}
```

### ChatRooms Table
```json
{
  "chatId": "string",      // Partition key
  "participants": ["string"],
  "chatName": "string",
  "chatType": "direct|group",
  "createdAt": "string",
  "lastActivity": "string"
}
```

### WebSocketConnections Table
```json
{
  "connectionId": "string", // Partition key
  "userId": "string",
  "chatId": "string",
  "connectedAt": "number",
  "ttl": "number"          // Auto-expire connections
}
```

## Cost Optimization

### DynamoDB:
- Uses PAY_PER_REQUEST billing mode
- TTL enabled for WebSocket connections
- Global Secondary Indexes for efficient queries

### Lambda:
- Functions are optimized for cold start performance
- Memory allocation tuned for workload

### S3:
- CloudFront CDN reduces S3 requests
- Lifecycle policies for media cleanup (optional)

### API Gateway:
- WebSocket API for real-time features
- REST API for standard operations

## Monitoring and Logging

### CloudWatch Logs:
- Lambda function logs
- API Gateway access logs
- WebSocket connection logs

### CloudWatch Metrics:
- Lambda invocations and duration
- DynamoDB read/write capacity
- API Gateway request count
- WebSocket connection count

## Security Considerations

### IAM Roles:
- Least privilege access for Lambda functions
- Separate roles for different services

### API Security:
- CORS configured for frontend domain
- Input validation in Lambda functions
- Signed URLs for S3 uploads

### Data Protection:
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS, WSS)

## Scaling Considerations

### Auto-scaling:
- Lambda functions scale automatically
- DynamoDB auto-scaling enabled
- CloudFront global distribution

### Performance:
- DynamoDB Global Secondary Indexes
- S3 Transfer Acceleration (optional)
- CloudFront edge caching

## Troubleshooting

### Common Issues:

1. **WebSocket Connection Fails**:
   - Check API Gateway WebSocket API configuration
   - Verify Lambda function permissions
   - Check CloudWatch logs for errors

2. **Messages Not Persisting**:
   - Verify DynamoDB table permissions
   - Check Lambda function environment variables
   - Review DynamoDB table configuration

3. **File Upload Issues**:
   - Check S3 bucket permissions
   - Verify CORS configuration
   - Check signed URL expiration

### Debugging:
```bash
# View CloudFormation stack events
aws cloudformation describe-stack-events --stack-name chat-messenger-dev

# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/chat

# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB --metric-name ConsumedReadCapacityUnits
```

## Development Workflow

### Local Development:
```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing:
- Unit tests for React components
- Integration tests for API endpoints
- Load testing for WebSocket connections

## Cleanup

To remove all AWS resources:
```bash
aws cloudformation delete-stack --stack-name chat-messenger-dev
```

## Support

For issues and questions:
1. Check CloudWatch logs
2. Review AWS service quotas
3. Verify IAM permissions
4. Check network connectivity

## License

This project is licensed under the MIT License.
