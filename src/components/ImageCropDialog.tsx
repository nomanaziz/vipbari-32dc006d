import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageCropDialogProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropDialog = ({ file, open, onClose, onCropComplete }: ImageCropDialogProps) => {
  const { language } = useLanguage();
  const [crop, setCrop] = useState<Crop>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState("");

  // Load image when file changes
  useState(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImgSrc(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImgSrc("");
    }
  });

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerAspectCrop(naturalWidth, naturalHeight));
  }, []);

  const handleConfirm = async () => {
    const image = imgRef.current;
    if (!image || !crop) return;
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelCrop = {
        x: (crop.x / 100) * image.naturalWidth,
        y: (crop.y / 100) * image.naturalHeight,
        width: (crop.width / 100) * image.naturalWidth,
        height: (crop.height / 100) * image.naturalHeight,
      };
      // Use unit check — if pixel unit, use directly
      if (crop.unit === "px") {
        pixelCrop.x = crop.x * scaleX;
        pixelCrop.y = crop.y * scaleY;
        pixelCrop.width = crop.width * scaleX;
        pixelCrop.height = crop.height * scaleY;
      }
      const size = Math.min(pixelCrop.width, 600);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.85)
      );
      onCropComplete(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === "bn" ? "ছবি ক্রপ করুন" : "Crop Image"}</DialogTitle>
        </DialogHeader>
        {imgSrc && (
          <div className="flex justify-center max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop"
                onLoad={onImageLoad}
                className="max-h-[55vh] object-contain"
              />
            </ReactCrop>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !crop}>
            {processing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {language === "bn" ? "সেভ করুন" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
