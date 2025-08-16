import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  GitBranch,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  Activity,
  Code,
  Package
} from 'lucide-react'

function MetricsPanel({ data }) {
  const complexityChartRef = useRef()
  const filesizeChartRef = useRef()
  const dependencyChartRef = useRef()

  // Calculate metrics with error handling
  const metrics = React.useMemo(() => {
    if (!data || !data.files || !Array.isArray(data.files) || data.files.length === 0) {
      return {
        error: 'No scan data available',
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0,
        avgComplexity: 0,
        complexFiles: 0,
        largeFiles: 0,
        fileTypes: {},
        complexityDistribution: { low: 0, medium: 0, high: 0 },
        dependencies: 0,
        conflicts: 0
      }
    }

    try {
      const files = data.files
      const totalLines = files.reduce((sum, f) => sum + (f.lines || 0), 0)
      const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)
      const avgComplexity = files.reduce((sum, f) => sum + (f.complexity || 0), 0) / files.length
      const complexFiles = files.filter(f => (f.complexity || 0) > 5)
      const largeFiles = files.filter(f => (f.lines || 0) > 200)
      
      // File type distribution
      const fileTypes = {}
      files.forEach(f => {
        const ext = f.filePath?.split('.').pop() || 'unknown'
        fileTypes[ext] = (fileTypes[ext] || 0) + 1
      })

      // Complexity distribution
      const complexityDistribution = {
        low: files.filter(f => (f.complexity || 0) <= 3).length,
        medium: files.filter(f => (f.complexity || 0) > 3 && (f.complexity || 0) <= 6).length,
        high: files.filter(f => (f.complexity || 0) > 6).length
      }

      return {
        totalFiles: files.length,
        totalLines,
        totalSize,
        avgComplexity: Math.round(avgComplexity * 10) / 10,
        complexFiles: complexFiles.length,
        largeFiles: largeFiles.length,
        fileTypes,
        complexityDistribution,
        dependencies: data.metrics?.dependencies || 0,
        conflicts: data.conflicts?.length || 0
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
      return {
        error: 'Error calculating metrics',
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0,
        avgComplexity: 0,
        complexFiles: 0,
        largeFiles: 0,
        fileTypes: {},
        complexityDistribution: { low: 0, medium: 0, high: 0 },
        dependencies: 0,
        conflicts: 0
      }
    }
  }, [data])

  // Complexity Chart
  useEffect(() => {
    if (!metrics || !complexityChartRef.current) return

    const container = complexityChartRef.current
    d3.select(container).selectAll('*').remove()

    const width = 300
    const height = 200
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const data = [
      { category: 'Low', value: metrics.complexityDistribution.low, color: '#10b981' },
      { category: 'Medium', value: metrics.complexityDistribution.medium, color: '#f59e0b' },
      { category: 'High', value: metrics.complexityDistribution.high, color: '#ef4444' }
    ]

    const x = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.2)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([innerHeight, 0])

    // Add bars
    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.category))
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('y', d => y(d.value))
      .attr('height', d => innerHeight - y(d.value))

    // Add value labels
    g.selectAll('.value-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.category) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text(d => d.value)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '11px')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '11px')

    // Style axes
    g.selectAll('.domain, .tick line')
      .style('stroke', '#475569')

  }, [metrics])

  // File Size Distribution Chart
  useEffect(() => {
    if (!metrics || !data?.files || !filesizeChartRef.current) return

    const container = filesizeChartRef.current
    d3.select(container).selectAll('*').remove()

    const width = 300
    const height = 200
    const radius = Math.min(width, height) / 2 - 10

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${width/2},${height/2})`)

    // Categorize files by size
    const sizeCategories = {
      'Small (&lt;100 lines)': data.files.filter(f => (f.lines || 0) < 100).length,
      'Medium (100-300)': data.files.filter(f => (f.lines || 0) >= 100 && (f.lines || 0) < 300).length,
      'Large (300-500)': data.files.filter(f => (f.lines || 0) >= 300 && (f.lines || 0) < 500).length,
      'Very Large (500+)': data.files.filter(f => (f.lines || 0) >= 500).length
    }

    const pieData = Object.entries(sizeCategories)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({ category: key, value }))

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.category))
      .range(colors)

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius)

    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc')

    // Add paths with animation
    arcs.append('path')
      .attr('fill', d => color(d.data.category))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return function(t) {
          return arc(interpolate(t))
        }
      })

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text(d => d.data.value)

  }, [metrics, data])

  if (metrics.error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-300">{metrics.error}</h3>
            <p className="text-gray-500">Please ensure a scan has been run and data is available.</p>
          </div>
        </div>
      </div>
    )
  }

  const healthScore = Math.max(0, 100 - (metrics.conflicts * 10) - (metrics.complexFiles * 5))
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthStatus = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`
    }
    return `${bytes}B`
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{metrics.totalFiles}</div>
              <div className="text-sm text-gray-400">Total Files</div>
            </div>
            <FileText className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
          </div>
          <div className="mt-2 flex items-center text-xs text-green-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Active</span>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{metrics.totalLines.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Lines of Code</div>
            </div>
            <Code className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />
          </div>
          <div className="mt-2 flex items-center text-xs text-blue-400">
            <Activity className="w-3 h-3 mr-1" />
            <span>Avg: {Math.round(metrics.totalLines / metrics.totalFiles)} per file</span>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{formatBytes(metrics.totalSize)}</div>
              <div className="text-sm text-gray-400">Total Size</div>
            </div>
            <Package className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
          </div>
          <div className="mt-2 flex items-center text-xs text-purple-400">
            <Target className="w-3 h-3 mr-1" />
            <span>Optimized</span>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                {healthScore}%
              </div>
              <div className="text-sm text-gray-400">Health Score</div>
            </div>
            <Zap className={`w-8 h-8 ${getHealthColor(healthScore).replace('text-', 'text-')} group-hover:opacity-80 transition-opacity`} />
          </div>
          <div className="mt-2 flex items-center text-xs">
            <div className={`w-2 h-2 rounded-full ${getHealthColor(healthScore).replace('text-', 'bg-')} mr-2`}></div>
            <span className="text-gray-400">{getHealthStatus(healthScore)}</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complexity Distribution */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Complexity Distribution</span>
            </h3>
            {metrics.complexFiles > 0 && (
              <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                {metrics.complexFiles} complex
              </div>
            )}
          </div>
          <div ref={complexityChartRef} className="flex justify-center" />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Complexity</span>
              <span className="text-white font-semibold">{metrics.avgComplexity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Complex Files (&gt;5)</span>
              <span className={`font-semibold ${metrics.complexFiles > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {metrics.complexFiles}
              </span>
            </div>
          </div>
        </div>

        {/* File Size Distribution */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-400" />
              <span>File Size Distribution</span>
            </h3>
            {metrics.largeFiles > 0 && (
              <div className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                {metrics.largeFiles} large
              </div>
            )}
          </div>
          <div ref={filesizeChartRef} className="flex justify-center" />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Size</span>
              <span className="text-white font-semibold">
                {Math.round(metrics.totalLines / metrics.totalFiles)} lines
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Large Files (&gt;200)</span>
              <span className={`font-semibold ${metrics.largeFiles > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {metrics.largeFiles}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span>Quality Metrics</span>
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Dependencies</span>
              </div>
              <span className="text-white font-semibold">{metrics.dependencies}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-300">Conflicts</span>
              </div>
              <span className={`font-semibold ${metrics.conflicts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.conflicts}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Scan Time</span>
              </div>
              <span className="text-white font-semibold">{data?.scanTime || 0}ms</span>
            </div>
          </div>

          {/* Health Score Breakdown */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Health Score Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Base Score</span>
                <span className="text-white">100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Conflicts Penalty</span>
                <span className="text-red-400">-{metrics.conflicts * 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Complexity Penalty</span>
                <span className="text-yellow-400">-{metrics.complexFiles * 5}</span>
              </div>
              <div className="border-t border-gray-600/50 pt-2 flex justify-between font-semibold">
                <span className="text-gray-300">Final Score</span>
                <span className={getHealthColor(healthScore)}>{healthScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Types */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>File Types</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(metrics.fileTypes).map(([ext, count]) => (
            <div key={ext} className="bg-gray-800/30 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-xs text-gray-400 uppercase">.{ext}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel