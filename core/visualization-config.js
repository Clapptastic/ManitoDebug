// Visualization Configuration for Dependency Graphs
// Best practices for interactive codebase visualization

export const VisualizationConfig = {
  // Color Schemes
  colors: {
    // File Type Colors
    fileTypes: {
      javascript: '#F7DF1E',      // JS Yellow
      typescript: '#3178C6',      // TS Blue
      jsx: '#61DAFB',            // React Blue
      tsx: '#3178C6',            // TS Blue
      css: '#1572B6',            // CSS Blue
      scss: '#CF649A',           // SCSS Pink
      html: '#E34F26',           // HTML Orange
      json: '#000000',           // JSON Black
      config: '#6C757D',         // Config Gray
      test: '#28A745',           // Test Green
      other: '#6C757D'           // Other Gray
    },

    // Architecture Layer Colors
    layers: {
      presentation: '#FF6B6B',    // Red
      business: '#4ECDC4',        // Teal
      data: '#45B7D1',           // Blue
      infrastructure: '#96CEB4',  // Green
      shared: '#FFEAA7',         // Yellow
      external: '#DDA0DD'        // Plum
    },

    // Dependency Type Colors
    dependencyTypes: {
      relative: '#4CAF50',       // Green
      absolute: '#2196F3',       // Blue
      alias: '#FF9800',          // Orange
      external: '#9C27B0',       // Purple
      circular: '#F44336'        // Red
    },

    // Quality Metrics Colors
    quality: {
      excellent: '#4CAF50',      // Green
      good: '#8BC34A',           // Light Green
      fair: '#FFC107',           // Yellow
      poor: '#FF9800',           // Orange
      critical: '#F44336'        // Red
    },

    // Complexity Colors
    complexity: {
      low: '#4CAF50',            // Green (0-5)
      medium: '#FFC107',         // Yellow (6-15)
      high: '#FF9800',           // Orange (16-30)
      critical: '#F44336'        // Red (30+)
    },

    // Coupling Colors
    coupling: {
      loose: '#4CAF50',          // Green (0-2)
      moderate: '#FFC107',       // Yellow (3-10)
      tight: '#FF9800',          // Orange (11-20)
      veryTight: '#F44336'       // Red (20+)
    }
  },

  // Node Styling
  nodes: {
    // Size based on metrics
    size: {
      min: 8,
      max: 50,
      scaleBy: 'complexity', // 'complexity', 'lines', 'dependencies', 'fanIn', 'fanOut'
      default: 20
    },

    // Shape based on file type
    shapes: {
      javascript: 'circle',
      typescript: 'circle',
      jsx: 'diamond',
      tsx: 'diamond',
      css: 'square',
      scss: 'square',
      html: 'triangle',
      json: 'hexagon',
      config: 'star',
      test: 'cross',
      other: 'circle'
    },

    // Border styling
    border: {
      width: 2,
      color: '#FFFFFF',
      style: 'solid'
    },

    // Label styling
    label: {
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: 4,
      borderRadius: 4,
      maxLength: 20
    },

    // Hover effects
    hover: {
      scale: 1.2,
      shadow: '0 4px 8px rgba(0,0,0,0.3)',
      borderWidth: 3
    }
  },

  // Edge Styling
  edges: {
    // Width based on dependency strength
    width: {
      min: 1,
      max: 8,
      scaleBy: 'strength', // 'strength', 'frequency', 'type'
      default: 2
    },

    // Arrow styling
    arrows: {
      size: 10,
      type: 'triangle', // 'triangle', 'circle', 'arrow', 'none'
      color: 'inherit'
    },

    // Line styling
    line: {
      style: 'solid', // 'solid', 'dashed', 'dotted'
      opacity: 0.7,
      curve: 'bezier' // 'straight', 'bezier', 'curved'
    },

    // Hover effects
    hover: {
      width: 4,
      opacity: 1,
      color: '#FF5722'
    }
  },

  // Animation Configuration
  animations: {
    // Initial load animation
    load: {
      duration: 1000,
      easing: 'easeOutQuart',
      stagger: 50, // Delay between nodes
      type: 'fadeIn' // 'fadeIn', 'scaleIn', 'slideIn', 'bounceIn'
    },

    // Node hover animations
    hover: {
      duration: 200,
      easing: 'easeOutQuad',
      type: 'scale' // 'scale', 'glow', 'pulse', 'shake'
    },

    // Edge animations
    edge: {
      duration: 300,
      easing: 'easeInOutQuad',
      type: 'flow' // 'flow', 'pulse', 'dash', 'none'
    },

    // Layout transitions
    layout: {
      duration: 800,
      easing: 'easeInOutCubic',
      type: 'smooth' // 'smooth', 'bounce', 'elastic'
    },

    // Filter animations
    filter: {
      duration: 400,
      easing: 'easeInOutQuad',
      type: 'fade' // 'fade', 'slide', 'scale'
    }
  },

  // Layout Configuration
  layout: {
    // Force-directed layout
    force: {
      charge: -1000,
      linkDistance: 100,
      linkStrength: 0.1,
      gravity: 0.1,
      alpha: 0.3,
      alphaDecay: 0.02,
      velocityDecay: 0.4
    },

    // Hierarchical layout
    hierarchical: {
      direction: 'TB', // 'TB', 'BT', 'LR', 'RL'
      nodeSeparation: 80,
      levelSeparation: 120,
      sortMethod: 'directed' // 'directed', 'weight', 'custom'
    },

    // Circular layout
    circular: {
      radius: 300,
      startAngle: 0,
      endAngle: 2 * Math.PI
    },

    // Grid layout
    grid: {
      rows: 10,
      cols: 10,
      spacing: 100
    }
  },

  // Interaction Configuration
  interactions: {
    // Zoom and pan
    zoom: {
      min: 0.1,
      max: 3,
      step: 0.1,
      enabled: true
    },

    // Drag and drop
    drag: {
      enabled: true,
      inertia: true,
      inertiaDecay: 0.95
    },

    // Selection
    selection: {
      enabled: true,
      multiple: true,
      style: {
        border: '2px solid #2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)'
      }
    },

    // Tooltips
    tooltip: {
      enabled: true,
      delay: 500,
      position: 'follow', // 'follow', 'fixed', 'smart'
      content: 'detailed' // 'simple', 'detailed', 'custom'
    }
  },

  // Filtering and Search
  filters: {
    // File type filter
    fileTypes: {
      enabled: true,
      default: 'all'
    },

    // Architecture layer filter
    layers: {
      enabled: true,
      default: 'all'
    },

    // Complexity filter
    complexity: {
      enabled: true,
      ranges: [
        { label: 'Low', min: 0, max: 5, color: '#4CAF50' },
        { label: 'Medium', min: 6, max: 15, color: '#FFC107' },
        { label: 'High', min: 16, max: 30, color: '#FF9800' },
        { label: 'Critical', min: 31, max: Infinity, color: '#F44336' }
      ]
    },

    // Search
    search: {
      enabled: true,
      fields: ['name', 'path', 'category'],
      fuzzy: true,
      highlight: true
    }
  },

  // Legend Configuration
  legend: {
    // Position
    position: 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    
    // Styling
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #E0E0E0',
      borderRadius: 8,
      padding: 16,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif'
    },

    // Categories
    categories: [
      {
        name: 'File Types',
        items: [
          { label: 'JavaScript', color: '#F7DF1E', shape: 'circle' },
          { label: 'TypeScript', color: '#3178C6', shape: 'circle' },
          { label: 'JSX/TSX', color: '#61DAFB', shape: 'diamond' },
          { label: 'CSS/SCSS', color: '#1572B6', shape: 'square' },
          { label: 'Config', color: '#6C757D', shape: 'star' },
          { label: 'Test', color: '#28A745', shape: 'cross' }
        ]
      },
      {
        name: 'Architecture Layers',
        items: [
          { label: 'Presentation', color: '#FF6B6B' },
          { label: 'Business', color: '#4ECDC4' },
          { label: 'Data', color: '#45B7D1' },
          { label: 'Infrastructure', color: '#96CEB4' },
          { label: 'Shared', color: '#FFEAA7' },
          { label: 'External', color: '#DDA0DD' }
        ]
      },
      {
        name: 'Dependency Types',
        items: [
          { label: 'Relative', color: '#4CAF50' },
          { label: 'Absolute', color: '#2196F3' },
          { label: 'Alias', color: '#FF9800' },
          { label: 'External', color: '#9C27B0' },
          { label: 'Circular', color: '#F44336' }
        ]
      },
      {
        name: 'Complexity',
        items: [
          { label: 'Low (0-5)', color: '#4CAF50' },
          { label: 'Medium (6-15)', color: '#FFC107' },
          { label: 'High (16-30)', color: '#FF9800' },
          { label: 'Critical (30+)', color: '#F44336' }
        ]
      }
    ]
  },

  // Performance Configuration
  performance: {
    // Rendering
    rendering: {
      maxNodes: 1000,
      maxEdges: 2000,
      culling: true,
      levelOfDetail: true
    },

    // Animation
    animation: {
      fps: 60,
      throttle: 16, // ms
      enabled: true
    },

    // Memory
    memory: {
      cacheSize: 100,
      cleanupInterval: 30000, // ms
      garbageCollection: true
    }
  },

  // Accessibility
  accessibility: {
    // Keyboard navigation
    keyboard: {
      enabled: true,
      shortcuts: {
        zoomIn: 'KeyI',
        zoomOut: 'KeyO',
        reset: 'KeyR',
        search: 'KeyS',
        help: 'KeyH'
      }
    },

    // Screen reader support
    screenReader: {
      enabled: true,
      announcements: true,
      descriptions: true
    },

    // High contrast mode
    highContrast: {
      enabled: false,
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        accent: '#FFFF00'
      }
    }
  }
};

