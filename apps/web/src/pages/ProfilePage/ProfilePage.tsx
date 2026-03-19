import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from 'store/authStore';
import { usersService } from 'services/usersService';
import { Button, FieldError, Input, Label } from '@/components/ui';
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
        <div className="ui-page">
            <div className="mb-8">
                <h1 className="ui-page-title mb-6">{strings.profileTitle}</h1>
                <p className="mt-1 text-sm text-gray-500">{strings.profileDescription}</p>
            </div>

            <div className="ui-card overflow-hidden">
                <form onSubmit={handleFormSubmit} className="ui-card-body space-y-6">
                    {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

                    {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <Label>{strings.firstNameLabel}</Label>
                            <Input
                                type="text"
                                {...register('firstName', { required: strings.firstNameRequiredError })}
                            />
                            {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
                        </div>

                        <div>
                            <Label>{strings.lastNameLabel}</Label>
                            <Input
                                type="text"
                                {...register('lastName', { required: strings.lastNameRequiredError })}
                            />
                            {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
                        </div>
                    </div>

                    <div>
                        <Label>{strings.newPasswordLabel}</Label>
                        <Input
                            type="password"
                            {...register('password', {
                                minLength: { value: consts.passwordMinLength, message: strings.passwordMinLengthError },
                            })}
                            placeholder={strings.passwordPlaceholder}
                        />
                        {errors.password && <FieldError>{errors.password.message}</FieldError>}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} variant="primary" size="md">
                            {isLoading ? strings.savingButtonText : strings.saveButtonText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default React.memo(ProfilePage);
