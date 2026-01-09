import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { organizationService } from '@/lib/organization-service';
import { db } from '@/lib/db';
import { LlamaIndexService } from '@/lib/llamaindex-service';
import { getLlamaCloudApiKey } from '@/lib/env';

export async function POST(request: NextRequest) {
  console.log('🎯 Multi-step API route called');

  try {
    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // Extract data from useChat format
    const { messages, projectId, indexIds } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ No messages provided');
      return new Response('Messages array is required', { status: 400 });
    }
    
    if (!projectId) {
      console.log('❌ No projectId provided');
      return new Response('Project ID is required', { status: 400 });
    }
    
    if (!indexIds || !Array.isArray(indexIds) || indexIds.length === 0) {
      console.log('❌ No indexIds provided');
      return new Response('At least one index ID is required', { status: 400 });
    }
    
    // Get the user's question from the latest message
    const latestMessage = messages[messages.length - 1];
    const question = latestMessage?.content;
    
    if (!question) {
      console.log('❌ No question content found in latest message');
      return new Response('Question content is required', { status: 400 });
    }
    
    console.log('✅ Request validated:', { question, projectId, indexIds });

    // Get current user and validate permissions
    const currentUser = await organizationService.getCurrentUser();
    console.log('👤 Current user:', currentUser?.id);
    
    if (!currentUser) {
      console.log('❌ No authenticated user found');
      return new Response('Authentication required', { status: 401 });
    }

    // Get project configuration
    console.log('🔍 Fetching project:', projectId);
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
      console.log('❌ Project not found:', projectId);
      return new Response('Project not found', { status: 404 });
    }
    
    console.log('✅ Project found:', project.name);

    const isMember = await organizationService.isUserOrganizationMember(
      currentUser.id,
      project.organization.id
    );
    
    if (!isMember) {
      console.log('❌ User not a member of organization');
      return new Response('Access denied', { status: 403 });
    }

    // Search documents using LlamaIndex
    console.log('🔍 Searching documents with LlamaIndex...');
    let documentContext = '';
    let documentSources: any[] = [];
    
    if (project.organization.llamaCloudProjectId && project.organization.llamaCloudConnectedAt) {
      try {
        console.log('🔑 LlamaCloud API key found, initializing service...');
        
        // Convert index IDs to index names by looking up in project indexes
        const indexNames: string[] = [];
        for (const indexId of indexIds) {
          const projectIndex = project.projectIndexes.find(pi => pi.indexId === indexId);
          if (projectIndex) {
            indexNames.push(projectIndex.indexName);
          } else {
            console.warn(`⚠️ Index ID ${indexId} not found in project indexes, skipping`);
          }
        }
        
        if (indexNames.length === 0) {
          console.log('⚠️ No valid index names found after converting IDs');
          documentContext = 'No valid document indexes found.';
        } else {
          console.log(`📋 Using index names: ${indexNames.join(', ')}`);
          
          const apiKey = getLlamaCloudApiKey(currentUser.email);
          const llamaIndexService = new LlamaIndexService({
            apiKey: apiKey,
            projectName: project.organization.llamaCloudProjectName || 'Default',
            indexNames: indexNames,
          });

          console.log('📋 Calling LlamaIndex with question:', question);
          const searchResult = await llamaIndexService.generateResponse(question);
          documentContext = searchResult.response;
          documentSources = searchResult.sources || [];
          
          console.log(`✅ LlamaIndex search completed:`, {
            sourcesFound: documentSources.length,
            contextLength: documentContext.length,
            sources: documentSources.map(s => ({
              id: s.id,
              fileName: s.fileName,
              pageNumber: s.pageNumber,
              relevance: s.relevance
            }))
          });
        }
      } catch (error) {
        console.error('⚠️ Document search failed:', error);
        documentContext = 'No relevant documents found.';
      }
    } else {
      console.log('⚠️ No LlamaCloud API key found in organization');
    }

    console.log('🚀 Starting OpenAI streaming...');

    // Create system message for RFP-focused reasoning with document context
    const systemMessage = `You are an expert RFP (Request for Proposal) analyst and response specialist. 
    You analyze RFP questions systematically and provide comprehensive, professional responses.
    
    IMPORTANT: You must follow this exact process:
    1. Use the addReasoningStep function EXACTLY 5 times to show your thinking process
    2. After completing all 5 reasoning steps, you MUST provide a comprehensive final answer as regular text (not using any tool)
    
    The 5 reasoning steps should cover:
    1. Analyze what type of information is being requested
    2. Search through available documents for relevant information  
    3. Extract and synthesize key facts from the documents
    4. Create a professional RFP response structure
    5. Validate the response for completeness and accuracy
    
    DOCUMENT CONTEXT FROM ORGANIZATION'S KNOWLEDGE BASE:
    ${documentContext}
    
    AVAILABLE SOURCES FOR CITATION:
    ${documentSources.map((source, index) => 
      `Source ${index + 1}: "${source.fileName}" (Page: ${source.pageNumber || 'N/A'}) - Relevance: ${source.relevance || 'N/A'}%
      Content Preview: ${source.textContent?.substring(0, 300) || 'No content preview available'}...`
    ).join('\n\n')}
    
    CRITICAL CITATION REQUIREMENTS:
    - You MUST reference specific sources in your reasoning steps using [Source X] format where X is the source number
    - You MUST include multiple [Source X] citations in your final response
    - When you mention any fact, claim, or data point, cite the relevant source immediately
    - Example: "Our organization provides services globally [Source 1] with specific capabilities in telecommunications [Source 2]."
    
    After completing ALL 5 reasoning steps, you MUST provide a detailed final response as plain text. Do not use the addReasoningStep tool for the final response - just write your comprehensive answer directly.
    
    Guidelines for final response:
    - Start with a clear heading and structure your response professionally using markdown
    - Use proper markdown formatting: ## for main headings, ### for subheadings, **bold** for emphasis, - for bullet points
    - MANDATORY: Include [Source X] citations throughout your response whenever referencing information
    - Focus on providing specific, actionable information based on the retrieved documents
    - Maintain a professional, confident tone appropriate for business proposals
    - Address any limitations or gaps in available information
    - Structure responses with clear markdown headings and bullet points when appropriate
    - Always provide next steps or recommendations when relevant
    - Format your response as clean, readable markdown that will be properly rendered
    
    Remember: Every factual claim in your final response should include a [Source X] citation!
    
    Question: "${question}"
    Available document indexes: ${indexIds.length} indexes selected
    Retrieved sources: ${documentSources.length} documents found for citation`;

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      maxSteps: 10, // Allow more steps to include final response
      experimental_toolCallStreaming: true,
      tools: {
        addReasoningStep: {
          description: 'Add a step to the RFP analysis and response generation process. Use this exactly 5 times, then provide your final answer as regular text.',
          parameters: z.object({
            title: z.string().describe('The title of the reasoning step (e.g., "Analyzing Question Requirements", "Searching Documents")'),
            content: z.string().describe('The detailed content of the reasoning step. Include specific findings, analysis, and reasoning. Reference sources using [Source X] format.'),
            nextStep: z.enum(['continue', 'finalAnswer']).describe('Use "continue" for steps 1-4, and "finalAnswer" for step 5. After step 5, provide your final response as regular text.'),
          }),
          execute: async (params) => params,
        },
      },
    });

    console.log('📡 Returning streaming response...');
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('💥 Multi-step streaming failed:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 