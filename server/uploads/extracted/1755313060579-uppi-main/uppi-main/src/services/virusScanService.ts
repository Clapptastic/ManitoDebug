/**
 * Virus Scanning Service
 * Provides virus and malware scanning for file content
 */

export interface ScanResult {
  isClean: boolean;
  threats: string[];
  scanDetails?: {
    engine: string;
    scanTime: number;
    fileHash: string;
  };
}

export class VirusScanService {
  private static instance: VirusScanService;

  public static getInstance(): VirusScanService {
    if (!VirusScanService.instance) {
      VirusScanService.instance = new VirusScanService();
    }
    return VirusScanService.instance;
  }

  /**
   * Scan file content for viruses and malware
   */
  async scanFileContent(content: string, fileName: string): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // Basic content validation
      const threats = this.detectBasicThreats(content, fileName);
      
      // Generate file hash for tracking
      const fileHash = await this.generateHash(content);
      
      const scanTime = Date.now() - startTime;
      
      return {
        isClean: threats.length === 0,
        threats,
        scanDetails: {
          engine: 'Basic Content Scanner v1.0',
          scanTime,
          fileHash
        }
      };
    } catch (error) {
      console.error('Virus scan failed:', error);
      // Fail safe - consider file potentially unsafe if scan fails
      return {
        isClean: false,
        threats: ['Scan failed - file rejected for safety'],
        scanDetails: {
          engine: 'Basic Content Scanner v1.0',
          scanTime: Date.now() - startTime,
          fileHash: 'unknown'
        }
      };
    }
  }

  /**
   * Detect basic threats in file content
   */
  private detectBasicThreats(content: string, fileName: string): string[] {
    const threats: string[] = [];
    
    // Check for suspicious executable patterns
    const executableExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
    if (executableExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
      threats.push('Executable file type detected');
    }
    
    // Check for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi
    ];
    
    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push('Potential script injection detected');
        break;
      }
    }
    
    // Check for suspicious command patterns
    const commandPatterns = [
      /rm\s+-rf\s+\//gi,
      /del\s+\/[sq]/gi,
      /format\s+c:/gi,
      /shutdown\s+-[rf]/gi,
      /wget\s+.*\|\s*sh/gi,
      /curl\s+.*\|\s*bash/gi
    ];
    
    for (const pattern of commandPatterns) {
      if (pattern.test(content)) {
        threats.push('Potentially destructive command detected');
        break;
      }
    }
    
    // Check for excessive size (potential bomb files)
    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      threats.push('File size exceeds safety limits');
    }
    
    // Check for binary content disguised as text
    const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/g;
    const binaryMatches = content.match(binaryPattern);
    if (binaryMatches && binaryMatches.length > content.length * 0.1) {
      threats.push('Suspicious binary content detected');
    }
    
    return threats;
  }

  /**
   * Generate a simple hash for file content
   */
  private async generateHash(content: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hash generation failed:', error);
      return 'hash_failed_' + Date.now();
    }
  }
}

export const virusScanService = VirusScanService.getInstance();