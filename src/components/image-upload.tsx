import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, createImagePreview, revokeImagePreview } from '../lib/firebase-storage';

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageRemove: () => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  currentImage,
  onImageSelect,
  onImageRemove,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate the file
      validateImageFile(file);
      
      // Clear any previous errors
      setError('');
      
      // Create preview
      const preview = createImagePreview(file);
      
      // Clean up old preview if it exists
      if (previewUrl && previewUrl !== currentImage) {
        revokeImagePreview(previewUrl);
      }
      
      setPreviewUrl(preview);
      onImageSelect(file, preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    // Clean up preview URL
    if (previewUrl && previewUrl !== currentImage) {
      revokeImagePreview(previewUrl);
    }
    
    setPreviewUrl('');
    setError('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onImageRemove();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Area */}
      <div className="relative w-full aspect-[16/9] max-w-md rounded-lg overflow-hidden bg-slate-800 border-2 border-dashed border-slate-600">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Restaurant profile"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm text-center">No image uploaded</p>
            <p className="text-xs text-center mt-2 text-slate-500">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
          className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
        >
          <Upload className="w-4 h-4 mr-2" />
          {previewUrl ? 'Change Image' : 'Upload Image'}
        </Button>
        
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        
        <p className="text-xs text-slate-400">
          Recommended: 1200x675 pixels (16:9 aspect ratio)
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
