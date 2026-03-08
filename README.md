# Vidhik AI: Demystifying Legal Documents for Everyone

## 1. Vision, Social Impact & Feasibility

### The Problem Our Solution Addresses

In India, millions of people from students renting their first apartment to small business owners signing service agreements enter into legally binding contracts without fully understanding the terms. This lack of comprehension stems from two significant barriers:

1.  **Complex Legal Jargon:** Legal documents are filled with technical language that is impenetrable to the average person.
2.  **The Language Divide:** A vast number of contracts are written exclusively in English, a language not accessible to a large portion of the Indian population, which is multilingual and diverse.

This information gap puts individuals at a severe disadvantage, exposing them to financial risks, unfair obligations, and potential exploitation. The cost of hiring a lawyer to review routine documents is prohibitive for the vast majority, creating a critical need for accessible, first-line legal support.

### Our Vision & Positive Impact

**Vidhik AI** is an intelligent legal assistant designed to empower the common person by making legal documents simple, accessible, and understandable.

Our vision is to **create a future where no one is disadvantaged by a contract they couldn't comprehend.** By using the power of Generative AI, Vidhik AI acts as a private, secure, and insightful legal companion. It translates dense legal text into plain, simple English, proactively flags potential risks, and answers specific questions in a conversational manner.

This vision directly aligns with the focus area of **empowering people with access to information and opportunity**. Vidhik AI achieves this by:

*   **Promoting Financial & Legal Literacy:** By demystifying contracts, we help people understand their financial commitments (like rent, loans, and service fees) and legal rights.
*   **Reducing Financial Risk:** By flagging potentially harmful clauses and unclear deadlines, it helps users avoid costly mistakes and unfair agreements before they are signed.
*   **Bridging the Language Divide:** Our AI is designed to understand documents in major Indian regional languages. A user can upload a document in their native tongue and receive a clear, structured analysis in simple English, breaking down a significant barrier to comprehension.
*   **Democratizing Legal Understanding:** We provide a free, accessible tool that offers the kind of initial document analysis typically reserved for those who can afford legal counsel. This empowers students, gig-economy workers, renters, and small business owners to make informed decisions with confidence.

### Feasibility and Scalability

The project is highly feasible and built for scale:

*   **Feasibility:** The technical foundation is solid and uses modern, production-ready technologies. By using **Amazon Bedrock** to orchestrate calls to **Amazon Nova Lite**, we can achieve a high degree of accuracy in contextual understanding and analysis right from the start.
*   **Scalability:** The stack is built for scale. **Next.js** provides a performant frontend running on **AWS ECS Fargate**, and **Amazon Cognito**, **Amazon S3**, and **DynamoDB** automatically scale to handle a massive number of users without manual intervention. The application is deployed on **AWS ECS Fargate** behind an Application Load Balancer.

## 2. Opportunity and Unique Value Proposition

### How is Vidhik AI different from existing solutions?

While other document analysis tools exist, Vidhik AI is uniquely positioned for the Indian context:

*   **Hyper-Localized & Multilingual:** Our primary differentiator is the deep integration of multilingual capabilities. Users can upload a document in a regional Indian language and receive analysis in simple English, breaking down barriers that generic tools cannot.
*   **Privacy-First with OCR:** Recognizing that many older documents exist only as physical copies, Vidhik AI includes OCR to extract text from scanned images. Crucially, it also automatically detects and masks Personally Identifiable Information (PII) for user privacy.
*   **Action-Oriented & Interactive:** We go beyond simple summarization. The "Jargon Buster," categorized "Risk Analysis," and the ability to export deadlines to a calendar provide actionable insights. The conversational Q&A turns a static report into a personalized legal consultation.
*   **Full Session Management:** The platform provides a complete user experience with secure authentication, persistent session history, and a document gallery for easy access to past work.

### USP (Unique Selling Proposition)

**Vidhik AI is the first privacy-centric legal assistant designed for India's linguistic diversity, transforming complex legal documents in any major regional language or even scanned images into simple, actionable insights that anyone can understand and act upon with confidence.**

## 3. Project Functionalities & Features

### Brief About the Prototype
The prototype is a fully functional web application that allows users to sign up, log in, and access the core features of Vidhik AI. When a user uploads a document, the system processes it and transforms the interface into a multi-tab view displaying the **Summary, Risk Analysis, Jargon Buster, and Original Document**. This dashboard also enables users to **chat with their document**, asking specific questions to get instant, context-aware answers.

