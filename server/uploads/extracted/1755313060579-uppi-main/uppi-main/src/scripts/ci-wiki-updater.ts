
/**
 * CI/CD Wiki Updater
 * 
 * This script updates the wiki documentation as part of CI/CD pipeline.
 * It should be run before the build process to ensure the wiki is up-to-date.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Configuration
const WIKI_UPDATER = path.resolve(__dirname, './wikiUpdater.ts');

/**
 * Main function to run the updater
 */
async function main() {
  try {
    console.log('Starting CI/CD wiki update process...');
    
    // Run the wiki updater
    execSync(`ts-node ${WIKI_UPDATER}`, { stdio: 'inherit' });
    
    // Check if there are any changes to commit
    const status = execSync('git status --porcelain').toString();
    
    if (status.includes('wikiData.ts')) {
      console.log('Wiki changes detected, committing changes...');
      
      // Configure git user for CI/CD environment if needed
      if (process.env.CI) {
        execSync('git config --global user.name "Wiki Updater Bot"');
        execSync('git config --global user.email "bot@example.com"');
      }
      
      // Commit the changes
      execSync('git add src/components/admin/wiki/wikiData.ts');
      execSync('git commit -m "docs: update wiki documentation [ci skip]"');
      
      // Push if needed
      if (process.env.CI && process.env.WIKI_AUTO_PUSH === 'true') {
        console.log('Pushing wiki changes...');
        execSync('git push origin HEAD');
      }
      
      console.log('Wiki changes committed successfully');
    } else {
      console.log('No wiki changes detected');
    }
    
    console.log('CI/CD wiki update process completed');
  } catch (error) {
    console.error('Error in CI/CD wiki update process:', error);
    process.exit(1);
  }
}

// Run the script
main();
