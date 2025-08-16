import path from 'path';

export class AIAnalysisFormatter {
  constructor(scanner) {
    this.scanner = scanner;
  }

  // Generate comprehensive AI-ready data structure
  generateAIAnalysisData() {
    const analysis = {
      // Core metadata
      metadata: {
        projectName: this.scanner.packageInfo?.name || 'Unknown Project',
        version: this.scanner.packageInfo?.version || '1.0.0',
        scanTimestamp: new Date().toISOString(),
        totalFiles: this.scanner.metrics.filesScanned,
        totalLines: this.scanner.metrics.linesOfCode,
        totalDependencies: this.scanner.metrics.dependencies,
        projectType: this.detectProjectType(),
        framework: this.detectFramework(),
        buildTools: this.detectBuildTools()
      },

      // Dependency graph structure
      dependencyGraph: {
        nodes: this.generateNodes(),
        edges: this.generateEdges(),
        clusters: [],
        layers: this.identifyArchitectureLayers()
      },

      // Code quality metrics
      qualityMetrics: {
        complexity: this.analyzeComplexity(),
        coupling: this.analyzeCoupling(),
        cohesion: { highCohesion: [], lowCohesion: [], average: 0 },
        maintainability: { excellent: [], good: [], fair: [], poor: [], average: 0 },
        technicalDebt: { total: 0, categories: {}, hotspots: [], recommendations: [] }
      },

      // Issues and conflicts
      issues: {
        circularDependencies: [],
        deadCode: { unusedFunctions: [], unusedVariables: [], unusedImports: [], unreachableCode: [] },
        duplicatePatterns: [],
        unusedDependencies: [],
        securityVulnerabilities: { high: [], medium: [], low: [], total: 0 },
        performanceIssues: { largeFiles: [], complexFunctions: [], heavyDependencies: [], inefficientPatterns: [] }
      },

      // Architecture insights
      architecture: {
        patterns: { mvc: [], mvvm: [], layered: [], microservices: [], monolith: [], eventDriven: [] },
        boundaries: { modules: [], interfaces: [], boundaries: [] },
        interfaces: { public: [], private: [], shared: [] },
        dataFlow: { patterns: [], bottlenecks: [], flows: [] },
        stateManagement: { patterns: [], stores: [], providers: [] }
      },

      // Recommendations
      recommendations: {
        refactoring: this.generateRefactoringRecommendations(),
        optimization: this.generateOptimizationRecommendations(),
        security: this.generateSecurityRecommendations(),
        testing: this.generateTestingRecommendations(),
        documentation: this.generateDocumentationRecommendations()
      }
    };

    return analysis;
  }

  generateNodes() {
    const nodes = [];
    
    for (const [filePath, deps] of this.scanner.dependencyGraph.entries()) {
      const analysis = this.scanner.getFileAnalysis(filePath);
      const node = {
        id: filePath,
        label: path.basename(filePath),
        type: this.categorizeFile(filePath),
        metrics: {
          size: analysis.size || 0,
          lines: analysis.lines || 0,
          complexity: analysis.complexity || 0,
          functions: analysis.functions?.length || 0,
          variables: analysis.variables?.length || 0,
          imports: analysis.imports?.length || 0,
          exports: analysis.exports?.length || 0,
          dependencyCount: deps.size,
          fanIn: this.calculateFanIn(filePath),
          fanOut: deps.size
        },
        properties: {
          isTypeScript: analysis.isTypeScript || false,
          isJSX: analysis.isJSX || false,
          isTest: filePath.includes('test') || filePath.includes('spec'),
          isConfig: this.isConfigFile(filePath),
          category: this.getFileCategory(filePath)
        }
      };
      nodes.push(node);
    }

    return nodes;
  }

  generateEdges() {
    const edges = [];
    
    for (const [fromFile, deps] of this.scanner.dependencyGraph.entries()) {
      for (const toDep of deps) {
        const edge = {
          id: `${fromFile}->${toDep}`,
          source: fromFile,
          target: toDep,
          type: this.getDependencyType(fromFile, toDep),
          properties: {
            isCircular: this.isCircularDependency(fromFile, toDep),
            isExternal: !toDep.startsWith('.') && !toDep.startsWith('/'),
            strength: this.calculateDependencyStrength(fromFile, toDep),
            direction: 'outgoing'
          }
        };
        edges.push(edge);
      }
    }

    return edges;
  }

  identifyClusters() {
    const clusters = [];
    const visited = new Set();

    for (const [file, deps] of this.scanner.dependencyGraph.entries()) {
      if (visited.has(file)) continue;

      const cluster = this.findConnectedComponents(file, visited);
      if (cluster.length > 1) {
        clusters.push({
          id: `cluster-${clusters.length}`,
          files: cluster,
          size: cluster.length,
          cohesion: this.calculateClusterCohesion(cluster),
          coupling: this.calculateClusterCoupling(cluster)
        });
      }
    }

    return clusters;
  }

  identifyArchitectureLayers() {
    const layers = {
      presentation: [],
      business: [],
      data: [],
      infrastructure: [],
      shared: []
    };

    for (const [file] of this.scanner.dependencyGraph.entries()) {
      const layer = this.classifyArchitectureLayer(file);
      layers[layer].push(file);
    }

    return layers;
  }

