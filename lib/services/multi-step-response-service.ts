import { IMultiStepResponseService } from '@/lib/interfaces/multi-step-response';
import {
  MultiStepGenerateRequest,
  MultiStepResponse,
  StepUpdate,
  StepResult,
  QuestionAnalysis,
  DocumentSearchResult,
  InformationExtraction,
  ResponseSynthesis,
  MultiStepConfig
} from '@/lib/validators/multi-step-response';
import { LlamaIndexService } from '@/lib/llama-index-service';
import { generateId } from 'ai';
import { db } from '@/lib/db';
import { organizationService } from '@/lib/organization-service';
import OpenAI from 'openai';
import { env } from '@/lib/env';

/**
 * Multi-step response generation service implementation with AI-powered reasoning
 */
export class MultiStepResponseService implements IMultiStepResponseService {
  private config: MultiStepConfig;
  private llamaIndexService: LlamaIndexService;
  private openai: OpenAI;

  constructor(config: Partial<MultiStepConfig> = {}) {
    this.config = {
      maxSteps: 5,
      timeoutPerStep: 30000,
      enableDetailedLogging: true,
      fallbackToSingleStep: true,
      minConfidenceThreshold: 0.7,
      ...config,
    };
    
    // Initialize the LlamaIndex service (will be reconfigured per request)
    this.llamaIndexService = new LlamaIndexService();
    
    // Initialize OpenAI for AI-powered reasoning
    this.openai = new OpenAI({
      apiKey: env.get('OPENAI_API_KEY')!,
    });
  }

  /**
   * Generate response using multi-step reasoning
   */
  async generateResponse(request: MultiStepGenerateRequest): Promise<MultiStepResponse> {
    const responseId = generateId();
    const steps: StepResult[] = [];
    const startTime = new Date();

    try {
      console.log(`Starting multi-step response generation for question: ${request.questionId}`);
      console.log(`DEBUG Multi-step: indexIds received:`, request.indexIds);

      // Get project configuration to use proper indexes
      const projectConfig = await this.getProjectConfiguration(request.projectId);
      console.log(`DEBUG Multi-step: project configuration:`, projectConfig);
      
      // Reconfigure LlamaIndex service with project-specific settings
      if (projectConfig.organization.llamaCloudProjectId && projectConfig.organization.llamaCloudConnectedAt) {
        const selectedIndexNames = this.getSelectedIndexNames(request.indexIds, projectConfig.projectIndexes);
        console.log(`DEBUG Multi-step: selected index names:`, selectedIndexNames);
        
        this.llamaIndexService = new LlamaIndexService({
          apiKey: env.get('LLAMACLOUD_API_KEY')!,
          projectName: projectConfig.organization.llamaCloudProjectName || 'Default',
          indexNames: selectedIndexNames.length > 0 ? selectedIndexNames : undefined,
        });
      }

      // Step 1: Analyze Question
      const analysisStep = await this.executeStep('analyze_question', {
        title: '🔍 Analyzing Question',
        description: 'Using AI to understand question complexity, entities, and search strategy',
        executor: () => this.analyzeQuestionWithAI(request.question)
      });
      steps.push(analysisStep);

      const analysis = analysisStep.output as QuestionAnalysis;

      // Step 2: Search Documents
      const searchStep = await this.executeStep('search_documents', {
        title: '📚 Searching Documents',
        description: `Searching for relevant information using ${analysis.searchQueries.length} AI-optimized queries`,
        executor: () => this.searchDocuments(analysis.searchQueries, request.indexIds)
      });
      steps.push(searchStep);

      const searchResults = searchStep.output as DocumentSearchResult[];

      // Step 3: Extract Information
      const extractionStep = await this.executeStep('extract_information', {
        title: '🔬 Extracting Information',
        description: 'Using AI to analyze documents and extract relevant facts',
        executor: () => this.extractInformationWithAI(request.question, searchResults, analysis)
      });
      steps.push(extractionStep);

      const extraction = extractionStep.output as InformationExtraction;

      // Step 4: Synthesize Response
      const synthesisStep = await this.executeStep('synthesize_response', {
        title: '✍️ Generating Response',
        description: 'Using AI to craft comprehensive response from extracted information',
        executor: () => this.synthesizeResponseWithAI(request.question, extraction, analysis)
      });
      steps.push(synthesisStep);

      const synthesis = synthesisStep.output as ResponseSynthesis;

      // Step 5: Validate Answer
      const validationStep = await this.executeStep('validate_answer', {
        title: '✅ Validating Response',
        description: 'Using AI to validate response quality and accuracy',
        executor: () => this.validateResponseWithAI(request.question, synthesis, analysis, extraction)
      });
      steps.push(validationStep);

      const validation = validationStep.output as { isValid: boolean; improvements: string[]; finalConfidence: number };

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      // Build final response
      const multiStepResponse: MultiStepResponse = {
        id: responseId,
        questionId: request.questionId,
        steps,
        finalResponse: synthesis.mainResponse,
        overallConfidence: validation.finalConfidence,
        totalDuration,
        sources: synthesis.sources.map(source => ({
          id: source.id,
          fileName: this.getSourceFileName(source.id, searchResults),
          relevance: source.relevance,
          pageNumber: this.getSourcePageNumber(source.id, searchResults),
          textContent: this.getSourceTextContent(source.id, searchResults),
        })),
        metadata: {
          modelUsed: 'gpt-4o',
          tokensUsed: this.calculateActualTokens(steps),
          stepsCompleted: steps.filter(s => s.status === 'completed').length,
          processingStartTime: startTime,
          processingEndTime: endTime,
        },
      };

      console.log(`Multi-step response generation completed in ${totalDuration}ms`);
      return multiStepResponse;

    } catch (error) {
      console.error('Multi-step response generation failed:', error);
      
      if (this.config.fallbackToSingleStep) {
        console.log('Falling back to single-step generation');
        return await this.fallbackToSingleStep(request, steps);
      }
      
      throw error;
    }
  }

