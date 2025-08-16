/**
 * Chat File Service
 * Handles file creation and saving from AI chat responses
 */

import { enhancedDocumentService } from './documents/enhancedDocumentService';
import { virusScanService } from './virusScanService';
import { toast } from '@/hooks/use-toast';

export interface FileDetectionResult {
  hasFiles: boolean;
  files: DetectedFile[];
}

export interface DetectedFile {
  name: string;
  content: string;
  type: string;
  language?: string;
}

export class ChatFileService {
  private static instance: ChatFileService;

  public static getInstance(): ChatFileService {
    if (!ChatFileService.instance) {
      ChatFileService.instance = new ChatFileService();
    }
    return ChatFileService.instance;
  }

  /**
   * Detect files in AI response content
   */
  detectFiles(content: string): FileDetectionResult {
    const files: DetectedFile[] = [];
    
    // Pattern to match code blocks with file names
    const codeBlockPattern = /```(\w+)?\s*(?:\/\/\s*(.+\.[\w]+)|#\s*(.+\.[\w]+)|<!--\s*(.+\.[\w]+)\s*-->)?\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = codeBlockPattern.exec(content)) !== null) {
      const language = match[1] || 'text';
      const fileName = match[2] || match[3] || match[4] || this.generateFileName(language);
      const fileContent = match[5].trim();
      
      if (fileContent && fileName) {
        files.push({
          name: fileName,
          content: fileContent,
          type: this.getFileType(fileName),
          language
        });
      }
    }

    // Pattern for explicit file creation mentions
    const fileCreationPattern = /(?:create|save|write)\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?([a-zA-Z0-9._-]+\.[\w]+)/gi;
    
    let creationMatch;
    while ((creationMatch = fileCreationPattern.exec(content)) !== null) {
      const fileName = creationMatch[1];
      
      // Look for associated content near the file name
      const context = this.extractContextAroundMatch(content, creationMatch.index, 500);
      const contextCodeBlocks = this.extractCodeBlocks(context);
      
      if (contextCodeBlocks.length > 0 && !files.some(f => f.name === fileName)) {
        files.push({
          name: fileName,
          content: contextCodeBlocks[0],
          type: this.getFileType(fileName)
        });
      }
    }

    return {
      hasFiles: files.length > 0,
      files
    };
  }

  /**
   * Save detected files to document storage with virus scanning
   */
  async saveFilesToStorage(files: DetectedFile[]): Promise<{ saved: number; failed: number; errors: string[] }> {
    let saved = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Scan file for viruses/malware
        const scanResult = await virusScanService.scanFileContent(file.content, file.name);
        
        if (!scanResult.isClean) {
          failed++;
          const threatList = scanResult.threats.join(', ');
          errors.push(`${file.name}: Security threats detected - ${threatList}`);
          
          toast({
            title: 'File Rejected',
            description: `${file.name} was not saved due to security concerns: ${threatList}`,
            variant: 'destructive'
          });
          continue;
        }

        // Create blob and convert to File object
        const blob = new Blob([file.content], { type: 'text/plain' });
        const fileObj = new File([blob], file.name, { type: 'text/plain' });

        // Save to document storage
        await enhancedDocumentService.uploadDocument(fileObj, {
          title: file.name,
          description: `AI-generated file (${file.language || file.type})`,
          category: 'ai-generated',
          tags: ['ai-created', file.language || file.type],
          isPublic: false
        });

        saved++;
        
        toast({
          title: 'File Saved',
          description: `${file.name} has been saved to your document storage`,
          variant: 'default'
        });

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMsg}`);
        
        console.error(`Failed to save file ${file.name}:`, error);
      }
    }

    return { saved, failed, errors };
  }

  /**
   * Extract context around a match position
   */
  private extractContextAroundMatch(text: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.slice(start, end);
  }

  /**
   * Extract code blocks from text
   */
  private extractCodeBlocks(text: string): string[] {
    const codeBlocks: string[] = [];
    const pattern = /```[\w]*\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return codeBlocks;
  }

  /**
   * Generate a filename based on language
   */
  private generateFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh',
      yaml: 'yml',
      markdown: 'md'
    };

    const ext = extensions[language.toLowerCase()] || 'txt';
    const timestamp = Date.now().toString().slice(-6);
    return `ai_generated_${timestamp}.${ext}`;
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const typeMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'c++',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      sh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      txt: 'text'
    };

    return typeMap[ext] || 'text';
  }
}

export const chatFileService = ChatFileService.getInstance();