### 1. AI Document Helper
*   **Flexible Document Input:** Supports uploading text-based files (`.txt`, `.pdf`, `.docx`), direct text pasting, and image uploads (`.png`, `.jpg`) for scanned documents.
*   **OCR & PII Masking:** For image-based uploads, automatically extracts text and masks sensitive personal information to protect user privacy.
*   **Multilingual Analysis:** Accepts documents in English and major Indian regional languages, with all output provided in clear English.
*   **Multi-Tab Analysis Report:**
    *   **Feature Summary:** A high-level overview in markdown.
    *   **Risk Analysis:** Identifies and categorizes risks (High, Medium, Low). Users can manually adjust the risk level for any clause.
    *   **Jargon Buster:** A glossary of complex legal terms with simple definitions.
    *   **Obligations & Deadlines:** Extracts key dates and allows for calendar export (`.ics` file).
    *   **Original Document:** A viewer for the original file.
*   **Conversational Q&A (RAG Implementation):**
    *   An interactive chat interface is available after the initial analysis.
    *   This feature uses **Retrieval-Augmented Generation (RAG)**. When a user asks a question, the full text of their document is passed to **Amazon Nova Lite via Amazon Bedrock** as the primary context.
    *   This forces the AI to generate answers *exclusively* from the provided document, preventing it from inventing information or using external knowledge. This ensures that the answers are highly relevant and grounded in the user's specific legal text.
*   **Download Original:** Allows users to download the original document they uploaded.

### 2. Compare Documents
*   **Side-by-Side Upload:** An interface to upload two document versions for comparison.
*   **Detailed Difference Report:** Generates a report of **New Clauses**, **Changed Terms**, and **Deleted Clauses**, explaining the practical impact of each modification.

### 3. User & Session Management
*   **Secure Authentication:** Users can sign up and log in with email and password via **Amazon Cognito**.
*   **Session History:** Automatically saves all analysis and comparison sessions to the user's private account in **DynamoDB**. Users can view and reload past sessions from the history panel.
*   **My Documents:** A gallery of all unique documents a user has ever uploaded, allowing for quick access to start new analysis sessions.

### 4. Information & FAQ
*   A dedicated, accessible page explaining all features, answering common questions, and detailing the "how-to" of the application to ensure users can get the most out of the platform.

## 4. Technical Implementation & Architecture

### Technologies Used
*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** Tailwind CSS, ShadCN UI
*   **AI Backend:** Amazon Bedrock (AWS SDK)
*   **AI Model:** Amazon Nova Lite via Amazon Bedrock
*   **Document Storage:** Amazon S3
*   **Database:** Amazon DynamoDB (for storing user session history and metadata)
*   **Authentication:** Amazon Cognito (Email/Password via AWS Amplify)
*   **Deployment:** AWS ECS Fargate (containerized, behind an Application Load Balancer)
*   **Container Registry:** Amazon ECR
*   **Observability:** Amazon CloudWatch Logs

### Tech Stack Diagram

```mermaid
flowchart TB

%% USER LAYER
A[User Browser]
A --> B[Next.js Frontend<br>React + TypeScript]
B --> C[Next.js Server Actions API]

%% AUTHENTICATION
C --> D[AWS Cognito<br>User Authentication<br>JWT Tokens]

%% DOCUMENT PROCESSING
C --> E[Document Processing Layer]

E --> F1[pdfjs-dist<br>PDF Parser]
E --> F2[mammoth<br>DOCX Parser]
E --> F3[Amazon Rekognition<br>OCR for Images]

%% PRIVACY LAYER
E --> G[PII Detection & Masking Engine]

%% AI ENGINE
G --> H[Amazon Bedrock]
H --> I[Amazon Nova Lite Model]

%% AI TASKS
I --> J1[Document Summary]
I --> J2[Risk Detection]
I --> J3[Obligation Extraction]
I --> J4[Legal Term Glossary]
I --> J5[Conversational Q&A]

%% STORAGE LAYER
C --> K[Amazon S3<br>Document Storage]
C --> L[DynamoDB<br>Metadata + Chat History]

%% DEPLOYMENT INFRASTRUCTURE
subgraph AWS Cloud
M[Docker Container]
N[ECS Fargate]
O[Application Load Balancer]
P[CloudWatch Logs]
Q[Amazon ECR]
end

O --> N
N --> M
Q --> N
N --> P

%% RESPONSE FLOW
J1 --> R[Analysis Results]
J2 --> R
J3 --> R
J4 --> R
J5 --> R

R --> B
B --> A
```

### RAG Implementation Details
The core of Vidhik AI's intelligence relies on a direct and effective implementation of Retrieval-Augmented Generation (RAG).

