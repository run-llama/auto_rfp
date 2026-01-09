import OpenAI from 'openai';
import { IAIQuestionExtractor, AIServiceConfig } from '@/lib/interfaces/ai-service';
import { ExtractedQuestions, ExtractedQuestionsSchema } from '@/lib/validators/extract-questions';
import { DEFAULT_LANGUAGE_MODEL } from '@/lib/constants';
import { AIServiceError } from '@/lib/errors/api-errors';
import { env } from '@/lib/env';

/**
 * OpenAI-powered question extraction service
 */
export class OpenAIQuestionExtractor implements IAIQuestionExtractor {
  private client: OpenAI;
  private config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.client = new OpenAI({
      apiKey: env.get('OPENAI_API_KEY')!,
    });

    this.config = {
      model: DEFAULT_LANGUAGE_MODEL,
      temperature: 0.1,
      maxTokens: 4000,
      timeout: 60000,
      ...config,
    };
  }

  /**
   * Generate a summary of the RFP document
   */
  async generateSummary(content: string, documentName: string): Promise<string> {
    try {
      const systemPrompt = this.getSummarySystemPrompt();
      
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatUserPrompt(content, documentName) }
        ],
        temperature: 0.3, // Slightly higher for more creative summaries
        max_tokens: 500, // Limit summary length
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new AIServiceError('Empty response from OpenAI for summary generation');
      }

      return assistantMessage.trim();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract vendor eligibility requirements from RFP document
   */
  async extractEligibility(content: string, documentName: string): Promise<string[]> {
    try {
      const systemPrompt = this.getEligibilitySystemPrompt();
      
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatUserPrompt(content, documentName) }
        ],
        temperature: 0.1, // Low temperature for precise extraction
        max_tokens: 1000, // Allow for comprehensive eligibility lists
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new AIServiceError('Empty response from OpenAI for eligibility extraction');
      }

      // Parse and validate the JSON response
      const rawData = JSON.parse(assistantMessage);

      // Handle cases where no eligibility criteria are found
      // The AI may return {}, { "eligibility": null }, or { "eligibility": [] }
      const eligibility = rawData.eligibility;

      // If eligibility is missing or not an array, return empty array (document has no eligibility criteria)
      if (!eligibility || !Array.isArray(eligibility)) {
        console.log('No eligibility criteria found in document, returning empty array');
        return [];
      }

      return eligibility.filter((item: any) => typeof item === 'string' && item.trim().length > 0);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AIServiceError('Invalid JSON response from AI service for eligibility extraction');
      }
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(`Eligibility extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract structured questions from document content
   */
  async extractQuestions(content: string, documentName: string): Promise<ExtractedQuestions> {
    try {
      const systemPrompt = this.getSystemPrompt();

      console.log("content of the document", content); 
      console.log("documentName", documentName);
      
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatUserPrompt(content, documentName) }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new AIServiceError('Empty response from OpenAI');
      }

      // Parse and validate the JSON response
      const rawData = JSON.parse(assistantMessage);
      const extractedData = ExtractedQuestionsSchema.parse(rawData);

      return extractedData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AIServiceError('Invalid JSON response from AI service');
      }
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(`Question extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the system prompt for RFP summary generation
   */
  private getSummarySystemPrompt(): string {
    return `
You are an expert at analyzing RFP (Request for Proposal) documents and creating concise, informative summaries.

Your task is to read through the RFP document and create a comprehensive paragraph summary that captures:
1. The purpose and scope of the project/procurement
2. Key requirements and deliverables
3. Important dates, deadlines, or timelines mentioned
4. Any special qualifications or criteria for vendors
5. The overall scale or nature of the work

Write a clear, professional summary in paragraph form (3-5 sentences) that would help someone quickly understand what this RFP is about and what the organization is seeking. Focus on the most important aspects that potential bidders would need to know.

Do not include section numbers, question lists, or administrative details like submission instructions. Focus on the substance of what is being procured.
    `.trim();
  }

  /**
   * Get the system prompt for vendor eligibility extraction
   */
  private getEligibilitySystemPrompt(): string {
    return `
You are an expert at analyzing RFP (Request for Proposal) documents and extracting vendor eligibility requirements.

Your task is to read through the RFP document and identify all key eligibility criteria that vendors must meet to qualify for this proposal. Focus on extracting:

1. Minimum experience requirements (years in business, project experience)
2. Technical qualifications and certifications
3. Financial requirements (bonding, insurance, revenue thresholds)
4. Geographic restrictions or preferences
5. Industry-specific licenses or accreditations
6. Staff qualifications and expertise requirements
7. Past performance criteria
8. Legal and compliance requirements
9. Size classifications (small business, minority-owned, etc.)
10. Any other mandatory qualifications mentioned

Format your response as a JSON object with an "eligibility" array containing clear, concise bullet points. Each requirement should be a standalone statement that a vendor can easily evaluate against their own qualifications.

Example format:
{
  "eligibility": [
    "Minimum 5 years of experience in software development",
    "Must hold current ISO 27001 certification",
    "Annual revenue of at least $10 million",
    "Licensed to operate in the State of California"
  ]
}

Focus only on mandatory requirements, not preferences. If no clear eligibility criteria are found, return an empty array.
    `.trim();
  }

  /**
   * Get the system prompt for question extraction
   */
  private getSystemPrompt(): string {
    const timestamp = Date.now();
    return `
You are an expert at analyzing RFP (Request for Proposal) documents and extracting structured information.
Given a document that contains RFP questions, extract all sections and questions into a structured format.

Carefully identify:
1. Different sections (usually numbered like 1.1, 1.2, etc.)
2. The questions within each section
3. Any descriptive text that provides context for the section

Format the output as a JSON object with the following structure:
{
  "sections": [
    {
      "id": "section_${timestamp}_1",
      "title": "Section Title",
      "description": "Optional description text for the section",
      "questions": [
        {
          "id": "q_${timestamp}_1_1",
          "question": "The exact text of the question"
        }
      ]
    }
  ]
}

Requirements:
- Generate unique reference IDs using the format: q_${timestamp}_<section>_<question> for questions
- Generate unique reference IDs using the format: section_${timestamp}_<number> for sections  
- Preserve the exact text of questions
- Include all questions found in the document
- Group questions correctly under their sections
- If a section has subsections, create separate sections for each subsection
- The timestamp prefix (${timestamp}) ensures uniqueness across different document uploads
    `.trim();
  }

  /**
   * Format the user prompt with context
   */
  private formatUserPrompt(content: string, documentName: string): string {
    return `Document Name: ${documentName}\n\nDocument Content:\n${content}`;
  }
}

// Export singleton instance
export const openAIQuestionExtractor = new OpenAIQuestionExtractor(); 