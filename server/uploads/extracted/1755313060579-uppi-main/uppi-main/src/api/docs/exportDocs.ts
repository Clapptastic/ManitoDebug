
import fs from 'fs';
import path from 'path';

/**
 * Recursively get all markdown files from a directory
 * @param dir Directory to scan
 * @param results Array to store results
 */
const getMarkdownFiles = (dir: string, results: string[] = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively scan directories
      getMarkdownFiles(filePath, results);
    } else if (path.extname(file).toLowerCase() === '.md') {
      // Add markdown files to results
      results.push(filePath);
    }
  });
  
  return results;
};

/**
 * Read markdown files and return their contents
 */
export const getAllDocumentationFiles = () => {
  const projectRoot = process.cwd();
  const docsDir = path.join(projectRoot, 'docs');
  const srcDocsDir = path.join(projectRoot, 'src', 'docs');
  
  const markdownFiles: string[] = [];
  
  // Collect markdown files from all relevant directories
  if (fs.existsSync(docsDir)) {
    getMarkdownFiles(docsDir, markdownFiles);
  }
  
  if (fs.existsSync(srcDocsDir)) {
    getMarkdownFiles(srcDocsDir, markdownFiles);
  }
  
  // Read file contents and create document objects
  return markdownFiles.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(projectRoot, filePath);
    const category = path.dirname(relativePath).split(path.sep).pop() || 'Documentation';
    const fileName = path.basename(filePath, '.md');
    
    // Extract title from first line if it's a markdown heading
    const lines = content.split('\n');
    const title = lines[0].startsWith('# ') 
      ? lines[0].substring(2).trim() 
      : fileName;
    
    return {
      id: Buffer.from(relativePath).toString('base64'),
      title,
      content,
      category,
      path: relativePath,
      excerpt: content.substring(0, 150) + '...',
      lastUpdated: new Date().toISOString(),
      tags: [category.toLowerCase(), 'documentation'],
    };
  });
};
