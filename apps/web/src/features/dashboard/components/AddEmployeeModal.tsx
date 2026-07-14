import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployeeSchema, type CreateEmployeeInput, ROLES } from '@ecosphere/shared';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Input } from '@/components/ui';

interface AddEmployeeModalProps {
  orgId: string;
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export function AddEmployeeModal({ orgId, departments, onClose }: AddEmployeeModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      departmentId: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateEmployeeInput) => apiClient(`/orgs/${orgId}/users`, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.directory(orgId) });
      onClose();
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      ...data,
      departmentId: data.departmentId === '' ? undefined : data.departmentId,
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-employee-title"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-employee-title" className="text-xl font-bold text-white">
          Add New Employee
        </h2>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <Input id="firstName" {...form.register('firstName')} />
              {form.formState.errors.firstName ? (
                <p className="field-error">{form.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <Input id="lastName" {...form.register('lastName')} />
              {form.formState.errors.lastName ? (
                <p className="field-error">{form.formState.errors.lastName.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">
              Work email
            </label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="field-error">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                className="input block w-full"
                {...form.register('role')}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              {form.formState.errors.role ? (
                <p className="field-error">{form.formState.errors.role.message}</p>
              ) : null}
            </div>

            <div>
              <label className="label" htmlFor="departmentId">
                Department (Optional)
              </label>
              <select
                id="departmentId"
                className="input block w-full"
                {...form.register('departmentId')}
              >
                <option value="">No Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.departmentId ? (
                <p className="field-error">{form.formState.errors.departmentId.message}</p>
              ) : null}
            </div>
          </div>

          {mutation.error ? (
            <p className="text-sm text-danger-400">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to add employee.'}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Add Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
