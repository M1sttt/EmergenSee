import { SHELTER_CATEGORIES, SHELTER_CATEGORY_LABELS } from '@emergensee/shared';
import type { ShelterCategory } from '@emergensee/shared';

export const defaultCategory: ShelterCategory = 'missile';

export const categoryOptions = SHELTER_CATEGORIES.map(category => ({
	value: category,
	label: SHELTER_CATEGORY_LABELS[category],
}));