// Helper functions for visualization
export const VisualizationHelpers = {
  // Get color for file type
  getFileTypeColor(fileType) {
    return VisualizationConfig.colors.fileTypes[fileType] || 
           VisualizationConfig.colors.fileTypes.other;
  },

  // Get color for architecture layer
  getLayerColor(layer) {
    return VisualizationConfig.colors.layers[layer] || 
           VisualizationConfig.colors.layers.shared;
  },

  // Get color for dependency type
  getDependencyColor(type) {
    return VisualizationConfig.colors.dependencyTypes[type] || 
           VisualizationConfig.colors.dependencyTypes.external;
  },

  // Get color for complexity level
  getComplexityColor(complexity) {
    if (complexity <= 5) return VisualizationConfig.colors.complexity.low;
    if (complexity <= 15) return VisualizationConfig.colors.complexity.medium;
    if (complexity <= 30) return VisualizationConfig.colors.complexity.high;
    return VisualizationConfig.colors.complexity.critical;
  },

  // Get color for coupling level
  getCouplingColor(coupling) {
    if (coupling <= 2) return VisualizationConfig.colors.coupling.loose;
    if (coupling <= 10) return VisualizationConfig.colors.coupling.moderate;
    if (coupling <= 20) return VisualizationConfig.colors.coupling.tight;
    return VisualizationConfig.colors.coupling.veryTight;
  },

  // Calculate node size based on metric
  calculateNodeSize(value, metric = 'complexity') {
    const config = VisualizationConfig.nodes.size;
    const min = config.min;
    const max = config.max;
    
    // Normalize value (assuming reasonable ranges)
    let normalized = 0;
    switch (metric) {
      case 'complexity':
        normalized = Math.min(value / 50, 1); // Max complexity of 50
        break;
      case 'lines':
        normalized = Math.min(value / 1000, 1); // Max lines of 1000
        break;
      case 'dependencies':
        normalized = Math.min(value / 20, 1); // Max dependencies of 20
        break;
      default:
        normalized = 0.5;
    }
    
    return min + (max - min) * normalized;
  },

  // Generate tooltip content
  generateTooltip(node) {
    return `
      <div class="tooltip">
        <h4>${node.label}</h4>
        <p><strong>Path:</strong> ${node.data.path}</p>
        <p><strong>Type:</strong> ${node.data.category}</p>
        <p><strong>Lines:</strong> ${node.data.lines}</p>
        <p><strong>Complexity:</strong> ${node.data.complexity}</p>
        <p><strong>Dependencies:</strong> ${node.data.dependencyCount}</p>
        <p><strong>Functions:</strong> ${node.data.functions}</p>
      </div>
    `;
  },

  // Generate edge tooltip
  generateEdgeTooltip(edge) {
    return `
      <div class="tooltip">
        <h4>Dependency</h4>
        <p><strong>From:</strong> ${edge.source}</p>
        <p><strong>To:</strong> ${edge.target}</p>
        <p><strong>Type:</strong> ${edge.type}</p>
        <p><strong>Circular:</strong> ${edge.properties.isCircular ? 'Yes' : 'No'}</p>
        <p><strong>External:</strong> ${edge.properties.isExternal ? 'Yes' : 'No'}</p>
      </div>
    `;
  }
};

export default VisualizationConfig;
