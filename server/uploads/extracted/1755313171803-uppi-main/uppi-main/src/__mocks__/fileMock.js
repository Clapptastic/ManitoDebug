// Real file handling for assets instead of mocks
const fs = require('fs');
const path = require('path');

module.exports = {
  // Actual file reading functionality
  readFile: (filePath) => {
    try {
      return fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8');
    } catch (error) {
      console.warn(`Could not read file: ${filePath}`);
      return '';
    }
  },
  
  // Real asset URL handling
  getAssetUrl: (assetPath) => {
    // Return proper asset URLs for different environments
    if (process.env.NODE_ENV === 'production') {
      return `/assets/${assetPath}`;
    }
    return `/src/assets/${assetPath}`;
  },
  
  // Image loading functionality
  loadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
};