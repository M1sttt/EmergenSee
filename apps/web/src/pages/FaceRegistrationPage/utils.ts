import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { RegistrationPhase } from './consts';
import { POSE_STRAIGHT_MAX, POSE_TURN_MIN } from './consts';

export function isCapturingPhase(phase: RegistrationPhase): boolean {
	return phase === 'phase1' || phase === 'phase2' || phase === 'phase3';
}

export function getPhaseNumber(phase: RegistrationPhase): number | null {
	if (phase === 'phase1') return 1;
	if (phase === 'phase2') return 2;
	if (phase === 'phase3') return 3;
	return null;
}

/**
 * Returns a signed turn score from MediaPipe face landmarks (image coordinates).
 * Positive  → user turned their head physically LEFT  (nose closer to image-left jaw).
 * Negative  → user turned their head physically RIGHT (nose closer to image-right jaw).
 *
 * Landmark 234 = left jaw outline, 454 = right jaw outline, 4 = nose tip.
 * These are symmetric face-oval points that reliably span the full face width.
 */
export function estimateHeadTurn(landmarks: NormalizedLandmark[]): number {
	const nose = landmarks[4];
	const leftJaw = landmarks[234];
	const rightJaw = landmarks[454];
	const leftDist = Math.hypot(nose.x - leftJaw.x, nose.y - leftJaw.y);
	const rightDist = Math.hypot(nose.x - rightJaw.x, nose.y - rightJaw.y);
	return (rightDist - leftDist) / (rightDist + leftDist);
}

export function isPoseValidForPhase(turn: number, phase: RegistrationPhase): boolean {
	if (phase === 'phase1') return Math.abs(turn) < POSE_STRAIGHT_MAX;
	if (phase === 'phase2') return turn > POSE_TURN_MIN;
	if (phase === 'phase3') return turn < -POSE_TURN_MIN;
	return false;
}
