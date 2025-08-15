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
    if (!data || !data.files) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const container = containerRef.current
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
      id: file.filePath,
      name: file.filePath.split('/').pop(),
      fullPath: file.filePath,
      type: getNodeType(file),
      size: Math.max(8, Math.min(30, file.lines / 10)),
      complexity: file.complexity || 1,
      lines: file.lines,
      fileSize: file.size,
      imports: file.imports || [],
      exports: file.exports || []
    }))

    const links = []
    data.files.forEach(file => {
      if (file.imports) {
        file.imports.forEach(imp => {
          if (imp.source.startsWith('.')) {
            const targetFile = data.files.find(f => 
              f.filePath.includes(imp.source.replace(/^\.\//, ''))
            )
            if (targetFile) {
              links.push({
                source: file.filePath,
                target: targetFile.filePath,
                type: 'import',
                strength: 1
              })
            }
          }
        })
      }
    })

    // Apply filters
    const filteredNodes = nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || node.type === filterType
      return matchesSearch && matchesFilter
    })

    const filteredLinks = links.filter(link => 
      filteredNodes.some(n => n.id === link.source) && 
      filteredNodes.some(n => n.id === link.target)
    )

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5))

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 0px 3px rgba(71, 85, 105, 0.5))')

    // Create node groups
    const nodeGroup = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))

    // Add circles for nodes
    const circles = nodeGroup.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => `url(#gradient-${d.type})`)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)')
      .style('transition', 'all 0.3s ease')

    // Add labels
    const labels = nodeGroup.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', d => d.size + 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#e2e8f0')
      .style('pointer-events', 'none')

    // Add icons
    nodeGroup.append('text')
      .text(d => nodeTypes[d.type]?.icon || '📄')
      .attr('x', 0)
      .attr('y', 6)
      .attr('text-anchor', 'middle')
      .style('font-size', d => `${Math.max(12, d.size / 2)}px`)
      .style('pointer-events', 'none')

    // Node interactions
    circles
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size * 1.2)
          .attr('stroke-width', 3)
          
        // Highlight connected nodes
        const connectedIds = new Set()
        filteredLinks.forEach(link => {
          if (link.source.id === d.id) connectedIds.add(link.target.id)
          if (link.target.id === d.id) connectedIds.add(link.source.id)
        })

        circles.style('opacity', node => 
          node.id === d.id || connectedIds.has(node.id) ? 1 : 0.3
        )
        
        link.style('opacity', l => 
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
        )
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.size)
          .attr('stroke-width', 2)
          
        circles.style('opacity', 1)
        link.style('opacity', 0.6)
      })
      .on('click', function(event, d) {
        setSelectedNode(d)
        event.stopPropagation()
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Clear selection on background click
    svg.on('click', () => setSelectedNode(null))

  }, [data, searchTerm, filterType])

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