1.  **Contextual Grounding**: For every AI task (demystification, comparison, Q&A), the *entire text content* of the user's document(s) is passed directly to **Amazon Nova Lite via Amazon Bedrock** as part of the prompt. This serves as the "retrieval" source.
2.  **Document-as-Context**: For the conversational Q&A feature, the `ask` flow passes the full document text alongside the user's question as the primary context window for the model, instructing it to treat the document as the single source of truth.
3.  **In-Prompt Instructions**: The prompts are engineered with critical instructions for the AI to base its answers *exclusively* on the provided document context, ensuring factual accuracy and preventing hallucinations.

This approach simplifies the architecture while ensuring that every piece of analysis is directly traceable to the source document, providing a reliable and trustworthy user experience.

### Architecture & Process Flow Diagrams

#### High-Level Architecture

```mermaid
flowchart LR

%% ---------------- CLIENT LAYER ----------------
subgraph Client["Client Layer"]
A[User Browser]
B[Next.js 15 UI<br>React + TypeScript + Tailwind]
A --> B
end

%% ---------------- AUTH ----------------
subgraph Auth["Authentication"]
C[Amazon Cognito<br>User Pool]
end

B -->|Login / JWT| C

%% ---------------- APPLICATION LAYER ----------------
subgraph App["Application Layer (AWS ECS Fargate)"]
D[Next.js Server Actions API]

subgraph AI["AI Workflows"]
E1[Demystify Document Flow<br>Single Step RAG]
E2[Compare Documents Flow<br>Multi Document Analysis]
E3[Chat Flow<br>Conversational RAG]
end

subgraph Processing
F1[PDF Parser<br>pdfjs-dist]
F2[DOCX Parser<br>mammoth]
F3[Image OCR<br>Amazon Rekognition]
F4[PII Detection & Masking]
end

D --> E1
D --> E2
D --> E3

E1 --> F1
E1 --> F2
E1 --> F3
E2 --> F1
E2 --> F2
E3 --> F1

F1 --> F4
F2 --> F4
F3 --> F4
end

%% ---------------- AI LAYER ----------------
subgraph AILayer["AI Layer (Amazon Bedrock)"]
G[Amazon Nova Lite Model]
end

F4 -->|Sanitized Document Context| G

%% ---------------- AI OUTPUT TASKS ----------------
subgraph AIAnalysis["AI Analysis"]
H1[Document Summary]
H2[Risk Detection]
H3[Obligation Extraction]
H4[Legal Term Glossary]
H5[Conversational Q&A]
end

G --> H1
G --> H2
G --> H3
G --> H4
G --> H5

%% ---------------- DATA STORAGE ----------------
subgraph DataStorage["Data & Storage"]
I1[Amazon S3<br>Document Storage]
I2[DynamoDB<br>Metadata + Chat History]
end

D --> I1
D --> I2

%% ---------------- INFRASTRUCTURE ----------------
subgraph Infrastructure["Infrastructure (AWS Cloud)"]
J1[Docker Containers]
J2[ECS Fargate]
J3[Application Load Balancer]
J4[Amazon ECR]
J5[CloudWatch Logs]
end

J3 --> J2
J2 --> J1
J4 --> J2
J2 --> J5

%% ---------------- RESPONSE ----------------
H1 --> B
H2 --> B
H3 --> B
H4 --> B
H5 --> B

%% ---------- COLORS ----------
style A fill:#cfe8ff,stroke:#1f78b4,stroke-width:2px
style B fill:#cfe8ff,stroke:#1f78b4,stroke-width:2px

style C fill:#d4f7d4,stroke:#2e7d32,stroke-width:2px

style D fill:#fff4cc,stroke:#b8860b,stroke-width:2px
style E1 fill:#fff4cc,stroke:#b8860b
style E2 fill:#fff4cc,stroke:#b8860b
style E3 fill:#fff4cc,stroke:#b8860b

style F1 fill:#fff4cc
style F2 fill:#fff4cc
style F3 fill:#fff4cc
style F4 fill:#fff4cc

style G fill:#e8d5ff,stroke:#6a0dad,stroke-width:2px

style H1 fill:#e8d5ff
style H2 fill:#e8d5ff
style H3 fill:#e8d5ff
style H4 fill:#e8d5ff
style H5 fill:#e8d5ff

style I1 fill:#ffe5cc,stroke:#d2691e,stroke-width:2px
style I2 fill:#ffe5cc,stroke:#d2691e,stroke-width:2px

style J1 fill:#f0f0f0
style J2 fill:#f0f0f0
style J3 fill:#f0f0f0
style J4 fill:#f0f0f0
style J5 fill:#f0f0f0
```

