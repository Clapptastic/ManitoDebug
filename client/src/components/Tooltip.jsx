import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 500,
  disabled = false,
  className = '',
  maxWidth = '200px'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const trigger = triggerRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let top, left

    // Calculate position based on preference
    switch (position) {
      case 'top':
        top = trigger.top - tooltip.height - 8
        left = trigger.left + (trigger.width - tooltip.width) / 2
        break
      case 'bottom':
        top = trigger.bottom + 8
        left = trigger.left + (trigger.width - tooltip.width) / 2
        break
      case 'left':
        top = trigger.top + (trigger.height - tooltip.height) / 2
        left = trigger.left - tooltip.width - 8
        break
      case 'right':
        top = trigger.top + (trigger.height - tooltip.height) / 2
        left = trigger.right + 8
        break
      default:
        top = trigger.top - tooltip.height - 8
        left = trigger.left + (trigger.width - tooltip.width) / 2
    }

    // Adjust if tooltip goes outside viewport
    if (left < 8) left = 8
    if (left + tooltip.width > viewport.width - 8) {
      left = viewport.width - tooltip.width - 8
    }
    if (top < 8) {
      // If tooltip would go above viewport, try to position it below the trigger
      if (trigger.bottom + tooltip.height + 8 <= viewport.height) {
        top = trigger.bottom + 8
      } else {
        // If it still doesn't fit, position it at the top with some margin
        top = 8
      }
    }
    if (top + tooltip.height > viewport.height - 8) {
      // If tooltip would go below viewport, try to position it above the trigger
      if (trigger.top - tooltip.height - 8 >= 0) {
        top = trigger.top - tooltip.height - 8
      } else {
        // If it still doesn't fit, position it at the bottom with some margin
        top = viewport.height - tooltip.height - 8
      }
    }

    setTooltipPosition({ top, left })
  }

  const handleMouseEnter = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Small delay to ensure DOM is updated
      setTimeout(updatePosition, 0)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const handleFocus = () => {
    if (disabled) return
    setIsVisible(true)
    setTimeout(updatePosition, 0)
  }

  const handleBlur = () => {
    setIsVisible(false)
  }

  if (!content) return children

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`
            tooltip-portal px-3 py-2 text-sm text-white 
            bg-gray-900/95 border border-gray-700/50 
            rounded-lg shadow-lg backdrop-blur-sm
            animate-fade-in
            ${className}
          `}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth
          }}
        >
          <div className="relative">
            {content}
            
            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900/95 border border-gray-700/50 rotate-45
                ${position === 'top' ? 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-transparent border-l-transparent' : ''}
                ${position === 'bottom' ? 'top-[-5px] left-1/2 transform -translate-x-1/2 border-b-transparent border-r-transparent' : ''}
                ${position === 'left' ? 'right-[-5px] top-1/2 transform -translate-y-1/2 border-l-transparent border-t-transparent' : ''}
                ${position === 'right' ? 'left-[-5px] top-1/2 transform -translate-y-1/2 border-r-transparent border-b-transparent' : ''}
              `}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// Higher-order component for easy tooltip integration
export function withTooltip(Component, tooltipContent, options = {}) {
  return function TooltipWrapped(props) {
    return (
      <Tooltip content={tooltipContent} {...options}>
        <Component {...props} />
      </Tooltip>
    )
  }
}

// Tooltip variants for common use cases
export const HelpTooltip = ({ content, children, ...props }) => (
  <Tooltip 
    content={content} 
    position="top" 
    delay={200}
    className="max-w-xs z-[9999]"
    {...props}
  >
    {children || (
      <div className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-400 bg-gray-700/50 rounded-full cursor-help hover:bg-gray-600/50 transition-colors">
        ?
      </div>
    )}
  </Tooltip>
)

export const StatusTooltip = ({ status, children, ...props }) => {
  const statusMessages = {
    online: 'Server is online and responding',
    offline: 'Server is offline or unreachable',
    connecting: 'Connecting to server...',
    error: 'Connection error occurred',
    loading: 'Loading data...',
    success: 'Operation completed successfully',
    warning: 'Warning: Please check the details'
  }

  return (
    <Tooltip 
      content={statusMessages[status] || status}
      position="bottom"
      delay={100}
      {...props}
    >
      {children}
    </Tooltip>
  )
}

export const KeyboardTooltip = ({ shortcut, description, children, ...props }) => (
  <Tooltip
    content={
      <div className="text-center">
        <div className="font-semibold mb-1">{description}</div>
        <div className="text-xs text-gray-300">
          {shortcut.split('+').map((key, index) => (
            <React.Fragment key={key}>
              {index > 0 && <span className="mx-1">+</span>}
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                {key}
              </kbd>
            </React.Fragment>
          ))}
        </div>
      </div>
    }
    position="bottom"
    delay={800}
    maxWidth="300px"
    {...props}
  >
    {children}
  </Tooltip>
)

export default Tooltip