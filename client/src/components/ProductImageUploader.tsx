import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage, getStorageUrl } from "@/lib/supabase";
import { compressImage, normalizeImagePath } from "@/lib/image-compression";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (imagePath: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  folder?: string;
}

export function ProductImageUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
  folder = "products",
}: ProductImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentImageUrl) {
      const normalizedPath = normalizeImagePath(currentImageUrl);
      const displayUrl = getStorageUrl(normalizedPath);
      setPreviewUrl(displayUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [currentImageUrl]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const compressedFile = await compressImage(file);
      const { path } = await uploadImage(compressedFile, folder);
      const normalizedPath = normalizeImagePath(path);
      const displayUrl = getStorageUrl(normalizedPath);
      
      setPreviewUrl(displayUrl);
      onImageUploaded(normalizedPath);
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [folder, onImageUploaded, toast]);

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    onImageRemoved?.();
  }, [onImageRemoved]);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-camera-capture"
      />

      <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden border border-border">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full h-full object-cover"
              data-testid="img-product-preview"
            />
            {!disabled && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                type="button"
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          type="button"
          data-testid="button-upload-image"
        >
          <Upload className="h-4 w-4 mr-2" />
          Enviar Imagem
        </Button>

        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isUploading}
          type="button"
          data-testid="button-camera-capture"
        >
          <Camera className="h-4 w-4 mr-2" />
          Câmera
        </Button>
      </div>
    </div>
  );
}
