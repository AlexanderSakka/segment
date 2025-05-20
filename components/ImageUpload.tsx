import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  onImageUpload: (file: File | null) => void;
}

export default function ImageUpload({ label, onImageUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Send file to parent
    onImageUpload(file);
  }, [onImageUpload]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onImageUpload(null);
  }, [onImageUpload]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {!preview ? (
        <Card
          className={`border-2 border-dashed p-8 transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="cursor-pointer text-center w-full">
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <Button 
                variant="outline" 
                type="button" 
                className="w-full max-w-[200px] mb-2"
                onClick={handleButtonClick}
              >
                Choose Image
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF (max. 5MB)
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="relative">
          <Card className="overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </Card>
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}