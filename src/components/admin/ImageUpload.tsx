import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = 'square',
  placeholder = 'Clique ou arraste para fazer upload',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {value ? (
        <div className={cn('relative rounded-lg overflow-hidden border border-border', aspectClasses[aspectRatio])}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Trocar
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            aspectClasses[aspectRatio],
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-3 rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            <p className="text-xs text-muted-foreground/70">PNG, JPG ou WEBP</p>
          </div>
        </div>
      )}
    </div>
  );
}
