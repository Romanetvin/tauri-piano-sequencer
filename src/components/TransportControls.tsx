import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, Square } from 'lucide-react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Play/Pause Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={isPlaying ? onPause : onPlay}
              size="lg"
              className="relative rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                         hover:shadow-lg hover:shadow-indigo-500/50
                         transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Stop Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onStop}
              variant="outline"
              size="lg"
              className="rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Square className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default TransportControls;
