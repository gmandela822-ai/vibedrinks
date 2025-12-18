import { useCallback, useRef } from 'react';
import notificationSoundUrl from '@assets/new-notification-026-380249_1765220299583.mp3';

interface UseNotificationSoundOptions {
  volume?: number;
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { volume = 0.7 } = options;
  const isPlayingRef = useRef(false);
  const activeAudiosRef = useRef<Set<HTMLAudioElement>>(new Set());
  const stopRequestedRef = useRef(false);

  const createAudio = useCallback(() => {
    const audio = new Audio(notificationSoundUrl);
    audio.volume = volume;
    activeAudiosRef.current.add(audio);
    audio.addEventListener('ended', () => {
      activeAudiosRef.current.delete(audio);
    });
    return audio;
  }, [volume]);

  const playOnce = useCallback(() => {
    const audio = createAudio();
    audio.play().catch(() => {
      activeAudiosRef.current.delete(audio);
    });
  }, [createAudio]);

  const playMultiple = useCallback(async (times: number = 5, delayMs: number = 800) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    stopRequestedRef.current = false;

    for (let i = 0; i < times; i++) {
      if (stopRequestedRef.current) break;
      const audio = createAudio();
      await audio.play().catch(() => {
        activeAudiosRef.current.delete(audio);
      });
      if (i < times - 1 && !stopRequestedRef.current) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    isPlayingRef.current = false;
  }, [createAudio]);

  const stopAll = useCallback(() => {
    stopRequestedRef.current = true;
    activeAudiosRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudiosRef.current.clear();
    isPlayingRef.current = false;
  }, []);

  return {
    playOnce,
    playMultiple,
    stopAll,
  };
}
