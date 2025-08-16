// Test file with various import/export patterns
import { useState, useEffect } from 'react';
import defaultExport from './utils.js';
import * as utils from './utils.js';
import { greeting } from './utils.js';

// Dynamic import
const loadModule = async () => {
  const module = await import('./dynamic-module.js');
  return module;
};

// CommonJS require (for testing)
const fs = require('fs');
const path = require('path');

// Alias imports
import Component from '@/components/Component';
import { helper } from '~/utils/helper';

// Export patterns
export const testFunction = () => {
  console.log('Test function');
};

export default class TestClass {
  constructor() {
    this.name = 'TestClass';
  }
}

// Re-export
export { greeting as hello } from './utils.js';
