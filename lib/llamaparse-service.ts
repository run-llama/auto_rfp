import { env, validateEnv } from "./env";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Types for parse options
export interface ParseOptions {
  fastMode?: boolean;
  premiumMode?: boolean;
  complexTables?: boolean;
  agenticMode?: boolean;
}

/**
 * Service for interacting with LlamaParse
 */
export class LlamaParseService {
  private apiKey: string;
  
  constructor() {
    if (!validateEnv()) {
      throw new Error('Required environment variables are missing');
    }
    
    this.apiKey = env.LLAMACLOUD_API_KEY;
  }
  
  /**
   * Parse a file using LlamaParse
   */
  async parseFile(
    file: File,
    options: ParseOptions = {}
  ) {
    try {
      // Step 1: Convert the File object to a file path by saving it temporarily
      const filePath = await this.saveFileToTemp(file);
      
      // Step 2: Configure parsing options
      let mode = 'balanced'; // default mode
      
      if (options.fastMode) {
        mode = 'fast';
      } else if (options.premiumMode) {
        mode = 'premium';
      } else if (options.complexTables) {
        mode = 'complexTables';
      }
      
      console.log('Started parsing the file');
      
      // Step 3: Use dynamic import to avoid constructor issues
      const llamaIndexModule = await import('llamaindex');
      const { LlamaParseReader } = llamaIndexModule;
      
      // Step 4: Configure options based on the mode
      // Default to agentic mode for better multi-sheet/multi-page parsing
      const useAgentic = options.agenticMode !== false;

      // LlamaParseReader uses protocol + hostname format (no /api/v1)
      // env.LLAMACLOUD_API_URL is already in this format
      let readerOptions: Record<string, any> = {
        apiKey: this.apiKey,
        resultType: "markdown",
        useAgenticParse: useAgentic,
        baseUrl: env.LLAMACLOUD_API_URL,
      };
      
      // Add mode-specific options
      if (mode === 'fast') {
        readerOptions.fast_mode = true;
      } else if (mode === 'premium') {
        readerOptions.premium_mode = true;
      } else if (mode === 'complexTables') {
        readerOptions.complexTables = true;
      }
      
      console.log(`Creating reader with options:`, readerOptions);
      
      // Step 5: Create the reader with the appropriate options
      const reader = new LlamaParseReader(readerOptions);
      
      // Step 6: Parse the document
      const documents = await reader.loadData(filePath);
      
      // Log successful parsing
      console.log("Document parsed successfully");
      console.log(`Number of documents returned: ${documents.length}`);
      
      if (documents.length > 0) {
        console.log(`First document text length: ${documents[0]?.text?.length || 0}`);
        console.log(`First document text preview: ${documents[0]?.text?.substring(0, 200) || 'No text content'}`);
      } else {
        console.log("WARNING: No documents were returned from LlamaParse");
      }
      
      // Step 7: Clean up the temporary file
      await fs.promises.unlink(filePath);
      
      // Step 8: Combine all documents into one text (LlamaParse often returns multiple docs for multi-page content)
      const documentText = documents.map(doc => doc.text || '').join('\n\n');
      
      // Log final content for debugging
      console.log(`Total documents parsed: ${documents.length}`);
      console.log(`Final combined document text length: ${documentText.length}`);
      
      if (documents.length > 1) {
        console.log(`Individual document lengths: ${documents.map((doc, i) => `Doc ${i+1}: ${doc.text?.length || 0} chars`).join(', ')}`);
      }
      
      if (documentText.length === 0) {
        console.error("ERROR: Document content is empty after parsing!");
      }
      
      // Step 9: Return the result
      return {
        id: `llamaparse-${Date.now()}`,
        status: 'success',
        documentName: file.name,
        content: documentText,
        metadata: {
          mode: mode as any,
          wordCount: this.countWords(documentText),
          pageCount: this.estimatePages(documentText),
          summary: this.generateSummary(documentText),
        }
      };
    } catch (error) {
      console.error('Error parsing file with LlamaParse:', error);
      throw error;
    }
  }
  
  /**
   * Save a File object to a temporary file and return the path
   */
  private async saveFileToTemp(file: File): Promise<string> {
    // Create buffer from file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create temporary file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    
    // Write to temporary file
    await fs.promises.writeFile(tempFilePath, buffer);
    
    return tempFilePath;
  }
  
  /**
   * Count words in a text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }
  
  /**
   * Estimate page count based on word count
   * (roughly 500 words per page as a simple estimation)
   */
  private estimatePages(text: string): number {
    const words = this.countWords(text);
    return Math.max(1, Math.ceil(words / 500));
  }
  
  /**
   * Generate a short summary of the document content
   */
  private generateSummary(text: string): string {
    // In a production app, you would use an LLM to generate a summary
    // For now, we'll just take the first 100 words
    const words = text.split(/\s+/).filter(Boolean);
    const summary = words.slice(0, 100).join(' ');
    return summary + (words.length > 100 ? '...' : '');
  }
} 