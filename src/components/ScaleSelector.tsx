import React from 'react';
import { ROOT_NOTES, RootNote, ScaleMode } from '../utils/scaleUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Music } from 'lucide-react';

interface ScaleSelectorProps {
  selectedScale: { root: RootNote; mode: ScaleMode } | null;
  onScaleChange: (scale: { root: RootNote; mode: ScaleMode } | null) => void;
}

const ScaleSelector: React.FC<ScaleSelectorProps> = ({ selectedScale, onScaleChange }) => {
  const currentValue = selectedScale
    ? `${selectedScale.root}-${selectedScale.mode}`
    : 'none';

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onScaleChange(null);
    } else {
      const [root, mode] = value.split('-') as [RootNote, ScaleMode];
      onScaleChange({ root, mode });
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          <SelectValue placeholder="Select scale" />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <SelectItem value="none">
          <span className="font-medium">None</span>
          <span className="text-xs text-muted-foreground ml-2">(No highlighting)</span>
        </SelectItem>

        {ROOT_NOTES.map((root) => (
          <SelectGroup key={root}>
            <SelectLabel>{root}</SelectLabel>
            <SelectItem value={`${root}-major`}>Major</SelectItem>
            <SelectItem value={`${root}-minor`}>Minor</SelectItem>
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ScaleSelector;
