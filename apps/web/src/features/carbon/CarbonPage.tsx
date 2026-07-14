import { zodResolver } from '@hookform/resolvers/zod';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { useForm } from 'react-hook-form';

import {

  createCarbonTransactionSchema,

  createResourceConsumptionSchema,

  type CreateCarbonTransactionInput,

  type CreateResourceConsumptionInput,

} from '@ecosphere/shared';

import { useOrgContext } from '@/hooks/useAuth';

import { apiClient } from '@/lib/api-client';

import { queryKeys } from '@/lib/query-keys';

import { Button, Card, EmptyState, Input, PageHeader, StatusBadge, Textarea } from '@/components/ui';



interface EmissionFactor {

  id: string;

  name: string;

  category: string;

  scope: string;

  unit: string;

  factorValue: string;

}



interface CarbonTransaction {

  id: string;

  activityType: string;

  co2eKg: string;

  status: string;

  quantity: string;

  unit: string;

  scope: string;

}



interface ResourceEntry {

  id: string;

  resourceType: string;

  quantity: string;

  unit: string;

  documentHash: string;

  status: string;

}



interface Department {

  id: string;

  name: string;

}



const SCOPES = [

  { key: 'all', label: 'All scopes' },

  { key: 'scope_1', label: 'Scope 1 (Direct)' },

  { key: 'scope_2', label: 'Scope 2 (Electricity)' },

  { key: 'scope_3', label: 'Scope 3 (Supply Chain)' },

] as const;



