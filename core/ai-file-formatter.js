import fs from 'fs/promises';
import path from 'path';

export class AIFileFormatter {
  constructor() {
    this.fileCache = new Map();
    this.analysisCache = new Map();
  }

  // Format files for AI analysis
  async formatFilesForAI(filePaths, options = {}) {
    const formattedFiles = [];
    const fileAnalysis = {
      metadata: {},
      files: [],
      relationships: [],
      patterns: [],
      insights: []
    };

    for (const filePath of filePaths) {
      try {
        const formattedFile = await this.formatSingleFile(filePath, options);
        if (formattedFile) {
          formattedFiles.push(formattedFile);
          fileAnalysis.files.push(formattedFile);
        }
      } catch (error) {
        console.warn(`Error formatting file ${filePath}:`, error.message);
      }
    }

    // Generate comprehensive analysis
    fileAnalysis.metadata = this.generateMetadata(formattedFiles);
    fileAnalysis.relationships = this.analyzeRelationships(formattedFiles);
    fileAnalysis.patterns = this.detectPatterns(formattedFiles);
    fileAnalysis.insights = this.generateInsights(formattedFiles);

    return fileAnalysis;
  }

  // Format a single file for AI analysis
  async formatSingleFile(filePath, options = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath);
      const fileName = path.basename(filePath);
      const relativePath = filePath;

      const formattedFile = {
        // File identification
        id: this.generateFileId(filePath),
        name: fileName,
        path: relativePath,
        extension: ext,
        type: this.getFileType(ext),

        // File metadata
        metadata: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          lines: content.split('\n').length,
          characters: content.length
        },

        // Content analysis
        content: {
          raw: content,
          lines: content.split('\n'),
          structure: this.analyzeFileStructure(content, ext),
          imports: this.extractImports(content, ext),
          exports: this.extractExports(content, ext),
          functions: this.extractFunctions(content, ext),
          classes: this.extractClasses(content, ext),
          variables: this.extractVariables(content, ext),
          comments: this.extractComments(content, ext)
        },

        // Code quality metrics
        metrics: {
          complexity: this.calculateComplexity(content),
          maintainability: this.calculateMaintainability(content),
          readability: this.calculateReadability(content),
          testability: this.calculateTestability(content),
          documentation: this.calculateDocumentation(content)
        },

        // Dependencies and relationships
        dependencies: {
          imports: this.extractImports(content, ext),
          requires: this.extractRequires(content, ext),
          dynamic: this.extractDynamicImports(content, ext),
          external: this.extractExternalDependencies(content, ext)
        },

        // Architecture analysis
        architecture: {
          layer: this.determineArchitectureLayer(filePath),
          pattern: this.detectArchitecturePattern(content, ext),
          responsibility: this.analyzeResponsibility(content, ext),
          coupling: this.analyzeCoupling(content, ext),
          cohesion: this.analyzeCohesion(content, ext)
        },

        // Security analysis
        security: {
          vulnerabilities: this.detectSecurityVulnerabilities(content, ext),
          bestPractices: this.checkSecurityBestPractices(content, ext),
          risks: this.assessSecurityRisks(content, ext)
        },

        // Performance analysis
        performance: {
          bottlenecks: this.detectPerformanceBottlenecks(content, ext),
          optimizations: this.suggestPerformanceOptimizations(content, ext),
          metrics: this.calculatePerformanceMetrics(content, ext)
        },