#### Process Flow: AI Document Helper
```mermaid
graph TD
    subgraph User Interaction
        A["1. User Uploads Document"] --> B{"AI Document Helper"};
    end
    subgraph "Backend Processing (RAG)"
        B --> C["2. Next.js server calls 'demystify' flow"];
        C --> D["3. RAG: full document text sent to Amazon Nova Lite via Amazon Bedrock"];
        D --> E["4. Nova Lite performs OCR, PII Masking, & generates structured analysis"];
        E --> F["5. Nova Lite returns structured JSON output"];
        F --> G["6. Flow completes, returns data to Next.js"];
    end
    subgraph Session & UI Update
        G --> H["7. Session is saved to DynamoDB"];
        G --> I["8. Next.js sends analysis to client"];
        I --> J["9. UI updates with multi-tab report"];
    end
    subgraph "Conversational Q&A (RAG)"
        J --> K["10. User asks a question in chat"];
        K --> L["11. 'ask' flow is called with question and full document text as context window"];
        L --> M["12. Nova Lite uses document as context to generate an answer"];
        M --> N["13. Answer is streamed back to UI"];
    end
```

#### Process Flow: Compare Documents
```mermaid
graph TD
    subgraph User Interaction
        A["1. User uploads Document A & B"] --> B{"Compare Documents"};
    end
    subgraph "Backend Processing (RAG)"
        B --> C["2. Next.js calls 'compare' flow"];
        C --> D["3. RAG: both document texts sent to Amazon Nova Lite via Amazon Bedrock"];
        D --> E["4. Nova Lite analyzes differences and impacts"];
        E --> F["5. Nova Lite returns structured JSON report"];
        F --> G["6. Flow returns data to Next.js"];
    end
    subgraph Session & UI Update
        G --> H["7. New comparison session saved to DynamoDB"];
        G --> I["8. Report is sent to client UI"];
        I --> J["9. UI renders detailed comparison"];
    end
```

## 5. Detailed Instructions for Judges to Access and Test

### Accessing the Live Solution

1.  **Navigate to the URL:** Please open the provided application URL in your web browser.
2.  **Create an Account:** You will be directed to the login page. Please **Sign Up** with an email and password to create a secure account.
3.  **Login:** Log in with your newly created credentials to access the application dashboard.

### Local Setup Instructions

To run and test the application on your local machine, please follow these steps:

1.  **Prerequisites:**
    *   **Node.js:** Ensure you have Node.js (v18 or newer) installed.
    *   **AWS Account:** You will need an AWS account with access to Cognito, S3, DynamoDB, Bedrock (Nova Lite), and ECS Fargate.

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/RD500/VidhikAI.git
    cd VidhikAI
    ```

3.  **Configure AWS Credentials:**
    *   Ensure your AWS credentials are configured. The recommended approach is to use IAM roles (for deployed environments) or set the following environment variables locally:
    ```bash
    AWS_ACCESS_KEY_ID="<your-access-key-id>"
    AWS_SECRET_ACCESS_KEY="<your-secret-access-key>"
    AWS_REGION="us-east-1"
    ```

4.  **Create Environment File:**
    *   In the root of the project directory, create a new file named `.env.local`.
    *   Add the following lines to the file, replacing placeholders with your actual AWS resource values:
    ```
    # AWS Region
    AWS_REGION="us-east-1"

    # AWS Credentials (for local development; use IAM roles in production)
    AWS_ACCESS_KEY_ID="<your-access-key-id>"
    AWS_SECRET_ACCESS_KEY="<your-secret-access-key>"

    # Amazon Bedrock
    BEDROCK_MODEL_ID="amazon.nova-lite-v1:0"

    # Amazon Cognito
    NEXT_PUBLIC_COGNITO_REGION="us-east-1"
    NEXT_PUBLIC_COGNITO_USER_POOL_ID="<your-user-pool-id>"
    NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID="<your-user-pool-client-id>"

    # Amazon S3
    S3_BUCKET_NAME="<your-s3-bucket-name>"

    # Amazon DynamoDB
    DYNAMODB_TABLE_NAME="<your-dynamodb-table-name>"
    ```

5.  **Enable AWS Services:**
    *   Ensure the following AWS services are provisioned in your AWS account:
        *   **Amazon Cognito** — User Pool for authentication
        *   **Amazon S3** — Bucket for document storage
        *   **Amazon DynamoDB** — Table for session history and metadata
        *   **Amazon Bedrock** — Enable model access for **Amazon Nova Lite** (`amazon.nova-lite-v1:0`) in the Bedrock console

6.  **Install Dependencies:**
    ```bash
    npm install
    ```

7.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

8.  **Access the Application:** Open your browser and navigate to `http://localhost:3000`. You can now sign up and use the application as described in the testing scenarios below.