  analyzeComplexity() {
    const complexityData = {
      average: 0,
      max: 0,
      hotspots: [],
      distribution: {
        low: 0,    // 0-5
        medium: 0, // 6-15
        high: 0,   // 16-30
        critical: 0 // 30+
      }
    };

    let totalComplexity = 0;
    let fileCount = 0;

    for (const [file, deps] of this.scanner.dependencyGraph.entries()) {
      const analysis = this.scanner.getFileAnalysis(file);
      const complexity = analysis.complexity || 0;
      
      totalComplexity += complexity;
      fileCount++;

      if (complexity > complexityData.max) {
        complexityData.max = complexity;
      }

      if (complexity > 30) {
        complexityData.distribution.critical++;
        complexityData.hotspots.push({ file, complexity });
      } else if (complexity > 15) {
        complexityData.distribution.high++;
      } else if (complexity > 5) {
        complexityData.distribution.medium++;
      } else {
        complexityData.distribution.low++;
      }
    }

    complexityData.average = fileCount > 0 ? totalComplexity / fileCount : 0;
    complexityData.hotspots.sort((a, b) => b.complexity - a.complexity);

    return complexityData;
  }

  analyzeCoupling() {
    const couplingData = {
      average: 0,
      max: 0,
      tightlyCoupled: [],
      looselyCoupled: []
    };

    let totalCoupling = 0;
    let fileCount = 0;

    for (const [file, deps] of this.scanner.dependencyGraph.entries()) {
      const coupling = deps.size;
      totalCoupling += coupling;
      fileCount++;

      if (coupling > couplingData.max) {
        couplingData.max = coupling;
      }

      if (coupling > 10) {
        couplingData.tightlyCoupled.push({ file, coupling });
      } else if (coupling <= 2) {
        couplingData.looselyCoupled.push({ file, coupling });
      }
    }

    couplingData.average = fileCount > 0 ? totalCoupling / fileCount : 0;
    return couplingData;
  }

  analyzeCohesion() {
    // Analyze how related functions and data are within files
    const cohesionData = {
      highCohesion: [],
      lowCohesion: [],
      average: 0
    };

    // This would require more detailed analysis of file contents
    // For now, return basic structure
    return cohesionData;
  }

  calculateMaintainabilityIndex() {
    // Calculate maintainability index based on complexity, lines of code, and other factors
    const maintainabilityData = {
      excellent: [],
      good: [],
      fair: [],
      poor: [],
      average: 0
    };

    // Implementation would calculate MI = 171 - 5.2 * ln(HV) - 0.23 * ln(CC) - 16.2 * ln(LOC)
    return maintainabilityData;
  }

  assessTechnicalDebt() {
    const technicalDebt = {
      total: 0,
      categories: {
        complexity: 0,
        duplication: 0,
        violations: 0,
        coverage: 0,
        documentation: 0
      },
      hotspots: [],
      recommendations: []
    };

    // Calculate technical debt based on various metrics
    return technicalDebt;
  }

  identifyDeadCode() {
    const deadCode = {
      unusedFunctions: [],
      unusedVariables: [],
      unusedImports: [],
      unreachableCode: []
    };

    // Analyze for dead code patterns
    return deadCode;
  }

  findUnusedDependencies() {
    const unusedDeps = [];
    
    // Check for dependencies that are imported but not used
    for (const [file, deps] of this.scanner.dependencyGraph.entries()) {
      const analysis = this.scanner.getFileAnalysis(file);
      // Implementation would check if imports are actually used
    }

    return unusedDeps;
  }

  assessSecurityVulnerabilities() {
    const vulnerabilities = {
      high: [],
      medium: [],
      low: [],
      total: 0
    };

    // Check for common security patterns
    return vulnerabilities;
  }

  identifyPerformanceIssues() {
    const performanceIssues = {
      largeFiles: [],
      complexFunctions: [],
      heavyDependencies: [],
      inefficientPatterns: []
    };

    return performanceIssues;
  }

  identifyArchitecturePatterns() {
    const patterns = {
      mvc: [],
      mvvm: [],
      layered: [],
      microservices: [],
      monolith: [],
      eventDriven: []
    };

    // Analyze codebase for architectural patterns
    return patterns;
  }

  generateRefactoringRecommendations() {
    return [
      {
        type: 'extract_method',
        files: [],
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      },
      {
        type: 'extract_class',
        files: [],
        priority: 'medium',
        effort: 'high',
        impact: 'high'
      },
      {
        type: 'break_circular_dependency',
        files: [],
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      }
    ];
  }

  // Helper methods
  categorizeFile(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.jsx') return 'jsx';
    if (ext === '.js') return 'javascript';
    return 'other';
  }

  getFileCategory(filePath) {
    const dir = path.dirname(filePath);
    if (dir.includes('components')) return 'component';
    if (dir.includes('utils')) return 'utility';
    if (dir.includes('services')) return 'service';
    if (dir.includes('models')) return 'model';
    if (dir.includes('tests')) return 'test';
    return 'other';
  }

