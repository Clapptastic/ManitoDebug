import { workerData, parentPort } from 'worker_threads';
import { CodeScanner } from '@manito/core';

async function processFiles() {
  try {
    const { files, options } = workerData;
    
    if (!files || files.length === 0) {
      parentPort.postMessage({
        files: [],
        dependencies: {},
        metrics: {
          filesScanned: 0,
          linesOfCode: 0,
          dependencies: 0
        }
      });
      return;
    }

    const scanner = new CodeScanner(options);
    const results = [];
    let totalLinesOfCode = 0;

    // Process each file assigned to this worker
    for (const filePath of files) {
      try {
        const result = await scanner.scanFile(filePath);
        if (result) {
          results.push(result);
          totalLinesOfCode += result.lines || 0;
          
          // Track dependencies in the scanner
          if (result.imports) {
            result.imports.forEach(imp => {
              scanner.addDependency(result.filePath, imp.source);
            });
          }
        }
      } catch (error) {
        console.warn(`Worker error processing ${filePath}:`, error.message);
      }
    }

    // Send results back to main thread
    parentPort.postMessage({
      files: results,
      dependencies: scanner.serializeDependencyGraph(),
      metrics: {
        filesScanned: results.length,
        linesOfCode: totalLinesOfCode,
        dependencies: Object.keys(scanner.serializeDependencyGraph()).length
      }
    });

  } catch (error) {
    console.error('Worker thread error:', error);
    parentPort.postMessage({
      error: error.message,
      files: [],
      dependencies: {},
      metrics: {
        filesScanned: 0,
        linesOfCode: 0,
        dependencies: 0
      }
    });
  }
}

// Start processing when the worker is created
processFiles();