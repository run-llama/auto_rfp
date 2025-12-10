# AutoRFP - AI-Powered RFP Response Platform

AutoRFP is an intelligent platform that automates RFP (Request for Proposal) response generation using advanced AI. Built with Next.js 15 and powered by LlamaIndex, it helps organizations respond to RFPs 80% faster by automatically extracting questions from documents and generating contextual responses based on your knowledge base.

## ✨ Features

### 🤖 AI-Powered Document Processing
- **Automatic Question Extraction**: Upload RFP documents and automatically extract structured questions
- **Intelligent Response Generation**: Generate contextual responses using your organization's documents
- **Multi-Step AI Analysis**: Advanced reasoning process that analyzes, searches, extracts, and synthesizes responses
- **Document Understanding**: Supports Word, PDF, Excel, and PowerPoint files

### 🏢 Organization Management
- **Multi-Tenant Architecture**: Support for multiple organizations with role-based access
- **Team Collaboration**: Invite team members with different permission levels (owner, admin, member)
- **Project Organization**: Organize RFPs into projects for better management
- **Auto-Connect LlamaCloud**: Automatically connects to LlamaCloud when single project is available

### 🔍 Advanced Search & Indexing
- **LlamaCloud Integration**: Connect to LlamaCloud projects for document indexing
- **Multiple Index Support**: Work with multiple document indexes per project
- **Source Attribution**: Track and cite sources in generated responses
- **Real-time Search**: Search through your document knowledge base

### 💬 Interactive AI Responses
- **Chat Interface**: Interactive chat-style interface for generating responses
- **Multi-Step Response Dialog**: Detailed step-by-step response generation process
- **Source Details**: View detailed source information and relevance scores
- **Response Editing**: Edit and refine AI-generated responses

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: Supabase Auth (Magic Link)
- **Database**: PostgreSQL with Prisma ORM
- **AI & ML**: OpenAI GPT-4o, LlamaIndex, LlamaCloud
- **Deployment**: Vercel (recommended)
- **Package Manager**: pnpm

## 📋 Prerequisites

Before setting up AutoRFP, ensure you have:

- **Node.js** 18.x or later
- **pnpm** 8.x or later
- **PostgreSQL** database (local or cloud)
- **Supabase** account and project
- **OpenAI** API account with credits
- **LlamaCloud** account (optional but recommended)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/auto_rfp.git
cd auto_rfp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/auto_rfp
DIRECT_URL=postgresql://username:password@localhost:5432/auto_rfp

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# OpenAI API
OPENAI_API_KEY=<your-openai-api-key>

# LlamaCloud
LLAMACLOUD_API_KEY=<your-llamacloud-api-key>
# Optional: Internal API key and domain for internal users
# LLAMACLOUD_API_KEY_INTERNAL=<your-internal-llamacloud-api-key>
# INTERNAL_EMAIL_DOMAIN=<your-domain>  # Defaults to @runllama.ai

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: To use the env file for the app AND for docker the env var values cannot be in quotes.

### 4. Database Setup

#### Set up PostgreSQL Database

If using local PostgreSQL:
```bash
# Create database
createdb auto_rfp

# Or using psql
psql -c "CREATE DATABASE auto_rfp;"
```

#### Run Database Migrations

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# (Optional) Seed with sample data
pnpm prisma db seed
```

### 5. Supabase Setup

1. Create a new Supabase project at [supabase.com][]
2. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Configure authentication providers in **Authentication > Providers**
4. Set up email templates in **Authentication > Email Templates**

### 6. OpenAI Setup

1. Create an account at [platform.openai.com][]
2. Generate an API key in **API Keys** section
3. Add credits to your account
4. Copy the API key to `OPENAI_API_KEY`

### 7. LlamaCloud Setup (Optional)

1. Create an account at [cloud.llamaindex.ai][]
2. Create a new project
3. Generate an API key
4. Copy the API key to `LLAMACLOUD_API_KEY`

### 8. Run the Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000][] to see the application.

## 📁 Project Structure

```
auto_rfp/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   ├── extract-questions/    # Question extraction endpoint
│   │   ├── generate-response/    # Response generation endpoint
│   │   ├── llamacloud/          # LlamaCloud integration APIs
│   │   ├── organizations/       # Organization management APIs
│   │   └── projects/            # Project management APIs
│   ├── auth/                    # Authentication pages
│   ├── login/                   # Login flow
│   ├── organizations/           # Organization management pages
│   ├── projects/                # Project management pages
│   └── upload/                  # Document upload page
├── components/                  # Reusable React components
│   ├── organizations/           # Organization-specific components
│   ├── projects/               # Project-specific components
│   ├── ui/                     # UI component library (shadcn/ui)
│   └── upload/                 # Upload-related components
├── lib/                        # Core libraries and utilities
│   ├── services/               # Business logic services
│   ├── interfaces/             # TypeScript interfaces
│   ├── validators/             # Zod validation schemas
│   ├── utils/                  # Utility functions
│   └── errors/                 # Error handling
├── prisma/                     # Database schema and migrations
├── types/                      # TypeScript type definitions
└── providers/                  # React context providers
```

## 🔧 Key Configuration

### Database Schema

The application uses a multi-tenant architecture with the following key models:

- **User**: Authenticated users
- **Organization**: Tenant organizations
- **OrganizationUser**: User-organization relationships with roles
- **Project**: RFP projects within organizations
- **Question**: Extracted RFP questions
- **Answer**: AI-generated responses with sources
- **ProjectIndex**: LlamaCloud document indexes

### Authentication Flow

1. **Magic Link Authentication**: Users sign in via email magic links
2. **Organization Creation**: New users can create organizations
3. **Team Invitations**: Organization owners can invite team members
4. **Role-based Access**: Support for owner, admin, and member roles

### AI Processing Pipeline

1. **Document Upload**: Users upload RFP documents
2. **Question Extraction**: OpenAI extracts structured questions
3. **Document Indexing**: LlamaCloud indexes documents for search
4. **Response Generation**: Multi-step AI process generates responses
5. **Source Attribution**: Responses include relevant source citations

## 🚀 Deployment

### Environment Variables for Production

```bash
# Set these in your deployment platform
DATABASE_URL="your-production-database-url"
DIRECT_URL="your-production-database-direct-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
OPENAI_API_KEY="your-openai-api-key"
LLAMACLOUD_API_KEY="your-llamacloud-api-key"
# LLAMACLOUD_API_KEY_INTERNAL="your-internal-llamacloud-api-key"  # Optional: for internal users
# INTERNAL_EMAIL_DOMAIN="@yourdomain.com"  # Optional: defaults to @runllama.ai
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

