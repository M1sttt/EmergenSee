import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui';

export interface ConfirmModalProps {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmModal = ({
	title = 'Are you sure?',
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
}: ConfirmModalProps) => {
	return (
		<div className="ui-modal-root" aria-labelledby="modal-title" role="dialog" aria-modal="true">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" aria-hidden="true" onClick={onCancel}></div>

				<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
					&#8203;
				</span>

				<div className="ui-modal-panel ui-modal-panel-md inline-block align-bottom sm:align-middle">
					<div className="ui-modal-header">
						<div className="sm:flex sm:items-start">
							<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
							</div>
							<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
									{title}
								</h3>
								<div className="mt-2">
									<p className="text-sm text-gray-500">{message}</p>
								</div>
							</div>
						</div>
					</div>
					<div className="ui-modal-footer">
						<Button type="button" variant="danger" className="w-full sm:ml-3 sm:w-auto" onClick={onConfirm}>
							{confirmText}
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
							onClick={onCancel}
						>
							{cancelText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