export function CarbonPage() {

  const { orgId } = useOrgContext();

  const queryClient = useQueryClient();

  const [activeScope, setActiveScope] = useState<string>('all');

  const [activeTab, setActiveTab] = useState<'carbon' | 'resources'>('carbon');



  const factorsQuery = useQuery({

    queryKey: queryKeys.carbon.factors(orgId!, activeScope === 'all' ? undefined : activeScope),

    queryFn: () =>

      apiClient<EmissionFactor[]>(`/orgs/${orgId}/environmental/emission-factors`, {

        params: activeScope !== 'all' ? { scope: activeScope } : undefined,

      }),

    enabled: Boolean(orgId),

  });



  const departmentsQuery = useQuery({

    queryKey: queryKeys.departments(orgId!),

    queryFn: () => apiClient<Department[]>(`/orgs/${orgId}/departments`),

    enabled: Boolean(orgId),

  });



  const transactionsQuery = useQuery({

    queryKey: queryKeys.carbon.transactions(orgId!, activeScope),

    queryFn: () =>

      apiClient<{ data: CarbonTransaction[] }>(`/orgs/${orgId}/environmental/carbon-transactions`, {

        params: {

          page: 1,

          limit: 20,

          ...(activeScope !== 'all' ? { scope: activeScope } : {}),

        },

      }),

    enabled: Boolean(orgId),

  });



  const resourceQuery = useQuery({

    queryKey: queryKeys.carbon.resources(orgId!),

    queryFn: () =>

      apiClient<ResourceEntry[]>(`/orgs/${orgId}/environmental/resource-consumption`),

    enabled: Boolean(orgId),

  });



  const scopeTotalsQuery = useQuery({

    queryKey: queryKeys.carbon.scopeTotals(orgId!),

    queryFn: () =>

      apiClient<Array<{ scope: string; total: string }>>(

        `/orgs/${orgId}/environmental/scope-totals`,

      ),

    enabled: Boolean(orgId),

  });



  const form = useForm<CreateCarbonTransactionInput>({

    resolver: zodResolver(createCarbonTransactionSchema),

    defaultValues: {

      activityType: 'Electricity consumption',

      quantity: 100,

      unit: 'kWh',

      emissionFactorId: '',

      departmentId: '',

      activityDate: new Date().toISOString(),

      description: '',

    },

  });



  const resourceForm = useForm<CreateResourceConsumptionInput>({

    resolver: zodResolver(createResourceConsumptionSchema),

    defaultValues: {

      resourceType: 'energy',

      quantity: 1000,

      unit: 'kWh',

      departmentId: '',

      consumptionDate: new Date().toISOString(),

      documentHash: 'a'.repeat(64),

      description: '',

    },

  });



  const factors = factorsQuery.data ?? [];

  const departments = departmentsQuery.data ?? [];



  if (factors[0] && !form.getValues('emissionFactorId')) {

    form.setValue('emissionFactorId', factors[0].id);

    form.setValue('unit', factors[0].unit);

  }

  if (departments[0] && !form.getValues('departmentId')) {

    form.setValue('departmentId', departments[0].id);

    resourceForm.setValue('departmentId', departments[0].id);

  }



  const createMutation = useMutation({

    mutationFn: (values: CreateCarbonTransactionInput) =>

      apiClient(`/orgs/${orgId}/environmental/carbon-transactions`, {

        method: 'POST',

        body: values,

      }),

    onSuccess: async () => {

      await queryClient.invalidateQueries({ queryKey: queryKeys.carbon.all(orgId!) });

    },

  });



  const resourceMutation = useMutation({

    mutationFn: (values: CreateResourceConsumptionInput) =>

      apiClient(`/orgs/${orgId}/environmental/resource-consumption`, {

        method: 'POST',

        body: values,

      }),

    onSuccess: async () => {

      await queryClient.invalidateQueries({ queryKey: queryKeys.carbon.resources(orgId!) });

    },

  });



  const scopeTotals = scopeTotalsQuery.data ?? [];



  return (

    <div>

      <PageHeader

        title="Environmental — Carbon & Resources"

        description="Scope 1/2/3 carbon accounting with verifiable emission factors and energy/water ledger with document hash verification."

      />



      <div className="mb-6 grid gap-4 md:grid-cols-3">

        {(['scope_1', 'scope_2', 'scope_3'] as const).map((scope) => {

          const total = scopeTotals.find((row) => row.scope === scope)?.total ?? '0';

          const labels = {

            scope_1: 'Scope 1 — Direct',

            scope_2: 'Scope 2 — Electricity',

            scope_3: 'Scope 3 — Supply Chain',

          };

          return (

            <Card key={scope}>

              <p className="text-xs uppercase text-slate-400">{labels[scope]}</p>

              <p className="mt-1 text-2xl font-bold text-white">{Number(total).toFixed(1)} kg</p>

              <p className="text-xs text-slate-500">Approved CO2e</p>

            </Card>

          );

        })}

      </div>



      <div className="mb-4 flex flex-wrap gap-2">

        <button

          type="button"

          className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'carbon' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-400'}`}

          onClick={() => setActiveTab('carbon')}

        >

          Carbon transactions

        </button>

        <button

          type="button"

          className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'resources' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-400'}`}

          onClick={() => setActiveTab('resources')}

        >

          Energy / Water ledger

        </button>

      </div>



      {activeTab === 'carbon' ? (

        <>

          <div className="mb-4 flex flex-wrap gap-2">

            {SCOPES.map((scope) => (

              <button

                key={scope.key}

                type="button"

                className={`rounded-lg px-3 py-1.5 text-sm ${

                  activeScope === scope.key

                    ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30'

                    : 'text-slate-400 hover:text-white'

                }`}

                onClick={() => setActiveScope(scope.key)}

              >

                {scope.label}

              </button>

            ))}

          </div>



          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

            <Card>

              <h2 className="text-lg font-semibold text-white">Carbon transactions</h2>

              <div className="mt-4 space-y-3">

                {transactionsQuery.data?.data.length ? (

                  transactionsQuery.data.data.map((transaction) => (

                    <div

                      key={transaction.id}

                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"

                    >

                      <div className="flex items-center justify-between gap-3">

                        <h3 className="font-medium text-white">{transaction.activityType}</h3>

                        <StatusBadge status={transaction.status} />

                      </div>

                      <p className="mt-2 text-sm text-slate-400">

                        {transaction.scope.replace('_', ' ')} · {transaction.quantity}{' '}

                        {transaction.unit} · {transaction.co2eKg} kg CO2e

                      </p>

                    </div>

                  ))

                ) : (

                  <EmptyState

                    title="No carbon transactions yet"

                    description="Log your first activity to begin building your emissions ledger."

                  />

                )}

              </div>

            </Card>



            <Card>

              <h2 className="text-lg font-semibold text-white">Log carbon activity</h2>

              <form

                className="mt-4 space-y-4"

                onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}

              >

                <div>

                  <label className="label" htmlFor="activityType">Activity type</label>

                  <Input id="activityType" {...form.register('activityType')} />

                </div>

                <div>

                  <label className="label" htmlFor="departmentId">Department</label>

                  <select id="departmentId" className="input" {...form.register('departmentId')}>

                    {departments.map((department) => (

                      <option key={department.id} value={department.id}>

                        {department.name}

                      </option>

                    ))}

                  </select>

                </div>

                <div>

                  <label className="label" htmlFor="emissionFactorId">Emission factor</label>

                  <select

                    id="emissionFactorId"

                    className="input"

                    {...form.register('emissionFactorId')}

                    onChange={(event) => {

                      form.register('emissionFactorId').onChange(event);

                      const factor = factors.find((item) => item.id === event.target.value);

                      if (factor) {

                        form.setValue('unit', factor.unit);

                      }

                    }}

                  >

                    {factors.map((factor) => (

                      <option key={factor.id} value={factor.id}>

                        [{factor.scope}] {factor.name} ({factor.factorValue} kg / {factor.unit})

                      </option>

                    ))}

                  </select>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <label className="label" htmlFor="quantity">Quantity</label>

                    <Input

                      id="quantity"

                      type="number"

                      step="0.01"

                      {...form.register('quantity', { valueAsNumber: true })}

                    />

                  </div>

                  <div>

                    <label className="label" htmlFor="unit">Unit</label>

                    <Input id="unit" {...form.register('unit')} />

                  </div>

                </div>

                <div>

                  <label className="label" htmlFor="description">Description</label>

                  <Textarea id="description" {...form.register('description')} />

                </div>

                <Button type="submit" disabled={createMutation.isPending}>

                  {createMutation.isPending ? 'Submitting...' : 'Submit for approval'}

                </Button>

              </form>

            </Card>

          </div>

        </>

      ) : (

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

          <Card>

            <h2 className="text-lg font-semibold text-white">Resource consumption ledger</h2>

            <div className="mt-4 space-y-3">

              {resourceQuery.data?.length ? (

                resourceQuery.data.map((entry) => (

                  <div

                    key={entry.id}

                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"

                  >

                    <div className="flex items-center justify-between">

                      <h3 className="font-medium capitalize text-white">{entry.resourceType}</h3>

                      <StatusBadge status={entry.status} />

                    </div>

                    <p className="mt-2 text-sm text-slate-400">

                      {entry.quantity} {entry.unit}

                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-slate-500">

                      hash: {entry.documentHash}

                    </p>

                  </div>

                ))

              ) : (

                <EmptyState title="No resource entries" description="Log energy or water consumption with document verification." />

              )}

            </div>

          </Card>



          <Card>

            <h2 className="text-lg font-semibold text-white">Log resource consumption</h2>

            <form

              className="mt-4 space-y-4"

              onSubmit={resourceForm.handleSubmit((values) => resourceMutation.mutate(values))}

            >

              <div>

                <label className="label" htmlFor="resourceType">Resource type</label>

                <select id="resourceType" className="input" {...resourceForm.register('resourceType')}>

                  <option value="energy">Energy</option>

                  <option value="water">Water</option>

                </select>

              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="label" htmlFor="resQuantity">Quantity</label>

                  <Input

                    id="resQuantity"

                    type="number"

                    {...resourceForm.register('quantity', { valueAsNumber: true })}

                  />

                </div>

                <div>

                  <label className="label" htmlFor="resUnit">Unit</label>

                  <Input id="resUnit" {...resourceForm.register('unit')} />

                </div>

              </div>

              <div>

                <label className="label" htmlFor="documentHash">Document hash (SHA-256)</label>

                <Input id="documentHash" {...resourceForm.register('documentHash')} />

              </div>

              <Button type="submit" disabled={resourceMutation.isPending}>

                {resourceMutation.isPending ? 'Submitting...' : 'Submit for verification'}

              </Button>

            </form>

          </Card>

        </div>

      )}

    </div>

  );

}


