# Contributing to AutoRFP

Thank you for your interest in contributing to AutoRFP! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use a clear and descriptive title**
3. **Provide detailed information** about the bug or feature request
4. **Include reproduction steps** for bugs
5. **Add screenshots** if relevant

### Feature Requests

When requesting a feature:

1. **Explain the use case** and why it's valuable
2. **Describe the expected behavior**
3. **Consider the impact** on existing functionality
4. **Propose an implementation approach** if you have ideas

### Pull Requests

1. **Fork the repository** and create a new branch
2. **Follow the coding standards** described below
3. **Write clear commit messages**
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Ensure all checks pass**

## 🏗 Development Setup

### Prerequisites

- Node.js 18.x or later
- pnpm 8.x or later
- PostgreSQL database
- Supabase account
- OpenAI API account

### Local Development

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/auto_rfp.git
cd auto_rfp

# 2. Install dependencies
pnpm install

# 3. Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
pnpm prisma generate
pnpm prisma migrate deploy

# 5. Start development server
pnpm dev
```

### Environment Variables

Create a `.env` file with these variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/auto_rfp"
DIRECT_URL="postgresql://username:password@localhost:5432/auto_rfp"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
LLAMACLOUD_API_KEY="your-llamacloud-api-key"
# Optional: Internal API key and domain for internal users
# LLAMACLOUD_API_KEY_INTERNAL="your-internal-llamacloud-api-key"
# INTERNAL_EMAIL_DOMAIN="@yourdomain.com"  # Defaults to @runllama.ai

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📝 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define proper interfaces** for data structures
- **Use strict typing** - avoid `any` when possible
- **Export types** from dedicated files when shared

### React Components

```typescript
// Use functional components with TypeScript
interface MyComponentProps {
  title: string;
  optional?: boolean;
}

export function MyComponent({ title, optional = false }: MyComponentProps) {
  // Component implementation
}
```

### File Naming

- **Components**: PascalCase (`MyComponent.tsx`)
- **Pages**: kebab-case (`my-page.tsx`)
- **Utilities**: camelCase (`myUtility.ts`)
- **API routes**: kebab-case (`my-route.ts`)

### Code Structure

```typescript
// 1. External imports
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

// 3. Types/interfaces
interface ComponentProps {
  // ...
}

// 4. Component/function implementation
export function Component({ }: ComponentProps) {
  // ...
}
```

### API Routes

- **Use TypeScript** for all API routes
- **Validate inputs** with Zod schemas
- **Handle errors** consistently
- **Return proper HTTP status codes**
- **Use the apiHandler middleware** for consistent error handling

```typescript
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/middleware/api-handler';
import { MyRequestSchema } from '@/lib/validators/my-schema';

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const body = await request.json();
    const validatedData = MyRequestSchema.parse(body);
    
    // Implementation
    
    return {
      success: true,
      data: result
    };
  });
}
```

## 🗂 Project Structure

### Directory Organization

```
app/                    # Next.js App Router
├── api/               # API routes
├── (auth)/            # Auth-related pages
├── organizations/     # Organization pages
├── projects/         # Project pages
└── globals.css       # Global styles

components/            # Reusable components
├── ui/               # Base UI components (shadcn/ui)
├── organizations/    # Organization-specific components
├── projects/         # Project-specific components
└── upload/           # Upload-related components

lib/                   # Core libraries
├── services/         # Business logic
├── validators/       # Zod schemas
├── interfaces/       # TypeScript interfaces
├── utils/           # Utility functions
└── errors/          # Error definitions

prisma/               # Database
├── schema.prisma    # Database schema
└── migrations/      # Database migrations
```

### Component Guidelines

- **Single Responsibility**: Each component should have one clear purpose
- **Reusability**: Design components to be reusable across the app
- **Composition**: Prefer composition over large monolithic components
- **Props Interface**: Always define TypeScript interfaces for props

### Service Layer

- **Business Logic**: Keep business logic in service classes
- **Error Handling**: Use custom error classes for different error types
- **Validation**: Use Zod schemas for input validation
- **Database Access**: Use Prisma ORM for database operations

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Writing Tests

- **Test user interactions** not implementation details
- **Use descriptive test names**
- **Follow the AAA pattern** (Arrange, Act, Assert)
- **Mock external dependencies**

## 🔄 Database Changes

### Making Schema Changes

1. **Update the Prisma schema** in `prisma/schema.prisma`
2. **Create a migration**:
   ```bash
   pnpm prisma migrate dev --name describe-your-change
   ```
3. **Update TypeScript types** if needed
4. **Test the migration** thoroughly

### Migration Guidelines

- **Always create migrations** for schema changes
- **Use descriptive names** for migrations
- **Test migrations** on a copy of production data
- **Consider backward compatibility**

## 📚 Documentation

### Code Documentation

- **Comment complex logic**
- **Use JSDoc** for functions and classes
- **Update README** for significant changes
- **Document API endpoints**

### API Documentation

```typescript
/**
 * Creates a new organization with the given details
 * @param name - Organization name
 * @param description - Optional organization description
 * @param userId - ID of the user creating the organization
 * @returns Created organization with relationships
 */
export async function createOrganization(
  name: string,
  description: string | null,
  userId: string
) {
  // Implementation
}
```

## 🚀 Deployment

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Database migrations are safe
- [ ] Environment variables are configured
- [ ] Documentation is updated

### Release Process

1. **Create a feature branch** from main
2. **Make your changes** following the guidelines
3. **Test thoroughly** in development
4. **Create a pull request** with detailed description
5. **Address review feedback**
6. **Merge after approval**

## 🎯 Areas for Contribution

### High-Priority Areas

- **Testing**: Add unit and integration tests
- **Documentation**: Improve inline documentation
- **Performance**: Optimize database queries and API responses
- **Accessibility**: Improve accessibility of UI components
- **Mobile**: Enhance mobile responsiveness

### Feature Ideas

- **Export functionality**: Export answers to various formats
- **Templates**: RFP response templates
- **Analytics**: Usage analytics and reporting
- **Integrations**: Additional third-party integrations
- **Collaboration**: Enhanced team collaboration features

## 💬 Communication

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check README and code comments first

### Code Reviews

- **Be constructive** and respectful in reviews
- **Explain reasoning** behind suggestions
- **Consider different approaches**
- **Focus on code quality** and maintainability

## 📄 License

By contributing to AutoRFP, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AutoRFP! 🙏 