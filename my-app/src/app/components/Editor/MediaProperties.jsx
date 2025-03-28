'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '../../store/editorstore';
import { Upload, Trash2, Maximize, Image, Video } from 'lucide-react';


const MediaProperties= ({onFileUpload}) => {
  const fileInputRef = useRef(null);
  const { 
    activeMediaId, 
    mediaElements, 
    addMediaElement,
    updateMediaDimensions,
    updateMediaPosition,
    updateMediaOpacity,
    removeMediaElement
  } = useEditorStore();

  const activeMedia = mediaElements.find(media => media.id === activeMediaId);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await addMediaElement(file);
      onFileUpload(file);
      // Reset input value for reuse
      e.target.value = '';
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e, property) => {
    if (!activeMediaId) return;
    
    const value = parseFloat(e.target.value);
    if (isNaN(value)) return;
    
    switch (property) {
      case 'width':
        updateMediaDimensions(activeMediaId, value, activeMedia?.dimensions.height || 180);
        break;
      case 'height':
        updateMediaDimensions(activeMediaId, activeMedia?.dimensions.width || 320, value);
        break;
      case 'x':
        updateMediaPosition(activeMediaId, value, activeMedia?.position.y || 200);
        break;
      case 'y':
        updateMediaPosition(activeMediaId, activeMedia?.position.x || 200, value);
        break;
    }
  };

  const handleOpacityChange = (value) => {
    if (activeMediaId) {
      updateMediaOpacity(activeMediaId, value[0] / 100);
    }
  };

  const handleRemove = () => {
    if (activeMediaId) {
      removeMediaElement(activeMediaId);
    }
  };

  const opacityValue = activeMedia ? [activeMedia.opacity * 100] : [100];

  // Media type icon
  const MediaTypeIcon = () => {
    if (!activeMedia) return null;
    return activeMedia.type === 'video' ? (
      <Video size={16} className="text-zinc-300" />
    ) : (
      <Image size={16} className="text-zinc-300" />
    );
  };

  // Local width/height state for controlled inputs
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 });
  
  // Update dimensions when active media changes
  useEffect(() => {
    if (activeMedia) {
      setDimensions({
        width: activeMedia.dimensions.width,
        height: activeMedia.dimensions.height
      });
    }
  }, [activeMedia]);

  // Handle controlled dimension changes
  const handleDimensionChange = (e, dimension) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDimensions(prev => ({ ...prev, [dimension]: value }));
    }
  };

  // Apply dimensions when input is blurred
  const applyDimensions = () => {
    if (activeMediaId && activeMedia) {
      updateMediaDimensions(activeMediaId, dimensions.width, dimensions.height);
    }
  };

  return (
    <div className="w-72 bg-secondary border-r border-zinc-800 overflow-y-auto">
      <div className="p-4">
        <h2 className="font-semibold flex items-center pb-2 mb-4 border-b border-zinc-700">
          <span>Add Media</span>
        </h2>
        
        {!activeMedia ? (
          // Empty state when no media is selected
          <div className="p-4 text-center border border-dashed border-zinc-700 rounded-md">
            <div className="mb-6 text-zinc-400 flex flex-col items-center">
              <p>Upload files to edit</p>
            </div>

            <Button 
              variant="default" 
              size="lg"
              className="w-full mb-2 font-medium py-5 cursor-pointer bg-purple-600 hover:bg-purple-700"
              onClick={handleOpenFileDialog}
            >
              <Upload size={16} className="mr-2 text-white" />
              <span className='text-white'>Upload Media</span>
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-zinc-500 mt-2">Supported: JPEG, PNG, GIF, WebP, MP4, WebM</p>
          </div>
        ) : (
          // Properties panel for active media
          <>
            {/* Media Info Section */}
            <div className="mb-6 bg-zinc-300 rounded-md p-3 flex items-center">
              <div className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center mr-3">
                <MediaTypeIcon />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">
                  {activeMedia.type === 'video' ? 'Video' : 'Image'}
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="!bg-transparent !text-red-500 hover:!bg-red-400/10 px-0 h-6 cursor-pointer"
                  onClick={handleRemove}
                >
                  <Trash2 size={14} className="mr-1" />
                  Remove
                </Button>
              </div>
            </div>
            
            {/* Dimensions Controls - Featured prominently */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium text-sm">Dimensions</Label>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-black cursor-pointer" onClick={() => {
                  if (activeMedia && activeMediaId) {
                    if (activeMedia.type === 'video') {
                      // Set to standard 16:9 video dimensions
                      setDimensions({ width: 640, height: 360 });
                      updateMediaDimensions(activeMediaId, 640, 360);
                    }
                  }
                }}>
                  <Maximize size={14} className="mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Width (px)</div>
                  <Input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => handleDimensionChange(e, 'width')}
                    onBlur={applyDimensions}
                    className="bg-zinc-800 text-white border-zinc-700 focus:border-zinc-500"
                    min={10}
                    max={1280}
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Height (px)</div>
                  <Input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => handleDimensionChange(e, 'height')}
                    onBlur={applyDimensions}
                    className="bg-zinc-800 text-white border-zinc-700 focus:border-zinc-500"
                    min={10}
                    max={720}
                  />
                </div>
              </div>
            </div>
            
            {/* Position Controls */}
            <div className="mb-6">
              <Label className="font-medium text-sm block mb-2">Position</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-zinc-400 mb-1">X Position</div>
                  <Input
                    type="number"
                    value={activeMedia?.position.x || 0}
                    onChange={(e) => handleInputChange(e, 'x')}
                    className="bg-zinc-800 text-white border-zinc-700 focus:border-zinc-500"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Y Position</div>
                  <Input
                    type="number"
                    value={activeMedia?.position.y || 0}
                    onChange={(e) => handleInputChange(e, 'y')}
                    className="bg-zinc-800 text-white border-zinc-700 focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Visual Options */}
            <div className="mb-6">
              <Label className="font-medium text-sm block mb-2">Opacity</Label>
              <div className="px-1">
                <Slider
                  value={opacityValue}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleOpacityChange}
                  className="my-2 bg-zinc-600"
                />
                <div className="flex justify-between text-xs">
                  <span>0%</span>
                  <span>{opacityValue[0]}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaProperties;
