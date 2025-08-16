import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
// Handle both ES module and CommonJS exports
const traverseFunction = traverse.default || traverse;
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export class CodeScanner {
  constructor(options = {}) {
    this.options = {
      patterns: ['**/*.{js,jsx,ts,tsx}'],
      excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
      maxFileSize: 1024 * 1024, // 1MB
      ...options
    };
    this.dependencyGraph = new Map();
    this.metrics = {
      filesScanned: 0,
      linesOfCode: 0,
      dependencies: 0,
      conflicts: []
    };
  }

  async scan(rootPath) {
    console.log(`Starting scan of ${rootPath}...`);
    const startTime = Date.now();
    
    try {
      // Analyze package.json for external dependencies
      const packageInfo = await this.analyzePackageJson(rootPath);
      
      const files = await this.findFiles(rootPath);
      console.log(`Found ${files.length} files to scan`);
      
      const results = [];
      for (const file of files) {
        try {
          const result = await this.scanFile(file);
          if (result) {
            results.push(result);
            this.metrics.filesScanned++;
          }
        } catch (error) {
          console.warn(`Error scanning ${file}:`, error.message);
        }
      }

      this.detectConflicts();
      
      const scanTime = Date.now() - startTime;
      console.log(`Scan completed in ${scanTime}ms`);
      
      return {
        id: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanTime,
        rootPath,
        files: results,
        dependencies: this.serializeDependencyGraph(),
        packageInfo,
        metrics: this.metrics,
        conflicts: this.metrics.conflicts
      };
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    }
  }

  async findFiles(rootPath) {
    const allFiles = [];
    
    for (const pattern of this.options.patterns) {
      const files = await glob(pattern, {
        cwd: rootPath,
        absolute: true,
        ignore: this.options.excludePatterns
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates and filter by size
    const uniqueFiles = [...new Set(allFiles)];
    const validFiles = [];
    
    for (const file of uniqueFiles) {
      try {
        const stats = await fs.stat(file);
        if (stats.size <= this.options.maxFileSize) {
          validFiles.push(file);
        }
      } catch (error) {
        console.warn(`Could not stat file ${file}:`, error.message);
      }
    }
    
    return validFiles;
  }

  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      this.metrics.linesOfCode += lines;
      
      const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
      
      let ast;
      
      // Determine parser plugins based on file type
      const plugins = ['decorators'];
      
      if (isTypeScript) {
        plugins.push('typescript');
      }
      
      if (isJSX) {
        plugins.push('jsx');
      }
      
      // Try to detect if this is a CommonJS file (has require/module.exports but no ES6 imports)
      const hasRequire = /require\s*\(/.test(content);
      const hasModuleExports = /module\.exports/.test(content);
      const hasES6Imports = /import\s+/.test(content);
      
      let parseOptions;
      if (hasRequire || hasModuleExports) {
        // CommonJS file
        parseOptions = {
          sourceType: 'script',
          allowReturnOutsideFunction: true,
          plugins: plugins
        };
      } else {
        // ES6 module
        parseOptions = {
          sourceType: 'module',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          plugins: plugins
        };
      }

      try {
        ast = parse(content, parseOptions);
      } catch (parseError) {
        try {
          // Fallback to script mode
          const scriptOptions = { ...parseOptions, sourceType: 'script' };
          ast = parse(content, scriptOptions);
        } catch (secondError) {
          console.warn(`Parse error in ${filePath}:`, parseError.message);
          return null;
        }
      }

      const analysis = {
        filePath,
        lines,
        size: content.length,
        isTypeScript,
        isJSX,
        imports: [],
        exports: [],
        functions: [],
        variables: [],
        complexity: 0
      };

      const self = this;
      traverseFunction(ast, {
        ImportDeclaration(path) {
          const node = path.node;
          const importPath = node.source.value;
          analysis.imports.push({
            source: importPath,
            specifiers: node.specifiers.map(spec => ({
              type: spec.type,
              local: spec.local?.name,
              imported: spec.imported?.name || spec.local?.name
            }))
          });
          self.addDependency(filePath, importPath);
        },
        
        // Add support for dynamic imports and CommonJS require
        CallExpression(path) {
          const node = path.node;
          
          // Dynamic imports
          if (node.callee.type === 'Import' && node.arguments.length > 0) {
            const importPath = node.arguments[0];
            if (importPath.type === 'StringLiteral') {
              analysis.imports.push({
                source: importPath.value,
                specifiers: [],
                dynamic: true
              });
              self.addDependency(filePath, importPath.value);
            }
          }
          
          // CommonJS require
          if (node.callee.name === 'require' && node.arguments.length > 0) {
            const requirePath = node.arguments[0];
            if (requirePath.type === 'StringLiteral') {
              analysis.imports.push({
                source: requirePath.value,
                specifiers: [{
                  type: 'require',
                  local: 'require',
                  imported: requirePath.value
                }],
                commonjs: true
              });
              self.addDependency(filePath, requirePath.value);
            }
          }
        },
        
        ExportNamedDeclaration(path) {
          const node = path.node;
          if (node.declaration) {
            if (node.declaration.type === 'FunctionDeclaration') {
              analysis.exports.push({
                type: 'function',
                name: node.declaration.id?.name
              });
            } else if (node.declaration.type === 'VariableDeclaration') {
              node.declaration.declarations.forEach(decl => {
                analysis.exports.push({
                  type: 'variable',
                  name: decl.id?.name
                });
              });
            }
          }
        },
        
        ExportDefaultDeclaration(path) {
          const node = path.node;
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            analysis.exports.push({
              type: 'function',
              name: node.declaration.id.name,
              default: true
            });
          } else {
            analysis.exports.push({
              type: 'default',
              name: 'default'
            });
          }
        },
        
        FunctionDeclaration(path) {
          const node = path.node;
          analysis.functions.push({
            name: node.id?.name || '<anonymous>',
            params: node.params.length,
            line: node.loc?.start.line
          });
          analysis.complexity += self.calculateComplexity(node);
        },
        
        ArrowFunctionExpression(path) {
          const node = path.node;
          analysis.functions.push({
            name: '<arrow>',
            params: node.params.length,
            line: node.loc?.start.line
          });
          analysis.complexity += self.calculateComplexity(node);
        },
        
        VariableDeclarator(path) {
          const node = path.node;
          if (node.id?.name) {
            analysis.variables.push({
              name: node.id.name,
              line: node.loc?.start.line
            });
          }
        }
      });

      return analysis;
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
      return null;
    }
  }

  async analyzePackageJson(rootPath) {
    try {
      const packagePath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      
      return {
        name: pkg.name,
        version: pkg.version,
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        peerDependencies: pkg.peerDependencies || {},
        optionalDependencies: pkg.optionalDependencies || {},
        scripts: pkg.scripts || {},
        main: pkg.main,
        module: pkg.module,
        exports: pkg.exports,
        type: pkg.type || 'commonjs'
      };
    } catch (error) {
      console.warn('Could not read package.json:', error.message);
      return null;
    }
  }

  addDependency(from, to) {
    if (!this.dependencyGraph.has(from)) {
      this.dependencyGraph.set(from, new Set());
    }
    this.dependencyGraph.get(from).add(to);
    this.metrics.dependencies++;
  }

  resolveModulePath(importPath, fromFile) {
    // Handle different types of imports
    if (importPath.startsWith('.')) {
      // Relative import - resolve relative to importing file
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, importPath);
    } else if (importPath.startsWith('/')) {
      // Absolute import - resolve relative to project root
      return path.resolve(this.rootPath, importPath.slice(1));
    } else if (importPath.startsWith('@')) {
      // Alias import - try to resolve using common patterns
      return this.resolveAlias(importPath, fromFile);
    } else {
      // External package - mark as external dependency
      return `external:${importPath}`;
    }
  }

  resolveAlias(aliasPath, fromFile) {
    // Common alias patterns
    const aliasMap = {
      '@': 'src',
      '~': '',
      '@app': 'src/app',
      '@components': 'src/components',
      '@utils': 'src/utils',
      '@types': 'src/types'
    };

    for (const [alias, target] of Object.entries(aliasMap)) {
      if (aliasPath.startsWith(alias)) {
        const relativePath = aliasPath.replace(alias, target);
        return path.resolve(this.rootPath, relativePath);
      }
    }

    // Fallback to original path
    return aliasPath;
  }

  detectConflicts() {
    const circularDeps = this.findCircularDependencies();
    circularDeps.forEach(cycle => {
      this.metrics.conflicts.push({
        type: 'circular_dependency',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        files: cycle
      });
    });

    for (const [file, deps] of this.dependencyGraph.entries()) {
      if (deps.size === 0) {
        this.metrics.conflicts.push({
          type: 'isolated_file',
          severity: 'warning',
          message: `File has no dependencies: ${path.basename(file)}`,
          files: [file]
        });
      }
    }
  }

  findCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, pathArray) => {
      if (recursionStack.has(node)) {
        const cycleStart = pathArray.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...pathArray.slice(cycleStart), node]);
        }
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      pathArray.push(node);

      const deps = this.dependencyGraph.get(node);
      if (deps) {
        for (const dep of deps) {
          // Only check relative dependencies (local files)
          if (!dep.startsWith('.') && !dep.startsWith('/')) continue;
          
          // Resolve the dependency path relative to the current file
          let resolvedDep = dep;
          if (dep.startsWith('./')) {
            // Find the file that would match this dependency
            const currentDir = path.dirname(node);
            const targetFile = path.resolve(currentDir, dep);
            
            // Check if this resolved path exists in our dependency graph
            for (const graphNode of this.dependencyGraph.keys()) {
              if (graphNode === targetFile || 
                  graphNode.endsWith(dep.slice(2)) || // Remove ./
                  path.basename(graphNode) === path.basename(dep)) {
                resolvedDep = graphNode;
                break;
              }
            }
          }
          
          dfs(resolvedDep, [...pathArray]);
        }
      }

      recursionStack.delete(node);
      pathArray.pop();
    };

    for (const file of this.dependencyGraph.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return cycles;
  }

  calculateComplexity(node) {
    if (!node || !node.body) {
      return 1;
    }
    
    let complexity = 1;
    
    try {
      // Use a simpler approach that doesn't require scope traversal
      const nodeType = node.type;
      
      // Count control flow statements
      if (nodeType === 'IfStatement' || 
          nodeType === 'WhileStatement' || 
          nodeType === 'ForStatement' || 
          nodeType === 'ForInStatement' || 
          nodeType === 'ForOfStatement' || 
          nodeType === 'SwitchCase' || 
          nodeType === 'CatchClause' || 
          nodeType === 'ConditionalExpression') {
        complexity++;
      }
      
      // For logical expressions, we need to traverse the node
      if (nodeType === 'LogicalExpression') {
        if (node.operator === '&&' || node.operator === '||') {
          complexity++;
        }
      }
      
      // Recursively check child nodes
      if (node.body) {
        if (Array.isArray(node.body)) {
          for (const child of node.body) {
            complexity += this.calculateComplexity(child);
          }
        } else {
          complexity += this.calculateComplexity(node.body);
        }
      }
      
      if (node.consequent) {
        complexity += this.calculateComplexity(node.consequent);
      }
      
      if (node.alternate) {
        complexity += this.calculateComplexity(node.alternate);
      }
      
      if (node.test) {
        complexity += this.calculateComplexity(node.test);
      }
      
    } catch (error) {
      console.warn('Error calculating complexity:', error.message);
    }
    
    return complexity;
  }

  serializeDependencyGraph() {
    const graph = {};
    for (const [file, deps] of this.dependencyGraph.entries()) {
      graph[file] = Array.from(deps);
    }
    return graph;
  }

  // Generate comprehensive data structure for AI visualization tools
  generateVisualizationData() {
    const nodes = [];
    const edges = [];
    const metadata = {
      totalFiles: this.metrics.filesScanned,
      totalLines: this.metrics.linesOfCode,
      totalDependencies: this.metrics.dependencies,
      conflicts: this.metrics.conflicts,
      circularDependencies: this.findCircularDependencies(),
      isolatedFiles: [],
      highlyConnectedFiles: [],
      duplicatePatterns: [],
      complexityHotspots: this.findComplexityHotspots(),
      dependencyChains: this.findDependencyChains()
    };

    // Create nodes for each file
    for (const [filePath, deps] of this.dependencyGraph.entries()) {
      const fileAnalysis = this.getFileAnalysis(filePath);
      const node = {
        id: filePath,
        label: path.basename(filePath),
        type: 'file',
        data: {
          path: filePath,
          size: fileAnalysis?.size || 0,
          lines: fileAnalysis?.lines || 0,
          complexity: fileAnalysis?.complexity || 0,
          isTypeScript: fileAnalysis?.isTypeScript || false,
          isJSX: fileAnalysis?.isJSX || false,
          functions: fileAnalysis?.functions || [],
          variables: fileAnalysis?.variables || [],
          imports: fileAnalysis?.imports || [],
          exports: fileAnalysis?.exports || [],
          dependencyCount: deps.size,
          isExternal: false,
          category: this.categorizeFile(filePath, fileAnalysis)
        }
      };
      nodes.push(node);

      // Track isolated files
      if (deps.size === 0) {
        metadata.isolatedFiles.push(filePath);
      }

      // Track highly connected files
      if (deps.size > 10) {
        metadata.highlyConnectedFiles.push(filePath);
      }
    }

    // Create edges for dependencies
    for (const [fromFile, deps] of this.dependencyGraph.entries()) {
      for (const toDep of deps) {
        const edge = {
          id: `${fromFile}->${toDep}`,
          source: fromFile,
          target: toDep,
          type: 'dependency',
          data: {
            dependencyType: this.getDependencyType(fromFile, toDep),
            isCircular: this.isCircularDependency(fromFile, toDep),
            isExternal: !toDep.startsWith('.') && !toDep.startsWith('/'),
            importSpecifiers: this.getImportSpecifiers(fromFile, toDep)
          }
        };
        edges.push(edge);
      }
    }

    // Add external dependency nodes
    const externalDeps = this.getExternalDependencies();
    for (const [packageName, usage] of externalDeps.entries()) {
      const node = {
        id: `external:${packageName}`,
        label: packageName,
        type: 'external',
        data: {
          packageName,
          usageCount: usage.length,
          usedBy: usage,
          category: 'external'
        }
      };
      nodes.push(node);
    }

    return {
      nodes,
      edges,
      metadata,
      analysis: {
        timestamp: new Date().toISOString(),
        scanTime: Date.now(),
        version: '1.0.0'
      }
    };
  }

  getFileAnalysis(filePath) {
    // This would need to be implemented to return the analysis for a specific file
    // For now, return a placeholder
    return {
      size: 0,
      lines: 0,
      complexity: 0,
      isTypeScript: false,
      isJSX: false,
      functions: [],
      variables: [],
      imports: [],
      exports: []
    };
  }

  categorizeFile(filePath, analysis) {
    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);
    
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.jsx') return 'jsx';
    if (ext === '.js') return 'javascript';
    if (dir.includes('components')) return 'component';
    if (dir.includes('utils') || dir.includes('helpers')) return 'utility';
    if (dir.includes('services')) return 'service';
    if (dir.includes('models')) return 'model';
    if (dir.includes('tests')) return 'test';
    if (filePath.includes('index.')) return 'index';
    
    return 'other';
  }

  getDependencyType(fromFile, toDep) {
    // Determine the type of dependency
    if (toDep.startsWith('.')) return 'relative';
    if (toDep.startsWith('/')) return 'absolute';
    if (toDep.startsWith('@')) return 'alias';
    return 'external';
  }

  isCircularDependency(fromFile, toDep) {
    const cycles = this.findCircularDependencies();
    return cycles.some(cycle => 
      cycle.includes(fromFile) && cycle.includes(toDep)
    );
  }

  getImportSpecifiers(fromFile, toDep) {
    // This would need to be implemented to return the actual import specifiers
    return [];
  }

  getExternalDependencies() {
    const externalDeps = new Map();
    
    for (const [file, deps] of this.dependencyGraph.entries()) {
      for (const dep of deps) {
        if (!dep.startsWith('.') && !dep.startsWith('/') && !dep.startsWith('@')) {
          if (!externalDeps.has(dep)) {
            externalDeps.set(dep, []);
          }
          externalDeps.get(dep).push(file);
        }
      }
    }
    
    return externalDeps;
  }

  findDuplicatePatterns() {
    const patterns = new Map();
    const duplicates = [];

    for (const [file, deps] of this.dependencyGraph.entries()) {
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

  findComplexityHotspots() {
    const hotspots = [];
    
    for (const [file, deps] of this.dependencyGraph.entries()) {
      const analysis = this.getFileAnalysis(file);
      if (analysis.complexity > 10) {
        hotspots.push({
          file,
          complexity: analysis.complexity,
          lines: analysis.lines,
          functions: analysis.functions.length
        });
      }
    }

    return hotspots.sort((a, b) => b.complexity - a.complexity);
  }

  findDependencyChains() {
    const chains = [];
    const visited = new Set();

    const dfs = (file, chain = []) => {
      if (visited.has(file)) return;
      visited.add(file);

      const newChain = [...chain, file];
      const deps = this.dependencyGraph.get(file) || new Set();

      if (deps.size === 0) {
        // End of chain
        if (newChain.length > 2) {
          chains.push(newChain);
        }
      } else {
        for (const dep of deps) {
          if (!newChain.includes(dep)) {
            dfs(dep, newChain);
          }
        }
      }
    };

    for (const file of this.dependencyGraph.keys()) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }

    return chains;
  }
}

export default CodeScanner;

// Export AI analysis services
export { AIFileFormatter } from './ai-file-formatter.js';
export { AIAnalysisService } from './ai-analysis-service.js';
export { VisualizationConfig, VisualizationHelpers } from './visualization-config.js';