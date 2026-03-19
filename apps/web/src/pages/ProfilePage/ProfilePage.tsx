import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from 'store/authStore';
import { usersService } from 'services/usersService';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

type ProfileFormData = {
    firstName: string;
    lastName: string;
    password?: string;
};

const ProfilePage = () => {
    const user = useAuthStore(state => state.user);
    const updateUser = useAuthStore(state => state.updateUser);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ProfileFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            password: '',
        },
    });

    const onSubmit = useCallback(
        async (data: ProfileFormData) => {
            if (!user?.id) return;
            try {
                setError('');
                setSuccess('');
                setIsLoading(true);

                const updatePayload: Record<string, string> = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                };

                if (data.password) {
                    updatePayload.password = data.password;
                }

                const updatedUser = await usersService.update(user.id, updatePayload);
                updateUser(updatedUser);
                setSuccess(strings.successMessage);
                reset({ firstName: updatedUser.firstName, lastName: updatedUser.lastName, password: '' });
            } catch (err: unknown) {
                const errorMessage = utils.formatUpdateError(err);
                setError(errorMessage || strings.defaultErrorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [user, updateUser, reset],
    );

    const handleFormSubmit = handleSubmit(onSubmit);

    return (
        <div className={consts.containerClass}>
            <div className={consts.headerContainerClass}>
                <h1 className={consts.titleClass}>{strings.profileTitle}</h1>
                <p className={consts.descriptionClass}>{strings.profileDescription}</p>
            </div>

            <div className={consts.formContainerClass}>
                <form onSubmit={handleFormSubmit} className={consts.formClass}>
                    {error && <div className={consts.errorBoxClass}>{error}</div>}

                    {success && <div className={consts.successBoxClass}>{success}</div>}

                    <div className={consts.gridClass}>
                        <div>
                            <label className={consts.labelClass}>{strings.firstNameLabel}</label>
                            <input
                                type="text"
                                {...register('firstName', { required: strings.firstNameRequiredError })}
                                className={consts.inputClass}
                            />
                            {errors.firstName && <p className={consts.errorMessageClass}>{errors.firstName.message}</p>}
                        </div>

                        <div>
                            <label className={consts.labelClass}>{strings.lastNameLabel}</label>
                            <input
                                type="text"
                                {...register('lastName', { required: strings.lastNameRequiredError })}
                                className={consts.inputClass}
                            />
                            {errors.lastName && <p className={consts.errorMessageClass}>{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={consts.labelClass}>{strings.newPasswordLabel}</label>
                        <input
                            type="password"
                            {...register('password', {
                                minLength: { value: consts.passwordMinLength, message: strings.passwordMinLengthError },
                            })}
                            className={consts.inputClass}
                            placeholder={strings.passwordPlaceholder}
                        />
                        {errors.password && <p className={consts.errorMessageClass}>{errors.password.message}</p>}
                    </div>

                    <div className={consts.buttonContainerClass}>
                        <button type="submit" disabled={isLoading} className={consts.buttonClass}>
                            {isLoading ? strings.savingButtonText : strings.saveButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default React.memo(ProfilePage);
