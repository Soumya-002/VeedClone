"use client";
import React from "react";
import { useEditorStore } from "../../store/editorstore";
import { formatTime } from "../../lib/utlis";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

const Timeline = () => {
  const { playbackState, togglePlayback } = useEditorStore();

  const { isPlaying, currentTime, duration } = playbackState;

  return (
    <>
      {/* Playback Controls */}
      <div className="h-12 bg-secondary border-t border-zinc-800 flex items-center px-4 justify-center">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-zinc-900">
            <Button variant="ghost" size="icon" className=" text-purple-700">
              <SkipBack className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 w-8 rounded-full flex items-center justify-center p-0"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="rounded-full bg-zinc-900">
            <Button variant="ghost" size="icon" className=" text-purple-700">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm w-12">{formatTime(currentTime)}</div>
          <div>/</div>
          <div className="text-sm">{formatTime(duration)}</div>
        </div>
      </div>
    </>
  );
};

export default Timeline;
