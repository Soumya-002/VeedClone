import { create } from 'zustand';
import { createVideoThumbnail } from '../lib/utlis';


export const useEditorStore = create((set, get) => ({
  // Media
  activeMediaId: null,
  mediaElements: [],
  
  // Drag & Resize
  dragState: {
    isDragging: false,
    initialX: 0,
    initialY: 0,
    offsetX: 0,
    offsetY: 0,
  },
  resizeState: {
    isResizing: false,
    handle: null,
    initialWidth: 0,
    initialHeight: 0,
    initialLeft: 0,
    initialTop: 0,
  },
  
  // Playback
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    duration: 60, // Default duration in seconds (1 minute)
  },
  requestAnimationFrameId: null,
  
  // Actions
  setActiveMediaId: (id) => set({ activeMediaId: id }),
  
  addMediaElement: async (file, x, y) => {
    const id = `media-${Date.now()}`;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) return;
    
    const src = URL.createObjectURL(file);
    let thumbnailSrc = src;
    
    // Create an image or video element to get the natural dimensions
    let naturalWidth = 320;
    let naturalHeight = 180;
    
    if (isVideo) {
      thumbnailSrc = await createVideoThumbnail(file);
      
      // Try to get video dimensions and duration
      try {
        const video = document.createElement('video');
        video.src = src;
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
          // If loading takes too long, use default dimensions
          setTimeout(resolve, 1000);
        });
        
        if (video.videoWidth && video.videoHeight) {
          naturalWidth = video.videoWidth;
          naturalHeight = video.videoHeight;
        }
        
        // Update global duration if it's a video
        if (video.duration && !isNaN(video.duration)) {
          // Set the playback duration to match the video duration
          // Round to nearest second to avoid float precision issues
          const videoDuration = Math.ceil(video.duration);
          set(state => ({
            playbackState: {
              ...state.playbackState,
              duration: videoDuration
            }
          }));
        }
      } catch (e) {
        console.error('Error getting video dimensions:', e);
      }
    } else if (isImage) {
      // Try to get image dimensions
      try {
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => {
          img.onload = resolve;
          // If loading takes too long, use default dimensions
          setTimeout(resolve, 1000);
        });
        
        if (img.naturalWidth && img.naturalHeight) {
          naturalWidth = img.naturalWidth;
          naturalHeight = img.naturalHeight;
        }
      } catch (e) {
        console.error('Error getting image dimensions:', e);
      }
    }
    
    // Scale down large media to fit better in the canvas
    const maxWidth = 640;
    const maxHeight = 480;
    
    if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
      const aspectRatio = naturalWidth / naturalHeight;
      
      if (naturalWidth > naturalHeight) {
        naturalWidth = maxWidth;
        naturalHeight = maxWidth / aspectRatio;
      } else {
        naturalHeight = maxHeight;
        naturalWidth = maxHeight * aspectRatio;
      }
    }
    
    // Use provided position or default to center
    const posX = x !== undefined ? x - (naturalWidth / 2) : 640 - (naturalWidth / 2);
    const posY = y !== undefined ? y - (naturalHeight / 2) : 360 - (naturalHeight / 2);
    
    // Make sure it's within the canvas boundaries
    const boundedX = Math.max(0, Math.min(1280 - naturalWidth, posX));
    const boundedY = Math.max(0, Math.min(720 - naturalHeight, posY));
    
    const newMedia = {
      id,
      type: isVideo ? 'video' : 'image',
      src,
      thumbnailSrc,
      position: {
        x: boundedX,
        y: boundedY,
      },
      dimensions: {
        width: naturalWidth,
        height: naturalHeight,
      },
      timing: {
        start: 0,
        // For videos, use the actual video duration (up to the timeline duration)
        // For images, use a default of 5 seconds
        end: isVideo ? Math.min(Math.ceil(get().playbackState.duration), get().playbackState.duration) : 5,
      },
      opacity: 1,
    };
    
    set((state) => ({
      mediaElements: [...state.mediaElements, newMedia],
      activeMediaId: id,
    }));
  },
  
  updateMediaElement: (id, updates) => {
    set((state) => ({
      mediaElements: state.mediaElements.map((media) => 
        media.id === id ? { ...media, ...updates } : media
      ),
    }));
  },
  
  updateMediaDimensions: (id, width, height) => {
    set((state) => ({
      mediaElements: state.mediaElements.map((media) => 
        media.id === id 
          ? { ...media, dimensions: { width, height } } 
          : media
      ),
    }));
  },
  
  updateMediaPosition: (id, x, y) => {
    set((state) => ({
      mediaElements: state.mediaElements.map((media) => 
        media.id === id 
          ? { ...media, position: { x, y } } 
          : media
      ),
    }));
  },
  
  updateMediaTiming: (id, start, end) => {
    // Ensure end time is greater than start time
    const validEnd = Math.max(start + 0.1, end);
    
    set((state) => ({
      mediaElements: state.mediaElements.map((media) => 
        media.id === id 
          ? { ...media, timing: { start, end: validEnd } } 
          : media
      ),
    }));
  },
  
  updateMediaOpacity: (id, opacity) => {
    set((state) => ({
      mediaElements: state.mediaElements.map((media) => 
        media.id === id ? { ...media, opacity } : media
      ),
    }));
  },
  
  removeMediaElement: (id) => {
    const mediaToRemove = get().mediaElements.find(media => media.id === id);
    
    if (mediaToRemove) {
      // Clean up object URLs
      URL.revokeObjectURL(mediaToRemove.src);
      if (mediaToRemove.thumbnailSrc && mediaToRemove.thumbnailSrc !== mediaToRemove.src) {
        URL.revokeObjectURL(mediaToRemove.thumbnailSrc);
      }
      
      set((state) => ({
        mediaElements: state.mediaElements.filter((media) => media.id !== id),
        activeMediaId: state.activeMediaId === id ? null : state.activeMediaId,
      }));
    }
  },
  
  // Drag & Resize
  startDrag: (id, initialX, initialY, offsetX, offsetY) => {
    set({ 
      activeMediaId: id,
      dragState: {
        isDragging: true,
        initialX,
        initialY,
        offsetX,
        offsetY,
      },
    });
  },
  
  updateDrag: (x, y) => {
    const { isDragging, offsetX, offsetY } = get().dragState;
    const activeMediaId = get().activeMediaId;
    
    if (isDragging && activeMediaId) {
      const newX = x - offsetX;
      const newY = y - offsetY;
      
      get().updateMediaPosition(activeMediaId, newX, newY);
    }
  },
  
  stopDrag: () => {
    set({
      dragState: {
        ...get().dragState,
        isDragging: false,
      },
    });
  },
  
  startResize: (id, handle, initialWidth, initialHeight, initialLeft, initialTop) => {
    set({
      activeMediaId: id,
      resizeState: {
        isResizing: true,
        handle,
        initialWidth,
        initialHeight,
        initialLeft,
        initialTop,
      },
    });
  },
  
  updateResize: (mouseX, mouseY) => {
    const { isResizing, handle, initialWidth, initialHeight, initialLeft, initialTop } = get().resizeState;
    const activeMediaId = get().activeMediaId;
    
    if (isResizing && activeMediaId && handle) {
      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newLeft = initialLeft;
      let newTop = initialTop;
      
      // Calculate new dimensions based on resize handle
      switch (handle) {
        case 'se':
          newWidth = mouseX - initialLeft;
          newHeight = mouseY - initialTop;
          break;
        case 'sw':
          newWidth = initialLeft + initialWidth - mouseX;
          newHeight = mouseY - initialTop;
          newLeft = mouseX;
          break;
        case 'ne':
          newWidth = mouseX - initialLeft;
          newHeight = initialTop + initialHeight - mouseY;
          newTop = mouseY;
          break;
        case 'nw':
          newWidth = initialLeft + initialWidth - mouseX;
          newHeight = initialTop + initialHeight - mouseY;
          newLeft = mouseX;
          newTop = mouseY;
          break;
      }
      
      // Apply minimum dimensions
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);
      
      // Update element dimensions and position
      get().updateMediaDimensions(activeMediaId, newWidth, newHeight);
      get().updateMediaPosition(activeMediaId, newLeft, newTop);
    }
  },
  
  stopResize: () => {
    set({
      resizeState: {
        ...get().resizeState,
        isResizing: false,
      },
    });
  },
  
  // Playback
  togglePlayback: () => {
    const isPlaying = get().playbackState.isPlaying;
    const currentTime = get().playbackState.currentTime;
    const duration = get().playbackState.duration;
    
    // Stop if playing
    if (isPlaying) {
      const requestId = get().requestAnimationFrameId;
      if (typeof requestId === 'number') {
        cancelAnimationFrame(requestId);
      }
      
      set({
        playbackState: {
          ...get().playbackState,
          isPlaying: false,
        },
        requestAnimationFrameId: null,
      });
      
      return;
    }
    
    // Reset if at end
    let startTime = currentTime;
    if (currentTime >= duration) {
      startTime = 0;
      set({
        playbackState: {
          ...get().playbackState,
          currentTime: 0,
        },
      });
    }
    
    // Start playing
    let startTimestamp= null;
    
    const animate = (timestamp) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      
      const elapsed = ((timestamp - startTimestamp) / 1000) + startTime;
      const currentTime = Math.min(elapsed, duration);
      
      set({
        playbackState: {
          ...get().playbackState,
          currentTime,
        },
      });
      
      if (currentTime < duration && get().playbackState.isPlaying) {
        const requestId = requestAnimationFrame(animate);
        set({ requestAnimationFrameId: requestId });
      } else {
        set({
          playbackState: {
            ...get().playbackState,
            isPlaying: false,
          },
          requestAnimationFrameId: null,
        });
      }
    };
    
    const requestId = requestAnimationFrame(animate);
    
    set({
      playbackState: {
        ...get().playbackState,
        isPlaying: true,
      },
      requestAnimationFrameId: requestId,
    });
  },
  
  updatePlaybackTime: (time) => {
    set({
      playbackState: {
        ...get().playbackState,
        currentTime: Math.min(Math.max(0, time), get().playbackState.duration),
      },
    });
  },
  
  resetPlayback: () => {
    const requestId = get().requestAnimationFrameId;
    if (typeof requestId === 'number') {
      cancelAnimationFrame(requestId);
    }
    
    set({
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        duration: get().playbackState.duration,
      },
      requestAnimationFrameId: null,
    });
  },
}));
