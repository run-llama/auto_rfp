import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, FileText, ThumbsDown, ThumbsUp } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface AISuggestionsPanelProps {
  questionId: string;
}

export function AISuggestionsPanel({ questionId }: AISuggestionsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Handle using a suggestion
  const handleUseSuggestion = (suggestion: string) => {
    // This would ideally communicate back to the parent component
    // to set the answer text
    toast({
      title: "Suggestion Applied",
      description: "The AI suggestion has been applied to your answer.",
    });
  };

  // Handle copying a suggestion to clipboard
  const handleCopySuggestion = (suggestion: string, index: number) => {
    navigator.clipboard.writeText(suggestion).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: "The suggestion has been copied to your clipboard.",
      });
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">AI Suggestions for Question {questionId}</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            3 Suggestions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suggestion1">
          <TabsList className="mb-2">
            <TabsTrigger value="suggestion1">Suggestion 1</TabsTrigger>
            <TabsTrigger value="suggestion2">Suggestion 2</TabsTrigger>
            <TabsTrigger value="suggestion3">Suggestion 3</TabsTrigger>
          </TabsList>
          <TabsContent value="suggestion1" className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              <p>
                Our proposed technical architecture employs a cloud-native microservices approach designed for
                scalability, resilience, and maintainability. The architecture consists of:
              </p>
              <br />
              <p>
                <strong>1. Frontend Layer:</strong> A React-based single-page application (SPA) with responsive design
                principles, ensuring a consistent user experience across devices. The frontend communicates with backend
                services via RESTful APIs.
              </p>
              <br />
              <p>
                <strong>2. API Gateway:</strong> Serves as the entry point for all client requests, handling
                authentication, request routing, and rate limiting. We utilize AWS API Gateway for this component.
              </p>
              <br />
              <p>
                <strong>3. Microservices:</strong> Core business functionality is implemented as containerized
                microservices, each responsible for a specific domain. These services are developed using Node.js and
                deployed as Docker containers orchestrated by Kubernetes.
              </p>
              <br />
              <p>
                <strong>4. Data Layer:</strong> A hybrid data storage approach with PostgreSQL for relational data and
                MongoDB for document storage. Redis is used for caching to improve performance.
              </p>
              <br />
              <p>
                <strong>5. Integration Layer:</strong> A combination of RESTful APIs and event-driven messaging using
                Apache Kafka ensures reliable communication between services.
              </p>
              <br />
              <p>
                <strong>6. Monitoring & Observability:</strong> Comprehensive monitoring using Prometheus and Grafana,
                with distributed tracing via Jaeger to ensure system health and performance.
              </p>
              <br />
              <p>
                Please see the attached architecture diagram for a visual representation of these components and their
                interactions.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Source: Technical Capabilities.pdf, pg. 12-15</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button size="sm" className="h-7 gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Use
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="suggestion2" className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              <p>
                Our technical architecture follows a modern, cloud-agnostic approach that prioritizes security,
                scalability, and maintainability. The architecture is composed of several distinct layers:
              </p>
              <br />
              <p>
                <strong>1. Presentation Layer:</strong> A responsive web application built with React and TypeScript,
                following accessibility standards (WCAG 2.1 AA). The UI components are modular and reusable, enabling
                rapid development and consistent user experience.
              </p>
              <br />
              <p>
                <strong>2. API Management:</strong> An API gateway (Kong) that handles cross-cutting concerns such as
                authentication, authorization, rate limiting, and request routing.
              </p>
              <br />
              <p>
                <strong>3. Service Layer:</strong> Domain-driven microservices implemented using Node.js and Express,
                each with clear boundaries and responsibilities. Services communicate through both synchronous (REST)
                and asynchronous (message queue) patterns.
              </p>
              <br />
              <p>
                <strong>4. Data Management:</strong> A polyglot persistence approach with PostgreSQL for transactional
                data, Elasticsearch for search capabilities, and Redis for caching and session management.
              </p>
              <br />
              <p>
                <strong>5. Infrastructure:</strong> Containerized deployment using Docker and Kubernetes, with
                infrastructure-as-code practices using Terraform. This enables consistent environments across
                development, testing, and production.
              </p>
              <br />
              <p>
                <strong>6. DevOps & Monitoring:</strong> CI/CD pipelines with automated testing, deployment, and
                rollback capabilities. Comprehensive monitoring using Prometheus, Grafana, and ELK stack.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Source: Previous RFP Responses.pdf, pg. 8-10</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button size="sm" className="h-7 gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Use
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="suggestion3" className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              <p>
                Our technical architecture is specifically designed to meet Velocity Labs&apos; requirements for a scalable,
                secure, and maintainable healthcare solution. The architecture leverages industry best practices and our
                extensive experience in HIPAA-compliant systems:
              </p>
              <br />
              <p>
                <strong>1. User Interface:</strong> A responsive web application built with React, featuring an
                intuitive interface designed specifically for healthcare professionals. The UI incorporates Velocity
                Labs&apos; design system for brand consistency.
              </p>
              <br />
              <p>
                <strong>2. Security Layer:</strong> A comprehensive security framework including OAuth 2.0/OIDC for
                authentication, role-based access control, data encryption (at rest and in transit), and audit logging
                for HIPAA compliance.
              </p>
              <br />
              <p>
                <strong>3. API Services:</strong> RESTful microservices built with Node.js, each focused on specific
                healthcare domain functions (patient management, scheduling, billing, etc.). All APIs are versioned and
                documented using OpenAPI.
              </p>
              <br />
              <p>
                <strong>4. Integration Hub:</strong> A dedicated integration layer for connecting with Velocity Labs&apos;
                existing systems, including HL7 FHIR support for healthcare interoperability and secure connections to
                third-party services.
              </p>
              <br />
              <p>
                <strong>5. Data Platform:</strong> A HIPAA-compliant data architecture using PostgreSQL with data
                partitioning for performance, point-in-time recovery, and comprehensive backup strategies.
              </p>
              <br />
              <p>
                <strong>6. Cloud Infrastructure:</strong> Deployed on AWS with multi-AZ redundancy, auto-scaling, and
                disaster recovery capabilities. Infrastructure is defined as code using Terraform and follows AWS
                Well-Architected Framework principles.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Source: AI-generated based on RFP requirements</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button size="sm" className="h-7 gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Use
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
