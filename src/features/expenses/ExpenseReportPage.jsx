import { useMemo, useState } from 'react';
import { format, startOfMonth, startOfYear, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Banknote, Calculator, Hash } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/dateFormat';
import { useBranches } from '@/features/branches/useBranches';
import { useExpenseReport } from '@/features/reports/useReports';

const PERIOD_PRESETS = {
  '7d': { label: 'Last 7 days', getRange: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  '30d': { label: 'Last 30 days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  thisMonth: { label: 'This month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
  '90d': { label: 'Last 90 days', getRange: () => ({ startDate: subDays(new Date(), 89), endDate: new Date() }) },
  thisYear: { label: 'This year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
};

const DEFAULT_PERIOD = '30d';

const CATEGORY_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-brand)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-destructive)',
  'var(--color-chart-4)',
];

const formatMoney = (amount) => `GH¢ ${Number(amount ?? 0).toFixed(2)}`;


function ChartCard({ title, isEmpty, emptyMessage, children }) {
  return (
    <Card className="gap-3 p-5">
      <CardTitle>{title}</CardTitle>
      <div className="h-64">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default function ExpenseReportPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [branchFilter, setBranchFilter] = useState('all');

  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data ?? [];

  const params = useMemo(() => {
    const { startDate, endDate } = PERIOD_PRESETS[period].getRange();
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      branchId: branchFilter === 'all' ? undefined : branchFilter,
    };
  }, [period, branchFilter]);

  const { data, isLoading } = useExpenseReport(params);

  const expenseTrendData = (data?.expenseTrend ?? []).map((row) => {
    const [year, month] = row.month.split('-').map(Number);
    return { ...row, label: format(new Date(year, month - 1, 1), 'MMM yyyy') };
  });
  const hasTrend = expenseTrendData.some((row) => row.count > 0);

  const expensesByCategory = data?.expensesByCategory ?? [];
  const expensesByBranch = data?.expensesByBranch ?? [];

  const periodLabel = data
    ? `${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}`
    : 'Expense analytics for your business.';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expense Report"
        description={periodLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Branch">
                  {(value) => (value === 'all' ? 'All branches' : (branches.find((b) => b.id === value)?.name ?? 'Branch'))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Period">{(value) => PERIOD_PRESETS[value]?.label ?? 'Period'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_PRESETS).map(([value, preset]) => (
                  <SelectItem key={value} value={value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total expenses"
              value={formatMoney(data.summary.totalExpenses)}
              icon={Banknote}
            />
            <StatCard
              label="Number of expenses"
              value={data.summary.expenseCount}
              icon={Hash}
            />
            <StatCard
              label="Average expense"
              value={formatMoney(data.summary.avgExpense)}
              icon={Calculator}
              sub="per transaction"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Expense trend (last 6 months)" isEmpty={!hasTrend} emptyMessage="No expenses recorded yet.">
              <BarChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value, _name, item) => [`${formatMoney(value)} (${item.payload.count})`, 'Expenses']} />
                <Bar dataKey="total" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Expenses by category" isEmpty={expensesByCategory.length === 0} emptyMessage="No expenses in this period.">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  dataKey="total"
                  nameKey="categoryName"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={entry.categoryName} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatMoney(value), name]} />
              </PieChart>
            </ChartCard>
          </div>

          <ChartCard title="Top categories by spend" isEmpty={expensesByCategory.length === 0} emptyMessage="No expenses in this period.">
            <BarChart data={expensesByCategory.slice(0, 10)} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="categoryName" tick={{ fontSize: 12 }} width={130} />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="total" fill="var(--color-destructive)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartCard>

          {expensesByBranch.length > 0 && (
            <ChartCard title="Expenses by branch" isEmpty={false} emptyMessage="">
              <BarChart data={expensesByBranch}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="total" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          )}

          <Card className="gap-3 p-5">
            <CardTitle>Category breakdown</CardTitle>
            <DataTable
              columns={[
                { key: 'categoryName', header: 'Category' },
                { key: 'count', header: 'Transactions', className: 'text-right' },
                {
                  key: 'total',
                  header: 'Total',
                  className: 'text-right',
                  render: (row) => formatMoney(row.total),
                },
                {
                  key: 'avg',
                  header: 'Avg. per transaction',
                  className: 'text-right',
                  render: (row) => formatMoney(row.count > 0 ? row.total / row.count : 0),
                },
              ]}
              data={expensesByCategory}
              emptyMessage="No expenses in this period."
            />
          </Card>
        </>
      )}
    </div>
  );
}
