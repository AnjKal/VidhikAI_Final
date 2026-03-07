# VidhikAI Technical Stack

## Architecture Overview
- **Infrastructure**: AWS Cloud (Containerized on ECS Fargate)
- **Frontend/Backend Framework**: Next.js 15 (App Router, Server Actions, TypeScript)
- **Deployment**: Docker container on AWS ECS Fargate with Application Load Balancer
- **Region**: us-east-1

## Core Components

### 1. AI Engine (Generative AI)
- **Service**: AWS Bedrock
- **Model**: Amazon Nova Lite (`us.amazon.nova-lite-v1:0`)
- **Integration**: Direct SDK calls via `@aws-sdk/client-bedrock-runtime`
- **API**: Bedrock Converse API for text generation
- **Features**: 
  - Document analysis and summarization
  - Risk assessment and obligation extraction
  - Document comparison
  - Conversational Q&A (RAG implementation)
  - PII detection and masking

### 2. Document Processing
- **PDF Parsing**: `pdfjs-dist` (local processing, no AWS Textract)
- **DOCX Parsing**: `mammoth` library
- **Image Text Extraction**: Amazon Rekognition DetectText API
- **Text Files**: Direct S3 read
- **Supported Formats**: PDF, DOCX, TXT, PNG, JPG, MD, JSON, XML, CSV

### 3. Storage Layer
- **Service**: Amazon S3
- **Bucket**: `vidhiks3`
- **SDK**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **Usage**:
  - Document uploads (with sanitized filenames)
  - Analysis results (JSON blobs)
  - Presigned URLs for secure access
  - Session data persistence

### 4. Database (Metadata & History)
- **Service**: Amazon DynamoDB
- **Table**: `VidhikT1`
- **SDK**: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`
- **Pattern**: Single table design with composite keys
- **Data Stored**:
  - User session metadata
  - Document metadata (filename, upload date, type)
  - Chat history references
  - Analysis session tracking

### 5. Authentication & Identity
- **Service**: Amazon Cognito User Pools
- **Pool ID**: `us-east-1_Znz8hh0GV`
- **Client ID**: `173grj5drqhick3ba7ofeb3m42`
- **Library**: AWS Amplify (`aws-amplify`, `@aws-amplify/auth`)
- **Features**:
  - Email/Password authentication
  - Session management with JWT tokens
  - Secure token verification (`aws-jwt-verify`)

### 6. Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Component Library**: Radix UI (shadcn/ui)
- **State Management**: React hooks (useState, useEffect, useRef)
- **Markdown Rendering**: `react-markdown`
- **Icons**: Lucide React
- **Animations**: Framer Motion

### 7. Deployment Infrastructure
- **Container**: Docker (multi-stage build)
- **Orchestration**: AWS ECS Fargate
- **Load Balancer**: Application Load Balancer (ALB)
- **Networking**: VPC with 2 public subnets across availability zones
- **Security**: Security groups for ALB and ECS tasks
- **Logging**: CloudWatch Logs
- **Image Registry**: Amazon ECR
- **IaC**: CloudFormation templates

## RAG Implementation
The system implements Retrieval-Augmented Generation (RAG) by:
1. Extracting full document text from S3
2. Passing complete document context to Amazon Nova model
3. Grounding all AI responses exclusively in provided document content
4. Preventing hallucinations through strict prompt engineering
5. Maintaining conversation history for contextual follow-ups

## Data Flow Architecture

```
User Browser
    ↓
Next.js Frontend (React)
    ↓
Next.js Server Actions
    ↓
┌─────────────────────────────────────┐
│  AWS Services                       │
│  ├─ Cognito (Auth)                  │
│  ├─ S3 (Document Storage)           │
│  ├─ DynamoDB (Metadata)             │
│  ├─ Bedrock (AI - Nova Lite)        │
│  └─ Rekognition (Image OCR)         │
└─────────────────────────────────────┘
    ↓
Response to Client
```

## Security Features
- End-to-end HTTPS encryption
- JWT token-based authentication
- Presigned S3 URLs with expiration
- PII masking before AI processing
- Security groups restricting network access
- Environment variable-based secrets management

## Performance Optimizations
- Docker multi-stage builds for smaller images
- Next.js standalone output for production
- Server-side rendering (SSR) for initial page loads
- Client-side state management for interactivity
- Efficient S3 presigned URL caching
- DynamoDB single-table design for fast queries

## Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript 5
- **Linting**: ESLint
- **Build Tool**: Next.js built-in (Turbopack)
- **Environment Management**: dotenv