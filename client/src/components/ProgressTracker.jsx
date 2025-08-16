import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, BarChart3, Network, Brain } from 'lucide-react';

const ProgressTracker = ({ 
  isActive, 
  stage, 
  progress, 
  files, 
  scanResults, 
  onComplete,
  onError 
}) => {
  const [currentStage, setCurrentStage] = useState('idle');
  const [stageProgress, setStageProgress] = useState(0);
  const [stageDetails, setStageDetails] = useState({});
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const stages = {
    idle: { label: 'Ready', icon: CheckCircle, color: 'text-green-500' },
    initializing: { label: 'Initializing', icon: Loader2, color: 'text-blue-500' },
    scanning: { label: 'Scanning Files', icon: FileText, color: 'text-yellow-500' },
    analyzing: { label: 'Analyzing Dependencies', icon: Network, color: 'text-purple-500' },
    processing: { label: 'Processing Results', icon: BarChart3, color: 'text-indigo-500' },
    ai_analysis: { label: 'AI Analysis', icon: Brain, color: 'text-pink-500' },
    finalizing: { label: 'Finalizing', icon: CheckCircle, color: 'text-green-500' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
    error: { label: 'Error', icon: AlertCircle, color: 'text-red-500' }
  };

  useEffect(() => {
    if (isActive && stage !== currentStage) {
      setCurrentStage(stage);
      setStageProgress(0);
      
      if (stage === 'initializing') {
        setStartTime(Date.now());
      }
      
      // Simulate progress for each stage
      const progressInterval = setInterval(() => {
        setStageProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 95);
          if (newProgress >= 95) {
            clearInterval(progressInterval);
          }
          return newProgress;
        });
      }, 200);

      return () => clearInterval(progressInterval);
    }
  }, [isActive, stage, currentStage]);

  useEffect(() => {
    if (startTime && isActive) {
      const elapsed = Date.now() - startTime;
      const progressPercent = progress / 100;
      if (progressPercent > 0) {
        const estimated = elapsed / progressPercent;
        setEstimatedTime(Math.max(0, estimated - elapsed));
      }
    }
  }, [progress, startTime, isActive]);

  useEffect(() => {
    if (scanResults && currentStage !== 'completed') {
      setCurrentStage('completed');
      setStageProgress(100);
      if (onComplete) onComplete(scanResults);
    }
  }, [scanResults, currentStage, onComplete]);

  const formatTime = (ms) => {
    if (ms < 1000) return 'Less than 1 second';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const getStageDetails = () => {
    switch (currentStage) {
      case 'scanning':
        return {
          title: 'Scanning Files',
          description: `Processing ${files || 0} files...`,
          details: scanResults ? `Found ${scanResults.files?.length || 0} code files` : 'Analyzing file structure'
        };
      case 'analyzing':
        return {
          title: 'Analyzing Dependencies',
          description: 'Building dependency graph...',
          details: scanResults ? `Found ${Object.keys(scanResults.dependencies || {}).length} dependencies` : 'Mapping imports and exports'
        };
      case 'processing':
        return {
          title: 'Processing Results',
          description: 'Preparing analysis data...',
          details: scanResults ? `Generated ${scanResults.metrics?.linesOfCode || 0} lines of code metrics` : 'Calculating complexity metrics'
        };
      case 'ai_analysis':
        return {
          title: 'AI Analysis',
          description: 'Running AI-powered analysis...',
          details: 'Identifying patterns, vulnerabilities, and optimization opportunities'
        };
      default:
        return {
          title: stages[currentStage]?.label || 'Processing',
          description: 'Preparing analysis...',
          details: 'Setting up scan environment'
        };
    }
  };

  const details = getStageDetails();

  if (!isActive && currentStage === 'idle') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          {React.createElement(stages[currentStage]?.icon || Loader2, {
            className: `w-6 h-6 ${stages[currentStage]?.color || 'text-blue-500'} ${currentStage === 'scanning' || currentStage === 'analyzing' ? 'animate-spin' : ''}`
          })}
          <div>
            <h3 className="text-lg font-semibold text-white">{details.title}</h3>
            <p className="text-sm text-gray-400">{details.description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(stageProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stageProgress}%` }}
            />
          </div>
        </div>

        {/* Stage Details */}
        <div className="mb-4">
          <p className="text-sm text-gray-300">{details.details}</p>
        </div>

        {/* Estimated Time */}
        {estimatedTime && (
          <div className="text-sm text-gray-400">
            Estimated time remaining: {formatTime(estimatedTime)}
          </div>
        )}

        {/* Scan Results Preview */}
        {scanResults && (
          <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Scan Results Preview</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">
                Files: <span className="text-white">{scanResults.files?.length || 0}</span>
              </div>
              <div className="text-gray-400">
                Lines: <span className="text-white">{scanResults.metrics?.linesOfCode || 0}</span>
              </div>
              <div className="text-gray-400">
                Dependencies: <span className="text-white">{Object.keys(scanResults.dependencies || {}).length}</span>
              </div>
              <div className="text-gray-400">
                Conflicts: <span className="text-white">{scanResults.conflicts?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {isActive && currentStage !== 'completed' && currentStage !== 'error' && (
          <button
            onClick={() => onError?.('Scan cancelled by user')}
            className="mt-4 w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded transition-colors"
          >
            Cancel Scan
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
