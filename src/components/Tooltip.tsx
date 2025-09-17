import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);
  let hideTimeout = useRef<number | null>(null);

  const showTooltip = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    hideTimeout.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  useLayoutEffect(() => {
    if (isVisible && childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      const tooltipElement = document.getElementById('tooltip-portal');
      const tooltipWidth = tooltipElement?.offsetWidth || 256;
      
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
      });
    }
  }, [isVisible]);
  
  const onTooltipHover = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  return (
    <>
      <div 
        ref={childRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          id="tooltip-portal"
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg w-64"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            transform: 'translateY(-100%)',
          }}
          onMouseEnter={onTooltipHover}
          onMouseLeave={hideTooltip}
        >
          <div className="whitespace-pre-line">{content}</div>
          <div 
            className="absolute top-full left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={{ transform: 'translateX(-50%)' }}
          ></div>
        </div>,
        document.body
      )}
    </>
  );
};
