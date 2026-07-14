import { zodResolver } from '@hookform/resolvers/zod';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useEffect } from 'react';

import { useForm } from 'react-hook-form';

import { createCsrActivityFormSchema, parseFlexibleDateTime, toDatetimeLocalValue, type CreateCsrActivityFormInput } from '@ecosphere/shared';

import { CalendarDays, Clock3, HeartHandshake, Users } from 'lucide-react';

import { useOrgContext } from '@/hooks/useAuth';

import { ApiError, apiClient } from '@/lib/api-client';

import { queryKeys } from '@/lib/query-keys';

import { Button, Card, EmptyState, Input, MetricCard, PageHeader, StatusBadge, Textarea } from '@/components/ui';



interface CsrActivity {

  id: string;

  title: string;

  description: string;

  hoursContributed: string;

  status: string;

  activityDate: string;

  beneficiariesCount?: number | null;

  submittedByFirstName: string;

  submittedByLastName: string;

  departmentName: string;

}



interface Department {

  id: string;

  name: string;

  code: string;

}



export function CsrPage() {

  const { orgId } = useOrgContext();

  const queryClient = useQueryClient();



  const departmentsQuery = useQuery({

    queryKey: queryKeys.departments(orgId!),

    queryFn: () => apiClient<Department[]>(`/orgs/${orgId}/departments`),

    enabled: Boolean(orgId),

  });



  const csrQuery = useQuery({

    queryKey: queryKeys.csr.list(orgId!),

    queryFn: () =>

      apiClient<{ data: CsrActivity[] }>(`/orgs/${orgId}/social/csr`, {

        params: { page: 1, limit: 20 },

      }),

    enabled: Boolean(orgId),

  });



  const form = useForm<CreateCsrActivityFormInput>({

    resolver: zodResolver(createCsrActivityFormSchema),

    defaultValues: {

      title: '',

      description: '',

      departmentId: '',

      activityDate: toDatetimeLocalValue(),

      hoursContributed: 2,

      beneficiariesCount: 25,

    },

  });



  const departments = departmentsQuery.data ?? [];

  const activities = csrQuery.data?.data ?? [];



  useEffect(() => {

    if (departments[0]?.id && !form.getValues('departmentId')) {

      form.setValue('departmentId', departments[0].id);

    }

  }, [departments, form]);



  const createMutation = useMutation({

    mutationFn: (values: CreateCsrActivityFormInput) =>

      apiClient(`/orgs/${orgId}/social/csr`, {
        method: 'POST',
        body: {
          ...values,
          activityDate: parseFlexibleDateTime(values.activityDate),
        },
      }),

    onSuccess: async () => {

      form.reset({

        title: '',

        description: '',

        departmentId: departments[0]?.id ?? '',

        activityDate: toDatetimeLocalValue(),

        hoursContributed: 2,

        beneficiariesCount: 25,

      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.csr.all(orgId!) });

    },

  });



  const totalHours = activities.reduce((sum, item) => sum + Number(item.hoursContributed), 0);

  const approvedCount = activities.filter((item) => item.status === 'approved').length;

  const pendingCount = activities.filter((item) => item.status === 'submitted').length;

  const totalBeneficiaries = activities.reduce(

    (sum, item) => sum + Number(item.beneficiariesCount ?? 0),

    0,

  );



  return (

    <div className="space-y-8">

      <PageHeader

        title="CSR Impact Hub"

        description="Track volunteer contributions, submit new community activities, and monitor approval progress across departments."

      />



      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="CSR summary metrics">

        <MetricCard

          label="Volunteer Hours"

          value={totalHours.toFixed(1)}

          hint="Total logged across all CSR submissions"

          icon={<Clock3 className="h-5 w-5 text-brand-300" aria-hidden />}

        />

        <MetricCard

          label="Approved Activities"

          value={approvedCount}

          hint="Verified and counted toward ESG score"

          icon={<HeartHandshake className="h-5 w-5 text-brand-300" aria-hidden />}

        />

        <MetricCard

          label="Pending Review"

          value={pendingCount}

          hint="Awaiting manager or ESG approval"

          icon={<CalendarDays className="h-5 w-5 text-accent-300" aria-hidden />}

          tone="gold"

        />

        <MetricCard

          label="People Impacted"

          value={totalBeneficiaries.toLocaleString()}

          hint="Reported beneficiaries from CSR programs"

          icon={<Users className="h-5 w-5 text-brand-300" aria-hidden />}

        />

      </section>



      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

        <Card>

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="eyebrow">Team Contributions</p>

              <h2 className="mt-2 text-lg font-semibold text-white">Recent CSR submissions</h2>

            </div>

            <span className="accent-pill">{activities.length} records</span>

          </div>



          <div className="mt-6 space-y-3">

            {activities.length ? (

              activities.map((activity) => (

                <article

                  key={activity.id}

                  className="rounded-2xl border border-brand-500/10 bg-surface-950/70 px-4 py-4 transition hover:border-brand-400/25"

                >

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div>

                      <h3 className="font-medium text-white">{activity.title}</h3>

                      <p className="mt-1 text-xs text-slate-500">

                        {activity.submittedByFirstName} {activity.submittedByLastName} ·{' '}

                        {activity.departmentName}

                      </p>

                    </div>

                    <StatusBadge status={activity.status} />

                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">

                    {activity.description}

                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">

                    <span>{activity.hoursContributed} hours</span>

                    <span>{new Date(activity.activityDate).toLocaleDateString()}</span>

                    {activity.beneficiariesCount ? (

                      <span>{activity.beneficiariesCount} beneficiaries</span>

                    ) : null}

                  </div>

                </article>

              ))

            ) : (

              <EmptyState

                title="No CSR submissions yet"

                description="Submit your first activity using the form on the right."

              />

            )}

          </div>

        </Card>



        <Card className="relative overflow-hidden">

          <div className="absolute inset-x-0 top-0 h-1 bg-accent-400/80" />

          <p className="eyebrow">Submit Activity</p>

          <h2 className="mt-2 text-lg font-semibold text-white">Log a new CSR initiative</h2>

          <p className="mt-2 text-sm text-slate-400">

            Approved activities earn XP, reward points, and improve your social ESG score.

          </p>



          {createMutation.isSuccess ? (

            <div

              role="status"

              className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200"

            >

              CSR activity submitted successfully and sent for approval.

            </div>

          ) : null}



          {createMutation.isError ? (

            <div

              role="alert"

              className="mt-4 rounded-xl border border-accent-500/20 bg-accent-500/10 px-4 py-3 text-sm text-accent-200"

            >

              {createMutation.error instanceof ApiError

                ? createMutation.error.message

                : 'Submission failed. Please check the form and try again.'}

            </div>

          ) : null}



          <form

            className="mt-6 space-y-4"

            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}

            noValidate

          >

            <div>

              <label className="label" htmlFor="title">

                Title

              </label>

              <Input id="title" placeholder="Community tree plantation drive" {...form.register('title')} />

              {form.formState.errors.title ? (

                <p className="mt-1 text-xs text-accent-300">{form.formState.errors.title.message}</p>

              ) : null}

            </div>



            <div>

              <label className="label" htmlFor="departmentId">

                Department

              </label>

              <select id="departmentId" className="input" {...form.register('departmentId')}>

                {departments.map((department) => (

                  <option key={department.id} value={department.id}>

                    {department.name}

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label className="label" htmlFor="description">

                Description

              </label>

              <Textarea

                id="description"

                placeholder="Describe the initiative, location, and community impact in detail."

                {...form.register('description')}

              />

              {form.formState.errors.description ? (

                <p className="mt-1 text-xs text-accent-300">

                  {form.formState.errors.description.message}

                </p>

              ) : null}

            </div>



            <div className="grid gap-4 md:grid-cols-2">

              <div>

                <label className="label" htmlFor="hoursContributed">

                  Hours contributed

                </label>

                <Input

                  id="hoursContributed"

                  type="number"

                  step="0.5"

                  {...form.register('hoursContributed', { valueAsNumber: true })}

                />

              </div>

              <div>

                <label className="label" htmlFor="beneficiariesCount">

                  Beneficiaries

                </label>

                <Input

                  id="beneficiariesCount"

                  type="number"

                  {...form.register('beneficiariesCount', { valueAsNumber: true })}

                />

              </div>

            </div>



            <div>

              <label className="label" htmlFor="activityDate">

                Activity date

              </label>

              <Input id="activityDate" type="datetime-local" {...form.register('activityDate')} />

              {form.formState.errors.activityDate ? (

                <p className="mt-1 text-xs text-accent-300">

                  {form.formState.errors.activityDate.message}

                </p>

              ) : null}

            </div>



            <Button type="submit" className="w-full" disabled={createMutation.isPending}>

              {createMutation.isPending ? 'Submitting...' : 'Submit for approval'}

            </Button>

          </form>

        </Card>

      </div>

    </div>

  );

}


