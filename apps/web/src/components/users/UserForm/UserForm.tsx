import React, { useMemo, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { User, UserRole } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { FiSave, FiX } from 'react-icons/fi';
import SelectDropdown from '@/components/SelectDropdown';
import { getEntityId } from '@/types/entities';
import {
  useUserFormCreateMutation,
  useUserFormDepartmentsQuery,
  useUserFormUpdateMutation,
} from 'hooks/data/useUserFormData';
import { Button, FieldError, Input, Label } from '@/components/ui';

import * as strings from './strings';
import * as utils from './utils';

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

function UserForm({ user, onClose }: UserFormProps) {
  const currentUser = useAuthStore(state => state.user);
  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;

  const {
    data: allDepartmentsResponse = [],
    isLoading,
    isError,
  } = useUserFormDepartmentsQuery();

  const managedDepartments = useMemo(() => {
    return utils.getManagedDepartments(allDepartmentsResponse, currentUser);
  }, [allDepartmentsResponse, currentUser]);

  const defaultValues = useMemo<Partial<utils.UserFormData>>(() => {
    if (user) {
      return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        departments: user.departments || [],
      };
    }
    return {
      role: isGlobalAdmin ? undefined : UserRole.MEMBER,
      departments: [],
    };
  }, [user, isGlobalAdmin]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<utils.UserFormData>({
    defaultValues,
  });

  const roleOptions = useMemo(
    () => Object.values(UserRole).map(role => ({ value: role, label: role })),
    [],
  );

  const departmentOptions = useMemo(
    () =>
      managedDepartments.map(dept => ({
        value: getEntityId(dept),
        label: dept.name,
      })),
    [managedDepartments],
  );

  const invalidateAndClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const createMutation = useUserFormCreateMutation(invalidateAndClose);

  const updateMutation = useUserFormUpdateMutation(invalidateAndClose);

  const onSubmit = useCallback(
    (data: utils.UserFormData) => {
      if (user) {
        const updateData = utils.prepareUpdateUserData(data, user, managedDepartments, isGlobalAdmin);
        updateMutation.mutate({ id: getEntityId(user), data: updateData });
      } else {
        const createData = utils.prepareCreateUserData(data, managedDepartments, isGlobalAdmin);
        createMutation.mutate(createData);
      }
    },
    [user, managedDepartments, isGlobalAdmin, createMutation, updateMutation],
  );

  return (
    <div className="ui-modal-root">
      <div className="ui-modal-center">
        <div className="ui-modal-backdrop" onClick={onClose} />
        <div className="ui-modal-panel ui-modal-panel-2xl z-10 p-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{user ? strings.titleEdit : strings.titleCreate}</h2>

          {isLoading ? (
            <p>{strings.loading}</p>
          ) : isError ? (
            <p className="ui-field-error">{strings.error}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="ui-form-spacing">
              <div className="ui-form-grid-2">
                <div>
                  <Label>{strings.firstName}</Label>
                  <Input
                    {...register('firstName', { required: strings.firstNameReq })}
                    type="text"
                  />
                  <FieldError>{errors.firstName?.message as string | undefined}</FieldError>
                </div>

                <div>
                  <Label>{strings.lastName}</Label>
                  <Input
                    {...register('lastName', { required: strings.lastNameReq })}
                    type="text"
                  />
                  <FieldError>{errors.lastName?.message as string | undefined}</FieldError>
                </div>
              </div>

              <div>
                <Label>{strings.email}</Label>
                <Input
                  {...register('email', { required: strings.emailReq })}
                  type="email"
                />
                <FieldError>{errors.email?.message as string | undefined}</FieldError>
              </div>

              {!user && (
                <div>
                  <Label>{strings.password}</Label>
                  <Input
                    {...register('password', { required: strings.passwordReq })}
                    type="password"
                  />
                  <FieldError>{errors.password?.message as string | undefined}</FieldError>
                </div>
              )}

              {isGlobalAdmin && (
                <div>
                  <Label>{strings.role}</Label>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: strings.roleReq }}
                    render={({ field }) => (
                      <SelectDropdown
                        {...field}
                        options={roleOptions}
                        placeholder={strings.selectRole}
                        error={errors.role?.message as string | undefined}
                      />
                    )}
                  />
                </div>
              )}

              <div className="ui-form-grid-1">
                <div>
                  <Label>{strings.phoneNumber}</Label>
                  <Input {...register('phoneNumber')} type="tel" />
                </div>

                <div>
                  <Label>{strings.departments}</Label>
                  <Controller
                    name="departments"
                    control={control}
                    render={({ field }) => (
                      <SelectDropdown
                        {...field}
                        isMulti
                        options={departmentOptions}
                        placeholder={strings.departments}
                        closeMenuOnSelect={false}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="ui-form-actions">
                <Button type="button" onClick={onClose} variant="secondary" size="md">
                  <FiX /> {strings.btnCancel}
                </Button>
                <Button type="submit" variant="primary" size="md">
                  <FiSave /> {user ? strings.btnUpdate : strings.btnCreate}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(UserForm);
