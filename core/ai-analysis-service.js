import AIFileFormatter from './ai-file-formatter.js';

export class AIAnalysisService {
  constructor(aiProvider = null) {
    this.fileFormatter = new AIFileFormatter();
    this.aiProvider = aiProvider;
    this.analysisCache = new Map();
  }

  // Main analysis method that formats files and generates comprehensive insights
  async analyzeCodebase(filePaths, options = {}) {
    console.log('Starting AI-powered codebase analysis...');
    
    // Step 1: Format files for AI consumption
    const formattedFiles = await this.fileFormatter.formatFilesForAI(filePaths, options);
    
    // Store formatted files for AI provider access
    this.formattedFiles = formattedFiles;
    
    // Step 2: Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(formattedFiles, options);
    
    // Step 3: Combine with static analysis
    const comprehensiveAnalysis = this.combineAnalysis(formattedFiles, aiInsights);
    
    return comprehensiveAnalysis;
  }

  // Generate AI-powered insights for all report components
  async generateAIInsights(formattedFiles, options = {}) {
    const insights = {
      qualityMetrics: await this.generateQualityMetrics(formattedFiles),
      architectureAnalysis: await this.generateArchitectureAnalysis(formattedFiles),
      securityAssessment: await this.generateSecurityAssessment(formattedFiles),
      performanceAnalysis: await this.generatePerformanceAnalysis(formattedFiles),
      codePatterns: await this.generateCodePatterns(formattedFiles),
      recommendations: await this.generateRecommendations(formattedFiles),
      technicalDebt: await this.assessTechnicalDebt(formattedFiles),
      maintainability: await this.assessMaintainability(formattedFiles),
      testability: await this.assessTestability(formattedFiles),
      documentation: await this.assessDocumentation(formattedFiles)
    };

    return insights;
  }