  /**
   * Get project configuration with organization and index details
   */
  private async getProjectConfiguration(projectId: string) {
    const currentUser = await organizationService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            llamaCloudProjectId: true,
            llamaCloudProjectName: true,
            llamaCloudConnectedAt: true,
          },
        },
        projectIndexes: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const isMember = await organizationService.isUserOrganizationMember(
      currentUser.id,
      project.organization.id
    );
    
    if (!isMember) {
      throw new Error('You do not have access to this project');
    }

    return project;
  }

  /**
   * Get selected index names from project configuration
   */
  private getSelectedIndexNames(requestedIndexIds: string[], projectIndexes: Array<{indexId: string; indexName: string}>): string[] {
    console.log('DEBUG Multi-step: getSelectedIndexNames called');
    console.log('DEBUG Multi-step: requestedIndexIds:', requestedIndexIds);
    console.log('DEBUG Multi-step: projectIndexes:', projectIndexes);
    
    const selectedIndexNames = projectIndexes
      .filter(projectIndex => {
        const isSelected = requestedIndexIds.includes(projectIndex.indexId);
        console.log(`DEBUG Multi-step: Checking ${projectIndex.indexName} (${projectIndex.indexId}): ${isSelected}`);
        return isSelected;
      })
      .map(projectIndex => projectIndex.indexName);
    
    console.log('DEBUG Multi-step: Final selectedIndexNames:', selectedIndexNames);
    return selectedIndexNames;
  }

  /**
   * Helper function to extract JSON from OpenAI responses that may be wrapped in markdown code blocks
   */
  private extractJsonFromResponse(content: string): any {
    if (!content) {
      throw new Error('No content to parse');
    }

    // Check if content is wrapped in markdown code blocks
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      // Extract JSON from code block
      const jsonContent = jsonBlockMatch[1].trim();
      return JSON.parse(jsonContent);
    }

    // If not in code blocks, try parsing directly
    return JSON.parse(content.trim());
  }

  /**
   * Step 1: AI-powered question analysis
   */
  private async analyzeQuestionWithAI(question: string): Promise<QuestionAnalysis> {
    const prompt = `Analyze this RFP question and provide a structured analysis in JSON format:

Question: "${question}"

Please analyze and return JSON with:
1. complexity: "simple" | "moderate" | "complex" | "multi-part"
2. requiredInformation: array of information types needed (e.g., ["technical specifications", "pricing", "timeline"])
3. specificEntities: array of named entities (companies, countries, technologies, etc.)
4. searchQueries: 2-4 optimized search queries to find relevant information
5. expectedSources: estimated number of sources needed for complete answer
6. reasoning: explanation of the analysis

Focus on:
- Identifying key concepts and entities
- Understanding what information is needed to answer completely
- Creating search queries that will find relevant documents
- Estimating complexity based on question structure and requirements

Return only valid JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing RFP questions and determining optimal search strategies. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return this.extractJsonFromResponse(content);
    } catch (error) {
      console.error('AI question analysis failed:', error);
      // Fallback to basic analysis
      return this.getBasicQuestionAnalysis(question);
    }
  }

  /**
   * Basic fallback question analysis
   */
  private getBasicQuestionAnalysis(question: string): QuestionAnalysis {
    const words = question.split(' ');
    const complexity = words.length > 20 ? 'complex' : words.length > 10 ? 'moderate' : 'simple';
    
    return {
      complexity,
      requiredInformation: ['general information'],
      specificEntities: [],
      searchQueries: [question],
      expectedSources: complexity === 'simple' ? 2 : complexity === 'moderate' ? 3 : 4,
      reasoning: `Basic analysis: ${complexity} question with ${words.length} words`
    };
  }

  /**
   * Step 2: Search documents using optimized queries
   */
  private async searchDocuments(
    searchQueries: string[], 
    indexIds: string[]
  ): Promise<DocumentSearchResult[]> {
    const searchResults: DocumentSearchResult[] = [];

    for (const query of searchQueries) {
      try {
        const llamaResponse = await this.llamaIndexService.generateResponse(query);
        
        const documentResult: DocumentSearchResult = {
          query,
          documentsFound: llamaResponse.sources.length,
          relevantSources: llamaResponse.sources.map((source: any) => ({
            id: source.id.toString(),
            title: source.fileName || 'Unknown Document',
            relevanceScore: source.relevance ? source.relevance / 100 : 0.5,
            snippet: source.textContent|| '',
          })),
          coverage: this.assessCoverageWithAI(llamaResponse.sources.length, query),
        };

        searchResults.push(documentResult);
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
        searchResults.push({
          query,
          documentsFound: 0,
          relevantSources: [],
          coverage: 'insufficient',
        });
      }
    }

    return searchResults;
  }

  /**
   * AI-powered coverage assessment
   */
  private assessCoverageWithAI(sourceCount: number, query: string): 'complete' | 'partial' | 'insufficient' {
    // More intelligent assessment based on query complexity and source count
    const queryComplexity = query.split(' ').length;
    
    if (sourceCount === 0) return 'insufficient';
    if (sourceCount >= queryComplexity / 2) return 'complete';
    if (sourceCount >= 1) return 'partial';
    return 'insufficient';
  }

  /**
   * Step 3: AI-powered information extraction
   */
  private async extractInformationWithAI(
    question: string,
    searchResults: DocumentSearchResult[],
    analysis: QuestionAnalysis
  ): Promise<InformationExtraction> {
    const allSources = searchResults.flatMap(result => result.relevantSources);
    
    if (allSources.length === 0) {
      return {
        extractedFacts: [],
        missingInformation: ['No relevant documents found'],
        conflictingInformation: []
      };
    }

    // Prepare comprehensive document content for AI analysis
    const documentContent = allSources.map((source, index) => 
      `=== Document ${index + 1}: ${source.title} ===\n${source.snippet}\n`
    ).join('\n');

    const prompt = `You are an expert RFP analyst. Analyze the following documents to extract information relevant to this question:

QUESTION: "${question}"

DOCUMENT CONTENT:
${documentContent}

Your task is to intelligently extract and organize information that directly addresses the question. DO NOT just list document snippets. Instead, analyze and synthesize the content.

Return JSON with:
{
  "extractedFacts": [
    {
      "fact": "Clear, concise statement of relevant information (not a raw document quote)",
      "source": "Document name", 
      "confidence": 0.8
    }
  ],
  "missingInformation": ["List any gaps in information needed to fully answer the question"],
  "conflictingInformation": [
    {
      "topic": "What the conflict is about",
      "conflictingSources": ["Doc1", "Doc2"]
    }
  ]
}

IMPORTANT GUIDELINES:
- Extract MEANINGFUL facts, not raw technical data dumps
- Focus on information that directly answers the question
- Synthesize and interpret technical details into understandable statements
- If documents contain mostly irrelevant technical details, extract only what's useful
- Confidence should reflect how well the fact answers the original question
- Each fact should be a complete, standalone statement

Return only valid JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert RFP analyst who extracts meaningful, relevant information from documents. Focus on answering the specific question, not listing raw data. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const result = this.extractJsonFromResponse(content);
      
      // Validate and clean the extracted facts
      if (result.extractedFacts && Array.isArray(result.extractedFacts)) {
        result.extractedFacts = result.extractedFacts.filter((fact: any) => 
          fact.fact && typeof fact.fact === 'string' && fact.fact.length > 20
        );
      }

      return result;
    } catch (error) {
      console.error('AI information extraction failed:', error);
      // Fallback to improved basic extraction
      return this.getImprovedBasicExtraction(allSources, question);
    }
  }

  /**
   * Improved basic fallback information extraction
   */
  private getImprovedBasicExtraction(sources: any[], question: string): InformationExtraction {
    const extractedFacts = sources
      .filter(source => source.snippet && source.snippet.length > 50)
      .slice(0, 5) // Limit to top 5 sources
      .map((source, index) => ({
        fact: `Relevant information regarding ${question.split(' ').slice(0, 3).join(' ')}: ${source.snippet.substring(0, 150)}${source.snippet.length > 150 ? '...' : ''}`,
        source: source.title,
        confidence: Math.min(source.relevanceScore + 0.1, 0.9)
      }));

    return {
      extractedFacts,
      missingInformation: sources.length < 3 ? ['Limited document coverage for comprehensive analysis'] : [],
      conflictingInformation: []
    };
  }

  /**
   * Step 4: AI-powered response synthesis
   */
  private async synthesizeResponseWithAI(
    question: string,
    extraction: InformationExtraction,
    analysis: QuestionAnalysis
  ): Promise<ResponseSynthesis> {
    console.log('=== SYNTHESIS DEBUG ===');
    console.log('Question:', question);
    console.log('Extracted facts count:', extraction.extractedFacts.length);
    console.log('Facts:', extraction.extractedFacts);
    
    if (extraction.extractedFacts.length === 0) {
      console.log('No facts available, returning insufficient information response');
      return {
        mainResponse: `Based on the available documentation, there is insufficient specific information to provide a comprehensive answer to: "${question}"\n\nTo fully address this question, additional documentation or clarification may be required.`,
        confidence: 0.2,
        sources: [],
        limitations: ['No relevant information found in provided documents'],
        recommendations: ['Request additional technical documentation', 'Consult with subject matter experts', 'Clarify specific requirements']
      };
    }

    const factsForAI = extraction.extractedFacts.map((fact, index) => 
      `${index + 1}. ${fact.fact} (Source: ${fact.source}, Confidence: ${fact.confidence})`
    ).join('\n');

    const contextInfo = `
Question Complexity: ${analysis.complexity}
Required Information Types: ${analysis.requiredInformation.join(', ')}
Available Facts: ${extraction.extractedFacts.length}
Missing Information: ${extraction.missingInformation.join(', ') || 'None identified'}
Conflicting Information: ${extraction.conflictingInformation.length > 0 ? extraction.conflictingInformation.map(c => c.topic).join(', ') : 'None detected'}`;

    const prompt = `You are an expert RFP response writer. Create a professional, comprehensive response to this RFP question using the provided facts.

QUESTION: "${question}"

CONTEXT:${contextInfo}

AVAILABLE FACTS:
${factsForAI}

Create a professional RFP response that:
1. Directly addresses the question asked
2. Uses the available facts to provide specific, actionable information  
3. Maintains a professional, confident tone
4. Structures information logically with headings if appropriate
5. Acknowledges any limitations transparently
6. Provides concrete details rather than vague statements

Return JSON with:
{
  "mainResponse": "Professional RFP response in markdown format with proper structure and headings",
  "confidence": 0.85,
  "sources": [{"id": "1", "relevance": 0.9, "usedInResponse": true}],
  "limitations": ["Specific limitations if any"],
  "recommendations": ["Actionable next steps if needed"]
}

FORMATTING GUIDELINES:
- Use markdown headers (##, ###) to structure sections
- Include bullet points for lists
- Bold important terms or requirements
- Keep paragraphs focused and concise
- End with next steps or recommendations if applicable

The response should read like a professional RFP section that could be directly included in a proposal document.

Return only valid JSON.`;

    try {
      console.log('Calling OpenAI for response synthesis...');
      console.log('Prompt length:', prompt.length);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert RFP response writer who creates professional, structured responses that directly address client questions. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('No content in OpenAI response');
        throw new Error('No response from AI');
      }

      console.log('OpenAI response received, parsing JSON...');
      console.log('Response preview:', content.substring(0, 200));

      let result;
      try {
        result = this.extractJsonFromResponse(content);
        console.log('JSON parsed successfully');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw content:', content);
        throw new Error(`JSON parse failed: ${parseError}`);
      }
      
      // Ensure sources are properly mapped
      if (!result.sources || !Array.isArray(result.sources)) {
        console.log('Fixing sources array...');
        result.sources = extraction.extractedFacts.map((fact, index) => ({
          id: (index + 1).toString(),
          relevance: fact.confidence,
          usedInResponse: true,
        }));
      }

      console.log('AI synthesis completed successfully');
      console.log('Final confidence:', result.confidence);
      console.log('Response length:', result.mainResponse?.length);

      return result;
    } catch (error: unknown) {
      console.error('AI response synthesis failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's an API error vs parsing error
      if (error instanceof Error && error.message?.includes('JSON parse')) {
        console.log('JSON parsing failed, trying fallback...');
      } else {
        console.log('OpenAI API call failed, trying fallback...');
      }
      
      // Fallback to improved synthesis
      console.log('Using fallback synthesis method...');
      return this.getImprovedResponseSynthesis(question, extraction);
    }
  }

  /**
   * Improved basic fallback response synthesis
   */
  private getImprovedResponseSynthesis(question: string, extraction: InformationExtraction): ResponseSynthesis {
    if (extraction.extractedFacts.length === 0) {
      return {
        mainResponse: `## Response to: ${question}\n\nBased on the available documentation, there is insufficient specific information to provide a comprehensive answer to this question.\n\n### Recommendations\n\n- Request additional technical documentation\n- Consult with subject matter experts\n- Clarify specific requirements`,
        confidence: 0.2,
        sources: [],
        limitations: ['No relevant information found in provided documents'],
        recommendations: ['Request additional technical documentation', 'Consult with subject matter experts']
      };
    }

    // Create a structured response
    const facts = extraction.extractedFacts;
    const avgConfidence = facts.reduce((sum, fact) => sum + fact.confidence, 0) / facts.length;
    
    let response = `## Response to: ${question}\n\n`;
    response += `Based on the available documentation, the following information addresses your question:\n\n`;
    
    // Group facts by source if possible
    const factsBySource = facts.reduce((groups: any, fact) => {
      const source = fact.source;
      if (!groups[source]) groups[source] = [];
      groups[source].push(fact);
      return groups;
    }, {});

    if (Object.keys(factsBySource).length > 1) {
      // Multiple sources - organize by source
      Object.entries(factsBySource).forEach(([source, sourceFacts]: [string, any]) => {
        response += `### Information from ${source}\n\n`;
        (sourceFacts as any[]).forEach(fact => {
          response += `- ${fact.fact}\n`;
        });
        response += '\n';
      });
    } else {
      // Single source or mixed - list all facts
      response += `### Key Information\n\n`;
      facts.forEach(fact => {
        response += `- ${fact.fact}\n`;
      });
      response += '\n';
    }

    // Add limitations if any
    if (extraction.missingInformation.length > 0) {
      response += `### Limitations\n\n`;
      response += `Please note the following limitations in the available information:\n\n`;
      extraction.missingInformation.forEach(limitation => {
        response += `- ${limitation}\n`;
      });
      response += '\n';
    }

    // Add next steps
    response += `### Next Steps\n\n`;
    if (extraction.missingInformation.length > 0) {
      response += `To provide a more comprehensive response, consider:\n\n`;
      response += `- Providing additional relevant documentation\n`;
      response += `- Clarifying specific technical requirements\n`;
      response += `- Consulting with technical subject matter experts\n`;
    } else {
      response += `Based on the available information, we can proceed with implementation planning and detailed technical specifications.\n`;
    }

    return {
      mainResponse: response,
      confidence: Math.min(avgConfidence, 0.9),
      sources: facts.map((fact, index) => ({
        id: (index + 1).toString(),
        relevance: fact.confidence,
        usedInResponse: true,
      })),
      limitations: extraction.missingInformation,
      recommendations: extraction.missingInformation.length > 0 
        ? ['Provide additional technical documentation', 'Clarify specific requirements']
        : ['Proceed with detailed implementation planning']
    };
  }

  /**
   * Step 5: AI-powered response validation
   */
  private async validateResponseWithAI(
    question: string,
    synthesis: ResponseSynthesis,
    analysis: QuestionAnalysis,
    extraction: InformationExtraction
  ): Promise<{ isValid: boolean; improvements: string[]; finalConfidence: number }> {
    const prompt = `Validate this RFP response for quality and completeness:

Original Question: "${question}"
Question Complexity: ${analysis.complexity}
Required Information: ${analysis.requiredInformation.join(', ')}

Generated Response:
${synthesis.mainResponse}

Response Confidence: ${synthesis.confidence}
Sources Used: ${synthesis.sources.length}
Limitations: ${synthesis.limitations.join(', ')}

Please validate and return JSON with:
1. isValid: boolean indicating if response meets quality standards
2. improvements: array of specific improvement suggestions
3. finalConfidence: adjusted confidence score 0-1

Consider:
- Does the response directly address the question?
- Is the information accurate and relevant?
- Are sources properly utilized?
- Are limitations appropriately acknowledged?
- Is the response complete for the question complexity?

Return only valid JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert at validating RFP responses for quality and completeness. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return this.extractJsonFromResponse(content);
    } catch (error) {
      console.error('AI response validation failed:', error);
      // Fallback to basic validation
      return this.getBasicValidation(synthesis);
    }
  }

  /**
   * Basic fallback validation
   */
  private getBasicValidation(synthesis: ResponseSynthesis): { isValid: boolean; improvements: string[]; finalConfidence: number } {
    const improvements: string[] = [];
    
    if (synthesis.confidence < this.config.minConfidenceThreshold) {
      improvements.push('Consider gathering additional sources for higher confidence');
    }
    
    if (synthesis.limitations.length > 3) {
      improvements.push('Response has many limitations - consider alternative approaches');
    }

    if (synthesis.sources.length < 2) {
      improvements.push('Limited source coverage - additional documentation may be needed');
    }

    return {
      isValid: synthesis.confidence >= this.config.minConfidenceThreshold,
      improvements,
      finalConfidence: Math.min(synthesis.confidence * 1.1, 1.0),
    };
  }

  /**
   * Execute a single step with timing and error handling
   */
  private async executeStep<T>(
    type: any,
    options: {
      title: string;
      description: string;
      executor: () => Promise<T>;
    }
  ): Promise<StepResult> {
    const stepId = generateId();
    const startTime = new Date();

    const step: StepResult = {
      id: stepId,
      type,
      title: options.title,
      description: options.description,
      status: 'running',
      startTime,
    };

    try {
      console.log(`Executing step: ${options.title}`);
      const output = await Promise.race([
        options.executor(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Step timeout')), this.config.timeoutPerStep)
        )
      ]);

      const endTime = new Date();
      step.status = 'completed';
      step.endTime = endTime;
      step.duration = endTime.getTime() - startTime.getTime();
      step.output = output;

      console.log(`Step completed: ${options.title} (${step.duration}ms)`);
      return step;

    } catch (error) {
      const endTime = new Date();
      step.status = 'failed';
      step.endTime = endTime;
      step.duration = endTime.getTime() - startTime.getTime();
      step.error = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Step failed: ${options.title}`, error);
      throw error;
    }
  }

  /**
   * Fallback to single-step generation if multi-step fails
   */
  private async fallbackToSingleStep(
    request: MultiStepGenerateRequest,
    completedSteps: StepResult[]
  ): Promise<MultiStepResponse> {
    console.log('Executing fallback single-step generation');
    
    const fallbackResponse = await this.llamaIndexService.generateResponse(request.question);
    
    return {
      id: generateId(),
      questionId: request.questionId,
      steps: completedSteps,
      finalResponse: fallbackResponse.response,
      overallConfidence: 0.6,
      totalDuration: Date.now(),
      sources: fallbackResponse.sources.map(source => ({
        id: source.id.toString(),
        fileName: source.fileName || 'Unknown Document',
        relevance: source.relevance ? source.relevance / 100 : 0.5,
        pageNumber: source.pageNumber,
        textContent: source.textContent,
      })),
      metadata: {
        modelUsed: 'fallback',
        tokensUsed: 0,
        stepsCompleted: completedSteps.length,
        processingStartTime: new Date(),
        processingEndTime: new Date(),
      },
    };
  }

  /**
   * Streaming version for real-time updates
   */
  async *generateResponseStream(
    request: MultiStepGenerateRequest
  ): AsyncGenerator<StepUpdate | MultiStepResponse> {
    const response = await this.generateResponse(request);
    yield response;
  }

  /**
   * Get detailed step information
   */
  async getStepDetails(stepId: string): Promise<StepResult | null> {
    return null;
  }

  /**
   * Helper methods
   */
  private getSourceFileName(sourceId: string, searchResults: DocumentSearchResult[]): string {
    for (const result of searchResults) {
      const source = result.relevantSources.find(s => s.id === sourceId);
      if (source) return source.title;
    }
    return 'Unknown Document';
  }

  private getSourcePageNumber(sourceId: string, searchResults: DocumentSearchResult[]): string | undefined {
    return undefined;
  }

  private getSourceTextContent(sourceId: string, searchResults: DocumentSearchResult[]): string | undefined {
    for (const result of searchResults) {
      const source = result.relevantSources.find(s => s.id === sourceId);
      if (source) return source.snippet;
    }
    return undefined;
  }

  private calculateActualTokens(steps: StepResult[]): number {
    // Calculate based on actual step outputs and AI usage
    return steps.reduce((total, step) => {
      if (step.output && typeof step.output === 'object') {
        const outputStr = JSON.stringify(step.output);
        return total + Math.ceil(outputStr.length / 4); // Rough token estimate
      }
      return total + 100; // Base tokens per step
    }, 0);
  }
}

// Export singleton instance
export const multiStepResponseService = new MultiStepResponseService(); 