        // AI-friendly summary
        aiSummary: this.generateAISummary(filePath, content, ext)
      };

      return formattedFile;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
  }

  // Generate AI-friendly summary
  generateAISummary(filePath, content, ext) {
    const lines = content.split('\n');
    const functions = this.extractFunctions(content, ext);
    const classes = this.extractClasses(content, ext);
    const imports = this.extractImports(content, ext);

    return {
      purpose: this.determineFilePurpose(filePath, content, ext),
      mainComponents: {
        functions: functions.length,
        classes: classes.length,
        imports: imports.length
      },
      keyFeatures: this.extractKeyFeatures(content, ext),
      complexity: this.calculateComplexity(content),
      dependencies: imports.length,
      documentation: this.calculateDocumentation(content),
      testCoverage: this.estimateTestCoverage(filePath, content),
      lastModified: new Date().toISOString(),
      summary: this.generateTextSummary(filePath, content, ext)
    };
  }

  // Analyze file structure
  analyzeFileStructure(content, ext) {
    const lines = content.split('\n');
    const structure = {
      sections: [],
      indentation: this.analyzeIndentation(lines),
      organization: this.analyzeOrganization(lines, ext),
      consistency: this.analyzeConsistency(lines, ext)
    };

    // Identify code sections
    let currentSection = { type: 'header', start: 0, end: 0 };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isImportLine(line, ext)) {
        if (currentSection.type !== 'imports') {
          if (currentSection.end > currentSection.start) {
            structure.sections.push(currentSection);
          }
          currentSection = { type: 'imports', start: i, end: i };
        }
      } else if (this.isFunctionLine(line, ext)) {
        if (currentSection.type !== 'functions') {
          if (currentSection.end > currentSection.start) {
            structure.sections.push(currentSection);
          }
          currentSection = { type: 'functions', start: i, end: i };
        }
      } else if (this.isClassLine(line, ext)) {
        if (currentSection.type !== 'classes') {
          if (currentSection.end > currentSection.start) {
            structure.sections.push(currentSection);
          }
          currentSection = { type: 'classes', start: i, end: i };
        }
      }
      
      currentSection.end = i;
    }
    
    if (currentSection.end > currentSection.start) {
      structure.sections.push(currentSection);
    }

    return structure;
  }

  // Extract imports
  extractImports(content, ext) {
    const imports = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // ES6 imports
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"](.+?)['"]/);
        if (importMatch) {
          imports.push({
            type: 'es6',
            specifiers: importMatch[1],
            source: importMatch[2],
            line: line,
            dynamic: false
          });
        }
      }
      
      // Dynamic imports
      if (trimmed.includes('import(')) {
        const dynamicMatch = trimmed.match(/import\s*\(\s*['"](.+?)['"]\s*\)/);
        if (dynamicMatch) {
          imports.push({
            type: 'dynamic',
            source: dynamicMatch[1],
            line: line,
            dynamic: true
          });
        }
      }
    }
    
    return imports;
  }

  // Extract requires (CommonJS)
  extractRequires(content, ext) {
    const requires = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('const ') && trimmed.includes('require(')) {
        const requireMatch = trimmed.match(/require\s*\(\s*['"](.+?)['"]\s*\)/);
        if (requireMatch) {
          requires.push({
            type: 'commonjs',
            source: requireMatch[1],
            line: line,
            variable: trimmed.match(/const\s+(\w+)/)?.[1] || 'unknown'
          });
        }
      }
    }
    
    return requires;
  }

  // Extract functions
  extractFunctions(content, ext) {
    const functions = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Function declarations
      const funcMatch = line.match(/(?:function\s+)?(\w+)\s*\([^)]*\)\s*{?/);
      if (funcMatch) {
        const functionName = funcMatch[1];
        const startLine = i;
        let endLine = i;
        
        // Find function end
        let braceCount = 0;
        let inFunction = false;
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine.includes('{')) {
            braceCount++;
            inFunction = true;
          }
          if (currentLine.includes('}')) {
            braceCount--;
            if (braceCount === 0 && inFunction) {
              endLine = j;
              break;
            }
          }
        }
        
        functions.push({
          name: functionName,
          startLine: startLine + 1,
          endLine: endLine + 1,
          lines: endLine - startLine + 1,
          complexity: this.calculateFunctionComplexity(lines.slice(startLine, endLine + 1))
        });
      }
    }
    
    return functions;
  }

  // Extract classes
  extractClasses(content, ext) {
    const classes = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        const startLine = i;
        let endLine = i;
        
        // Find class end
        let braceCount = 0;
        let inClass = false;
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine.includes('{')) {
            braceCount++;
            inClass = true;
          }
          if (currentLine.includes('}')) {
            braceCount--;
            if (braceCount === 0 && inClass) {
              endLine = j;
              break;
            }
          }
        }
        
        classes.push({
          name: className,
          startLine: startLine + 1,
          endLine: endLine + 1,
          lines: endLine - startLine + 1,
          methods: this.extractClassMethods(lines.slice(startLine, endLine + 1))
        });
      }
    }
    
    return classes;
  }

  // Calculate complexity
  calculateComplexity(content) {
    const lines = content.split('\n');
    let complexity = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Increment complexity for control structures
      if (trimmed.includes('if ') || trimmed.includes('else if ')) complexity++;
      if (trimmed.includes('for ') || trimmed.includes('while ')) complexity++;
      if (trimmed.includes('switch ')) complexity++;
      if (trimmed.includes('catch ')) complexity++;
      if (trimmed.includes('&&') || trimmed.includes('||')) complexity++;
      if (trimmed.includes('?')) complexity++; // ternary operators
    }
    
    return complexity;
  }

  // Calculate maintainability
  calculateMaintainability(content) {
    const lines = content.split('\n');
    const complexity = this.calculateComplexity(content);
    const linesOfCode = lines.length;
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    ).length;
    
    // Simplified maintainability index
    const maintainabilityIndex = 171 - 5.2 * Math.log(complexity) - 0.23 * Math.log(linesOfCode) - 16.2 * Math.log(commentLines);
    
    return Math.max(0, Math.min(100, maintainabilityIndex));
  }

  // Determine architecture layer
  determineArchitectureLayer(filePath) {
    const pathParts = filePath.split('/');
    
    if (pathParts.includes('components') || pathParts.includes('pages')) return 'presentation';
    if (pathParts.includes('services') || pathParts.includes('business')) return 'business';
    if (pathParts.includes('models') || pathParts.includes('entities')) return 'data';
    if (pathParts.includes('utils') || pathParts.includes('helpers')) return 'shared';
    if (pathParts.includes('config') || pathParts.includes('setup')) return 'infrastructure';
    
    return 'unknown';
  }

  // Detect security vulnerabilities
  detectSecurityVulnerabilities(content, ext) {
    const vulnerabilities = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // SQL injection
      if (line.includes('query(') && line.includes('${')) {
        vulnerabilities.push({
          type: 'sql_injection',
          severity: 'high',
          line: i + 1,
          description: 'Potential SQL injection vulnerability'
        });
      }
      
      // XSS
      if (line.includes('innerHTML') && line.includes('${')) {
        vulnerabilities.push({
          type: 'xss',
          severity: 'high',
          line: i + 1,
          description: 'Potential XSS vulnerability'
        });
      }
      
      // Hardcoded secrets
      if (line.includes('password') && line.includes('=') && line.includes("'")) {
        vulnerabilities.push({
          type: 'hardcoded_secret',
          severity: 'medium',
          line: i + 1,
          description: 'Potential hardcoded secret'
        });
      }
    }
    
    return vulnerabilities;
  }

  // Generate comprehensive analysis
  generateMetadata(files) {
    return {
      totalFiles: files.length,
      totalLines: files.reduce((sum, file) => sum + file.metadata.lines, 0),
      totalSize: files.reduce((sum, file) => sum + file.metadata.size, 0),
      fileTypes: this.groupByFileType(files),
      averageComplexity: this.calculateAverageComplexity(files),
      averageMaintainability: this.calculateAverageMaintainability(files)
    };
  }

  // Analyze relationships between files
  analyzeRelationships(files) {
    const relationships = [];
    
    for (const file of files) {
      for (const importItem of file.dependencies.imports) {
        const targetFile = files.find(f => 
          f.path.includes(importItem.source) || 
          f.name === importItem.source
        );
        
        if (targetFile) {
          relationships.push({
            source: file.id,
            target: targetFile.id,
            type: 'import',
            strength: this.calculateRelationshipStrength(file, targetFile)
          });
        }
      }
    }
    
    return relationships;
  }

  // Detect patterns across files
  detectPatterns(files) {
    return {
      architectural: this.detectArchitecturalPatterns(files),
      coding: this.detectCodingPatterns(files),
      naming: this.detectNamingPatterns(files),
      structure: this.detectStructurePatterns(files)
    };
  }

  // Generate insights
  generateInsights(files) {
    return {
      quality: this.generateQualityInsights(files),
      architecture: this.generateArchitectureInsights(files),
      security: this.generateSecurityInsights(files),
      performance: this.generatePerformanceInsights(files),
      recommendations: this.generateRecommendations(files)
    };
  }

  // Helper methods
  generateFileId(filePath) {
    return filePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  getFileType(ext) {
    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'jsx',
      '.tsx': 'tsx',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    return typeMap[ext] || 'unknown';
  }

  // Additional helper methods would be implemented here...
  isImportLine(line, ext) {
    return line.trim().startsWith('import ');
  }

  isFunctionLine(line, ext) {
    return line.trim().match(/^(?:function\s+)?\w+\s*\([^)]*\)\s*{?$/);
  }

  isClassLine(line, ext) {
    return line.trim().match(/^class\s+\w+/);
  }

  analyzeIndentation(lines) {
    const indentSizes = new Set();
    const indentStyles = new Set();
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const leadingSpaces = line.length - line.trimStart().length;
      if (leadingSpaces > 0) {
        indentSizes.add(leadingSpaces);
        indentStyles.add(line.startsWith(' ') ? 'spaces' : 'tabs');
      }
    }
    
    const sizes = Array.from(indentSizes);
    const styles = Array.from(indentStyles);
    
    return {
      consistent: sizes.length <= 1 && styles.length <= 1,
      style: styles[0] || 'spaces',
      size: sizes[0] || 2
    };
  }

  analyzeOrganization(lines, ext) {
    const sections = [];
    let currentSection = { type: 'header', start: 0, end: 0 };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isImportLine(line, ext)) {
        if (currentSection.type !== 'imports') {
          if (currentSection.end > currentSection.start) {
            sections.push(currentSection);
          }
          currentSection = { type: 'imports', start: i, end: i };
        }
      } else if (this.isFunctionLine(line, ext)) {
        if (currentSection.type !== 'functions') {
          if (currentSection.end > currentSection.start) {
            sections.push(currentSection);
          }
          currentSection = { type: 'functions', start: i, end: i };
        }
      } else if (this.isClassLine(line, ext)) {
        if (currentSection.type !== 'classes') {
          if (currentSection.end > currentSection.start) {
            sections.push(currentSection);
          }
          currentSection = { type: 'classes', start: i, end: i };
        }
      }
      
      currentSection.end = i;
    }
    
    if (currentSection.end > currentSection.start) {
      sections.push(currentSection);
    }
    
    return {
      structured: sections.length > 1,
      sections: sections.map(s => s.type)
    };
  }

  analyzeConsistency(lines, ext) {
    const indentAnalysis = this.analyzeIndentation(lines);
    const orgAnalysis = this.analyzeOrganization(lines, ext);
    
    let consistencyScore = 100;
    
    if (!indentAnalysis.consistent) {
      consistencyScore -= 30;
    }
    
    if (!orgAnalysis.structured) {
      consistencyScore -= 20;
    }
    
    // Check for consistent naming patterns
    const functionNames = lines
      .filter(line => this.isFunctionLine(line, ext))
      .map(line => line.match(/(?:function\s+)?(\w+)/)?.[1])
      .filter(Boolean);
    
    const namingPatterns = new Set();
    for (const name of functionNames) {
      if (name.match(/^[a-z][a-zA-Z0-9]*$/)) {
        namingPatterns.add('camelCase');
      } else if (name.match(/^[A-Z][a-zA-Z0-9]*$/)) {
        namingPatterns.add('PascalCase');
      } else if (name.match(/^[a-z_][a-z0-9_]*$/)) {
        namingPatterns.add('snake_case');
      }
    }
    
    if (namingPatterns.size > 1) {
      consistencyScore -= 15;
    }
    
    return {
      consistent: consistencyScore >= 80,
      score: Math.max(0, consistencyScore)
    };
  }

  extractExports(content, ext) {
    const exports = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // ES6 exports
      if (trimmed.startsWith('export ')) {
        const exportMatch = trimmed.match(/export\s+(?:default\s+)?(?:function\s+)?(\w+)/);
        if (exportMatch) {
          exports.push({
            type: 'es6',
            name: exportMatch[1],
            default: trimmed.includes('export default')
          });
        }
      }
      
      // CommonJS exports
      if (trimmed.includes('module.exports') || trimmed.includes('exports.')) {
        const exportMatch = trimmed.match(/(?:module\.)?exports\.(\w+)/);
        if (exportMatch) {
          exports.push({
            type: 'commonjs',
            name: exportMatch[1]
          });
        }
      }
    }
    
    return exports;
  }

  extractVariables(content, ext) {
    const variables = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Variable declarations
      const varMatch = trimmed.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch) {
        variables.push({
          name: varMatch[1],
          type: trimmed.startsWith('const') ? 'const' : 
                trimmed.startsWith('let') ? 'let' : 'var'
        });
      }
    }
    
    return variables;
  }

  extractComments(content, ext) {
    const comments = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Single line comments
      if (trimmed.startsWith('//')) {
        comments.push({
          type: 'single-line',
          content: trimmed.substring(2).trim(),
          line: i + 1
        });
      }
      
      // Multi-line comments
      if (trimmed.startsWith('/*')) {
        let commentContent = trimmed.substring(2);
        let j = i + 1;
        
        while (j < lines.length && !lines[j].includes('*/')) {
          commentContent += '\n' + lines[j];
          j++;
        }
        
        if (j < lines.length && lines[j].includes('*/')) {
          commentContent += '\n' + lines[j].substring(0, lines[j].indexOf('*/'));
        }
        
        comments.push({
          type: 'multi-line',
          content: commentContent.trim(),
          line: i + 1,
          endLine: j + 1
        });
        
        i = j;
      }
    }
    
    return comments;
  }

  calculateReadability(content) {
    const lines = content.split('\n');
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    
    // Calculate average words per sentence
    const avgWordsPerSentence = words / sentences;
    
    // Calculate average line length
    const avgLineLength = content.length / lines.length;
    
    // Calculate comment ratio
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    ).length;
    const commentRatio = commentLines / lines.length;
    
    let readabilityScore = 100;
    
    // Penalize very long sentences
    if (avgWordsPerSentence > 20) readabilityScore -= 20;
    else if (avgWordsPerSentence > 15) readabilityScore -= 10;
    
    // Penalize very long lines
    if (avgLineLength > 120) readabilityScore -= 20;
    else if (avgLineLength > 80) readabilityScore -= 10;
    
    // Bonus for good comment ratio
    if (commentRatio > 0.1 && commentRatio < 0.3) readabilityScore += 10;
    else if (commentRatio < 0.05) readabilityScore -= 10;
    
    return Math.max(0, Math.min(100, readabilityScore));
  }

  calculateTestability(content) {
    const lines = content.split('\n');
    const functions = this.extractFunctions(content, path.extname('test.js'));
    const complexity = this.calculateComplexity(content);
    
    let testabilityScore = 100;
    
    // Penalize high complexity
    if (complexity > 20) testabilityScore -= 30;
    else if (complexity > 10) testabilityScore -= 15;
    
    // Penalize functions with many parameters
    const highParamFunctions = functions.filter(f => f.params > 5).length;
    testabilityScore -= highParamFunctions * 5;
    
    // Check for side effects (simplified)
    const sideEffectKeywords = ['document.', 'window.', 'localStorage.', 'sessionStorage.'];
    const hasSideEffects = sideEffectKeywords.some(keyword => content.includes(keyword));
    if (hasSideEffects) testabilityScore -= 20;
    
    // Check for external dependencies
    const externalDeps = this.extractExternalDependencies(content, path.extname('test.js'));
    testabilityScore -= externalDeps.length * 2;
    
    return Math.max(0, Math.min(100, testabilityScore));
  }

  calculateDocumentation(content) {
    const comments = this.extractComments(content, path.extname('test.js'));
    const functions = this.extractFunctions(content, path.extname('test.js'));
    const classes = this.extractClasses(content, path.extname('test.js'));
    
    let documentationScore = 0;
    
    // Base score for having any comments
    if (comments.length > 0) documentationScore += 20;
    
    // Score for function documentation
    const documentedFunctions = functions.filter(func => {
      return comments.some(comment => 
        comment.content.includes(func.name) || 
        comment.line < func.startLine
      );
    }).length;
    
    const functionDocRatio = functions.length > 0 ? documentedFunctions / functions.length : 0;
    documentationScore += functionDocRatio * 40;
    
    // Score for class documentation
    const documentedClasses = classes.filter(cls => {
      return comments.some(comment => 
        comment.content.includes(cls.name) || 
        comment.line < cls.startLine
      );
    }).length;
    
    const classDocRatio = classes.length > 0 ? documentedClasses / classes.length : 0;
    documentationScore += classDocRatio * 40;
    
    return Math.max(0, Math.min(100, documentationScore));
  }

  extractDynamicImports(content, ext) {
    const dynamicImports = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Dynamic import() calls
      const dynamicMatch = trimmed.match(/import\s*\(\s*['"](.+?)['"]\s*\)/);
      if (dynamicMatch) {
        dynamicImports.push({
          source: dynamicMatch[1],
          type: 'dynamic',
          line: trimmed
        });
      }
    }
    
    return dynamicImports;
  }

  extractExternalDependencies(content, ext) {
    const externalDeps = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // ES6 imports
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/from\s+['"](.+?)['"]/);
        if (importMatch && !importMatch[1].startsWith('.') && !importMatch[1].startsWith('/')) {
          externalDeps.push({
            source: importMatch[1],
            type: 'es6',
            line: trimmed
          });
        }
      }
      
      // CommonJS requires
      if (trimmed.includes('require(')) {
        const requireMatch = trimmed.match(/require\s*\(\s*['"](.+?)['"]\s*\)/);
        if (requireMatch && !requireMatch[1].startsWith('.') && !requireMatch[1].startsWith('/')) {
          externalDeps.push({
            source: requireMatch[1],
            type: 'commonjs',
            line: trimmed
          });
        }
      }
    }
    
    return externalDeps;
  }

  detectArchitecturePattern(content, ext) {
    const patterns = [];
    
    // Check for module pattern
    if (content.includes('module.exports') || content.includes('export default')) {
      patterns.push('module');
    }
    
    // Check for singleton pattern
    if (content.includes('getInstance') || content.includes('instance')) {
      patterns.push('singleton');
    }
    
    // Check for factory pattern
    if (content.includes('create') && content.includes('return new')) {
      patterns.push('factory');
    }
    
    // Check for observer pattern
    if (content.includes('addEventListener') || content.includes('on(') || content.includes('emit(')) {
      patterns.push('observer');
    }
    
    // Check for MVC pattern
    if (content.includes('Controller') || content.includes('Model') || content.includes('View')) {
      patterns.push('mvc');
    }
    
    return patterns.length > 0 ? patterns[0] : 'module';
  }

  analyzeResponsibility(content, ext) {
    const responsibilities = [];
    
    // Check for UI responsibilities
    if (content.includes('render') || content.includes('JSX') || content.includes('className')) {
      responsibilities.push('ui');
    }
    
    // Check for business logic
    if (content.includes('calculate') || content.includes('process') || content.includes('validate')) {
      responsibilities.push('business');
    }
    
    // Check for data access
    if (content.includes('fetch') || content.includes('axios') || content.includes('database')) {
      responsibilities.push('data');
    }
    
    // Check for utility functions
    if (content.includes('helper') || content.includes('util') || content.includes('format')) {
      responsibilities.push('utility');
    }
    
    return responsibilities.length > 0 ? responsibilities[0] : 'utility';
  }

  analyzeCoupling(content, ext) {
    const imports = this.extractImports(content, ext);
    const requires = this.extractRequires(content, ext);
    const externalDeps = this.extractExternalDependencies(content, ext);
    
    const totalDeps = imports.length + requires.length + externalDeps.length;
    
    let couplingScore = 0;
    let couplingLevel = 'low';
    
    if (totalDeps === 0) {
      couplingScore = 0;
      couplingLevel = 'none';
    } else if (totalDeps <= 2) {
      couplingScore = 20;
      couplingLevel = 'low';
    } else if (totalDeps <= 5) {
      couplingScore = 40;
      couplingLevel = 'moderate';
    } else if (totalDeps <= 10) {
      couplingScore = 60;
      couplingLevel = 'high';
    } else {
      couplingScore = 80;
      couplingLevel = 'very_high';
    }
    
    return { level: couplingLevel, score: couplingScore };
  }

  analyzeCohesion(content, ext) {
    const functions = this.extractFunctions(content, ext);
    const classes = this.extractClasses(content, ext);
    const variables = this.extractVariables(content, ext);
    
    let cohesionScore = 100;
    let cohesionLevel = 'high';
    
    // Penalize files with too many different types of elements
    const elementTypes = [];
    if (functions.length > 0) elementTypes.push('functions');
    if (classes.length > 0) elementTypes.push('classes');
    if (variables.length > 0) elementTypes.push('variables');
    
    if (elementTypes.length > 3) {
      cohesionScore -= 30;
      cohesionLevel = 'low';
    } else if (elementTypes.length > 2) {
      cohesionScore -= 15;
      cohesionLevel = 'moderate';
    }
    
    // Check for related functionality
    const functionNames = functions.map(f => f.name.toLowerCase());
    const hasRelatedFunctions = functionNames.some(name => 
      functionNames.some(otherName => 
        otherName !== name && 
        (otherName.includes(name) || name.includes(otherName))
      )
    );
    
    if (!hasRelatedFunctions && functions.length > 1) {
      cohesionScore -= 20;
      cohesionLevel = 'low';
    }
    
    return { level: cohesionLevel, score: Math.max(0, cohesionScore) };
  }

  checkSecurityBestPractices(content, ext) {
    // Implementation for security best practices check
    return [];
  }

  assessSecurityRisks(content, ext) {
    // Implementation for security risk assessment
    return [];
  }

  detectPerformanceBottlenecks(content, ext) {
    // Implementation for performance bottleneck detection
    return [];
  }

  suggestPerformanceOptimizations(content, ext) {
    // Implementation for performance optimization suggestions
    return [];
  }

  calculatePerformanceMetrics(content, ext) {
    // Implementation for performance metrics calculation
    return {};
  }

  determineFilePurpose(filePath, content, ext) {
    // Implementation for file purpose determination
    return 'utility';
  }

  extractKeyFeatures(content, ext) {
    // Implementation for key feature extraction
    return [];
  }

  estimateTestCoverage(filePath, content) {
    // Implementation for test coverage estimation
    return 0;
  }

  generateTextSummary(filePath, content, ext) {
    // Implementation for text summary generation
    return 'A utility file with helper functions.';
  }

  calculateFunctionComplexity(lines) {
    // Implementation for function complexity calculation
    return 5;
  }

  extractClassMethods(lines) {
    // Implementation for class method extraction
    return [];
  }

  groupByFileType(files) {
    // Implementation for file type grouping
    return {};
  }

  calculateAverageComplexity(files) {
    // Implementation for average complexity calculation
    return 10;
  }

  calculateAverageMaintainability(files) {
    // Implementation for average maintainability calculation
    return 75;
  }

  calculateRelationshipStrength(sourceFile, targetFile) {
    // Implementation for relationship strength calculation
    return 0.8;
  }

  detectArchitecturalPatterns(files) {
    // Implementation for architectural pattern detection
    return [];
  }

  detectCodingPatterns(files) {
    // Implementation for coding pattern detection
    return [];
  }

  detectNamingPatterns(files) {
    // Implementation for naming pattern detection
    return [];
  }

  detectStructurePatterns(files) {
    // Implementation for structure pattern detection
    return [];
  }

  generateQualityInsights(files) {
    // Implementation for quality insights generation
    return [];
  }

  generateArchitectureInsights(files) {
    // Implementation for architecture insights generation
    return [];
  }

  generateSecurityInsights(files) {
    // Implementation for security insights generation
    return [];
  }

  generatePerformanceInsights(files) {
    // Implementation for performance insights generation
    return [];
  }

  generateRecommendations(files) {
    // Implementation for recommendations generation
    return [];
  }
}

export default AIFileFormatter;
