import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format time as MM:SS
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

// Convert file to object URL
export function fileToObjectURL(file) {
  return URL.createObjectURL(file);
}

// Clean up object URLs to prevent memory leaks
export function revokeObjectURL(url) {
  URL.revokeObjectURL(url);
}

// Create thumbnail from video (first frame)
export function createVideoThumbnail(videoFile) {
  return new Promise((resolve, reject) => {
    try {
      const videoUrl = URL.createObjectURL(videoFile);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      // Set up event handlers
      video.onloadedmetadata = () => {
        // Try to seek to the first frame
        video.currentTime = 0.1;
      };
      
      video.onerror = (e) => {
        console.error('Video error:', e);
        URL.revokeObjectURL(videoUrl);
        // Return a placeholder instead of failing
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkeT0iLjNlbSI+VmlkZW88L3RleHQ+PC9zdmc+');
      };
      
      // When we have a frame, capture it
      video.onseeked = () => {
        try {
          // Create canvas and draw the frame
          const canvas = document.createElement('canvas');
          
          // Set reasonable dimensions if video metadata isn't available
          const width = video.videoWidth || 320;
          const height = video.videoHeight || 180;
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Draw black background first in case of transparency
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          
          // Draw the video frame
          ctx.drawImage(video, 0, 0, width, height);
          
          // Convert to data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Clean up
          URL.revokeObjectURL(videoUrl);
          
          resolve(thumbnailUrl);
        } catch (err) {
          console.error('Error capturing thumbnail:', err);
          URL.revokeObjectURL(videoUrl);
          resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkeT0iLjNlbSI+VmlkZW88L3RleHQ+PC9zdmc+');
        }
      };
      
      // Start loading the video
      video.src = videoUrl;
      
      // Try to force loading in different ways
      video.load();
      
      // Some browsers need a play/pause to trigger loading
      video.play().catch(e => {
        console.warn('Could not play video for thumbnail', e);
      });
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      // Return a fallback thumbnail
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkeT0iLjNlbSI+VmlkZW88L3RleHQ+PC9zdmc+');
    }
  });
}