The application can be deployed to any platform that supports Node.js:
- Railway
- Heroku
- Digital Ocean App Platform
- AWS Amplify
- Google Cloud Run

### Build and Run with Docker

AutoRFP includes Docker support for containerized deployment.

```bash
# Build the Docker image
pnpm docker-build

# Run the container
pnpm docker-run
```

**Note:** The Docker container uses Next.js standalone output mode for optimized production deployment. Make sure your `.env.local` includes a database connection string that's accessible from within the Docker container.

**IMPORTANT NOTE**: When you build/run a docker container all of the `NEXT_*` env vars are resolved at `build-time` (when the container is built; because the vars also need to be available in the frontend and are generated into the frontend code). The other vars are resolved at `run-time` (when the container is started). Means, if you (for instance) need to set `NEXT_PUBLIC_APP_URL` to your own site (e.g. `https://rfp.mydomain.com`) then you need to make this change to the env file, before you run docker-build.

## 🔌 API Endpoints

### Core APIs

- `POST /api/organizations` - Create organization
- `GET /api/organizations/{id}` - Get organization details
- `POST /api/projects` - Create project
- `POST /api/extract-questions` - Extract questions from documents
- `POST /api/generate-response` - Generate AI responses
- `POST /api/generate-response-multistep` - Multi-step response generation

### LlamaCloud Integration

- `GET /api/llamacloud/projects` - Get available LlamaCloud projects
- `POST /api/llamacloud/connect` - Connect organization to LlamaCloud
- `POST /api/llamacloud/disconnect` - Disconnect from LlamaCloud
- `GET /api/llamacloud/documents` - Get organization documents

## 🧪 Sample Data

Try the platform with our sample RFP document:
- **Sample File**: [RFP - Launch Services for Medium-Lift Payloads][rfp-sample-file]
- **Use Case**: Download and upload to test question extraction and response generation

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database connection
pnpm prisma db pull

# Reset database (WARNING: destroys data)
pnpm prisma migrate reset
```

**Authentication Issues**
- Verify Supabase URL and keys
- Check email template configuration
- Ensure redirect URLs are configured correctly

**AI Processing Issues**
- Verify OpenAI API key and credits
- Check LlamaCloud API key if using document indexing
- Review API rate limits

**Environment Variables**
```bash
# Check if all required variables are set
node -e "console.log(process.env)" | grep -E "(DATABASE_URL|SUPABASE|OPENAI|LLAMACLOUD)"
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Run the linter: `pnpm lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards

- **TypeScript**: All code must be typed
- **ESLint**: Follow the configured linting rules
- **Prettier**: Code is automatically formatted
- **Component Structure**: Follow the established patterns

### Testing

```bash
# Run tests (when available)
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE][] file for details.

## 🙏 Acknowledgments

- **LlamaIndex** for powerful document indexing and retrieval
- **OpenAI** for advanced language model capabilities
- **Supabase** for authentication and database infrastructure
- **Vercel** for Next.js framework and deployment platform
- **Radix UI** for accessible component primitives

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join our discussions for help and feature requests

---

Built with ❤️ using Next.js, LlamaIndex, and OpenAI

[Docker]: https://docs.docker.com/get-docker/
[LICENSE]: ./LICENSE
[cloud.llamaindex.ai]: https://cloud.llamaindex.ai
[http://localhost:3000]: http://localhost:3000
[platform.openai.com]: https://platform.openai.com
[rfp-sample-file]: https://qluspotebpidccpfbdho.supabase.co/storage/v1/object/public/sample-files//RFP%20-%20Launch%20Services%20for%20Medium-Lift%20Payloads.pdf
[supabase.com]: https://supabase.com
