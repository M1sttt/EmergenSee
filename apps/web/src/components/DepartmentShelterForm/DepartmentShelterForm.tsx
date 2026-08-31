import React, { memo, useCallback, useMemo, useState } from 'react';
import { Department } from '@emergensee/shared';
import type { ShelterCategory, ShelterPolygon } from '@emergensee/shared';
import { FiMapPin, FiSave, FiX } from 'react-icons/fi';
import { Button, FieldError, Input, Label, Textarea } from '@/components/ui';
import SelectDropdown from '@/components/SelectDropdown';
import { getEntityId } from '@/types/entities';
import { useCreateDepartmentShelterMutation } from 'hooks/data/useDepartmentSheltersData';
import * as strings from './strings';
import * as consts from './consts';

export interface DepartmentShelterFormProps {
	polygon: ShelterPolygon;
	departments: Department[];
	onSaved: () => void;
	onClose: () => void;
}

const DepartmentShelterForm: React.FC<DepartmentShelterFormProps> = ({
	polygon,
	departments,
	onSaved,
	onClose,
}) => {
	const [name, setName] = useState('');
	const [category, setCategory] = useState<ShelterCategory>(consts.defaultCategory);
	const [departmentId, setDepartmentId] = useState(() =>
		departments.length === 1 ? getEntityId(departments[0]) : '',
	);
	const [capacity, setCapacity] = useState('');
	const [description, setDescription] = useState('');
	const [error, setError] = useState('');

	const createMutation = useCreateDepartmentShelterMutation(onSaved);

	const departmentOptions = useMemo(
		() => departments.map(department => ({ value: getEntityId(department), label: department.name })),
		[departments],
	);

	const handleSubmit = useCallback(() => {
		if (!name.trim()) {
			setError(strings.nameRequired);
			return;
		}
		if (!departmentId) {
			setError(strings.departmentRequired);
			return;
		}

		const parsedCapacity = Number.parseInt(capacity, 10);

		createMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
			category,
			capacity: Number.isFinite(parsedCapacity) && parsedCapacity >= 0 ? parsedCapacity : undefined,
			departmentId,
			polygon,
		});
	}, [name, departmentId, capacity, createMutation, description, category, polygon]);

	return (
		<div className="ui-modal-root" role="dialog" aria-modal="true">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" aria-hidden="true" onClick={onClose} />

				<div className="ui-modal-panel ui-modal-panel-md z-10 mx-4 w-full sm:mx-auto">
					<div className="flex items-start justify-between gap-3 bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 px-5 py-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
								<FiMapPin className="text-lg text-white" />
							</div>
							<div>
								<h3 className="text-base font-bold text-white">{strings.title}</h3>
								<p className="text-xs text-emerald-100">{strings.subtitle(polygon.length)}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
						>
							<FiX size={18} />
						</button>
					</div>

					<div className="ui-form-spacing bg-white px-5 py-4">
						{departments.length === 0 ? (
							<p className="text-sm text-gray-500">{strings.noDepartments}</p>
						) : (
							<>
								<div>
									<Label htmlFor="shelter-name">{strings.nameLabel}</Label>
									<Input
										id="shelter-name"
										value={name}
										onChange={changeEvent => setName(changeEvent.target.value)}
										placeholder={strings.namePlaceholder}
										autoFocus
									/>
								</div>

								<SelectDropdown
									label={strings.departmentLabel}
									value={departmentId}
									onChange={value => setDepartmentId(Array.isArray(value) ? '' : value)}
									options={departmentOptions}
									placeholder={strings.departmentPlaceholder}
									isClearable={false}
								/>

								<SelectDropdown
									label={strings.categoryLabel}
									value={category}
									onChange={value =>
										setCategory(Array.isArray(value) ? consts.defaultCategory : (value as ShelterCategory))
									}
									options={consts.categoryOptions}
									isSearchable={false}
									isClearable={false}
								/>

								<div>
									<Label htmlFor="shelter-capacity">{strings.capacityLabel}</Label>
									<Input
										id="shelter-capacity"
										type="number"
										min={0}
										value={capacity}
										onChange={changeEvent => setCapacity(changeEvent.target.value)}
										placeholder={strings.capacityPlaceholder}
									/>
								</div>

								<div>
									<Label htmlFor="shelter-description">{strings.descriptionLabel}</Label>
									<Textarea
										id="shelter-description"
										rows={2}
										value={description}
										onChange={changeEvent => setDescription(changeEvent.target.value)}
										placeholder={strings.descriptionPlaceholder}
									/>
								</div>

								{error && <FieldError>{error}</FieldError>}
							</>
						)}
					</div>

					<div className="ui-modal-footer">
						<Button
							onClick={handleSubmit}
							disabled={departments.length === 0 || createMutation.isPending}
							className="w-full sm:ml-3 sm:w-auto"
						>
							<FiSave size={14} />
							{createMutation.isPending ? strings.saving : strings.save}
						</Button>
						<Button
							variant="secondary"
							onClick={onClose}
							className="mt-3 w-full sm:mt-0 sm:w-auto"
						>
							{strings.cancel}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(DepartmentShelterForm);
