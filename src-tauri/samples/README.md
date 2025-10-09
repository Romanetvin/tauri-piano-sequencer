# Piano Samples

This directory contains piano audio samples for realistic piano playback.

## Recommended: Salamander Grand Piano

The app works best with the Salamander Grand Piano samples (public domain, high quality).

### Quick Setup (Recommended)

Download a pre-selected subset of samples:

1. Visit: https://archive.org/details/SalamanderGrandPianoV3
2. Download these specific files (or download the full archive and extract them):
   - `A0v8.wav` (MIDI 21)
   - `A1v8.wav` (MIDI 33)
   - `A2v8.wav` (MIDI 45)
   - `A3v8.wav` (MIDI 57)
   - `A4v8.wav` (MIDI 69)
   - `A5v8.wav` (MIDI 81)
   - `A6v8.wav` (MIDI 93)
   - `A7v8.wav` (MIDI 105)

3. Place the `.wav` files in this directory (`src-tauri/samples/`)

### Alternative: Full Sample Set

For the best quality with all velocity layers:

1. Download the full Salamander Grand Piano V3 from:
   - https://archive.org/details/SalamanderGrandPianoV3
   - https://github.com/sfzinstruments/SalamanderGrandPiano

2. Extract and place desired `.wav` files in this directory

## Sample Format

- **Format**: WAV, 48kHz, 24-bit (or 16-bit)
- **Naming**: Files should match MIDI note numbers (e.g., `A4v8.wav` for A4 at velocity layer 8)
- The app will pitch-shift samples to cover missing notes

## Fallback

If no samples are found, the app will use synthesized piano sounds (less realistic but functional).
