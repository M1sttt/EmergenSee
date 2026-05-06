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
};
