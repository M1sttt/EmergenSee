export const formatUpdateError = (error: unknown): string => {
	if (typeof error === 'object' && error !== null && 'response' in error) {
		const errorRes = error as { response?: { data?: { message?: string } } };
		if (errorRes.response?.data?.message) {
			return errorRes.response.data.message;
		}
	}
	return '';
};
