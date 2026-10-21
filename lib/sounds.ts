import { useTypingStore, type KeySound } from "./store";

// All sounds are synthesized with Web Audio, so there are no audio files to download.
let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio(): AudioContext {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function noise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** A gain node that fades from `peak` to silence over `duration` seconds. */
function envelope(ctx: AudioContext, peak: number, duration: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  gain.connect(ctx.destination);
  return gain;
}

function noiseBurst(ctx: AudioContext, volume: number, duration: number, filterType: BiquadFilterType, frequency: number) {
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  source.connect(filter).connect(envelope(ctx, volume, duration));
  source.start();
  source.stop(ctx.currentTime + duration);
}

function tone(ctx: AudioContext, volume: number, duration: number, type: OscillatorType, from: number, to = from) {
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
  oscillator.connect(envelope(ctx, volume, duration));
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

const KEY_SOUNDS: Record<Exclude<KeySound, "off">, (ctx: AudioContext, volume: number) => void> = {
  click: (ctx, volume) => noiseBurst(ctx, volume * 0.6, 0.025, "highpass", 2500),
  pop: (ctx, volume) => tone(ctx, volume * 0.5, 0.07, "sine", 750, 300),
  typewriter: (ctx, volume) => {
    noiseBurst(ctx, volume * 0.7, 0.04, "bandpass", 1400);
    tone(ctx, volume * 0.4, 0.05, "triangle", 160, 90);
  },
};

/** Plays the keypress or error sound picked in settings (no-op when sounds are off). */
export function playTypingSound(isError: boolean) {
  const { keySound, errorSound, soundVolume } = useTypingStore.getState();
  if (soundVolume <= 0) return;

  try {
    if (isError && errorSound) {
      tone(audio(), soundVolume * 0.35, 0.14, "square", 150, 110);
    } else if (keySound !== "off") {
      KEY_SOUNDS[keySound](audio(), soundVolume);
    }
  } catch {
    // audio unavailable (e.g. blocked autoplay); typing works without it
  }
}
