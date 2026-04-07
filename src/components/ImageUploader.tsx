import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  maxImages: number;
  existingImages: { id: string; image_url: string; sort_order: number }[];
  bucketPath: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: (id: string, url: string) => void;
  disabled?: boolean;
}

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

const ImageUploader = ({
  maxImages,
  existingImages,
  bucketPath,
  onImageUploaded,
  onImageRemoved,
  disabled,
}: ImageUploaderProps) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxImages - existingImages.length;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const toUpload = Array.from(files).slice(0, remaining);
      if (toUpload.length === 0) {
        toast.error(t("image.max_reached") || `Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      try {
        for (const file of toUpload) {
          if (!file.type.startsWith("image/")) continue;
          const compressed = await compressImage(file);
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const filePath = `${bucketPath}/${fileName}`;

          const { error } = await supabase.storage
            .from("property-images")
            .upload(filePath, compressed, { contentType: "image/jpeg" });

          if (error) {
            toast.error(error.message);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(filePath);

          onImageUploaded(urlData.publicUrl);
        }
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [bucketPath, maxImages, remaining, onImageUploaded, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {existingImages.map((img) => (
          <div key={img.id} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onImageRemoved(img.id, img.image_url)}
              disabled={disabled}
              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <div className="flex gap-1">
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-0.5">Camera</span>
                </>
              )}
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-0.5">{remaining} left</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />
    </div>
  );
};

export default ImageUploader;
