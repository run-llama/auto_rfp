import { ResponseResult } from '@/lib/interfaces/llamaindex';

interface ResponseTemplate {
  keywords: string[];
  response: string;
}

export class DefaultResponseService {
  private readonly responseTemplates: ResponseTemplate[] = [
    {
      keywords: ['security', 'secure', 'compliance', 'gdpr', 'hipaa', 'encrypt'],
      response: "Our platform implements robust security measures including 256-bit AES encryption for data at rest and in transit, role-based access controls with multi-factor authentication, regular penetration testing, and adherence to compliance standards including SOC 2 Type II and ISO 27001. We maintain comprehensive backup and disaster recovery procedures to ensure data integrity and availability."
    },
    {
      keywords: ['implementation', 'deploy', 'timeline', 'rollout', 'setup'],
      response: "Our implementation approach follows a proven 5-phase methodology: Discovery, Planning, Configuration, Testing, and Deployment. Each phase includes clear milestones, deliverables, and approval gates. A dedicated implementation team with domain expertise is assigned to your project, supported by our professional services organization. Typical enterprise implementations are completed within 8-12 weeks."
    },
    {
      keywords: ['price', 'pricing', 'cost', 'budget', 'fee', 'subscription'],
      response: "Our pricing model is structured to provide maximum flexibility and value. The core platform is available on an annual subscription basis with pricing tiers based on user count and feature requirements. Implementation services are priced separately based on project scope. Volume discounts are available for enterprise deployments, and we offer special pricing for academic and non-profit organizations."
    },
    {
      keywords: ['support', 'maintenance', 'help', 'training', 'documentation'],
      response: "We provide 24/7/365 technical support through multiple channels including phone, email, and chat. Our standard SLA guarantees 99.9% uptime with 4-hour response times for critical issues. Premium support plans with dedicated support engineers and faster response times are available. All customers have access to our comprehensive documentation, knowledge base, and community forums."
    },
    {
      keywords: ['integration', 'api', 'connect', 'interoperability', 'sync'],
      response: "Our platform offers comprehensive integration capabilities through RESTful APIs, webhooks, and pre-built connectors for major enterprise systems. We support standard protocols including SAML, OAuth 2.0, and SCIM for authentication and user provisioning. Our API-first architecture ensures seamless connectivity with your existing technology stack."
    },
    {
      keywords: ['scalability', 'performance', 'capacity', 'load', 'enterprise'],
      response: "Our cloud-native architecture is designed for enterprise-scale performance and reliability. The platform automatically scales to handle varying workloads and can support thousands of concurrent users. We utilize enterprise-grade infrastructure with global CDN, load balancing, and auto-scaling capabilities to ensure optimal performance worldwide."
    }
  ];

  private readonly defaultResponse = "Our solution provides comprehensive capabilities designed to meet and exceed your requirements. We employ industry best practices and leverage cutting-edge technology to deliver superior outcomes. Our team has extensive experience in implementing similar solutions across various industries.";

  generateResponse(question: string): ResponseResult {
    const questionLower = question.toLowerCase();
    
    // Find the best matching template based on keywords
    const matchingTemplate = this.responseTemplates.find(template =>
      template.keywords.some(keyword => questionLower.includes(keyword))
    );

    const response = matchingTemplate?.response || this.defaultResponse;
    
    return {
      response,
      sources: [],
      confidence: 0.7,
      generatedAt: new Date().toISOString(),
    };
  }

  // Method to add custom response templates (useful for configuration)
  addResponseTemplate(keywords: string[], response: string): void {
    this.responseTemplates.push({ keywords, response });
  }

  // Method to get all available templates (useful for admin interfaces)
  getResponseTemplates(): ReadonlyArray<ResponseTemplate> {
    return [...this.responseTemplates];
  }
} 