import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { VisualizationConfig, VisualizationHelpers } from '../../core/visualization-config.js';

const DependencyGraph = ({ data, width = 800, height = 600, config = VisualizationConfig }) => {
  const svgRef = useRef();
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [filters, setFilters] = useState({
    fileTypes: 'all',
    layers: 'all',
    complexity: 'all'
  });

  // Initialize D3 visualization
  useEffect(() => {
    if (!data || !data.dependencyGraph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const { nodes, edges } = data.dependencyGraph;
    
    // Apply filters
    const filteredNodes = applyFilters(nodes, filters);
    const filteredEdges = edges.filter(edge => 
      filteredNodes.some(node => node.id === edge.source) &&
      filteredNodes.some(node => node.id === edge.target)
    );

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredEdges).id(d => d.id).distance(config.layout.force.linkDistance))
      .force('charge', d3.forceManyBody().strength(config.layout.force.charge))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5));

    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([config.interactions.zoom.min, config.interactions.zoom.max])
      .on('zoom', (event) => {
        setZoom(event.transform.k);
        container.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Create container for all elements
    const container = svg.append('g');

    // Create arrow markers for edges
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', config.edges.arrows.size)
      .attr('markerHeight', config.edges.arrows.size)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', config.edges.arrows.color);

    // Create edges
    const edge = container.append('g')
      .selectAll('line')
      .data(filteredEdges)
      .enter().append('line')
      .attr('stroke', d => VisualizationHelpers.getDependencyColor(d.type))
      .attr('stroke-width', d => config.edges.width.default)
      .attr('stroke-opacity', config.edges.line.opacity)
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', config.edges.hover.width)
          .attr('stroke-opacity', config.edges.hover.opacity)
          .attr('stroke', config.edges.hover.color);
        
        // Show edge tooltip
        showTooltip(event, VisualizationHelpers.generateEdgeTooltip(d), 'edge');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', config.edges.width.default)
          .attr('stroke-opacity', config.edges.line.opacity)
          .attr('stroke', d => VisualizationHelpers.getDependencyColor(d.type));
        
        hideTooltip();
      });

    // Create nodes
    const node = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add node circles
    node.append('circle')
      .attr('r', d => VisualizationHelpers.calculateNodeSize(d.metrics.complexity, 'complexity'))
      .attr('fill', d => VisualizationHelpers.getFileTypeColor(d.type))
      .attr('stroke', config.nodes.border.color)
      .attr('stroke-width', config.nodes.border.width)
      .style('transition', `all ${config.animations.hover.duration}ms ${config.animations.hover.easing}`)
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this)
          .attr('r', d => VisualizationHelpers.calculateNodeSize(d.metrics.complexity, 'complexity') * config.nodes.hover.scale)
          .attr('stroke-width', config.nodes.hover.borderWidth)
          .style('filter', `drop-shadow(${config.nodes.hover.shadow})`);
        
        // Show node tooltip
        showTooltip(event, VisualizationHelpers.generateTooltip(d), 'node');
      })
      .on('mouseout', function() {
        setHoveredNode(null);
        d3.select(this)
          .attr('r', d => VisualizationHelpers.calculateNodeSize(d.metrics.complexity, 'complexity'))
          .attr('stroke-width', config.nodes.border.width)
          .style('filter', 'none');
        
        hideTooltip();
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        const newSelected = new Set(selectedNodes);
        if (newSelected.has(d.id)) {
          newSelected.delete(d.id);
        } else {
          newSelected.add(d.id);
        }
        setSelectedNodes(newSelected);
        
        // Highlight selected nodes
        node.selectAll('circle')
          .attr('stroke', d => 
            newSelected.has(d.id) ? config.interactions.selection.style.border : config.nodes.border.color
          )
          .attr('stroke-width', d => 
            newSelected.has(d.id) ? 3 : config.nodes.border.width
          );
      });

    // Add node labels
    node.append('text')
      .text(d => d.label.length > config.nodes.label.maxLength ? 
        d.label.substring(0, config.nodes.label.maxLength) + '...' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', config.nodes.label.fontSize)
      .style('font-family', config.nodes.label.fontFamily)
      .style('fill', config.nodes.label.color)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add complexity indicator
    node.append('circle')
      .attr('r', 3)
      .attr('cx', d => VisualizationHelpers.calculateNodeSize(d.metrics.complexity, 'complexity') + 5)
      .attr('cy', -5)
      .attr('fill', d => VisualizationHelpers.getComplexityColor(d.metrics.complexity))
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      edge
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, filters, selectedNodes]);

  // Apply filters to nodes
  const applyFilters = useCallback((nodes, filters) => {
    return nodes.filter(node => {
      if (filters.fileTypes !== 'all' && node.type !== filters.fileTypes) return false;
      if (filters.layers !== 'all' && node.data.category !== filters.layers) return false;
      if (filters.complexity !== 'all') {
        const complexity = node.metrics.complexity;
        switch (filters.complexity) {
          case 'low': return complexity <= 5;
          case 'medium': return complexity > 5 && complexity <= 15;
          case 'high': return complexity > 15 && complexity <= 30;
          case 'critical': return complexity > 30;
          default: return true;
        }
      }
      return true;
    });
  }, []);

  // Tooltip functions
  const showTooltip = (event, content, type) => {
    const tooltip = d3.select('body').select('.tooltip-container');
    if (tooltip.empty()) {
      d3.select('body').append('div')
        .attr('class', 'tooltip-container')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', 1000);
    }

    d3.select('.tooltip-container')
      .html(content)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .style('opacity', 1);
  };

  const hideTooltip = () => {
    d3.select('.tooltip-container').style('opacity', 0);
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Reset view
  const resetView = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
    setZoom(1);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNodes(new Set());
  };

  return (
    <div className="dependency-graph-container">
      {/* Controls */}
      <div className="graph-controls">
        <div className="filter-controls">
          <select 
            value={filters.fileTypes} 
            onChange={(e) => handleFilterChange('fileTypes', e.target.value)}
            className="filter-select"
          >
            <option value="all">All File Types</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="jsx">JSX</option>
            <option value="tsx">TSX</option>
            <option value="css">CSS</option>
            <option value="config">Config</option>
            <option value="test">Test</option>
          </select>

          <select 
            value={filters.layers} 
            onChange={(e) => handleFilterChange('layers', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Layers</option>
            <option value="presentation">Presentation</option>
            <option value="business">Business</option>
            <option value="data">Data</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="shared">Shared</option>
          </select>

          <select 
            value={filters.complexity} 
            onChange={(e) => handleFilterChange('complexity', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Complexity</option>
            <option value="low">Low (0-5)</option>
            <option value="medium">Medium (6-15)</option>
            <option value="high">High (16-30)</option>
            <option value="critical">Critical (30+)</option>
          </select>
        </div>

        <div className="view-controls">
          <button onClick={resetView} className="control-btn">
            Reset View
          </button>
          <button onClick={clearSelection} className="control-btn">
            Clear Selection
          </button>
          <span className="zoom-level">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Graph */}
      <div className="graph-container">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }}
        />
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <h4>Legend</h4>
        <div className="legend-section">
          <h5>File Types</h5>
          {config.legend.categories[0].items.map(item => (
            <div key={item.label} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="legend-section">
          <h5>Complexity</h5>
          {config.legend.categories[3].items.map(item => (
            <div key={item.label} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="legend-section">
          <h5>Dependencies</h5>
          {config.legend.categories[2].items.map(item => (
            <div key={item.label} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="graph-stats">
          <h4>Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Nodes:</span>
              <span className="stat-value">{data.dependencyGraph.nodes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Edges:</span>
              <span className="stat-value">{data.dependencyGraph.edges.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedNodes.size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hovered:</span>
              <span className="stat-value">{hoveredNode ? hoveredNode.label : 'None'}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dependency-graph-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .graph-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .filter-controls {
          display: flex;
          gap: 8px;
        }

        .filter-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .view-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-btn {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
        }

        .control-btn:hover {
          background: #f5f5f5;
        }

        .zoom-level {
          font-size: 12px;
          color: #666;
        }

        .graph-container {
          display: flex;
          justify-content: center;
        }

        .graph-legend {
          display: flex;
          gap: 24px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .legend-section h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid #ddd;
        }

        .graph-stats {
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .stat-label {
          color: #666;
        }

        .stat-value {
          font-weight: bold;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default DependencyGraph;
