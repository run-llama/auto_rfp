import { env, validateEnv } from "./env";
import { LlamaCloudIndex, ContextChatEngine } from "llamaindex";
import { 
  ILlamaIndexService,
  LlamaIndexConfig,
  GenerateResponseOptions,
  ResponseResult,
  ResponseSource,
  SourceNode
} from "./interfaces/llama-index";
import { DefaultResponseService } from "./services/default-response-service";
import { ExternalServiceError } from "./errors/api-errors";

/**
 * Service for interacting with LlamaIndex Cloud API
 */
export class LlamaIndexService implements ILlamaIndexService {
  private readonly config: LlamaIndexConfig;
  private readonly indexes: LlamaCloudIndex[] = [];
  private readonly defaultResponseService: DefaultResponseService;
  
  constructor(config?: Partial<LlamaIndexConfig>) {
    this.defaultResponseService = new DefaultResponseService();
    
    if (config?.apiKey) {
      // Use provided configuration (dynamic mode)
      this.config = {
        apiKey: config.apiKey,
        projectName: config.projectName || 'Default',
        indexNames: config.indexNames,
      };
    } else {
      // Fallback to environment variables (for default responses)
    if (!validateEnv()) {
      throw new Error('Required environment variables are missing');
    }
      this.config = {
        apiKey: env.LLAMACLOUD_API_KEY,
        projectName: 'Default',
      };
  }
  
    this.initializeIndexes();
  }

  private initializeIndexes(): void {

    try {
      // Extract hostname from LLAMACLOUD_API_URL for LlamaCloudIndex
      // The SDK expects just the hostname (e.g., 'api.cloud.eu.llamaindex.ai')
      const baseUrlHostname = new URL(env.LLAMACLOUD_API_URL).hostname;

      console.log('Initializing LlamaCloud indexes with config:', this.config);
      if (this.config.indexNames && this.config.indexNames.length > 0) {
        this.indexes.push(
          ...this.config.indexNames.map(indexName =>
            new LlamaCloudIndex({
              name: indexName,
              projectName: this.config.projectName,
              apiKey: this.config.apiKey,
              baseUrl: baseUrlHostname,
            })
          )
        );
        console.log(`Initialized ${this.indexes.length} LlamaCloud indexes:`, this.config.indexNames);
      } else {
        // No specific indexes configured - will use default responses
        console.log('No specific indexes configured, will use default responses when needed');
          }
        } catch (error) {
      console.error('Failed to initialize LlamaCloud indexes:', error);
      // Don't throw here - allow fallback to default responses
    }
  }
  
  async generateResponse(
    question: string, 
    options: GenerateResponseOptions = {}
  ): Promise<ResponseResult> {
    try {
      if (this.indexes.length === 0) {
        console.log('No LlamaCloud indexes configured, using default response service');
        return this.generateDefaultResponse(question);
      }

      console.log(`Using LlamaCloud index: ${this.config.indexNames?.[0] || 'unknown'} (from ${this.indexes.length} available indexes)`);
      
      // For now, use the first available index
      // TODO: Enhance to query multiple indexes and combine results
      const index = this.indexes[0];
      
      const result = await this.queryIndex(index, question);
      return this.formatResponse(result.response, result.sourceNodes);
    } catch (error) {
      console.error('Error generating response with LlamaIndex:', error);
      
      if (error instanceof Error && error.message.includes('API')) {
        throw new ExternalServiceError(
          `LlamaCloud API error: ${error.message}`,
          'LlamaCloud'
        );
      }
      
      // Fallback to default response for other errors
      console.log('Falling back to default response due to error');
      return this.generateDefaultResponse(question);
    }
  }
  
  private async queryIndex(index: LlamaCloudIndex, question: string) {
    const retriever = index.asRetriever({
      similarityTopK: 5,
    });

    const chatEngine = new ContextChatEngine({ retriever });
    const responder = await chatEngine.chat({ message: question });
    
    return {
      response: responder.response,
      sourceNodes: responder.sourceNodes || []
    };
  }

  private formatResponse(response: string, sourceNodes: any[]): ResponseResult {
    const sources = this.extractSources(sourceNodes);
    
    return {
      response,
      sources,
      confidence: 0.95, // Placeholder - LlamaIndex doesn't directly provide confidence scores
      generatedAt: new Date().toISOString(),
    };
  }

  private extractSources(sourceNodes: any[]): ResponseSource[] {
    return sourceNodes.map((node: SourceNode, index: number) => {
      const textContent = this.extractTextContent(node);
      const metadata = node.node?.metadata || {};
      
      return {
        id: index + 1, // Use 1-based indexing for user-friendly display
        fileName: metadata.file_name || 'Unknown',
        filePath: metadata.file_path,
        pageNumber: metadata.page_label || metadata.start_page_label,
        documentId: metadata.document_id,
        relevance: node.score ? Math.round(node.score * 100) : undefined,
        textContent
      };
    });
  }

  private extractTextContent(node: SourceNode): string | undefined {
    try {
      if (node.node?.text) {
        return node.node.text;
      }
      
      if (node.node?.metadata && 'text' in node.node.metadata) {
        return (node.node.metadata as any).text;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting text content from node:', error);
      return undefined;
    }
  }
  
  generateDefaultResponse(question: string): Promise<ResponseResult> {
    const result = this.defaultResponseService.generateResponse(question);
    return Promise.resolve(result);
  }

  // Utility methods for testing and debugging
  getIndexCount(): number {
    return this.indexes.length;
  }

  getConfig(): Readonly<LlamaIndexConfig> {
    return { ...this.config };
  }
} 