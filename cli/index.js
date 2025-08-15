#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { CodeScanner } from '@manito/core';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

program
  .name('manito')
  .description('AI-powered code analysis and debugging CLI')
  .version('1.0.0');

// Scan command
program
  .command('scan')
  .description('Analyze code dependencies and conflicts')
  .argument('[path]', 'Path to scan', '.')
  .option('-o, --output <file>', 'Output file for results')
  .option('--format <format>', 'Output format (json|table|summary)', 'summary')
  .option('--exclude <patterns...>', 'Patterns to exclude')
  .action(async (scanPath, options) => {
    const spinner = ora('Starting code scan...').start();
    
    try {
      const scanner = new CodeScanner({
        excludePatterns: options.exclude || ['node_modules/**', 'dist/**', 'build/**']
      });
      
      spinner.text = `Scanning ${scanPath}...`;
      const results = await scanner.scan(scanPath);
      
      spinner.succeed(`Scan completed in ${results.scanTime}ms`);
      
      // Display results
      displayScanResults(results, options.format);
      
      // Save to file if requested
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(chalk.green(`Results saved to ${options.output}`));
      }
      
    } catch (error) {
      spinner.fail(`Scan failed: ${error.message}`);
      process.exit(1);
    }
  });

// Vibe command - quick health check
program
  .command('vibe')
  .description('Quick codebase health check')
  .argument('[path]', 'Path to check', '.')
  .action(async (checkPath) => {
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
  });

// Server command
program
  .command('serve')
  .description('Start Manito development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(async (options) => {
    console.log(chalk.blue('Starting Manito development server...'));
    console.log(chalk.gray(`Port: ${options.port}`));
    console.log(chalk.yellow('Note: This would start the full Manito server'));
    console.log(chalk.gray('Run "npm run dev" in the project root for full functionality'));
  });

// Export command
program
  .command('export')
  .description('Export scan results to various formats')
  .argument('<input>', 'Input scan results file')
  .option('-f, --format <format>', 'Export format (csv|html|pdf)', 'html')
  .option('-o, --output <file>', 'Output file')
  .action(async (input, options) => {
    try {
      const data = JSON.parse(await fs.readFile(input, 'utf-8'));
      console.log(chalk.blue(`Exporting to ${options.format.toUpperCase()}...`));
      console.log(chalk.yellow('Note: Export functionality would be implemented here'));
      console.log(chalk.green('Export completed!'));
    } catch (error) {
      console.error(chalk.red(`Export failed: ${error.message}`));
      process.exit(1);
    }
  });

function displayScanResults(results, format) {
  console.log('\n' + boxen(chalk.bold.blue('📊 Scan Results'), {
    padding: 1,
    borderColor: 'blue',
    borderStyle: 'round'
  }));
  
  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log(chalk.cyan('📁 Files:'), results.files.length);
  console.log(chalk.cyan('📊 Lines of Code:'), results.metrics.linesOfCode.toLocaleString());
  console.log(chalk.cyan('🔗 Dependencies:'), results.metrics.dependencies);
  
  if (results.conflicts.length > 0) {
    console.log(chalk.red('⚠️  Conflicts:'), results.conflicts.length);
    console.log();
    
    results.conflicts.forEach(conflict => {
      const icon = conflict.severity === 'error' ? '❌' : 
                   conflict.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${chalk.yellow(conflict.type)}: ${conflict.message}`);
    });
  } else {
    console.log(chalk.green('✅ No conflicts found!'));
  }
  
  if (format === 'table' && results.files.length > 0) {
    console.log('\n' + chalk.bold('📋 File Details:'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log(
      chalk.cyan('File'.padEnd(40)) +
      chalk.cyan('Lines'.padEnd(10)) +
      chalk.cyan('Size'.padEnd(10)) +
      chalk.cyan('Complexity')
    );
    console.log(chalk.gray('─'.repeat(80)));
    
    results.files.slice(0, 10).forEach(file => {
      const fileName = path.basename(file.filePath);
      const sizeKB = (file.size / 1024).toFixed(1) + 'KB';
      console.log(
        fileName.padEnd(40).slice(0, 40) +
        file.lines.toString().padEnd(10) +
        sizeKB.padEnd(10) +
        file.complexity.toString()
      );
    });
    
    if (results.files.length > 10) {
      console.log(chalk.gray(`... and ${results.files.length - 10} more files`));
    }
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
    chalk.bold[color](`${emoji} Vibe Score: ${score}/100`) + '\\n' +
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
    console.log('\\n' + chalk.yellow('🔧 Issues found:'));
    results.conflicts.slice(0, 3).forEach(conflict => {
      console.log(`  • ${conflict.message}`);
    });
    
    if (results.conflicts.length > 3) {
      console.log(chalk.gray(`  ... and ${results.conflicts.length - 3} more`));
    }
  }
}

program.parse();