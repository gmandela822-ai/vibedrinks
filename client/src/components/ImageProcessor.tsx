import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ImageIcon, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

interface ImageInfo {
  path: string;
  size: number;
  name: string;
  folder: string;
}

interface ProcessResult {
  path: string;
  newPath?: string;
  success?: boolean;
  skipped?: boolean;
  originalSize?: number;
  newSize?: number;
  savings?: number;
  error?: string;
}

export function ImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const { toast } = useToast();

  const { data: imagesData, isLoading: isLoadingImages, refetch } = useQuery<{ images: ImageInfo[]; total: number }>({
    queryKey: ['/api/admin/images'],
    enabled: false,
  });

  const processImageMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await apiRequest('POST', '/api/admin/images/process', { path });
      return response.json();
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setTotalSavings(0);
    setCurrentImage('');

    try {
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      
      if (!data.images || data.images.length === 0) {
        toast({
          title: 'Nenhuma imagem encontrada',
          description: 'Não há imagens para processar no bucket.',
        });
        setIsProcessing(false);
        return;
      }

      const images: ImageInfo[] = data.images;
      const totalImages = images.length;
      let processedCount = 0;
      let savings = 0;
      const processedResults: ProcessResult[] = [];

      for (const image of images) {
        setCurrentImage(image.name);
        
        try {
          const result = await processImageMutation.mutateAsync(image.path);
          processedResults.push(result);
          
          if (result.savings) {
            savings += result.savings;
          }
        } catch (error) {
          processedResults.push({ path: image.path, error: 'Erro ao processar' });
        }

        processedCount++;
        setProgress(Math.round((processedCount / totalImages) * 100));
        setTotalSavings(savings);
        setResults([...processedResults]);
      }

      toast({
        title: 'Processamento concluído!',
        description: `${totalImages} imagens processadas. Economia total: ${formatBytes(savings)}`,
      });
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar as imagens.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setCurrentImage('');
    }
  };

  const successCount = results.filter(r => r.success && !r.skipped).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const errorCount = results.filter(r => r.error).length;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ImageIcon className="w-5 h-5" />
          Processador de Imagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Este processador vai otimizar todas as imagens do bucket do Supabase, 
          compactando e normalizando para melhorar a velocidade de carregamento.
        </p>

        {!isProcessing && results.length === 0 && (
          <Button 
            onClick={handleStartProcessing}
            className="w-full"
            data-testid="button-start-processing"
          >
            <Zap className="w-4 h-4 mr-2" />
            Iniciar Processamento
          </Button>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm">Processando: {currentImage}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% concluído</span>
              <span>Economia: {formatBytes(totalSavings)}</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {successCount > 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {successCount} otimizadas
                </Badge>
              )}
              {skippedCount > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  {skippedCount} já otimizadas
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {errorCount} erros
                </Badge>
              )}
            </div>

            <div className="p-3 rounded-md bg-secondary/50 border border-primary/20">
              <p className="text-sm font-medium">
                Economia total: <span className="text-primary">{formatBytes(totalSavings)}</span>
              </p>
            </div>

            {!isProcessing && (
              <Button 
                onClick={handleStartProcessing}
                variant="outline"
                className="w-full"
                data-testid="button-reprocess"
              >
                <Zap className="w-4 h-4 mr-2" />
                Processar Novamente
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
