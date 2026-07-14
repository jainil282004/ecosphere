import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@ecosphere/shared';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';

export function AccountSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => apiClient('/auth/profile', { method: 'PATCH', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) => apiClient('/auth/change-password', { method: 'POST', body: data }),
    onSuccess: () => {
      passwordForm.reset();
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Account Settings</h1>
        <p className="mt-1 text-slate-400">Manage your profile details and security settings.</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white">Personal Information</h2>
        <p className="mt-1 mb-6 text-sm text-slate-400">Update your name used across the platform.</p>
        <form
          className="space-y-4"
          onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <Input id="firstName" {...profileForm.register('firstName')} />
              {profileForm.formState.errors.firstName ? (
                <p className="field-error">{profileForm.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <Input id="lastName" {...profileForm.register('lastName')} />
              {profileForm.formState.errors.lastName ? (
                <p className="field-error">{profileForm.formState.errors.lastName.message}</p>
              ) : null}
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" loading={profileMutation.isPending}>
              Save Profile
            </Button>
            {profileMutation.isSuccess && (
              <span className="ml-4 text-sm text-brand-400">Profile updated successfully!</span>
            )}
            {profileMutation.isError && (
              <span className="ml-4 text-sm text-danger-400">Failed to update profile.</span>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white">Change Password</h2>
        <p className="mt-1 mb-6 text-sm text-slate-400">Ensure your account is using a long, random password to stay secure.</p>
        <form
          className="space-y-4"
          onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
        >
          <div>
            <label className="label" htmlFor="currentPassword">
              Current password
            </label>
            <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
            {passwordForm.formState.errors.currentPassword ? (
              <p className="field-error">{passwordForm.formState.errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="newPassword">
                New password
              </label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword ? (
                <p className="field-error">{passwordForm.formState.errors.newPassword.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="confirmNewPassword">
                Confirm new password
              </label>
              <Input id="confirmNewPassword" type="password" {...passwordForm.register('confirmNewPassword')} />
              {passwordForm.formState.errors.confirmNewPassword ? (
                <p className="field-error">{passwordForm.formState.errors.confirmNewPassword.message}</p>
              ) : null}
            </div>
          </div>

          {passwordMutation.isError ? (
            <p className="text-sm text-danger-400">
              {passwordMutation.error instanceof Error ? passwordMutation.error.message : 'Failed to change password.'}
            </p>
          ) : null}

          <div className="pt-2">
            <Button type="submit" loading={passwordMutation.isPending}>
              Update Password
            </Button>
            {passwordMutation.isSuccess && (
              <span className="ml-4 text-sm text-brand-400">Password changed successfully!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
