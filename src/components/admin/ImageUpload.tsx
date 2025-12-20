import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useImageUpload, ImageBucket } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  placeholder?: string;
  bucket?: ImageBucket;
  path?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = 'square',
  placeholder = 'Clique ou arraste para fazer upload',
  bucket = 'products',
  path,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, isUploading, progress, error } = useImageUpload();

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

  const handleFile = async (file: File) => {
    const url = await uploadImage(file, { bucket, path, maxSizeMB });
    
    if (url) {
      onChange(url);
      toast.success('Imagem enviada com sucesso!');
    } else if (error) {
      toast.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = async () => {
    if (value && onRemove) {
      await deleteImage(bucket, value);
      onRemove();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />
      
      {value ? (
        <div className={cn('relative rounded-xl overflow-hidden border border-border bg-muted/30', aspectClasses[aspectRatio])}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-lg shadow-lg"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 rounded-lg shadow-lg"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Trocar
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all',
            aspectClasses[aspectRatio],
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            isUploading && 'pointer-events-none opacity-70'
          )}
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 p-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="w-32">
                <Progress value={progress} className="h-1.5" />
              </div>
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="p-3 rounded-xl bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground/70">PNG, JPG ou WEBP (max {maxSizeMB}MB)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
