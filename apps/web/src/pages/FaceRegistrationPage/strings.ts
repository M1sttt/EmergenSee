export const pageTitle = 'Register Your Face';

export const loadingInstruction = 'Setting up face detection…';
export const phase1Instruction = 'Look straight at the camera';
export const phase2Instruction = 'Slowly turn your head to the left';
export const phase3Instruction = 'Slowly turn your head to the right';
export const submittingInstruction = 'Uploading face data…';
export const successTitle = 'Face Registered!';
export const successSubtitle = 'You can now be identified by EmergenSee cameras.';
export const errorTitle = 'Registration Failed';
export const defaultError = 'Something went wrong. Please try again.';
export const modelLoadError = 'Failed to load face detection models. Check your connection and try again.';
export const doneButton = 'Done';
export const retryButton = 'Try Again';
export const skipButton = 'Skip for now';
export const cameraErrorMessage = 'Could not access camera. Please allow camera permissions and reload.';

export const noFaceHint = 'No face detected — move into the light';
export const wrongPoseHint = 'Adjust your position…';
export const frameCounter = (n: number, total: number) => `${n} / ${total} frames`;

export const faceIdSectionTitle = 'Face Recognition';
export const faceIdSectionDescription =
	'Register your face so EmergenSee cameras can identify you during emergencies.';
export const registerFaceButton = 'Register Face';