### Deployment Instructions

The application is containerized and deployed to **AWS ECS Fargate**. Refer to [deploy-to-ecs.md](deploy-to-ecs.md) for the full step-by-step guide. At a high level:

1.  **Build and push the Docker image to Amazon ECR:**
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
    docker build -t vidhik-ai .
    docker tag vidhik-ai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vidhik-ai:latest
    docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vidhik-ai:latest
    ```

2.  **Deploy to ECS Fargate** using the provided CloudFormation template or the AWS Console. The `ecs-infrastructure.yaml` file in the repository contains the full infrastructure definition including the ECS cluster, task definition, service, and Application Load Balancer.

### Testing Scenarios

#### Scenario 1: Demystify a Scanned Rental Agreement (Image/OCR)

1.  **Navigate:** From the sidebar, ensure you are on the **"AI Document Helper"** screen.
2.  **Upload Image:** Use the **"Scanned/Image"** tab to upload an image of a sample rental agreement.
3.  **Analyze:** Click "Demystify Document". The analysis will start automatically after the upload.
4.  **Review the Report:**
    *   Check the **"Feature Summary"** tab for a clear, high-level overview.
    *   Go to the **"Risk Analysis"** tab. Note the AI-assigned risk levels. **Change the risk level** for one of the clauses from "Medium" to "High" using the dropdown.
    *   Explore the **"Jargon Buster"** to understand complex terms.
    *   Visit the **"Obligations & Deadlines"** tab. Click **"Export to Calendar"** to download an `.ics` file.
    *   Click the **"Original Document"** tab to see the image you uploaded.
5.  **Ask Questions (RAG in action):**
    *   The chat interface will now be active. Ask a specific question about the document, for example:
        *   "What is the notice period for terminating the lease?"
        *   (In Hinglish) "Security deposit kab wapas milega?"
    *   Verify that the AI provides a relevant answer based on the document's content.

#### Scenario 2: Analyze a Text-Based Document (PDF/DOCX)

1.  **Navigate:** Click "New Session" if needed, and select **"AI Document Helper"**.
2.  **Upload File:** In the **"Upload File"** tab, upload a text-based document like a `.pdf` or `.docx` file of a sample contract.
3.  **Analyze & Review:** Click "Demystify Document" and review the generated **Summary** and **Risk Analysis**.

#### Scenario 3: Analyze a Pasted Text Snippet

1.  **Navigate:** Click "New Session" and choose **"AI Document Helper"**.
2.  **Paste Text:** Select the **"Paste Text"** tab. Copy and paste a few paragraphs of any legal text (e.g., from a website's terms of service).
3.  **Analyze:** Click the **"Demystify Text"** button.
4.  **Review:** Briefly review the generated **Summary** and **Risk Analysis**.

#### Scenario 4: Compare Two Versions of a Contract

1.  **Navigate:** Click **"Compare Documents"** in the sidebar.
2.  **Upload Documents:**
    *   In the "Document A" slot, upload an original contract file (e.g., a `.docx` or `.pdf`).
    *   In the "Document B" slot, upload a modified version of the same contract (e.g., change the rent amount, add a new clause, or remove one).
3.  **Compare:** Click the **"Compare Documents"** button.
4.  **Review the Comparison Report:**
    *   Examine the generated report which should clearly list any **New Clauses**, **Changed Terms**, and **Deleted Clauses** in the accordion sections.

#### Scenario 5: Check History and My Documents

1.  **View History:** After performing the tests above, click the **History icon** in the top-right corner of the header. The side panel should show a list of your recent sessions.
2.  **Switch Sessions:** Click on a previous session in the history panel. The application state should update to show the documents and results from that session.
3.  **Navigate:** Click **"My Documents"** in the main sidebar.
4.  **Verify:** You should see cards representing each unique document you uploaded during your testing. Clicking on one of these cards will start a new "AI Document Helper" session with that document.

#### Scenario 6: Explore the Info & FAQ page

1.  **Navigate:** Click **"Info & FAQ"** in the main sidebar.
2.  **Review:** Read through the feature descriptions and frequently asked questions to understand the full capabilities of the application.
3.  **Test CTA:** Click one of the "Try Vidhik Now" or "Get Started" buttons, which should open the "New Session" dialog.
