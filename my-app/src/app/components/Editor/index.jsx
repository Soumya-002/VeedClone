'use client';
import React, { useRef, useEffect, useState } from 'react';
import Header from './Header';
import MediaProperties from './MediaProperties';
import Canvas from './Canvas';
import Timeline from './Timeline';
import { useEditorStore } from '../../store/editorstore';

const Editor = () => {
  const canvasRef = useRef(null);
  const { 
    updateDrag,
    stopDrag,
    updateResize,
    stopResize,
    dragState,
    resizeState 
  } = useEditorStore();
  const [isVideo, setIsVideo] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragState.isDragging || resizeState.isResizing) {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        
        if (canvasRect) {
          const mouseX = e.clientX - canvasRect.left;
          const mouseY = e.clientY - canvasRect.top;
          
          if (dragState.isDragging) {
            updateDrag(mouseX, mouseY);
          } else if (resizeState.isResizing) {
            updateResize(mouseX, mouseY);
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        stopDrag();
      }
      
      if (resizeState.isResizing) {
        stopResize();
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState.isDragging,
    resizeState.isResizing,
    updateDrag,
    updateResize,
    stopDrag,
    stopResize
  ]);

  const handleFileUpload = (file) => {
    if (file?.type.startsWith('video/')) {
      setIsVideo(true);
    } else {
      setIsVideo(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <MediaProperties onFileUpload={handleFileUpload} />
        <div className="flex-1 flex flex-col bg-background relative w-full sm:w-4/5 md:w-3/4 lg:w-2/3">
          <Canvas ref={canvasRef} />
          {isVideo && <Timeline />}
        </div>
      </div>
    </div>
  );
};

export default Editor;