  getDependencyType(fromFile, toDep) {
    if (toDep.startsWith('.')) return 'relative';
    if (toDep.startsWith('/')) return 'absolute';
    if (toDep.startsWith('@')) return 'alias';
    return 'external';
  }

  calculateFanIn(filePath) {
    let fanIn = 0;
    for (const [_, deps] of this.scanner.dependencyGraph.entries()) {
      if (deps.has(filePath)) fanIn++;
    }
    return fanIn;
  }

  isConfigFile(filePath) {
    return filePath.includes('config') || 
           filePath.includes('webpack') || 
           filePath.includes('vite') ||
           filePath.includes('babel') ||
           filePath.includes('tsconfig');
  }

  detectProjectType() {
    // Analyze package.json and file structure
    return 'nodejs';
  }

  detectFramework() {
    // Detect React, Vue, Angular, etc.
    return 'react';
  }

  detectBuildTools() {
    // Detect Webpack, Vite, Rollup, etc.
    return ['webpack', 'babel'];
  }

  findConnectedComponents(startFile, visited) {
    const component = [];
    const stack = [startFile];

    while (stack.length > 0) {
      const file = stack.pop();
      if (visited.has(file)) continue;

      visited.add(file);
      component.push(file);

      const deps = this.scanner.dependencyGraph.get(file) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          stack.push(dep);
        }
      }
    }

    return component;
  }

  calculateClusterCohesion(cluster) {
    // Calculate how related the files in a cluster are
    return 0.8; // Placeholder
  }

  calculateClusterCoupling(cluster) {
    // Calculate coupling between clusters
    return 0.3; // Placeholder
  }

  classifyArchitectureLayer(filePath) {
    const dir = path.dirname(filePath);
    if (dir.includes('components') || dir.includes('pages')) return 'presentation';
    if (dir.includes('services') || dir.includes('business')) return 'business';
    if (dir.includes('models') || dir.includes('entities')) return 'data';
    if (dir.includes('utils') || dir.includes('helpers')) return 'shared';
    return 'infrastructure';
  }

  isCircularDependency(fromFile, toDep) {
    const cycles = this.scanner.findCircularDependencies();
    return cycles.some(cycle => 
      cycle.includes(fromFile) && cycle.includes(toDep)
    );
  }

  calculateDependencyStrength(fromFile, toDep) {
    // Calculate how strong the dependency is based on usage patterns
    return 1.0; // Placeholder
  }

  findDuplicatePatterns() {
    const patterns = new Map();
    const duplicates = [];

    for (const [file, deps] of this.scanner.dependencyGraph.entries()) {
      const depArray = Array.from(deps).sort();
      const pattern = depArray.join(',');
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }
      patterns.get(pattern).push(file);
    }

    for (const [pattern, files] of patterns.entries()) {
      if (files.length > 1) {
        duplicates.push({
          pattern: pattern.split(','),
          files,
          count: files.length
        });
      }
    }

    return duplicates;
  }

  identifyModuleBoundaries() {
    // Identify logical module boundaries based on directory structure and dependencies
    const boundaries = {
      modules: [],
      interfaces: [],
      boundaries: []
    };

    // Group files by directory structure
    const moduleGroups = new Map();
    for (const [file] of this.scanner.dependencyGraph.entries()) {
      const dir = path.dirname(file);
      if (!moduleGroups.has(dir)) {
        moduleGroups.set(dir, []);
      }
      moduleGroups.get(dir).push(file);
    }

    // Create module boundaries
    for (const [dir, files] of moduleGroups.entries()) {
      if (files.length > 1) {
        boundaries.modules.push({
          name: path.basename(dir),
          path: dir,
          files,
          size: files.length
        });
      }
    }

    return boundaries;
  }

  analyzeInterfaces() {
    // Analyze interfaces between modules
    const interfaces = {
      public: [],
      private: [],
      shared: []
    };

    return interfaces;
  }

  analyzeDataFlow() {
    // Analyze data flow patterns
    const dataFlow = {
      patterns: [],
      bottlenecks: [],
      flows: []
    };

    return dataFlow;
  }

  analyzeStateManagement() {
    // Analyze state management patterns
    const stateManagement = {
      patterns: [],
      stores: [],
      providers: []
    };

    return stateManagement;
  }

  generateOptimizationRecommendations() {
    return [
      {
        type: 'performance_optimization',
        description: 'Optimize large files',
        priority: 'medium',
        effort: 'high',
        impact: 'medium'
      }
    ];
  }

  generateSecurityRecommendations() {
    return [
      {
        type: 'security_audit',
        description: 'Audit external dependencies',
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      }
    ];
  }

  generateTestingRecommendations() {
    return [
      {
        type: 'test_coverage',
        description: 'Increase test coverage',
        priority: 'medium',
        effort: 'high',
        impact: 'high'
      }
    ];
  }

  generateDocumentationRecommendations() {
    return [
      {
        type: 'documentation',
        description: 'Add missing documentation',
        priority: 'low',
        effort: 'medium',
        impact: 'medium'
      }
    ];
  }
}

export default AIAnalysisFormatter;
