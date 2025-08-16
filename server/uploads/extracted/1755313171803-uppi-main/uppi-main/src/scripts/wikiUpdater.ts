
/**
 * Wiki Documentation Generator
 * 
 * This script automatically generates documentation for the wiki based on the codebase.
 * It scans the project files, extracts documentation, and updates the wiki data.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const SRC_DIR = path.resolve(__dirname, '../');
const WIKI_DATA_PATH = path.resolve(__dirname, '../components/admin/wiki/wikiData.ts');
const DOCS_DIR = path.resolve(__dirname, '../../docs');
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', 'archive'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md'];
const TEAM_DOCS_PRIORITY = ['TEAM_COLLABORATION.md', 'API_DOCUMENTATION.md'];

interface WikiDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
  tags: string[];
  author?: string;
  relatedDocs?: string[];
}

/**
 * Extract documentation from code files
 */
function extractDocumentation(filePath: string): Partial<WikiDocument> | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const extension = path.extname(filePath);
    
    // For Markdown files, use the content directly
    if (extension === '.md') {
      const fileName = path.basename(filePath, '.md');
      const firstLine = content.split('\n')[0];
      const title = firstLine.startsWith('# ') ? firstLine.substring(2) : fileName;
      
      // Determine category based on file location and content
      let category = 'Documentation';
      if (filePath.includes('team') || fileName.includes('TEAM')) {
        category = 'Team Collaboration';
      } else if (filePath.includes('api') || fileName.includes('API')) {
        category = 'API Documentation';
      } else if (filePath.includes('competitor') || fileName.includes('COMPETITOR')) {
        category = 'Competitor Analysis';
      }
      
      return {
        title,
        content,
        category,
        tags: ['markdown', 'docs', category.toLowerCase().replace(/\s+/g, '-')]
      };
    }
    
    // For code files, extract documentation from comments
    const docComments: string[] = [];
    const fileLines = content.split('\n');
    
    let inComment = false;
    let commentBlock = '';
    
    for (const line of fileLines) {
      // Check for JSDoc/TSDoc comments
      if (line.trim().startsWith('/**')) {
        inComment = true;
        commentBlock = line + '\n';
      } else if (inComment && line.includes('*/')) {
        inComment = false;
        commentBlock += line;
        docComments.push(commentBlock);
        commentBlock = '';
      } else if (inComment) {
        commentBlock += line + '\n';
      }
    }
    
    if (docComments.length === 0) return null;
    
    // Get the relative path from src for the category
    const relPath = path.relative(SRC_DIR, filePath);
    const category = path.dirname(relPath).split(path.sep)[0] || 'General';
    
    return {
      title: path.basename(filePath),
      content: docComments.join('\n\n'),
      category: category.charAt(0).toUpperCase() + category.slice(1),
      tags: [path.extname(filePath).substring(1), category.toLowerCase()]
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Scan directory recursively for files
 */
function scanDirectory(dirPath: string): string[] {
  const results: string[] = [];
  
  function scan(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }
  
  scan(dirPath);
  return results;
}

/**
 * Process all documentation files and generate wiki data
 */
function generateWikiData(): WikiDocument[] {
  console.log('Scanning source files for documentation...');
  const srcFiles = scanDirectory(SRC_DIR);
  
  console.log('Scanning documentation directory...');
  const docFiles = fs.existsSync(DOCS_DIR) ? scanDirectory(DOCS_DIR) : [];
  
  const allFiles = [...srcFiles, ...docFiles];
  console.log(`Found ${allFiles.length} files to process`);
  
  const wikiDocs: WikiDocument[] = [];
  
  for (const filePath of allFiles) {
    const doc = extractDocumentation(filePath);
    if (doc) {
      wikiDocs.push({
        id: Buffer.from(filePath).toString('base64'),
        title: doc.title || path.basename(filePath),
        content: doc.content || '',
        category: doc.category || 'Uncategorized',
        lastUpdated: new Date().toISOString(),
        tags: doc.tags || [],
      });
    }
  }
  
  console.log(`Generated ${wikiDocs.length} wiki documents`);
  return wikiDocs;
}

/**
 * Update the wiki data file
 */
function updateWikiData(documents: WikiDocument[]) {
  try {
    // Ensure the destination directory exists
    const dir = path.dirname(WIKI_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const data = `/**
 * Wiki Documentation Data
 * Auto-generated on: ${timestamp}
 * DO NOT EDIT THIS FILE MANUALLY
 */

import { WikiDocument } from '@/types/wiki/types';

export const wikiDocuments: WikiDocument[] = ${JSON.stringify(documents, null, 2)};
`;

    fs.writeFileSync(WIKI_DATA_PATH, data);
    console.log(`Wiki data updated successfully at ${WIKI_DATA_PATH}`);
    return true;
  } catch (error) {
    console.error('Error updating wiki data:', error);
    return false;
  }
}

/**
 * Main function to run the wiki updater
 */
function main() {
  console.log('Starting wiki documentation update...');
  const startTime = Date.now();
  
  const wikiDocs = generateWikiData();
  const success = updateWikiData(wikiDocs);
  
  const elapsedTime = (Date.now() - startTime) / 1000;
  
  if (success) {
    console.log(`Wiki documentation updated successfully in ${elapsedTime.toFixed(2)}s`);
  } else {
    console.error('Failed to update wiki documentation');
    process.exit(1);
  }
}

// Run the script
main();
