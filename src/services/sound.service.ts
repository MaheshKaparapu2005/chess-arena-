import { PieceType, PieceColor } from '../models/chess';

export type SoundTheme = 'wood' | 'glass' | 'arcade' | 'scifi' | 'minimal';

export interface SoundPreferences {
  volume: number; // 0.0 - 1.0
  muted: boolean;
  theme: SoundTheme;
  moveSoundsEnabled: boolean;
  captureSoundsEnabled: boolean;
  checkSoundsEnabled: boolean;
  gameEndSoundsEnabled: boolean;
  clockTickEnabled: boolean;
  specialFxEnabled: boolean;
}

/**
 * SoundManagerService
 * Comprehensive Web Audio API procedural sound engine for Chess Arena.
 * Generates acoustic, realistic physical chess piece sounds, high-fidelity check stingers,
 * game outcome fanfares, and ambient clock ticks without external audio file dependencies.
 */
export class SoundManagerService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.75;
  private isMuted: boolean = false;
  private theme: SoundTheme = 'wood';

  // Granular sound category toggles
  private moveSoundsEnabled: boolean = true;
  private captureSoundsEnabled: boolean = true;
  private checkSoundsEnabled: boolean = true;
  private gameEndSoundsEnabled: boolean = true;
  private clockTickEnabled: boolean = true;
  private specialFxEnabled: boolean = true;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPreferences();
  }

  // --- Preference Persistence & Event Dispatching ---

  private loadPreferences() {
    try {
      const savedMuted = localStorage.getItem('chess_arena_muted');
      if (savedMuted !== null) this.isMuted = savedMuted === 'true';

      const savedVol = localStorage.getItem('chess_arena_volume');
      if (savedVol !== null) this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));

      const savedTheme = localStorage.getItem('chess_arena_sound_theme') as SoundTheme | null;
      if (savedTheme && ['wood', 'glass', 'arcade', 'scifi', 'minimal'].includes(savedTheme)) {
        this.theme = savedTheme;
      }

      const savedMoveSound = localStorage.getItem('chess_arena_sound_moves_enabled');
      if (savedMoveSound !== null) this.moveSoundsEnabled = savedMoveSound === 'true';

      const savedCaptureSound = localStorage.getItem('chess_arena_sound_captures_enabled');
      if (savedCaptureSound !== null) this.captureSoundsEnabled = savedCaptureSound === 'true';

      const savedCheckSound = localStorage.getItem('chess_arena_sound_checks_enabled');
      if (savedCheckSound !== null) this.checkSoundsEnabled = savedCheckSound === 'true';

      const savedGameEndSound = localStorage.getItem('chess_arena_sound_game_end_enabled');
      if (savedGameEndSound !== null) this.gameEndSoundsEnabled = savedGameEndSound === 'true';

      const savedTick = localStorage.getItem('chess_arena_sound_clock_tick');
      if (savedTick !== null) this.clockTickEnabled = savedTick === 'true';

      const savedSpecial = localStorage.getItem('chess_arena_sound_special_fx_enabled');
      if (savedSpecial !== null) this.specialFxEnabled = savedSpecial === 'true';
    } catch (e) {
      console.warn('[SoundManager] Could not access localStorage preferences:', e);
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem('chess_arena_muted', String(this.isMuted));
      localStorage.setItem('chess_arena_volume', String(this.volume));
      localStorage.setItem('chess_arena_sound_theme', this.theme);
      localStorage.setItem('chess_arena_sound_moves_enabled', String(this.moveSoundsEnabled));
      localStorage.setItem('chess_arena_sound_captures_enabled', String(this.captureSoundsEnabled));
      localStorage.setItem('chess_arena_sound_checks_enabled', String(this.checkSoundsEnabled));
      localStorage.setItem('chess_arena_sound_game_end_enabled', String(this.gameEndSoundsEnabled));
      localStorage.setItem('chess_arena_sound_clock_tick', String(this.clockTickEnabled));
      localStorage.setItem('chess_arena_sound_special_fx_enabled', String(this.specialFxEnabled));
    } catch (e) {
      console.warn('[SoundManager] Could not save preferences to localStorage:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Web Audio Context Helpers ---

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createMasterGain(ctx: AudioContext, gainFactor: number = 1.0): GainNode {
    const gain = ctx.createGain();
    const effectiveVol = this.isMuted ? 0 : this.volume * gainFactor;
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.connect(ctx.destination);
    return gain;
  }

  // --- Getters & Setters ---

  public getPreferences(): SoundPreferences {
    return {
      volume: this.volume,
      muted: this.isMuted,
      theme: this.theme,
      moveSoundsEnabled: this.moveSoundsEnabled,
      captureSoundsEnabled: this.captureSoundsEnabled,
      checkSoundsEnabled: this.checkSoundsEnabled,
      gameEndSoundsEnabled: this.gameEndSoundsEnabled,
      clockTickEnabled: this.clockTickEnabled,
      specialFxEnabled: this.specialFxEnabled,
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.savePreferences();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setTheme(theme: SoundTheme) {
    this.theme = theme;
    this.savePreferences();
    // Play a preview sound of the selected theme
    this.playMove();
  }

  public getTheme(): SoundTheme {
    return this.theme;
  }

  public setMoveSoundsEnabled(enabled: boolean) {
    this.moveSoundsEnabled = enabled;
    this.savePreferences();
  }

  public isMoveSoundsEnabled(): boolean {
    return this.moveSoundsEnabled;
  }

  public setCaptureSoundsEnabled(enabled: boolean) {
    this.captureSoundsEnabled = enabled;
    this.savePreferences();
  }

  public isCaptureSoundsEnabled(): boolean {
    return this.captureSoundsEnabled;
  }

  public setCheckSoundsEnabled(enabled: boolean) {
    this.checkSoundsEnabled = enabled;
    this.savePreferences();
  }

  public isCheckSoundsEnabled(): boolean {
    return this.checkSoundsEnabled;
  }

  public setGameEndSoundsEnabled(enabled: boolean) {
    this.gameEndSoundsEnabled = enabled;
    this.savePreferences();
  }

  public isGameEndSoundsEnabled(): boolean {
    return this.gameEndSoundsEnabled;
  }

  public setClockTickEnabled(enabled: boolean) {
    this.clockTickEnabled = enabled;
    this.savePreferences();
  }

  public isClockTickEnabled(): boolean {
    return this.clockTickEnabled;
  }

  public setSpecialFxEnabled(enabled: boolean) {
    this.specialFxEnabled = enabled;
    this.savePreferences();
  }

  public isSpecialFxEnabled(): boolean {
    return this.specialFxEnabled;
  }

  // =========================================================================
  // --- TACTICAL AUDIO CUES: MOVES, CAPTURES, CHECKS, GAME END STATES ---
  // =========================================================================

  /**
   * 1. PIECE MOVEMENT CUE
   * Plays dynamic acoustic touch / landing sound tailored to piece mass and selected theme.
   */
  public playMove(pieceType?: PieceType) {
    if (this.isMuted || !this.moveSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';
    const isMedium = pieceType === 'b' || pieceType === 'n';

    // ARCADE 8-BIT THEME
    if (this.theme === 'arcade') {
      const master = this.createMasterGain(ctx, 0.4);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';

      const startFreq = isHeavy ? 200 : isMedium ? 280 : 340;
      const endFreq = isHeavy ? 90 : isMedium ? 130 : 160;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.055);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.055);
      return;
    }

    // GLASS & CRYSTAL THEME
    if (this.theme === 'glass') {
      const master = this.createMasterGain(ctx, 0.42);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const startFreq = isHeavy ? 1100 : isMedium ? 1400 : 1750;
      const endFreq = isHeavy ? 550 : isMedium ? 700 : 850;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.075);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.075);
      return;
    }

    // SCI-FI SYNTH THEME
    if (this.theme === 'scifi') {
      const master = this.createMasterGain(ctx, 0.38);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      const baseFreq = isHeavy ? 240 : isMedium ? 360 : 480;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.06);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.06);
      return;
    }

    // MINIMALIST SOFT THEME
    if (this.theme === 'minimal') {
      const master = this.createMasterGain(ctx, 0.32);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const baseFreq = isHeavy ? 130 : isMedium ? 170 : 210;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.045);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.045);
      return;
    }

    // DEFAULT: 'wood' CLASSIC ACOUSTIC TOURNAMENT BOARD TAP
    const master = this.createMasterGain(ctx, 0.48);
    const baseFreq = isHeavy ? 140 : isMedium ? 180 : 220;

    // Phase 1: High frequency felt/varnish impact friction transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isHeavy ? 850 : 1200, now);
    noiseFilter.Q.setValueAtTime(2.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);

    // Phase 2: Resonant hollow wooden tournament body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(baseFreq, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.58, now + 0.075);

    bodyGain.gain.setValueAtTime(0.42, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(master);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.075);
  }

  /**
   * 2. PIECE CAPTURE CUE
   * Realistic multi-phase physical strike: piece colliding with target piece, followed by
   * firm plant on square. Dynamically amplified for high-value targets (Queen/Rook).
   */
  public playCapture(capturedType?: PieceType, capturingType?: PieceType) {
    if (this.isMuted || !this.captureSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isHighValue = capturedType === 'q' || capturedType === 'r';

    // ARCADE 8-BIT THEME
    if (this.theme === 'arcade') {
      const master = this.createMasterGain(ctx, 0.55);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isHighValue ? 520 : 420, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.13);

      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    // GLASS CRYSTAL CLINK THEME
    if (this.theme === 'glass') {
      const master = this.createMasterGain(ctx, 0.52);
      const freqs = isHighValue ? [1600, 2200, 3100] : [1900, 2600];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(450, now + idx * 0.02 + 0.11);

        gain.gain.setValueAtTime(0.38, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.11);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.11);
      });
      return;
    }

    // SCI-FI SYNTH THEME
    if (this.theme === 'scifi') {
      const master = this.createMasterGain(ctx, 0.48);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.14);
      return;
    }

    // MINIMALIST SOFT THEME
    if (this.theme === 'minimal') {
      const master = this.createMasterGain(ctx, 0.4);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHighValue ? 240 : 200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.09);
      return;
    }

    // DEFAULT: 'wood' DOUBLE TRANSIENT KNOCK (Striking piece off board + landing)
    const master = this.createMasterGain(ctx, isHighValue ? 0.65 : 0.55);

    // 1st Impact: Strike on the opponent piece (t = 0)
    const strikeOsc = ctx.createOscillator();
    const strikeGain = ctx.createGain();
    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(isHighValue ? 320 : 280, now);
    strikeOsc.frequency.exponentialRampToValueAtTime(110, now + 0.045);
    strikeGain.gain.setValueAtTime(0.55, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);

    strikeOsc.connect(strikeGain);
    strikeGain.connect(master);
    strikeOsc.start(now);
    strikeOsc.stop(now + 0.045);

    // 2nd Impact: Piece planting down firmly onto the square (t = 0.038s)
    const plantOsc = ctx.createOscillator();
    const plantGain = ctx.createGain();
    plantOsc.type = 'sine';
    plantOsc.frequency.setValueAtTime(isHighValue ? 160 : 130, now + 0.038);
    plantOsc.frequency.exponentialRampToValueAtTime(65, now + 0.13);
    plantGain.gain.setValueAtTime(0.65, now + 0.038);
    plantGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    plantOsc.connect(plantGain);
    plantGain.connect(master);
    plantOsc.start(now + 0.038);
    plantOsc.stop(now + 0.13);

    // Physical wood crack noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.055);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHighValue ? 950 : 800, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
  }

  /**
   * 3. CHECK ALERT CUE
   * Tense, urgent attention-grabbing harmonic stinger indicating King under direct attack.
   * If isDoubleCheck is true, triggers an escalated dual-stinger.
   */
  public playCheck(isDoubleCheck: boolean = false) {
    if (this.isMuted || !this.checkSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.55);

    // ARCADE 8-BIT THEME
    if (this.theme === 'arcade') {
      const alertFreqs = isDoubleCheck ? [587.33, 880, 1174.66] : [587.33, 880];
      alertFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.32, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.12);
      });
      return;
    }

    // SCI-FI SYNTH THEME
    if (this.theme === 'scifi') {
      [440, 622.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.25, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.3);
      });
      return;
    }

    // DEFAULT & GLASS: TENSE MINOR-AUGMENTED DRAMATIC CHIME (F5, Ab5, D6)
    const frequencies = isDoubleCheck
      ? [698.46, 830.61, 1174.66, 1396.91]
      : [698.46, 830.61, 1174.66];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = this.theme === 'glass' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.3, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.38);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.38);
    });

    // Deep sub-bass resonance gong for dramatic impact
    const gong = ctx.createOscillator();
    const gongGain = ctx.createGain();
    gong.type = 'sine';
    gong.frequency.setValueAtTime(196, now); // G3
    gong.frequency.exponentialRampToValueAtTime(130, now + 0.42);

    gongGain.gain.setValueAtTime(0.4, now);
    gongGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    gong.connect(gongGain);
    gongGain.connect(master);
    gong.start(now);
    gong.stop(now + 0.42);
  }

  /**
   * 4. CHECKMATE CUE
   * Conclusive game-ending checkmate impact stinger.
   */
  public playCheckmate(winner?: PieceColor | null, isPlayerWinner: boolean = true) {
    if (this.isMuted || !this.gameEndSoundsEnabled) return;
    if (isPlayerWinner) {
      this.playVictory();
    } else {
      this.playDefeat();
    }
  }

  /**
   * 5. VICTORY FANFARE CUE
   * Triumphant Major Arpeggio Fanfare (C5 -> E5 -> G5 -> C6 -> E6 sustained chime).
   */
  public playVictory() {
    if (this.isMuted || !this.gameEndSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.55);

    const fanfareNotes = [
      { freq: 523.25, time: 0, dur: 0.14 },    // C5
      { freq: 659.25, time: 0.12, dur: 0.14 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.16 }, // G5
      { freq: 1046.5, time: 0.38, dur: 0.6 },  // C6
      { freq: 1318.51, time: 0.5, dur: 0.75 }, // E6
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = this.theme === 'arcade' ? 'square' : this.theme === 'scifi' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.32, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });

    // Celebratory sustained low bass gong
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(261.63, now + 0.38);
    bassGain.gain.setValueAtTime(0.42, now + 0.38);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    bass.connect(bassGain);
    bassGain.connect(master);
    bass.start(now + 0.38);
    bass.stop(now + 1.2);
  }

  /**
   * 6. DEFEAT CUE
   * Melancholy descending minor triad: E5 -> C5 -> A4 -> F#4 with fading bell stinger.
   */
  public playDefeat() {
    if (this.isMuted || !this.gameEndSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.48);

    const notes = [
      { freq: 659.25, time: 0, dur: 0.2 },
      { freq: 523.25, time: 0.18, dur: 0.22 },
      { freq: 440.0, time: 0.38, dur: 0.25 },
      { freq: 369.99, time: 0.6, dur: 0.65 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.3, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  /**
   * 7. DRAW / STALEMATE CUE
   * Neutral contemplative suspended harmony chord (D4 -> G4 -> A4).
   */
  public playDraw() {
    if (this.isMuted || !this.gameEndSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.45);

    const chord = [293.66, 392.0, 440.0];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.75);
    });
  }

  /**
   * 8. TIMEOUT CUE
   * Dual urgent siren/buzzer indicating clock depletion.
   */
  public playTimeout() {
    if (this.isMuted || !this.gameEndSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.52);

    [220, 164.81].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.32, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.25);
    });
  }

  /**
   * 9. RESIGNATION CUE
   */
  public playResign() {
    this.playDefeat();
  }

  /**
   * General Game Over outcome helper
   */
  public playGameOver(result?: 'win' | 'loss' | 'draw' | 'timeout') {
    if (result === 'win') this.playVictory();
    else if (result === 'loss') this.playDefeat();
    else if (result === 'draw') this.playDraw();
    else if (result === 'timeout') this.playTimeout();
    else this.playVictory();
  }

  /**
   * 10. CASTLING CUE
   * Rhythmic double-clack (King steps, Rook leaps over).
   */
  public playCastle() {
    if (this.isMuted || !this.specialFxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.46);

    // 1st step: King placement (t = 0)
    const kOsc = ctx.createOscillator();
    const kGain = ctx.createGain();
    kOsc.type = 'triangle';
    kOsc.frequency.setValueAtTime(190, now);
    kOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    kGain.gain.setValueAtTime(0.38, now);
    kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    kOsc.connect(kGain);
    kGain.connect(master);
    kOsc.start(now);
    kOsc.stop(now + 0.05);

    // 2nd step: Rook placement (t = 0.08s)
    const rOsc = ctx.createOscillator();
    const rGain = ctx.createGain();
    rOsc.type = 'triangle';
    rOsc.frequency.setValueAtTime(260, now + 0.08);
    rOsc.frequency.exponentialRampToValueAtTime(130, now + 0.14);
    rGain.gain.setValueAtTime(0.42, now + 0.08);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    rOsc.connect(rGain);
    rGain.connect(master);
    rOsc.start(now + 0.08);
    rOsc.stop(now + 0.14);
  }

  /**
   * 11. PAWN PROMOTION CUE
   * Ascending arpeggio shimmer: C5 -> E5 -> G5 -> C6 -> E6 with sparkling harmonics.
   */
  public playPromotion(promotedTo?: PieceType) {
    if (this.isMuted || !this.specialFxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.48);

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = this.theme === 'arcade' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.26, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.26);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  /**
   * 12. CHESS CLOCK TICK CUE
   * Subtle woodblock / digital click when time remaining is low (<= 15s).
   * Elevates frequency and intensity if urgent (<= 5s).
   */
  public playClockTick(isUrgent: boolean = false) {
    if (this.isMuted || !this.clockTickEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, isUrgent ? 0.38 : 0.22);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 1400 : 1000, now);
    osc.frequency.exponentialRampToValueAtTime(isUrgent ? 600 : 500, now + 0.02);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * 13. PIECE SELECTION CLICK
   * Soft subtle feedback when selecting a chess piece.
   */
  public playSelect() {
    if (this.isMuted || !this.moveSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.18);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * 14. ILLEGAL MOVE / REJECTION THUD
   */
  public playIllegal() {
    if (this.isMuted || !this.specialFxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.28);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * 15. GAME START GONG
   */
  public playGameStart() {
    if (this.isMuted || !this.specialFxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.48);

    [440, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.65);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  /**
   * 16. PUZZLE SOLVED CHIME
   */
  public playPuzzleSuccess() {
    this.playVictory();
  }

  /**
   * 17. PUZZLE FAILED STINGER
   */
  public playPuzzleFail() {
    this.playIllegal();
  }

  /**
   * 18. HINT DISCOVERY CHIME
   */
  public playHint() {
    if (this.isMuted || !this.specialFxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.35);

    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  /**
   * 19. ENGINE BLUNDER ALERT
   */
  public playBlunderAlert() {
    if (this.isMuted || !this.checkSoundsEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = this.createMasterGain(ctx, 0.45);

    [311.13, 293.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.28, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.22);
    });
  }

  public playBlunder() {
    this.playBlunderAlert();
  }

  public playLowTime() {
    this.playClockTick(true);
  }

  /**
   * 20. ENGINE BRILLIANT MOVE FLOURISH
   */
  public playBrilliantMove() {
    this.playPromotion();
  }
}

// Export singleton soundManager and alias soundService for backwards compatibility
export const soundManager = new SoundManagerService();
export const soundService = soundManager;
export const SoundService = SoundManagerService;
