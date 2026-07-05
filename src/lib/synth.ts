import { Track } from "../types";

class SynthEngine {
  private audioCtx: AudioContext | null = null;
  private mainGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrack: Track | null = null;
  private playbackInterval: any = null;
  private step: number = 0;
  private onBeatCallback: ((step: number) => void) | null = null;
  private volumeValue: number = 0.3; // safe and comfortable default

  init() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.mainGain = this.audioCtx.createGain();
      this.mainGain.gain.setValueAtTime(this.volumeValue, this.audioCtx.currentTime);
      this.mainGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  setVolume(volume: number) {
    this.volumeValue = Math.max(0, Math.min(1, volume));
    if (this.mainGain && this.audioCtx) {
      this.mainGain.gain.setValueAtTime(this.volumeValue, this.audioCtx.currentTime);
    }
  }

  setOnBeat(callback: (step: number) => void) {
    this.onBeatCallback = callback;
  }

  play(track: Track) {
    this.init();
    if (!this.audioCtx) return;

    if (this.isPlaying) {
      this.stop();
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    this.currentTrack = track;
    this.isPlaying = true;
    this.step = 0;

    const intervalTime = (60000 / track.tempo) / 2; // eighth notes
    this.playbackInterval = setInterval(() => {
      this.playStep();
    }, intervalTime);
  }

  stop() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  private playStep() {
    if (!this.audioCtx || !this.mainGain || !this.currentTrack) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const baseFreq = this.currentTrack.baseNote;

    // Trigger visual callback
    if (this.onBeatCallback) {
      this.onBeatCallback(this.step);
    }

    // 1. Synth Bassline (every step has a bass note, simple retro pattern)
    // Notes: Root, Root, Minor 3rd, 5th, Octave, etc.
    const bassScale = [1, 1, 1.2, 1.5, 1, 1.2, 1.5, 2];
    const bassFreq = baseFreq * 0.5 * (bassScale[this.step % bassScale.length]);
    
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    
    // Quick attack and medium decay
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    // Create a low-pass filter for a warm retro feel
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    
    bassOsc.connect(bassGain);
    bassGain.connect(filter);
    filter.connect(this.mainGain);
    
    bassOsc.start(now);
    bassOsc.stop(now + 0.22);

    // 2. Lead Synth Arpeggiator / Melody (based on track pattern type)
    if (this.currentTrack.patternType === "chill") {
      // Play melorhythmic patterns on steps 0, 2, 4, 6
      if (this.step % 2 === 0) {
        const leadScale = [1.5, 1.88, 2, 2.25, 2.5, 3];
        const leadFreq = baseFreq * leadScale[Math.floor(this.step / 2) % leadScale.length];
        this.playLeadNote(leadFreq, "triangle", 0.15, 0.4);
      }
    } else if (this.currentTrack.patternType === "cyber") {
      // Fast sixteenth-like or syncopated patterns
      const leadScale = [1, 1.2, 1.5, 1.8, 1.5, 1.2, 2, 2.4];
      const leadFreq = baseFreq * leadScale[this.step % leadScale.length];
      if (this.step % 4 !== 3) {
        this.playLeadNote(leadFreq, "sawtooth", 0.08, 0.25);
      }
    } else if (this.currentTrack.patternType === "midnight") {
      // Warm drifting ambient chords and slow lead
      if (this.step % 4 === 0) {
        const padScale = [1, 1.2, 1.5, 1.8];
        const chordIndex = Math.floor(this.step / 4) % padScale.length;
        const scaleMultiplier = padScale[chordIndex];
        
        // Play three notes for a warm chord
        this.playLeadNote(baseFreq * scaleMultiplier, "sine", 0.6, 1.2);
        this.playLeadNote(baseFreq * scaleMultiplier * 1.2, "sine", 0.4, 1.2);
        this.playLeadNote(baseFreq * scaleMultiplier * 1.5, "sine", 0.3, 1.2);
      }
    }

    // 3. Simple retro dynamic drum clicks
    if (this.step % 4 === 0) {
      // Kick drum
      this.playKick();
    } else if (this.step % 4 === 2) {
      // Snare / clap noise
      this.playSnare();
    }

    this.step = (this.step + 1) % 16;
  }

  private playLeadNote(freq: number, type: OscillatorType, volume: number, duration: number) {
    if (!this.audioCtx || !this.mainGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    // Add subtle frequency vibrato
    osc.frequency.linearRampToValueAtTime(freq + 5, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(freq - 5, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Simple delay/echo effect
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.15, now);
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.15, now);

    osc.connect(gain);
    gain.connect(this.mainGain);

    // Wire up echo feedback
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.mainGain);

    osc.start(now);
    osc.stop(now + duration + 0.2);
  }

  private playKick() {
    if (!this.audioCtx || !this.mainGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.mainGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playSnare() {
    if (!this.audioCtx || !this.mainGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Create custom noise buffer for retro snare/clap
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.mainGain);

    noise.start(now);
    noise.stop(now + 0.15);
  }
}

export const synth = new SynthEngine();
