'use client';
import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '../../store/editorstore';
import { Upload, Search, ChevronLeft, ChevronRight, Save, Settings } from 'lucide-react';

const Header = () => {
  const fileInputRef = useRef(null);
  const { addMediaElement } = useEditorStore();
  const [projectName, setProjectName] = useState("Project Name");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await addMediaElement(file);
      // Reset input value for reuse
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-zinc-800">
      <div className="flex items-center">
        <div className="flex items-center mr-6">
          <div className="bg-[#e65245] text-white h-8 w-28 rounded flex items-center justify-center mr-3">
            <span className="text-lg font-bold">VeeD Clone</span>
          </div>
        </div>
        
      </div>
      
      <div className="flex items-center">
        <div className="relative mx-4">
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-500" />
          </div>
          <Input 
            placeholder="Search"
            className="h-8 pl-8 pr-2 text-white bg-zinc-800 border-zinc-700 w-40 focus-visible:ring-1 focus-visible:ring-zinc-500"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
