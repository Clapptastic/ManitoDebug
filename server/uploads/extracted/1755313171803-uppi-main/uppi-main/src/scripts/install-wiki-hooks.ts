
/**
 * Install Wiki Git Hooks
 * 
 * This script installs Git hooks that automatically update the wiki documentation
 * when committing changes. Run this script once to set up the hooks.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const HOOKS_DIR = path.resolve(__dirname, '../../.git/hooks');
const PRE_COMMIT_HOOK_PATH = path.join(HOOKS_DIR, 'pre-commit');

// Pre-commit hook script content
const PRE_COMMIT_HOOK = `#!/bin/sh
# Auto-update wiki documentation

echo "Running wiki updater..."
# Save changes to a temporary stash
git stash save --keep-index --include-untracked

# Run the wiki updater
npx ts-node ./src/scripts/wikiUpdater.ts

# Add wiki data file if it changed
git add -f src/components/admin/wiki/wikiData.ts 2>/dev/null || true

# Restore stashed changes
git stash pop 2>/dev/null || true

echo "Wiki update complete"
`;

/**
 * Install the pre-commit hook
 */
function installPreCommitHook() {
  try {
    if (!fs.existsSync(HOOKS_DIR)) {
      fs.mkdirSync(HOOKS_DIR, { recursive: true });
    }
    
    fs.writeFileSync(PRE_COMMIT_HOOK_PATH, PRE_COMMIT_HOOK, { mode: 0o755 });
    console.log(`Pre-commit hook installed at ${PRE_COMMIT_HOOK_PATH}`);
  } catch (error) {
    console.error('Error installing pre-commit hook:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Installing wiki git hooks...');
  installPreCommitHook();
  console.log('Wiki git hooks installed successfully');
}

// Run the script
main();
