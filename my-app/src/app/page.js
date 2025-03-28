import React from 'react';
import Editor from './components/Editor/index';

export default function Home() {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      <Editor />
    </div>
  );
}
