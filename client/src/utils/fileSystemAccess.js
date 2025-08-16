/**
 * Browser File System Access Utilities
 * Provides cross-browser support for accessing local files and directories
 */

// Check if File System Access API is supported
export const isFileSystemAccessSupported = () => {
  return 'showDirectoryPicker' in window;
};

// Check if webkitdirectory is supported (fallback)
export const isWebkitDirectorySupported = () => {
  const input = document.createElement('input');
  return 'webkitdirectory' in input;
};

/**
 * Modern File System Access API approach
 */
export const selectDirectoryModern = async () => {
  try {
    const directoryHandle = await window.showDirectoryPicker({
      mode: 'read'
    });
    
    const files = [];
    await processDirectoryHandle(directoryHandle, files);
    
    return {
      name: directoryHandle.name,
      files: files,
      type: 'modern'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
};

/**
 * Process directory handle recursively
 */
async function processDirectoryHandle(directoryHandle, files = [], currentPath = '') {
  for await (const [name, handle] of directoryHandle.entries()) {
    const path = currentPath ? `${currentPath}/${name}` : name;
    
    if (handle.kind === 'file') {
      // Skip common non-code files
      if (shouldIncludeFile(name)) {
        try {
          const file = await handle.getFile();
          const content = await file.text();
          
          files.push({
            name: name,
            path: path,
            content: content,
            size: file.size,
            lastModified: file.lastModified,
            type: file.type
          });
        } catch (error) {
          console.warn(`Could not read file ${path}:`, error);
        }
      }
    } else if (handle.kind === 'directory') {
      // Skip common directories we don't want to scan
      if (!shouldSkipDirectory(name)) {
        await processDirectoryHandle(handle, files, path);
      }
    }
  }
}

/**
 * Fallback webkitdirectory approach
 */
export const selectDirectoryFallback = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = async (event) => {
      const files = Array.from(event.target.files);
      if (files.length === 0) {
        resolve(null);
        return;
      }
      
      const processedFiles = [];
      const directoryName = files[0].webkitRelativePath.split('/')[0];
      
      for (const file of files) {
        if (shouldIncludeFile(file.name)) {
          try {
            const content = await file.text();
            processedFiles.push({
              name: file.name,
              path: file.webkitRelativePath,
              content: content,
              size: file.size,
              lastModified: file.lastModified,
              type: file.type
            });
          } catch (error) {
            console.warn(`Could not read file ${file.webkitRelativePath}:`, error);
          }
        }
      }
      
      resolve({
        name: directoryName,
        files: processedFiles,
        type: 'fallback'
      });
    };
    
    input.onerror = reject;
    input.click();
  });
};

/**
 * Main directory selection function with fallback
 */
export const selectDirectory = async () => {
  if (isFileSystemAccessSupported()) {
    try {
      return await selectDirectoryModern();
    } catch (error) {
      console.warn('Modern File System Access failed, falling back:', error);
      // Fall through to fallback
    }
  }
  
  if (isWebkitDirectorySupported()) {
    return await selectDirectoryFallback();
  }
  
  throw new Error('Browser does not support directory selection');
};

/**
 * Check if we should include this file in scanning
 */
function shouldIncludeFile(filename) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return extensions.includes(ext);
}

/**
 * Check if we should skip this directory
 */
function shouldSkipDirectory(dirname) {
  const skipDirs = [
    'node_modules', 
    'dist', 
    'build', 
    '.git', 
    '.svn', 
    'coverage', 
    '.next', 
    '.nuxt',
    'vendor',
    '__pycache__'
  ];
  return skipDirs.includes(dirname);
}

/**
 * Create FormData for upload from selected files
 */
export const createUploadFormData = (directoryData, projectName) => {
  const formData = new FormData();
  
  // Create a zip-like structure by uploading individual files
  const fileData = {
    name: projectName || directoryData.name,
    files: directoryData.files.map(file => ({
      path: file.path,
      content: file.content,
      size: file.size
    }))
  };
  
  // Send as JSON for now - we could implement client-side zipping later
  formData.append('projectData', JSON.stringify(fileData));
  formData.append('projectName', projectName || directoryData.name);
  formData.append('source', 'browser-directory');
  
  return formData;
};