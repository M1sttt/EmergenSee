import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { User, UpdateUserDto, UserRole, CreateUserDto } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { FiSave, FiX } from 'react-icons/fi';
import {
  useUserFormCreateMutation,
  useUserFormDepartmentsQuery,
  useUserFormUpdateMutation,
} from 'hooks/data/useUserFormData';

import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

type UserFormData = CreateUserDto & UpdateUserDto;

function UserForm({ user, onClose }: UserFormProps) {
  const currentUser = useAuthStore(state => state.user);
  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;

  const {
    data: allDepartmentsResponse = [],
    isLoading,
    isError,
  } = useUserFormDepartmentsQuery();

  const managedDepartments = useMemo(() => {
    return utils.getManagedDepartments(
      Array.isArray(allDepartmentsResponse)
        ? allDepartmentsResponse
        : (allDepartmentsResponse as any).data || [],
      currentUser,
    );
  }, [allDepartmentsResponse, currentUser]);

  const defaultValues = useMemo(() => {
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
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: defaultValues as any,
  });

  const invalidateAndClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const createMutation = useUserFormCreateMutation(invalidateAndClose);

  const updateMutation = useUserFormUpdateMutation(invalidateAndClose);

  const onSubmit = useCallback(
    (data: UserFormData) => {
      const preparedData = utils.prepareUserData(data, user, managedDepartments, isGlobalAdmin);

      if (user) {
        const updateData: UpdateUserDto = { ...preparedData };
        delete (updateData as any).password;
        updateMutation.mutate({ id: user.id || (user as any)._id, data: updateData });
      } else {
        createMutation.mutate(preparedData as CreateUserDto);
      }
    },
    [user, managedDepartments, isGlobalAdmin, createMutation, updateMutation],
  );

  return (
    <div className={consts.overlayClass}>
      <div className={consts.modalClass}>
        <h2 className={consts.titleClass}>{user ? strings.titleEdit : strings.titleCreate}</h2>

        {isLoading ? (
          <p>{strings.loading}</p>
        ) : isError ? (
          <p className={consts.errorTextClass}>{strings.error}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={consts.spaceY4Class}>
            <div className={consts.grid2ColsClass}>
              <div>
                <label className={consts.labelClass}>{strings.firstName}</label>
                <input
                  {...register('firstName', { required: strings.firstNameReq })}
                  type="text"
                  className={consts.inputClass}
                />
                {errors.firstName && (
                  <p className={consts.errorTextClass}>{errors.firstName.message as string}</p>
                )}
              </div>

              <div>
                <label className={consts.labelClass}>{strings.lastName}</label>
                <input
                  {...register('lastName', { required: strings.lastNameReq })}
                  type="text"
                  className={consts.inputClass}
                />
                {errors.lastName && (
                  <p className={consts.errorTextClass}>{errors.lastName.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label className={consts.labelClass}>{strings.email}</label>
              <input
                {...register('email', { required: strings.emailReq })}
                type="email"
                className={consts.inputClass}
              />
              {errors.email && (
                <p className={consts.errorTextClass}>{errors.email.message as string}</p>
              )}
            </div>

            {!user && (
              <div>
                <label className={consts.labelClass}>{strings.password}</label>
                <input
                  {...register('password', { required: strings.passwordReq })}
                  type="password"
                  className={consts.inputClass}
                />
                {errors.password && (
                  <p className={consts.errorTextClass}>{errors.password.message as string}</p>
                )}
              </div>
            )}

            {isGlobalAdmin && (
              <div>
                <label className={consts.labelClass}>{strings.role}</label>
                <select
                  {...register('role', { required: strings.roleReq })}
                  className={consts.inputClass}
                >
                  <option value="">{strings.selectRole}</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className={consts.errorTextClass}>{errors.role.message as string}</p>
                )}
              </div>
            )}

            <div className={consts.grid1ColClass}>
              <div>
                <label className={consts.labelClass}>{strings.phoneNumber}</label>
                <input {...register('phoneNumber')} type="tel" className={consts.inputClass} />
              </div>

              <div>
                <label className={consts.labelClass}>{strings.departments}</label>
                <select multiple {...register('departments')} className={consts.selectDeptsClass}>
                  {managedDepartments.map(dept => (
                    <option key={dept.id || (dept as any)._id} value={dept.id || (dept as any)._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={consts.actionsWrapperClass}>
              <button type="button" onClick={onClose} className={consts.cancelButtonClass}>
                <FiX /> {strings.btnCancel}
              </button>
              <button type="submit" className={consts.submitButtonClass}>
                <FiSave /> {user ? strings.btnUpdate : strings.btnCreate}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default React.memo(UserForm);
