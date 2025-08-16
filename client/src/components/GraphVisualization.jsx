import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Search,
  Filter,
  Download,
  Layers,
  GitBranch,
  AlertCircle,
  FileText
} from 'lucide-react'

function GraphVisualization({ data }) {
  const svgRef = useRef()
  const containerRef = useRef()
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [zoomLevel, setZoomLevel] = useState(1)

  const nodeTypes = {
    entry: { color: '#3b82f6', icon: '🚀' },
    component: { color: '#10b981', icon: '⚛️' },
    utility: { color: '#f59e0b', icon: '🔧' },
    service: { color: '#8b5cf6', icon: '⚙️' },
    dependency: { color: '#ef4444', icon: '📦' },
    external: { color: '#6b7280', icon: '🔗' }
  }

  useEffect(() => {
    if (!data || !data.files || !Array.isArray(data.files) || data.files.length === 0) {
      // Clear previous visualization if no data
      d3.select(svgRef.current).selectAll('*').remove()
      return
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const container = containerRef.current
    if (!container) return
    
    try {
      const containerRect = container.getBoundingClientRect()
      const width = containerRect.width
      const height = containerRect.height

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .style('background', 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)')

      // Create definitions for gradients and filters
      const defs = svg.append('defs')

      // Gradient definitions for nodes
      Object.entries(nodeTypes).forEach(([type, config]) => {
        const gradient = defs.append('linearGradient')
          .attr('id', `gradient-${type}`)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '100%').attr('y2', '100%')

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('style', `stop-color:${config.color};stop-opacity:0.8`)

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('style', `stop-color:${d3.color(config.color).darker(0.5)};stop-opacity:1`)
      })

      // Glow filter
      const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%')

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'coloredBlur')

      const feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'coloredBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

      // Create zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          setZoomLevel(event.transform.k)
          g.attr('transform', event.transform)
        })

      svg.call(zoom)

      // Main group for zoom/pan
      const g = svg.append('g')

      // Process data into nodes and links
      const nodes = data.files.map((file, index) => ({
        id: file.filePath || `file-${index}`,
        label: file.filePath?.split('/').pop() || `File ${index}`,
        type: determineNodeType(file),
        size: Math.max(20, Math.min(60, (file.lines || 0) / 10)),
        complexity: file.complexity || 0,
        lines: file.lines || 0,
        filePath: file.filePath || ''
      }))

      // Create links from dependencies
      const links = []
      if (data.dependencies && typeof data.dependencies === 'object') {
        Object.entries(data.dependencies).forEach(([from, to]) => {
          if (from && to) {
            links.push({
              source: from,
              target: to,
              value: 1
            })
          }
        })
      }

      // Create force simulation
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.size + 10))

      // Create links
      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#4b5563')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)

      // Create nodes
      const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

      // Add circles to nodes
      node.append('circle')
        .attr('r', d => d.size)
        .attr('fill', d => `url(#gradient-${d.type})`)
        .attr('stroke', d => nodeTypes[d.type]?.color || '#6b7280')
        .attr('stroke-width', 2)
        .style('filter', 'url(#glow)')
        .on('click', (event, d) => setSelectedNode(d))
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke-width', 4)
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('stroke-width', 2)
        })

      // Add labels to nodes
      node.append('text')
        .text(d => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')

      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node
          .attr('transform', d => `translate(${d.x},${d.y})`)
      })

      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event, d) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      // Determine node type based on file properties
      function determineNodeType(file) {
        const path = file.filePath || ''
        if (path.includes('test') || path.includes('spec')) return 'test'
        if (path.includes('component') || path.includes('Component')) return 'component'
        if (path.includes('util') || path.includes('helper')) return 'utility'
        if (path.includes('service') || path.includes('api')) return 'service'
        if (path.includes('node_modules') || path.includes('vendor')) return 'external'
        return 'entry'
      }

    } catch (error) {
      console.error('Error creating graph visualization:', error)
      // Show error state
      d3.select(svgRef.current).selectAll('*').remove()
      const svg = d3.select(svgRef.current)
        .attr('width', 400)
        .attr('height', 300)
        .style('background', 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)')
      
      svg.append('text')
        .attr('x', 200)
        .attr('y', 150)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .attr('font-size', '16px')
        .text('Error creating visualization')
    }
  }, [data])

  const getNodeType = (file) => {
    const path = file.filePath.toLowerCase()
    if (path.includes('index') || path.includes('main') || path.includes('app')) return 'entry'
    if (path.includes('component')) return 'component'
    if (path.includes('util') || path.includes('helper')) return 'utility'
    if (path.includes('service') || path.includes('api')) return 'service'
    if (path.includes('node_modules')) return 'external'
    return 'dependency'
  }

  const handleZoomIn = () => {
    d3.select(svgRef.current).transition().call(
      d3.zoom().scaleBy, 1.5
    )
  }

  const handleZoomOut = () => {
    d3.select(svgRef.current).transition().call(
      d3.zoom().scaleBy, 1 / 1.5
    )
  }

  const handleReset = () => {
    d3.select(svgRef.current).transition().call(
      d3.zoom().transform,
      d3.zoomIdentity
    )
  }

  const handleExport = () => {
    const svgElement = svgRef.current
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgElement)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'dependency-graph.svg'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  if (!data || !data.files || data.files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <GitBranch className="w-16 h-16 text-gray-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-300">No Dependencies Found</h3>
            <p className="text-gray-500">Run a scan to visualize your project's dependency graph</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-4 py-2 w-48 text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field py-2 px-3 text-sm"
          >
            <option value="all">All Types</option>
            <option value="entry">Entry Points</option>
            <option value="component">Components</option>
            <option value="utility">Utilities</option>
            <option value="service">Services</option>
            <option value="dependency">Dependencies</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-400 mr-4">
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
          
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-gray-300" />
          </button>
          
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-gray-300" />
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-gray-300" />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 glass-panel p-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Legend</h4>
          {Object.entries(nodeTypes).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-gray-400 capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 glass-panel p-4 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: nodeTypes[selectedNode.type]?.color }}
                />
                <h4 className="text-sm font-semibold text-white">
                  {selectedNode.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Path:</span>
                <div className="font-mono text-xs text-gray-300 bg-gray-800/50 p-1 rounded mt-1">
                  {selectedNode.fullPath}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Lines:</span>
                  <div className="text-white">{selectedNode.lines}</div>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>
                  <div className="text-white">
                    {(selectedNode.fileSize / 1024).toFixed(1)}KB
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <div className="text-white capitalize">{selectedNode.type}</div>
                </div>
                <div>
                  <span className="text-gray-400">Complexity:</span>
                  <div className={`${selectedNode.complexity > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {selectedNode.complexity}
                  </div>
                </div>
              </div>

              {selectedNode.imports?.length > 0 && (
                <div>
                  <span className="text-gray-400">Imports:</span>
                  <div className="text-xs text-gray-300 mt-1">
                    {selectedNode.imports.length} dependencies
                  </div>
                </div>
              )}

              {selectedNode.exports?.length > 0 && (
                <div>
                  <span className="text-gray-400">Exports:</span>
                  <div className="text-xs text-gray-300 mt-1">
                    {selectedNode.exports.length} exports
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphVisualization