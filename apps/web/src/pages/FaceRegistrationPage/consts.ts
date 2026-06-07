export type RegistrationPhase =
	| 'loading'
	| 'phase1'
	| 'phase2'
	| 'phase3'
	| 'submitting'
	| 'success'
	| 'error';

export type FaceStatus = 'none' | 'detected' | 'capturing';

export const FRAMES_PER_PHASE = 4;
export const TOTAL_PHASES = 3;
export const TOTAL_FRAMES = FRAMES_PER_PHASE * TOTAL_PHASES;

export const DETECTION_INTERVAL_MS = 120;
export const MIN_FACE_CONFIDENCE = 0.65;
export const POSE_STRAIGHT_MAX = 0.12;
export const POSE_TURN_MIN = 0.18;
export const PHASE_COMPLETE_DELAY_MS = 350;

export const MEDIAPIPE_WASM_URL =
	'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
export const FACE_LANDMARKER_MODEL_URL =
	'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export const RING_RADIUS = 36;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
