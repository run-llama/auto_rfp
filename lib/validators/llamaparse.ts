import { z } from 'zod';

// Supported file extensions
export const SUPPORTED_FILE_EXTENSIONS = ['csv', 'xlsx', 'xls', 'pdf', 'doc', 'docx'] as const;

// LlamaParse request validation schema
export const LlamaParseRequestSchema = z.object({
  file: z.instanceof(File, { message: 'Valid file is required' }),
  fast_mode: z.boolean().optional().default(false),
  premium_mode: z.boolean().optional().default(false),
  agentic_mode: z.boolean().optional().default(true),
  preset: z.enum(['complexTables']).optional(),
  documentName: z.string().optional(),
});

// LlamaParse parsing options schema
export const LlamaParseOptionsSchema = z.object({
  fastMode: z.boolean().default(false),
  premiumMode: z.boolean().default(false),
  complexTables: z.boolean().default(false),
  agenticMode: z.boolean().default(false),
});

// File validation schema
export const FileValidationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().positive('File size must be positive'),
  type: z.string().min(1, 'File type is required'),
});

// LlamaParse result schema (from service)
export const LlamaParseResultSchema = z.object({
  id: z.string(),
  documentName: z.string(),
  status: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

// LlamaParse response validation schema
export const LlamaParseResponseSchema = z.object({
  success: z.boolean(),
  documentId: z.string(),
  documentName: z.string(),
  status: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Type exports
export type LlamaParseRequest = z.infer<typeof LlamaParseRequestSchema>;
export type LlamaParseOptions = z.infer<typeof LlamaParseOptionsSchema>;
export type FileValidation = z.infer<typeof FileValidationSchema>;
export type LlamaParseResult = z.infer<typeof LlamaParseResultSchema>;
export type LlamaParseResponse = z.infer<typeof LlamaParseResponseSchema>; 