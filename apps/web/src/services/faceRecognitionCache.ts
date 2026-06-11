import { faceRecognitionService, FaceRecognizeResponse } from './faceRecognitionService';

const SIGNATURE_SIZE = 16;
const SIMILARITY_THRESHOLD = 5;
const CACHE_TTL_MS = 30_000;
const MAX_ENTRIES = 8;

interface CacheEntry {
	signature: Uint8Array;
	response: FaceRecognizeResponse;
	expiresAt: number;
}

let entries: CacheEntry[] = [];

const sampleCanvas = document.createElement('canvas');
sampleCanvas.width = SIGNATURE_SIZE;
sampleCanvas.height = SIGNATURE_SIZE;

function computeSignature(source: HTMLCanvasElement): Uint8Array | null {
	const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;
	ctx.drawImage(source, 0, 0, SIGNATURE_SIZE, SIGNATURE_SIZE);
	const { data } = ctx.getImageData(0, 0, SIGNATURE_SIZE, SIGNATURE_SIZE);
	const signature = new Uint8Array(SIGNATURE_SIZE * SIGNATURE_SIZE);
	for (let i = 0; i < signature.length; i++) {
		const offset = i * 4;
		signature[i] = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
	}
	return signature;
}

function meanDifference(a: Uint8Array, b: Uint8Array): number {
	let total = 0;
	for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
	return total / a.length;
}

export async function recognizeWithCache(canvas: HTMLCanvasElement): Promise<FaceRecognizeResponse | null> {
	const now = Date.now();
	entries = entries.filter(e => e.expiresAt > now);

	const signature = computeSignature(canvas);
	if (signature) {
		const hit = entries.find(e => meanDifference(e.signature, signature) <= SIMILARITY_THRESHOLD);
		if (hit) return hit.response;
	}

	const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
	if (!blob) return null;

	const response = await faceRecognitionService.recognize(blob);
	if (signature) {
		entries.push({ signature, response, expiresAt: now + CACHE_TTL_MS });
		if (entries.length > MAX_ENTRIES) entries.shift();
	}
	return response;
}
