/**
 * Lightweight 8-bit Sound Synthesizer generating Scratch-compatible PCM WAV audio
 */
import { computeMd5 } from './md5';
import { ProjectAsset, Sb3Sound } from '../types';

function createWavHeader(sampleCount: number, sampleRate: number = 22050): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 8;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = sampleCount;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  // File size - 8
  view.setUint32(4, 36 + dataSize, true);
  // "WAVE"
  view.setUint32(8, 0x57415645, false);
  // "fmt "
  view.setUint32(12, 0x666d7420, false);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels
  view.setUint16(22, numChannels, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate
  view.setUint32(28, byteRate, true);
  // BlockAlign
  view.setUint16(32, blockAlign, true);
  // BitsPerSample
  view.setUint16(34, bitsPerSample, true);
  // "data"
  view.setUint32(36, 0x64617461, false);
  // Subchunk2Size
  view.setUint32(40, dataSize, true);

  return new Uint8Array(buffer);
}

export type SoundEffectType =
  | 'jump'
  | 'coin'
  | 'hit'
  | 'shoot'
  | 'explosion'
  | 'win'
  | 'game_over';

export function synthesizeSoundEffect(type: SoundEffectType): { asset: ProjectAsset; sound: Sb3Sound } {
  const sampleRate = 22050;
  let duration = 0.2; // seconds

  if (type === 'explosion') duration = 0.4;
  else if (type === 'win') duration = 0.6;
  else if (type === 'game_over') duration = 0.5;

  const totalSamples = Math.floor(sampleRate * duration);
  const wavBuffer = createWavHeader(totalSamples, sampleRate);
  const dataOffset = 44;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const progress = i / totalSamples;
    let sample = 128; // 8-bit unsigned PCM center is 128 (range 0..255)

    if (type === 'jump') {
      // Frequency sweep upwards: 150 Hz -> 500 Hz
      const freq = 150 + 350 * progress;
      const wave = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      const envelope = 1 - progress;
      sample = Math.floor(128 + wave * 60 * envelope);
    } else if (type === 'coin') {
      // High two-tone chime (987 Hz -> 1318 Hz)
      const freq = progress < 0.5 ? 987 : 1318;
      const wave = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.max(0, 1 - progress * 1.5);
      sample = Math.floor(128 + wave * 70 * envelope);
    } else if (type === 'shoot') {
      // Rapid downward chirp: 900 Hz -> 150 Hz
      const freq = 900 - 750 * progress;
      const wave = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      const envelope = 1 - progress;
      sample = Math.floor(128 + wave * 60 * envelope);
    } else if (type === 'hit') {
      // Low thud + white noise
      const noise = Math.random() * 2 - 1;
      const tone = Math.sin(2 * Math.PI * 120 * t);
      const envelope = Math.exp(-progress * 8);
      sample = Math.floor(128 + (tone * 0.6 + noise * 0.4) * 80 * envelope);
    } else if (type === 'explosion') {
      // Low-frequency noise burst
      const noise = Math.random() * 2 - 1;
      const rumble = Math.sin(2 * Math.PI * 60 * t);
      const envelope = Math.exp(-progress * 5);
      sample = Math.floor(128 + (noise * 0.7 + rumble * 0.3) * 90 * envelope);
    } else if (type === 'win') {
      // Upbeat 4-note arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const noteIdx = Math.min(notes.length - 1, Math.floor(progress * notes.length));
      const freq = notes[noteIdx];
      const wave = Math.sin(2 * Math.PI * freq * t);
      const subProgress = (progress * notes.length) % 1;
      const envelope = 1 - subProgress * 0.5;
      sample = Math.floor(128 + wave * 75 * envelope);
    } else if (type === 'game_over') {
      // Downbeat 3-note descending sad chime
      const notes = [392.0, 329.63, 261.63];
      const noteIdx = Math.min(notes.length - 1, Math.floor(progress * notes.length));
      const freq = notes[noteIdx];
      const wave = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      const subProgress = (progress * notes.length) % 1;
      const envelope = 1 - subProgress * 0.6;
      sample = Math.floor(128 + wave * 50 * envelope);
    }

    wavBuffer[dataOffset + i] = Math.max(0, Math.min(255, sample));
  }

  const assetId = computeMd5(wavBuffer);
  const fileName = `${assetId}.wav`;

  const asset: ProjectAsset = {
    assetId,
    name: type,
    fileName,
    extension: 'wav',
    content: wavBuffer,
  };

  const sound: Sb3Sound = {
    assetId,
    name: type,
    md5ext: fileName,
    dataFormat: 'wav',
    rate: sampleRate,
    sampleCount: totalSamples,
  };

  return { asset, sound };
}
