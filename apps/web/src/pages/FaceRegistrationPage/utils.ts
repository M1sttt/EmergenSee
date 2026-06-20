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
 * Positive  → user turned their head physically LEFT  (nose closer to image-right jaw,
 *             since the camera image is not mirrored: the user's left side is image-right).
 * Negative  → user turned their head physically RIGHT.
 *
 * Landmark 234 = image-left jaw outline, 454 = image-right jaw outline, 4 = nose tip.
 * These are symmetric face-oval points that reliably span the full face width.
 */
export function estimateHeadTurn(landmarks: NormalizedLandmark[]): number {
	const nose = landmarks[4];
	const imageLeftJaw = landmarks[234];
	const imageRightJaw = landmarks[454];
	const distToImageLeft = Math.hypot(nose.x - imageLeftJaw.x, nose.y - imageLeftJaw.y);
	const distToImageRight = Math.hypot(nose.x - imageRightJaw.x, nose.y - imageRightJaw.y);
	return (distToImageLeft - distToImageRight) / (distToImageLeft + distToImageRight);
}

export function isPoseValidForPhase(turn: number, phase: RegistrationPhase): boolean {
	if (phase === 'phase1') return Math.abs(turn) < POSE_STRAIGHT_MAX;
	if (phase === 'phase2') return turn > POSE_TURN_MIN;
	if (phase === 'phase3') return turn < -POSE_TURN_MIN;
	return false;
}
