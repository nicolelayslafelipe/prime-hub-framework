// Professional sound library using Web Audio API
// Each sound is synthesized for high-quality, consistent playback

export type SoundType = 'bell' | 'chime' | 'ding-dong' | 'kitchen-bell' | 'alert' | 'success';

interface SoundConfig {
  name: string;
  description: string;
  icon: string;
}

export const SOUND_OPTIONS: Record<SoundType, SoundConfig> = {
  bell: {
    name: 'Sino',
    description: 'Sino clássico de notificação',
    icon: '🔔',
  },
  chime: {
    name: 'Carrilhão',
    description: 'Carrilhão suave e elegante',
    icon: '🎵',
  },
  'ding-dong': {
    name: 'Campainha',
    description: 'Som de campainha dupla',
    icon: '🚪',
  },
  'kitchen-bell': {
    name: 'Sino de Cozinha',
    description: 'Sino urgente para cozinha',
    icon: '👨‍🍳',
  },
  alert: {
    name: 'Alerta',
    description: 'Som de alerta repetitivo',
    icon: '⚠️',
  },
  success: {
    name: 'Sucesso',
    description: 'Som de confirmação',
    icon: '✅',
  },
};

// Sound synthesis configurations
const SOUND_CONFIGS: Record<SoundType, {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  delays: number[];
  gainEnvelope: { attack: number; decay: number; sustain: number; release: number };
}> = {
  bell: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 (C major chord)
    durations: [0.4, 0.35, 0.3],
    type: 'sine',
    delays: [0, 0.05, 0.1],
    gainEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.3 },
  },
  chime: {
    frequencies: [880, 1108.73, 1318.51, 1567.98], // A5, C#6, E6, G6
    durations: [0.6, 0.5, 0.4, 0.3],
    type: 'sine',
    delays: [0, 0.15, 0.3, 0.45],
    gainEnvelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.4 },
  },
  'ding-dong': {
    frequencies: [659.25, 523.25], // E5, C5
    durations: [0.3, 0.5],
    type: 'sine',
    delays: [0, 0.25],
    gainEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.3 },
  },
  'kitchen-bell': {
    frequencies: [1046.5, 1318.51, 1567.98], // C6, E6, G6 (higher, more urgent)
    durations: [0.25, 0.25, 0.25],
    type: 'triangle',
    delays: [0, 0.08, 0.16],
    gainEnvelope: { attack: 0.005, decay: 0.05, sustain: 0.5, release: 0.15 },
  },
  alert: {
    frequencies: [880, 698.46], // A5, F5 (attention-grabbing)
    durations: [0.15, 0.15],
    type: 'square',
    delays: [0, 0.18],
    gainEnvelope: { attack: 0.005, decay: 0.02, sustain: 0.6, release: 0.1 },
  },
  success: {
    frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6 (ascending)
    durations: [0.15, 0.15, 0.15, 0.3],
    type: 'sine',
    delays: [0, 0.1, 0.2, 0.3],
    gainEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.4, release: 0.2 },
  },
};

export class SoundPlayer {
  private audioContext: AudioContext | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private isInitialized = false;

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
      } catch (error) {
        console.warn('Could not resume AudioContext:', error);
      }
    }
    this.isInitialized = true;
    return this.audioContext;
  }

  // Must be called after user interaction to enable audio
  public async initialize(): Promise<boolean> {
    try {
      const ctx = await this.getAudioContext();
      // Play a silent sound to unlock audio
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);
      console.log('SoundPlayer initialized, AudioContext state:', ctx.state);
      return true;
    } catch (error) {
      console.warn('Failed to initialize SoundPlayer:', error);
      return false;
    }
  }

  public playSound(soundType: SoundType, volume: number = 0.7): void {
    // Fire and forget - we use the sync path internally
    this.playSoundAsync(soundType, volume).catch((error) => {
      console.warn('Could not play sound:', error);
    });
  }

  private async playSoundAsync(soundType: SoundType, volume: number): Promise<void> {
    const audioContext = await this.getAudioContext();
    const config = SOUND_CONFIGS[soundType];
    const now = audioContext.currentTime;

    // Stop any currently playing sounds
    this.stopCurrentSounds();

    config.frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const masterGain = audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(frequency, now);

      const { attack, decay, sustain, release } = config.gainEnvelope;
      const startTime = now + config.delays[index];
      const duration = config.durations[index];

      // ADSR envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
      gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
      gainNode.gain.setValueAtTime(sustain, startTime + duration - release);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      // Master volume
      masterGain.gain.setValueAtTime(volume * 0.5, now);

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      masterGain.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.1);

      this.currentOscillators.push(oscillator);

      oscillator.onended = () => {
        const idx = this.currentOscillators.indexOf(oscillator);
        if (idx > -1) {
          this.currentOscillators.splice(idx, 1);
        }
      };
    });
  }

  public stopCurrentSounds(): void {
    this.currentOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Already stopped
      }
    });
    this.currentOscillators = [];
  }

  public cleanup(): void {
    this.stopCurrentSounds();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance for global use
let soundPlayerInstance: SoundPlayer | null = null;

export function getSoundPlayer(): SoundPlayer {
  if (!soundPlayerInstance) {
    soundPlayerInstance = new SoundPlayer();
  }
  return soundPlayerInstance;
}

export function playNotificationSound(soundType: SoundType, volume: number = 0.7): void {
  getSoundPlayer().playSound(soundType, volume);
}
