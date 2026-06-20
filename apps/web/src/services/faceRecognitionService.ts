import axios from 'axios';

export interface FaceRecognitionBoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface FaceRecognitionResult {
	identity: string | null;
	confidence: number;
	bounding_box: FaceRecognitionBoundingBox;
}

export interface FaceRecognizeResponse {
	faces_found: number;
	results: FaceRecognitionResult[];
}

export interface RegisteredFaceImage {
	image_b64: string;
	bounding_box: FaceRecognitionBoundingBox | null;
}

export interface FaceImagesResponse {
	identity: string;
	count: number;
	images: RegisteredFaceImage[];
}

export interface RegisterResponse {
	registered_as: string;
}

export interface BatchRegisterResponse {
	registered_as: string;
	frames_accepted: number;
	frames_rejected: number;
}

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000';

const faceApi = axios.create({ baseURL: FACE_API_URL });

export const faceRecognitionService = {
	recognize: async (blob: Blob): Promise<FaceRecognizeResponse> => {
		const formData = new FormData();
		formData.append('image', blob, 'capture.jpg');
		const response = await faceApi.post<FaceRecognizeResponse>('/api/v1/faces/recognize', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	getImages: async (identity: string): Promise<FaceImagesResponse> => {
		const response = await faceApi.get<FaceImagesResponse>(`/api/v1/faces/${encodeURIComponent(identity)}/images`);
		return response.data;
	},

	register: async (name: string, blob: Blob): Promise<RegisterResponse> => {
		const fd = new FormData();
		fd.append('image', blob, 'face.jpg');
		fd.append('name', name);
		const response = await faceApi.post<RegisterResponse>('/api/v1/faces/register', fd);
		return response.data;
	},
	deleteFace: async (identity: string): Promise<void> => {
		await faceApi.delete(`/api/v1/faces/${encodeURIComponent(identity)}`);
	},

	registerBatch: async (identity: string, frames: Blob[], chunkSize = 4): Promise<BatchRegisterResponse> => {
		let totalAccepted = 0;
		let totalRejected = 0;
		let lastRegisteredAs = identity;

		for (let i = 0; i < frames.length; i += chunkSize) {
			const chunk = frames.slice(i, i + chunkSize);
			const formData = new FormData();
			formData.append('name', identity);
			chunk.forEach((blob, j) => formData.append('images', blob, `frame_${i + j}.jpg`));
			const response = await faceApi.post<BatchRegisterResponse>('/api/v1/faces/register/batch', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			totalAccepted += response.data.frames_accepted;
			totalRejected += response.data.frames_rejected;
			lastRegisteredAs = response.data.registered_as;
		}

		return { registered_as: lastRegisteredAs, frames_accepted: totalAccepted, frames_rejected: totalRejected };
	},
};
