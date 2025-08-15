#!/usr/bin/env node

// Manito CLI Vibe Command - Quick codebase health check
// This is a standalone entry point for the 'vibe' command

import { CodeScanner } from '@manito/core';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';

async function runVibeCheck(checkPath = '.') {
    const spinner = ora('Checking codebase vibe...').start();
    
    try {
        const scanner = new CodeScanner({
            patterns: ['**/*.{js,jsx,ts,tsx}'],
            excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        const results = await scanner.scan(checkPath);
        spinner.succeed('Vibe check complete!');
        
        const vibeScore = calculateVibeScore(results);
        displayVibeResults(results, vibeScore);
        
    } catch (error) {
        spinner.fail(`Vibe check failed: ${error.message}`);
        process.exit(1);
    }
}

function calculateVibeScore(results) {
    let score = 100;
    
    // Penalize for conflicts
    score -= results.conflicts.length * 10;
    
    // Penalize for high complexity files
    const highComplexityFiles = results.files.filter(f => f.complexity > 10).length;
    score -= highComplexityFiles * 5;
    
    // Penalize for very large files
    const largeFiles = results.files.filter(f => f.lines > 500).length;
    score -= largeFiles * 3;
    
    return Math.max(0, Math.min(100, score));
}

function displayVibeResults(results, score) {
    let emoji, color, message;
    
    if (score >= 90) {
        emoji = '🎉';
        color = 'green';
        message = 'Excellent! Your code is in great shape.';
    } else if (score >= 70) {
        emoji = '😊';
        color = 'yellow';
        message = 'Good vibes! Minor improvements possible.';
    } else if (score >= 50) {
        emoji = '😐';
        color = 'orange';
        message = 'Okay vibes. Some issues need attention.';
    } else {
        emoji = '😰';
        color = 'red';
        message = 'Rough vibes. Significant issues detected.';
    }
    
    console.log('\n' + boxen(
        chalk.bold[color](`${emoji} Vibe Score: ${score}/100`) + '\n' +
        chalk[color](message),
        {
            padding: 1,
            borderColor: color,
            borderStyle: 'round'
        }
    ));
    
    console.log(chalk.cyan('📊 Quick Stats:'));
    console.log(`  Files: ${results.files.length}`);
    console.log(`  Lines: ${results.metrics.linesOfCode.toLocaleString()}`);
    console.log(`  Conflicts: ${results.conflicts.length}`);
    
    if (results.conflicts.length > 0) {
        console.log('\n' + chalk.yellow('🔧 Issues found:'));
        results.conflicts.slice(0, 3).forEach(conflict => {
            console.log(`  • ${conflict.message}`);
        });
        
        if (results.conflicts.length > 3) {
            console.log(chalk.gray(`  ... and ${results.conflicts.length - 3} more`));
        }
    }
    
    console.log('\n' + chalk.blue('💡 Tip: Run "manito scan" for detailed analysis'));
}

// Run the vibe check
if (process.argv[1].endsWith('vibe.js')) {
    const path = process.argv[2] || '.';
    runVibeCheck(path);
}

export { runVibeCheck, calculateVibeScore, displayVibeResults };
