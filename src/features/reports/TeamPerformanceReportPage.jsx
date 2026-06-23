import { useMemo, useState } from 'react';
import { format, startOfMonth, subDays, subMonths, startOfYear } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, CalendarCheck, UsersRound } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/features/branches/useBranches';
import { useTeamPerformanceReport } from './useReports';

const PERIOD_PRESETS = {
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  '6m': { label: 'Last 6 months', getRange: () => ({ startDate: subMonths(new Date(), 6), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
};

const fmt = (n) => `GH¢ ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const COLUMNS = [
  { key: 'name', header: 'Team' },
  { key: 'branchName', header: 'Branch' },
  { key: 'memberCount', header: 'Members', className: 'text-right' },
  { key: 'bookingsCount', header: 'Bookings', className: 'text-right' },
  { key: 'servicesAssigned', header: 'Services assigned', className: 'text-right' },
  { key: 'assignmentsCompleted', header: 'Completed', className: 'text-right' },
  { key: 'revenue', header: 'Revenue', className: 'text-right', render: (row) => fmt(row.revenue) },
  {
    key: 'avgSatisfaction',
    header: 'Avg. satisfaction',
    className: 'text-right',
    render: (row) => (row.avgSatisfaction == null ? '—' : `${row.avgSatisfaction.toFixed(1)} / 5`),
  },
  {
    key: 'avgDurationMinutes',
    header: 'Avg. duration',
    className: 'text-right',
    render: (row) => (row.avgDurationMinutes == null ? '—' : `${row.avgDurationMinutes} min`),
  },
];

export default function TeamPerformanceReportPage() {
  const [period, setPeriod] = useState('thisMonth');
  const [branchId, setBranchId] = useState('');

  const range = useMemo(() => PERIOD_PRESETS[period].getRange(), [period]);

  const params = useMemo(
    () => ({
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd'),
      ...(branchId ? { branchId } : {}),
    }),
    [range, branchId]
  );

  const { data, isLoading } = useTeamPerformanceReport(params);
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const summary = data?.summary ?? {};
  const teams = data?.teams ?? [];

  const chartData = useMemo(
    () =>
      teams
        .filter((t) => Number(t.revenue) > 0)
        .map((t) => ({ name: t.name, revenue: Number(t.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    [teams]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Performance Report"
        description="Bookings, revenue and completion rate for teams dispatched as a unit, over a date range."
      />

      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_PRESETS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersRound} label="Teams with activity" value={summary.totalTeams ?? 0} isLoading={isLoading} />
        <StatCard
          icon={CalendarCheck}
          label="Services assigned"
          value={summary.totalServicesAssigned ?? 0}
          isLoading={isLoading}
        />
        <StatCard icon={Banknote} label="Revenue from completed work" value={fmt(summary.totalRevenue)} isLoading={isLoading} />
      </div>

      {chartData.length > 0 && (
        <Card className="p-4">
          <CardTitle className="mb-4 text-sm font-medium">Revenue by team (top 10)</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => fmt(value)} />
              <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <DataTable
          columns={COLUMNS}
          data={teams}
          isLoading={isLoading}
          emptyMessage="No team activity for this period. Teams only show up here once they're assigned to a booking via the 'Assign team' shortcut."
        />
      </Card>
    </div>
  );
}
