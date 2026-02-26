let audioCtx: AudioContext | null = null;
let musicElement: HTMLAudioElement | null = null;
let musicGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;
let musicOn = true;
let sfxOn = true;

function getContext(): AudioContext {
	if (!audioCtx) {
		audioCtx = new AudioContext();
		sfxGainNode = audioCtx.createGain();
		sfxGainNode.gain.value = 0.7;
		sfxGainNode.connect(audioCtx.destination);
	}
	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

export function initAudio(): void {
	getContext();
}

// --- Background Music ---

export function initMusic(): void {
	if (musicElement) return;
	musicElement = new Audio('/background.mp3');
	musicElement.loop = true;
	musicElement.volume = 1;

	const ctx = getContext();
	const source = ctx.createMediaElementSource(musicElement);
	musicGainNode = ctx.createGain();
	musicGainNode.gain.value = 0.3;
	source.connect(musicGainNode);
	musicGainNode.connect(ctx.destination);
}

export function startMusic(): void {
	if (!musicElement) initMusic();
	if (musicElement && musicOn) {
		musicElement.play().catch(() => {
			// Autoplay blocked - will start on next user interaction
		});
	}
}

export function stopMusic(): void {
	if (musicElement) {
		musicElement.pause();
		musicElement.currentTime = 0;
	}
}

export function setMusicOn(on: boolean): void {
	musicOn = on;
	if (musicElement) {
		if (on) {
			musicElement.play().catch(() => {});
		} else {
			musicElement.pause();
		}
	}
}

export function setSfxOn(on: boolean): void {
	sfxOn = on;
}

export function setMusicVolume(vol: number): void {
	if (musicGainNode) {
		musicGainNode.gain.value = vol;
	}
}

export function setSfxVolume(vol: number): void {
	if (sfxGainNode) {
		sfxGainNode.gain.value = vol;
	}
}

// --- Synthesized Sound Effects ---

function playTone(
	frequency: number,
	duration: number,
	type: OscillatorType = 'square',
	volumeEnvelope?: (gain: GainNode, ctx: AudioContext, startTime: number) => void
): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = type;
	osc.frequency.value = frequency;
	osc.connect(gain);
	gain.connect(sfxGainNode || ctx.destination);

	const now = ctx.currentTime;
	if (volumeEnvelope) {
		volumeEnvelope(gain, ctx, now);
	} else {
		gain.gain.setValueAtTime(0.3, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
	}

	osc.start(now);
	osc.stop(now + duration);
}

function playNoise(duration: number, filterFreq: number): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const bufferSize = ctx.sampleRate * duration;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) {
		data[i] = Math.random() * 2 - 1;
	}

	const source = ctx.createBufferSource();
	source.buffer = buffer;

	const filter = ctx.createBiquadFilter();
	filter.type = 'bandpass';
	filter.frequency.value = filterFreq;
	filter.Q.value = 1;

	const gain = ctx.createGain();
	const now = ctx.currentTime;
	gain.gain.setValueAtTime(0.2, now);
	gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

	source.connect(filter);
	filter.connect(gain);
	gain.connect(sfxGainNode || ctx.destination);

	source.start(now);
	source.stop(now + duration);
}

export function playMunchCorrect(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	// Ascending arpeggio: C5 → E5 → G5
	const notes = [523.25, 659.25, 783.99];
	notes.forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = freq;
		osc.connect(gain);
		gain.connect(sfxGainNode || ctx.destination);
		const start = now + i * 0.05;
		gain.gain.setValueAtTime(0.25, start);
		gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
		osc.start(start);
		osc.stop(start + 0.08);
	});
}

export function playMunchWrong(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	// Descending buzz
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(400, now);
	osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
	osc.connect(gain);
	gain.connect(sfxGainNode || ctx.destination);
	gain.gain.setValueAtTime(0.3, now);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
	osc.start(now);
	osc.stop(now + 0.4);

	// Noise burst
	playNoise(0.15, 300);
}

export function playMove(): void {
	playTone(800, 0.03, 'sine');
}

export function playTroggleEnter(): void {
	playNoise(0.2, 2000);
}

export function playTroggleCatch(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(800, now);
	osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
	osc.connect(gain);
	gain.connect(sfxGainNode || ctx.destination);
	gain.gain.setValueAtTime(0.35, now);
	gain.gain.linearRampToValueAtTime(0, now + 0.6);
	osc.start(now);
	osc.stop(now + 0.6);
}

export function playLevelComplete(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	// Major scale ascending: C5 D5 E5 F5 G5 A5 B5 C6
	const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
	notes.forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = freq;
		osc.connect(gain);
		gain.connect(sfxGainNode || ctx.destination);
		const start = now + i * 0.1;
		gain.gain.setValueAtTime(0.2, start);
		gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
		osc.start(start);
		osc.stop(start + 0.15);
	});
}

export function playGameOver(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	// Slow descending minor notes
	const notes = [659.25, 622.25, 523.25, 392.0, 329.63];
	notes.forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = freq;
		osc.connect(gain);
		gain.connect(sfxGainNode || ctx.destination);
		const start = now + i * 0.25;
		gain.gain.setValueAtTime(0.2, start);
		gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
		osc.start(start);
		osc.stop(start + 0.35);
	});
}

export function playExtraLife(): void {
	if (!sfxOn) return;
	const ctx = getContext();
	const now = ctx.currentTime;
	const notes = [523.25, 783.99, 1046.5];
	notes.forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = freq;
		osc.connect(gain);
		gain.connect(sfxGainNode || ctx.destination);
		const start = now + i * 0.08;
		gain.gain.setValueAtTime(0.25, start);
		gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
		osc.start(start);
		osc.stop(start + 0.12);
	});
}

export function playMenuSelect(): void {
	playTone(1000, 0.05, 'sine');
}

export function playPause(): void {
	playTone(600, 0.08, 'triangle');
}

export function cleanupAudio(): void {
	if (musicElement) {
		musicElement.pause();
		musicElement = null;
	}
	if (audioCtx) {
		audioCtx.close();
		audioCtx = null;
	}
	musicGainNode = null;
	sfxGainNode = null;
}
