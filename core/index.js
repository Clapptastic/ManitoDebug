import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';
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
      try {
        ast = parse(content, {
          ecmaVersion: 'latest',
          sourceType: 'module',
          allowHashBang: true,
          allowReturnOutsideFunction: true
        });
      } catch (parseError) {
        try {
          ast = parse(content, {
            ecmaVersion: 'latest',
            sourceType: 'script',
            allowHashBang: true,
            allowReturnOutsideFunction: true
          });
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

      walk(ast, {
        ImportDeclaration: (node) => {
          const importPath = node.source.value;
          analysis.imports.push({
            source: importPath,
            specifiers: node.specifiers.map(spec => ({
              type: spec.type,
              local: spec.local?.name,
              imported: spec.imported?.name
            }))
          });
          this.addDependency(filePath, importPath);
        },
        
        ExportNamedDeclaration: (node) => {
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
        
        FunctionDeclaration: (node) => {
          analysis.functions.push({
            name: node.id?.name || '<anonymous>',
            params: node.params.length,
            line: node.loc?.start.line
          });
          analysis.complexity += this.calculateComplexity(node);
        },
        
        VariableDeclarator: (node) => {
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

  addDependency(from, to) {
    if (!this.dependencyGraph.has(from)) {
      this.dependencyGraph.set(from, new Set());
    }
    this.dependencyGraph.get(from).add(to);
    this.metrics.dependencies++;
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
      walk(node.body, {
        IfStatement: () => complexity++,
        WhileStatement: () => complexity++,
        ForStatement: () => complexity++,
        ForInStatement: () => complexity++,
        ForOfStatement: () => complexity++,
        SwitchCase: () => complexity++,
        CatchClause: () => complexity++,
        ConditionalExpression: () => complexity++,
        LogicalExpression: (logicalNode) => {
          if (logicalNode.operator === '&&' || logicalNode.operator === '||') {
            complexity++;
          }
        }
      });
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
}

export default CodeScanner;