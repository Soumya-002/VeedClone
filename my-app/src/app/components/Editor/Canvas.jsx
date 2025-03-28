'use client';
import React, { forwardRef, useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorstore';


const MediaElementComponent= ({ media, isVisible, isActive }) => {
  const { startDrag, startResize, setActiveMediaId } = useEditorStore();
  const [videoElement, setVideoElement] = useState(null);
  
  // Control video playback based on timeline and playback state
  const { isPlaying, currentTime } = useEditorStore(state => state.playbackState);
  
  // To ensure video is visible for the entire timeline slot
  const shouldBeVisible = isVisible || (currentTime >= media.timing.start && currentTime <= media.timing.end);

  useEffect(() => {
    if (media.type === 'video' && videoElement) {
      // Make sure the element is always visible during its timeline slot
      if (shouldBeVisible) {
        videoElement.style.display = 'block';
      } else {
        videoElement.style.display = 'none';
      }
      
      // Only attempt to play if the element's timeline slot is active AND the global playback is active
      if (shouldBeVisible && isPlaying) {
        // Only play if the video is loaded
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          videoElement.play().catch(e => {
            console.warn('Video playback warning:', e);
            
            // Some browsers require user interaction first - we'll handle that gracefully
            if (e.name === 'NotAllowedError') {
              // Just show the first frame
              videoElement.currentTime = 0;
            }
          });
        } else {
          // If not loaded yet, set up a one-time event listener
          const handleCanPlay = () => {
            // Only play if still visible and global playback is still active
            if (shouldBeVisible && isPlaying) {
              videoElement.play().catch(e => console.warn('Delayed video playback warning:', e));
            }
            videoElement.removeEventListener('canplay', handleCanPlay);
          };
          videoElement.addEventListener('canplay', handleCanPlay);
          
          // Clean up if component unmounts before video can play
          return () => {
            videoElement.removeEventListener('canplay', handleCanPlay);
          };
        }
      } else {
        // Either not visible or playback is paused
        videoElement.pause();
      }
    }
  }, [shouldBeVisible, isPlaying, media.type, videoElement, media.timing, currentTime]);
  
  const handleMouseDown = (e) => {
    // Check if clicking on resize handle
    if ((e.target).classList.contains('resize-handle')) {
      const handle = (e.target).getAttribute('data-handle');
      
      startResize(
        media.id,
        handle,
        media.dimensions.width,
        media.dimensions.height,
        media.position.x,
        media.position.y
      );
    } else {
      // Otherwise start dragging
      const rect = (e.currentTarget).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      startDrag(
        media.id,
        media.position.x,
        media.position.y,
        offsetX,
        offsetY
      );
    }
    
    setActiveMediaId(media.id);
    e.preventDefault(); // Prevent default to avoid text selection
  };
  
  return (
    <div
      className={`media-element absolute cursor-move flex items-center justify-center overflow-hidden transition-shadow ${isActive ? 'border-2 border-primary shadow-lg' : 'border border-transparent'}`}
      style={{
        left: `${media.position.x}px`,
        top: `${media.position.y}px`,
        width: `${media.dimensions.width}px`,
        height: `${media.dimensions.height}px`,
        display: isVisible ? 'flex' : 'none',
        zIndex: isActive ? 10 : 1,
        boxShadow: isActive ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {media.type === 'image' ? (
        <img
          src={media.src}
          alt="Media"
          className="max-w-full max-h-full object-contain"
          style={{ opacity: media.opacity }}
          draggable="false"
        />
      ) : (
        <video
          ref={setVideoElement}
          src={media.src}
          className="max-w-full max-h-full object-contain"
          style={{ opacity: media.opacity }}
          muted
          playsInline
          loop
          autoPlay={false}
          preload="metadata"
          controls={false}
          draggable="false"
        />
      )}
      
      {/* Show resize handles only when element is active */}
      {isActive && (
        <>
          <div className="resize-handle absolute w-3 h-3 bg-primary rounded-full -top-1.5 -left-1.5 cursor-nwse-resize z-20" data-handle="nw"></div>
          <div className="resize-handle absolute w-3 h-3 bg-primary rounded-full -top-1.5 -right-1.5 cursor-nesw-resize z-20" data-handle="ne"></div>
          <div className="resize-handle absolute w-3 h-3 bg-primary rounded-full -bottom-1.5 -left-1.5 cursor-nesw-resize z-20" data-handle="sw"></div>
          <div className="resize-handle absolute w-3 h-3 bg-primary rounded-full -bottom-1.5 -right-1.5 cursor-nwse-resize z-20" data-handle="se"></div>
        </>
      )}
    </div>
  );
};


const Canvas = forwardRef((props, ref) => {
  const { mediaElements, activeMediaId, playbackState, setActiveMediaId } = useEditorStore();
  const { currentTime } = playbackState;
  
  // Clear selection when clicking on empty canvas
  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setActiveMediaId(null);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
      const file = files[0];
      const { addMediaElement } = useEditorStore.getState();
      
      // Get canvas coordinates for drop
      const canvasRect = (ref).current?.getBoundingClientRect();
      if (canvasRect) {
        // Position the element where it was dropped
        const x = e.clientX - canvasRect.left; 
        const y = e.clientY - canvasRect.top;
        
        await addMediaElement(file, x, y);
      } else {
        await addMediaElement(file);
      }
    }
  };
  
  return (
    <div 
      className="flex-1 overflow-auto relative flex items-center justify-center"
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDIwdjIwSDB6Ii8+PHBhdGggZD0iTTAgMGgyMHYxSDBWMHptMCAxOWgyMHYxSDBWMTl6TTAgMGgxdjIwSDBWMHptMTkgMGgxdjIwSDBWMHoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L2c+PC9zdmc+')]"></div>
      <div 
        ref={ref} 
        className="relative bg-black w-full h-full flex items-center justify-center overflow-hidden"
      >
        {mediaElements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <p className="text-lg mb-2">Please Upload your File</p>
          </div>
        )}
        
        {mediaElements.map((media) => {
          const isVisible = currentTime >= media.timing.start && currentTime <= media.timing.end;
          return (
            <MediaElementComponent
              key={media.id}
              media={media}
              isVisible={isVisible}
              isActive={media.id === activeMediaId}
            />
          );
        })}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