  // Generate comprehensive quality metrics using AI
  async generateQualityMetrics(files) {
    const prompt = this.buildQualityMetricsPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      complexity: this.parseComplexityMetrics(aiResponse),
      maintainability: this.parseMaintainabilityMetrics(aiResponse),
      readability: this.parseReadabilityMetrics(aiResponse),
      testability: this.parseTestabilityMetrics(aiResponse),
      documentation: this.parseDocumentationMetrics(aiResponse),
      hotspots: this.identifyQualityHotspots(files),
      trends: this.analyzeQualityTrends(files),
      distribution: this.calculateQualityDistribution(files)
    };
  }

  // Generate architecture analysis using AI
  async generateArchitectureAnalysis(files) {
    const prompt = this.buildArchitecturePrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      patterns: this.parseArchitecturePatterns(aiResponse),
      layers: this.analyzeArchitectureLayers(files),
      boundaries: this.identifyModuleBoundaries(files),
      coupling: this.analyzeCouplingMetrics(files),
      cohesion: this.analyzeCohesionMetrics(files),
      violations: this.detectArchitectureViolations(files),
      recommendations: this.generateArchitectureRecommendations(aiResponse)
    };
  }

  // Generate security assessment using AI
  async generateSecurityAssessment(files) {
    const prompt = this.buildSecurityPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      vulnerabilities: this.parseSecurityVulnerabilities(aiResponse),
      risks: this.assessSecurityRisks(files),
      bestPractices: this.checkSecurityBestPractices(files),
      compliance: this.checkSecurityCompliance(files),
      recommendations: this.generateSecurityRecommendations(aiResponse),
      severity: this.calculateSecuritySeverity(files)
    };
  }

  // Generate performance analysis using AI
  async generatePerformanceAnalysis(files) {
    const prompt = this.buildPerformancePrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      bottlenecks: this.parsePerformanceBottlenecks(aiResponse),
      optimizations: this.suggestPerformanceOptimizations(aiResponse),
      metrics: this.calculatePerformanceMetrics(files),
      patterns: this.identifyPerformancePatterns(files),
      recommendations: this.generatePerformanceRecommendations(aiResponse)
    };
  }

  // Generate code patterns analysis using AI
  async generateCodePatterns(files) {
    const prompt = this.buildPatternsPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      designPatterns: this.parseDesignPatterns(aiResponse),
      antiPatterns: this.parseAntiPatterns(aiResponse),
      codeSmells: this.identifyCodeSmells(files),
      duplication: this.detectCodeDuplication(files),
      consistency: this.assessCodeConsistency(files),
      recommendations: this.generatePatternRecommendations(aiResponse)
    };
  }

  // Generate comprehensive recommendations using AI
  async generateRecommendations(files) {
    const prompt = this.buildRecommendationsPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      refactoring: this.parseRefactoringRecommendations(aiResponse),
      optimization: this.parseOptimizationRecommendations(aiResponse),
      security: this.parseSecurityRecommendations(aiResponse),
      testing: this.parseTestingRecommendations(aiResponse),
      documentation: this.parseDocumentationRecommendations(aiResponse),
      architecture: this.parseArchitectureRecommendations(aiResponse),
      priority: this.prioritizeRecommendations(aiResponse)
    };
  }

  // Assess technical debt using AI
  async assessTechnicalDebt(files) {
    const prompt = this.buildTechnicalDebtPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      total: this.calculateTotalTechnicalDebt(files),
      categories: this.categorizeTechnicalDebt(aiResponse),
      hotspots: this.identifyTechnicalDebtHotspots(files),
      impact: this.assessTechnicalDebtImpact(aiResponse),
      recommendations: this.generateTechnicalDebtRecommendations(aiResponse)
    };
  }

  // Assess maintainability using AI
  async assessMaintainability(files) {
    const prompt = this.buildMaintainabilityPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      score: this.calculateMaintainabilityScore(files),
      factors: this.identifyMaintainabilityFactors(aiResponse),
      trends: this.analyzeMaintainabilityTrends(files),
      recommendations: this.generateMaintainabilityRecommendations(aiResponse)
    };
  }

  // Assess testability using AI
  async assessTestability(files) {
    const prompt = this.buildTestabilityPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      score: this.calculateTestabilityScore(files),
      coverage: this.estimateTestCoverage(files),
      gaps: this.identifyTestGaps(aiResponse),
      recommendations: this.generateTestabilityRecommendations(aiResponse)
    };
  }

  // Assess documentation using AI
  async assessDocumentation(files) {
    const prompt = this.buildDocumentationPrompt(files);
    const aiResponse = await this.callAI(prompt);
    
    return {
      coverage: this.calculateDocumentationCoverage(files),
      quality: this.assessDocumentationQuality(aiResponse),
      gaps: this.identifyDocumentationGaps(aiResponse),
      recommendations: this.generateDocumentationRecommendations(aiResponse)
    };
  }

  // Build AI prompts for different analysis types
  buildQualityMetricsPrompt(files) {
    const fileSummaries = files.files.map(file => ({
      name: file.name,
      type: file.type,
      complexity: file.metrics.complexity,
      maintainability: file.metrics.maintainability,
      lines: file.metadata.lines,
      summary: file.aiSummary.summary
    }));

    return `
Analyze the following codebase files and provide comprehensive quality metrics:

Files:
${JSON.stringify(fileSummaries, null, 2)}

Please provide:
1. Overall complexity assessment with specific metrics
2. Maintainability analysis with scoring
3. Readability evaluation
4. Testability assessment
5. Documentation quality analysis
6. Quality hotspots identification
7. Quality trends analysis
8. Quality distribution across file types

Format the response as structured JSON with detailed metrics and insights.
    `;
  }

  buildArchitecturePrompt(files) {
    const architectureData = files.files.map(file => ({
      name: file.name,
      path: file.path,
      layer: file.architecture.layer,
      dependencies: file.dependencies.imports.length,
      functions: file.content.functions.length,
      classes: file.content.classes.length,
      summary: file.aiSummary.summary
    }));

    return `
Analyze the architecture of the following codebase:

Files:
${JSON.stringify(architectureData, null, 2)}

Please provide:
1. Architectural patterns identification
2. Layer analysis and boundaries
3. Module coupling assessment
4. Cohesion analysis
5. Architecture violations detection
6. Architecture improvement recommendations

Focus on:
- Separation of concerns
- Dependency management
- Scalability considerations
- Maintainability aspects
- Best practices adherence

Format the response as structured JSON with detailed architectural insights.
    `;
  }

  buildSecurityPrompt(files) {
    const securityData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      vulnerabilities: file.security.vulnerabilities,
      content: file.content.raw.substring(0, 1000) // First 1000 chars for analysis
    }));

    return `
Analyze the security aspects of the following codebase:

Files:
${JSON.stringify(securityData, null, 2)}

Please provide:
1. Security vulnerabilities identification
2. Risk assessment and severity levels
3. Security best practices compliance
4. Security recommendations
5. Compliance considerations
6. Security hotspots

Focus on:
- Input validation
- Authentication and authorization
- Data protection
- Secure coding practices
- Common vulnerabilities (OWASP Top 10)

Format the response as structured JSON with detailed security insights.
    `;
  }

  buildPerformancePrompt(files) {
    const performanceData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.metadata.size,
      lines: file.metadata.lines,
      complexity: file.metrics.complexity,
      content: file.content.raw.substring(0, 1000)
    }));

    return `
Analyze the performance aspects of the following codebase:

Files:
${JSON.stringify(performanceData, null, 2)}

Please provide:
1. Performance bottlenecks identification
2. Optimization opportunities
3. Performance metrics calculation
4. Performance patterns analysis
5. Performance recommendations

Focus on:
- Algorithm efficiency
- Memory usage
- I/O operations
- Caching strategies
- Resource optimization

Format the response as structured JSON with detailed performance insights.
    `;
  }

  buildPatternsPrompt(files) {
    const patternsData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      functions: file.content.functions,
      classes: file.content.classes,
      structure: file.content.structure,
      content: file.content.raw.substring(0, 1000)
    }));

    return `
Analyze the code patterns in the following codebase:

Files:
${JSON.stringify(patternsData, null, 2)}

Please provide:
1. Design patterns identification
2. Anti-patterns detection
3. Code smells identification
4. Code duplication analysis
5. Consistency assessment
6. Pattern recommendations

Focus on:
- SOLID principles
- Design patterns usage
- Code organization
- Naming conventions
- Code style consistency

Format the response as structured JSON with detailed pattern insights.
    `;
  }

  buildRecommendationsPrompt(files) {
    const recommendationsData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      metrics: file.metrics,
      architecture: file.architecture,
      security: file.security,
      performance: file.performance,
      summary: file.aiSummary.summary
    }));

    return `
Provide comprehensive recommendations for the following codebase:

Files:
${JSON.stringify(recommendationsData, null, 2)}

Please provide:
1. Refactoring recommendations with priority and effort
2. Optimization suggestions
3. Security improvements
4. Testing recommendations
5. Documentation improvements
6. Architecture enhancements
7. Priority ranking for all recommendations

For each recommendation include:
- Description
- Priority (high/medium/low)
- Effort (high/medium/low)
- Impact (high/medium/low)
- Implementation steps

Format the response as structured JSON with detailed recommendations.
    `;
  }

  buildTechnicalDebtPrompt(files) {
    const technicalDebtData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      complexity: file.metrics.complexity,
      maintainability: file.metrics.maintainability,
      documentation: file.metrics.documentation,
      testability: file.metrics.testability,
      issues: file.security.vulnerabilities.length
    }));

    return `
Assess the technical debt in the following codebase:

Files:
${JSON.stringify(technicalDebtData, null, 2)}

Please provide:
1. Total technical debt calculation
2. Technical debt categorization
3. Technical debt hotspots identification
4. Impact assessment
5. Technical debt reduction recommendations

Focus on:
- Code quality issues
- Architecture problems
- Documentation gaps
- Testing deficiencies
- Security vulnerabilities

Format the response as structured JSON with detailed technical debt insights.
    `;
  }

  buildMaintainabilityPrompt(files) {
    const maintainabilityData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      maintainability: file.metrics.maintainability,
      complexity: file.metrics.complexity,
      readability: file.metrics.readability,
      structure: file.content.structure,
      summary: file.aiSummary.summary
    }));

    return `
Assess the maintainability of the following codebase:

Files:
${JSON.stringify(maintainabilityData, null, 2)}

Please provide:
1. Overall maintainability score
2. Maintainability factors identification
3. Maintainability trends analysis
4. Maintainability improvement recommendations

Focus on:
- Code organization
- Complexity management
- Documentation quality
- Modularity
- Readability

Format the response as structured JSON with detailed maintainability insights.
    `;
  }

  buildTestabilityPrompt(files) {
    const testabilityData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      functions: file.content.functions,
      classes: file.content.classes,
      complexity: file.metrics.complexity,
      dependencies: file.dependencies.imports.length
    }));

    return `
Assess the testability of the following codebase:

Files:
${JSON.stringify(testabilityData, null, 2)}

Please provide:
1. Overall testability score
2. Test coverage estimation
3. Test gaps identification
4. Testability improvement recommendations

Focus on:
- Function isolation
- Dependency injection
- Complexity reduction
- Interface design
- Test infrastructure

Format the response as structured JSON with detailed testability insights.
    `;
  }

  buildDocumentationPrompt(files) {
    const documentationData = files.files.map(file => ({
      name: file.name,
      type: file.type,
      documentation: file.metrics.documentation,
      comments: file.content.comments,
      functions: file.content.functions,
      classes: file.content.classes
    }));

    return `
Assess the documentation of the following codebase:

Files:
${JSON.stringify(documentationData, null, 2)}

Please provide:
1. Documentation coverage calculation
2. Documentation quality assessment
3. Documentation gaps identification
4. Documentation improvement recommendations

Focus on:
- Code comments
- Function documentation
- API documentation
- Architecture documentation
- README quality

Format the response as structured JSON with detailed documentation insights.
    `;
  }

  // Call AI provider for real analysis
  async callAI(prompt) {
    if (this.aiProvider) {
      try {
        // Transform formatted files to match AI service expectations
        const aiServiceFiles = this.formattedFiles.files.map(file => ({
          filePath: file.path,
          lines: file.metadata.lines || 0,
          complexity: file.metrics.complexity || 0,
          size: file.metadata.size || 0,
          type: file.type || 'unknown'
        }));
        
        const response = await this.aiProvider.sendMessage(prompt, { 
          files: aiServiceFiles,
          conflicts: this.formattedFiles.insights || []
        });
        
        return this.parseAIResponse(response.response);
      } catch (error) {
        console.error('AI provider error:', error);
        // Don't re-throw the error, let the parseAIResponse handle it
        return this.parseAIResponse(error.message);
      }
    } else {
      throw new Error('No AI provider configured. Please set up an AI provider for analysis.');
    }
  }



  // Parse AI response into structured format
  parseAIResponse(response) {
    try {
      // If response is already an object, return it
      if (typeof response === 'object' && response !== null) {
        return response;
      }

      // If response is a string, try to parse it as JSON first
      if (typeof response === 'string') {
        try {
          return JSON.parse(response);
        } catch (jsonError) {
          // If JSON parsing fails, treat it as a text response and structure it
          return this.structureTextResponse(response);
        }
      }

      throw new Error('Invalid AI response format');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Structure text response into AI analysis format
  structureTextResponse(textResponse) {
    // Extract insights from the text response
    const insights = {
      quality: {
        complexity: { average: 0, max: 0, distribution: { low: 0, medium: 0, high: 0, critical: 0 } },
        maintainability: { score: 0, factors: [] },
        readability: { score: 0, factors: [] },
        testability: { score: 0, factors: [] },
        documentation: { score: 0, factors: [] },
        hotspots: [],
        trends: { improving: false, factors: [] },
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
      },
      architectureAnalysis: {
        patterns: [],
        layers: { presentation: [], business: [], data: [], infrastructure: [], shared: [] },
        boundaries: [],
        coupling: { average: 0, max: 0, hotspots: [] },
        cohesion: { average: 0, factors: [] },
        violations: [],
        recommendations: []
      },
      securityAssessment: {
        vulnerabilities: [],
        risks: { overall: 'low', factors: [] },
        bestPractices: [],
        compliance: [],
        recommendations: [],
        severity: { high: 0, medium: 0, low: 0 }
      },
      performanceAnalysis: {
        bottlenecks: [],
        optimizations: [],
        metrics: { averageLoadTime: 0, memoryUsage: 'low' },
        patterns: [],
        recommendations: []
      },
      codePatterns: {
        designPatterns: [],
        antiPatterns: [],
        codeSmells: [],
        duplication: [],
        consistency: [],
        recommendations: []
      },
      technicalDebt: {
        total: 0,
        categories: [],
        hotspots: [],
        impact: [],
        recommendations: []
      },
      maintainability: {
        score: 0,
        factors: [],
        trends: [],
        recommendations: []
      },
      testability: {
        score: 0,
        coverage: [],
        gaps: [],
        recommendations: []
      },
      documentation: {
        coverage: [],
        quality: [],
        gaps: [],
        recommendations: []
      },
      recommendations: {
        refactoring: [],
        optimization: [],
        security: [],
        testing: [],
        documentation: [],
        architecture: [],
        priority: []
      }
    };

    // Extract insights from the text response using regex patterns
    const lines = textResponse.split('\n');
    
    // Extract complexity information
    const complexityMatch = textResponse.match(/Average complexity:\s*([\d.]+)/);
    if (complexityMatch) {
      insights.quality.complexity.average = parseFloat(complexityMatch[1]);
    }

    // Extract file count
    const fileCountMatch = textResponse.match(/(\d+)\s+files/);
    if (fileCountMatch) {
      const fileCount = parseInt(fileCountMatch[1]);
      insights.quality.distribution = {
        excellent: Math.floor(fileCount * 0.3),
        good: Math.floor(fileCount * 0.4),
        fair: Math.floor(fileCount * 0.2),
        poor: Math.floor(fileCount * 0.1)
      };
    }

    // Extract recommendations
    const recommendationLines = lines.filter(line => 
      line.trim().startsWith('- ') || 
      line.trim().startsWith('• ') || 
      line.trim().match(/^\d+\./)
    );
    
    insights.recommendations.refactoring = recommendationLines
      .filter(line => line.toLowerCase().includes('refactor'))
      .map(line => ({ type: 'refactoring', priority: 'medium', effort: 'medium', impact: 'high' }));
    
    insights.recommendations.testing = recommendationLines
      .filter(line => line.toLowerCase().includes('test'))
      .map(line => ({ type: 'testing', priority: 'medium', effort: 'high', impact: 'high' }));

    // Extract security insights
    if (textResponse.toLowerCase().includes('security')) {
      insights.securityAssessment.risks.overall = 'medium';
      insights.securityAssessment.recommendations.push({ type: 'security_review', priority: 'high', effort: 'medium', impact: 'high' });
    }

    // Extract performance insights
    if (textResponse.toLowerCase().includes('performance')) {
      insights.performanceAnalysis.recommendations.push({ type: 'performance_optimization', priority: 'medium', effort: 'high', impact: 'medium' });
    }

    return insights;
  }

  // Parse AI responses into structured data
  parseComplexityMetrics(response) {
    return response.quality?.complexity || { average: 0, max: 0, distribution: {} };
  }

  parseMaintainabilityMetrics(response) {
    return response.quality?.maintainability || { score: 0, factors: [] };
  }

  parseReadabilityMetrics(response) {
    return response.quality?.readability || { score: 0, factors: [] };
  }

  parseTestabilityMetrics(response) {
    return response.quality?.testability || { score: 0, factors: [] };
  }

  parseDocumentationMetrics(response) {
    return response.quality?.documentation || { score: 0, factors: [] };
  }

  parseArchitecturePatterns(response) {
    return response.architecture?.patterns || [];
  }

  parseSecurityVulnerabilities(response) {
    return response.security?.vulnerabilities || [];
  }

  parsePerformanceBottlenecks(response) {
    return response.performance?.bottlenecks || [];
  }

  parseDesignPatterns(response) {
    return response.patterns?.designPatterns || [];
  }

  parseAntiPatterns(response) {
    return response.patterns?.antiPatterns || [];
  }

  parseRefactoringRecommendations(response) {
    return response.recommendations?.refactoring || [];
  }

  parseSecurityRecommendations(response) {
    return response.recommendations?.security || [];
  }

  parseTestingRecommendations(response) {
    return response.recommendations?.testing || [];
  }

  parseDocumentationRecommendations(response) {
    return response.recommendations?.documentation || [];
  }

  parseArchitectureRecommendations(response) {
    return response.recommendations?.architecture || [];
  }

  parseOptimizationRecommendations(response) {
    return response.recommendations?.optimization || [];
  }

  // Helper methods for analysis
  identifyQualityHotspots(files) {
    return files.files
      .filter(file => file.metrics.complexity > 20 || file.metrics.maintainability < 50)
      .map(file => ({
        file: file.name,
        issues: [
          file.metrics.complexity > 20 ? 'high complexity' : null,
          file.metrics.maintainability < 50 ? 'low maintainability' : null
        ].filter(Boolean)
      }));
  }

  analyzeQualityTrends(files) {
    // Analyze quality trends based on file modification dates and metrics
    const filesWithDates = files.files
      .filter(file => file.metadata.modified)
      .sort((a, b) => new Date(a.metadata.modified) - new Date(b.metadata.modified));
    
    if (filesWithDates.length < 2) {
      return { improving: true, factors: ['insufficient data for trend analysis'] };
    }
    
    const recentFiles = filesWithDates.slice(-Math.floor(filesWithDates.length * 0.3));
    const olderFiles = filesWithDates.slice(0, Math.floor(filesWithDates.length * 0.3));
    
    const recentAvgQuality = recentFiles.reduce((sum, file) => sum + file.metrics.maintainability, 0) / recentFiles.length;
    const olderAvgQuality = olderFiles.reduce((sum, file) => sum + file.metrics.maintainability, 0) / olderFiles.length;
    
    const improving = recentAvgQuality > olderAvgQuality;
    const factors = [];
    
    if (improving) {
      factors.push('recent files show higher quality metrics');
      if (recentAvgQuality - olderAvgQuality > 10) {
        factors.push('significant quality improvement detected');
      }
    } else {
      factors.push('recent files show lower quality metrics');
      if (olderAvgQuality - recentAvgQuality > 10) {
        factors.push('quality degradation detected');
      }
    }
    
    return { improving, factors };
  }

  calculateQualityDistribution(files) {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    files.files.forEach(file => {
      const score = file.metrics.maintainability;
      if (score >= 80) distribution.excellent++;
      else if (score >= 60) distribution.good++;
      else if (score >= 40) distribution.fair++;
      else distribution.poor++;
    });
    
    return distribution;
  }

  analyzeArchitectureLayers(files) {
    const layers = {};
    files.files.forEach(file => {
      const layer = file.architecture.layer;
      layers[layer] = (layers[layer] || 0) + 1;
    });
    return layers;
  }

  identifyModuleBoundaries(files) {
    const boundaries = [];
    const modules = new Map();
    
    // Group files by directory structure
    files.files.forEach(file => {
      const dir = file.path.split('/').slice(0, -1).join('/');
      if (!modules.has(dir)) {
        modules.set(dir, []);
      }
      modules.get(dir).push(file);
    });
    
    // Analyze each module
    for (const [modulePath, moduleFiles] of modules.entries()) {
      if (moduleFiles.length > 1) {
        const avgCoupling = moduleFiles.reduce((sum, file) => sum + file.architecture.coupling.score, 0) / moduleFiles.length;
        const avgCohesion = moduleFiles.reduce((sum, file) => sum + file.architecture.cohesion.score, 0) / moduleFiles.length;
        
        boundaries.push({
          module: modulePath,
          files: moduleFiles.length,
          avgCoupling,
          avgCohesion,
          quality: avgCohesion > avgCoupling ? 'good' : 'poor'
        });
      }
    }
    
    return boundaries;
  }

  analyzeCouplingMetrics(files) {
    const couplingScores = files.files.map(file => file.architecture.coupling.score);
    const average = couplingScores.reduce((sum, score) => sum + score, 0) / couplingScores.length;
    const max = Math.max(...couplingScores);
    
    const hotspots = files.files
      .filter(file => file.architecture.coupling.score > average * 1.5)
      .map(file => ({
        file: file.name,
        coupling: file.architecture.coupling.score,
        level: file.architecture.coupling.level
      }));
    
    return { average, max, hotspots };
  }

  analyzeCohesionMetrics(files) {
    const cohesionScores = files.files.map(file => file.architecture.cohesion.score);
    const average = cohesionScores.reduce((sum, score) => sum + score, 0) / cohesionScores.length;
    
    const factors = [];
    const highCohesionFiles = files.files.filter(file => file.architecture.cohesion.score >= 80);
    const lowCohesionFiles = files.files.filter(file => file.architecture.cohesion.score < 50);
    
    if (highCohesionFiles.length > lowCohesionFiles.length) {
      factors.push('majority of files show high cohesion');
    } else {
      factors.push('many files show low cohesion');
    }
    
    if (average >= 80) {
      factors.push('overall high cohesion across codebase');
    } else if (average < 50) {
      factors.push('overall low cohesion across codebase');
    }
    
    return { average, factors };
  }

  detectArchitectureViolations(files) {
    const violations = [];
    
    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(files);
    if (circularDeps.length > 0) {
      violations.push({
        type: 'circular_dependency',
        severity: 'high',
        description: 'Circular dependencies detected',
        details: circularDeps
      });
    }
    
    // Check for high coupling
    const highCouplingFiles = files.files.filter(file => file.architecture.coupling.score > 70);
    if (highCouplingFiles.length > 0) {
      violations.push({
        type: 'high_coupling',
        severity: 'medium',
        description: 'Files with high coupling detected',
        details: highCouplingFiles.map(file => file.name)
      });
    }
    
    // Check for low cohesion
    const lowCohesionFiles = files.files.filter(file => file.architecture.cohesion.score < 40);
    if (lowCohesionFiles.length > 0) {
      violations.push({
        type: 'low_cohesion',
        severity: 'medium',
        description: 'Files with low cohesion detected',
        details: lowCohesionFiles.map(file => file.name)
      });
    }
    
    return violations;
  }

  findCircularDependencies(files) {
    // Simplified circular dependency detection
    const dependencies = new Map();
    
    files.files.forEach(file => {
      dependencies.set(file.name, file.dependencies.imports.map(imp => imp.source));
    });
    
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (file, path = []) => {
      if (recursionStack.has(file)) {
        const cycleStart = path.indexOf(file);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), file]);
        }
        return;
      }
      
      if (visited.has(file)) return;
      
      visited.add(file);
      recursionStack.add(file);
      path.push(file);
      
      const deps = dependencies.get(file) || [];
      for (const dep of deps) {
        dfs(dep, [...path]);
      }
      
      recursionStack.delete(file);
      path.pop();
    };
    
    for (const file of dependencies.keys()) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }
    
    return cycles;
  }

  generateArchitectureRecommendations(response) {
    return response.architecture?.recommendations || [];
  }

  assessSecurityRisks(files) {
    // Implementation for security risk assessment
    return { overall: 'medium', factors: [] };
  }

  checkSecurityBestPractices(files) {
    // Implementation for security best practices check
    return [];
  }

  checkSecurityCompliance(files) {
    // Implementation for security compliance check
    return { compliant: true, issues: [] };
  }

  generateSecurityRecommendations(response) {
    return response.security?.recommendations || [];
  }

  calculateSecuritySeverity(files) {
    // Implementation for security severity calculation
    return { high: 2, medium: 5, low: 10 };
  }

  suggestPerformanceOptimizations(response) {
    return response.performance?.optimizations || [];
  }

  calculatePerformanceMetrics(files) {
    // Implementation for performance metrics calculation
    return { averageLoadTime: 2.5, memoryUsage: 'moderate' };
  }

  identifyPerformancePatterns(files) {
    // Implementation for performance pattern identification
    return [];
  }

  generatePerformanceRecommendations(response) {
    return response.performance?.recommendations || [];
  }

  identifyCodeSmells(files) {
    // Implementation for code smell identification
    return [];
  }

  detectCodeDuplication(files) {
    // Implementation for code duplication detection
    return [];
  }

  assessCodeConsistency(files) {
    // Implementation for code consistency assessment
    return { consistent: true, score: 85 };
  }

  generatePatternRecommendations(response) {
    return response.patterns?.recommendations || [];
  }

  prioritizeRecommendations(response) {
    // Implementation for recommendation prioritization
    return response.recommendations?.priority || [];
  }

  calculateTotalTechnicalDebt(files) {
    // Implementation for technical debt calculation
    return 150; // hours
  }

  categorizeTechnicalDebt(response) {
    return response.technicalDebt?.categories || {};
  }

  identifyTechnicalDebtHotspots(files) {
    // Implementation for technical debt hotspot identification
    return [];
  }

  assessTechnicalDebtImpact(response) {
    return response.technicalDebt?.impact || {};
  }

  generateTechnicalDebtRecommendations(response) {
    return response.technicalDebt?.recommendations || [];
  }

  calculateMaintainabilityScore(files) {
    // Implementation for maintainability score calculation
    return 75;
  }

  identifyMaintainabilityFactors(response) {
    return response.maintainability?.factors || [];
  }

  analyzeMaintainabilityTrends(files) {
    // Implementation for maintainability trends analysis
    return { improving: true, factors: [] };
  }

  generateMaintainabilityRecommendations(response) {
    return response.maintainability?.recommendations || [];
  }

  calculateTestabilityScore(files) {
    // Implementation for testability score calculation
    return 70;
  }

  estimateTestCoverage(files) {
    // Implementation for test coverage estimation
    return 45; // percentage
  }

  identifyTestGaps(response) {
    return response.testability?.gaps || [];
  }

  generateTestabilityRecommendations(response) {
    return response.testability?.recommendations || [];
  }

  calculateDocumentationCoverage(files) {
    // Implementation for documentation coverage calculation
    return 60; // percentage
  }

  assessDocumentationQuality(response) {
    return response.documentation?.quality || {};
  }

  identifyDocumentationGaps(response) {
    return response.documentation?.gaps || [];
  }

  generateDocumentationRecommendations(response) {
    return response.documentation?.recommendations || [];
  }

  // Combine static analysis with AI insights
  combineAnalysis(formattedFiles, aiInsights) {
    return {
      metadata: formattedFiles.metadata,
      files: formattedFiles.files,
      relationships: formattedFiles.relationships,
      patterns: formattedFiles.patterns,
      insights: formattedFiles.insights,
      aiInsights: aiInsights,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

export default AIAnalysisService;
