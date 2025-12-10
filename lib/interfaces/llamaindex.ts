export interface LlamaIndexConfig {
  apiKey: string;
  projectName: string;
  indexNames?: string[];
}

export interface SourceMetadata {
  file_name?: string;
  file_path?: string;
  page_label?: string;
  start_page_label?: string;
  document_id?: string;
  [key: string]: any;
}

export interface SourceNode {
  node: {
    text?: string;
    metadata: SourceMetadata;
  };
  score?: number;
}

export interface ResponseSource {
  id: number;
  fileName: string;
  filePath?: string;
  pageNumber?: string;
  documentId?: string;
  relevance?: number;
  textContent?: string;
}

export interface GenerateResponseOptions {
  documentIds?: string[];
  selectedIndexIds?: string[];
  useAllIndexes?: boolean;
}

export interface ResponseResult {
  response: string;
  sources: ResponseSource[];
  confidence: number;
  generatedAt: string;
}

export interface ILlamaIndexService {
  generateResponse(
    question: string, 
    options?: GenerateResponseOptions
  ): Promise<ResponseResult>;
  
  generateDefaultResponse(question: string): Promise<ResponseResult>;
} 