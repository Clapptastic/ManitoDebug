
/**
 * Setup Wiki Updater
 * 
 * This script sets up the wiki updater to run automatically on file changes.
 * It can be used in development environment to keep the wiki up-to-date.
 * For production, use the CI/CD integration script.
 */

import chokidar from 'chokidar';
import { execSync } from 'child_process';
import path from 'path';

// Configuration
const SRC_DIR = path.resolve(__dirname, '../');
const WIKI_UPDATER = path.resolve(__dirname, './wikiUpdater.ts');
const DEBOUNCE_TIME = 5000; // 5 seconds

// Variables to track state
let debounceTimer: NodeJS.Timeout | null = null;
let pendingChanges = false;

/**
 * Run the wiki updater script
 */
function runWikiUpdater() {
  try {
    console.log('Running wiki updater...');
    execSync(`ts-node ${WIKI_UPDATER}`, { stdio: 'inherit' });
    console.log('Wiki update complete!');
  } catch (error) {
    console.error('Error running wiki updater:', error);
  }
}

/**
 * Handle file change events
 */
function handleChange(filePath: string) {
  // Ignore changes to the wiki data file itself to prevent loops
  if (filePath.includes('wikiData.ts')) {
    return;
  }

  console.log(`File changed: ${filePath}`);
  pendingChanges = true;

  // Debounce updates to prevent multiple runs when many files change at once
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    if (pendingChanges) {
      runWikiUpdater();
      pendingChanges = false;
    }
  }, DEBOUNCE_TIME);
}

/**
 * Main function to start the watcher
 */
function main() {
  console.log('Setting up wiki updater file watcher...');

  // Initialize the chokidar watcher
  const watcher = chokidar.watch(`${SRC_DIR}/**/*.{ts,tsx,js,jsx,md}`, {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/wikiData.ts'
    ],
    persistent: true,
    ignoreInitial: true
  });

  // Add event listeners
  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', handleChange);

  console.log(`Watching for file changes in ${SRC_DIR}`);
  console.log('Wiki will update automatically when files change');
}

// Run the script
main();
