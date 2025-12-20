import { useCallback, useRef } from 'react';

// Notification sound frequencies and durations for a pleasant "ding" sound
const NOTIFICATION_SOUNDS = {
  newOrder: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 (C major chord)
    duration: 0.15,
    type: 'sine' as OscillatorType,
  },
  orderUpdate: {
    frequencies: [440], // A4
    duration: 0.1,
    type: 'sine' as OscillatorType,
  },
  success: {
    frequencies: [523.25, 783.99], // C5, G5
    duration: 0.12,
    type: 'sine' as OscillatorType,
  },
};

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    (type: keyof typeof NOTIFICATION_SOUNDS = 'newOrder') => {
      try {
        const audioContext = getAudioContext();
        const sound = NOTIFICATION_SOUNDS[type];
        const now = audioContext.currentTime;

        sound.frequencies.forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = sound.type;
          oscillator.frequency.setValueAtTime(frequency, now);

          // Create envelope for smooth sound
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + sound.duration + index * 0.05);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(now + index * 0.05);
          oscillator.stop(now + sound.duration + index * 0.05 + 0.1);
        });
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    },
    [getAudioContext]
  );

  const playNewOrderSound = useCallback(() => {
    playSound('newOrder');
  }, [playSound]);

  const playUpdateSound = useCallback(() => {
    playSound('orderUpdate');
  }, [playSound]);

  const playSuccessSound = useCallback(() => {
    playSound('success');
  }, [playSound]);

  return {
    playSound,
    playNewOrderSound,
    playUpdateSound,
    playSuccessSound,
  };
}
