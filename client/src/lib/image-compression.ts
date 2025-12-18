const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        URL.revokeObjectURL(img.src);
        let { width, height } = img;

        // Redimensionar mantendo proporção
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        if (!ctx) {
          resolve(file);
          return;
        }

        // Melhorar qualidade do desenho
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            if (compressedFile.size < file.size) {
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          QUALITY
        );
      } catch (error) {
        console.error('Error compressing image:', error);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      console.error('Error loading image');
      resolve(file);
    };

    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
}

export function normalizeImagePath(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) {
    // Extract just the path from full URL
    const url = new URL(path);
    const pathPart = url.pathname.split('/object/public/images/')[1];
    return pathPart || path;
  }
  return path;
}
