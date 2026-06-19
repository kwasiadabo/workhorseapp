import { useMemo, useState } from 'react';
import { format, parseISO, startOfMonth, startOfYear, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownToLine, ArrowUpFromLine, Download, Printer, Scale, TrendingUp } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import FormattedDateInput from '@/components/shared/FormattedDateInput';
import { useBankAccounts } from './useBankAccounts';
import { useBankingReport } from './useBankingReport';

const PERIOD_PRESETS = {
  thisMonth: { label: 'This month', start: () => startOfMonth(new Date()), end: () => new Date() },
  '30d':     { label: 'Last 30 days', start: () => subDays(new Date(), 29), end: () => new Date() },
  '90d':     { label: 'Last 90 days', start: () => subDays(new Date(), 89), end: () => new Date() },
  thisYear:  { label: 'This year', start: () => startOfYear(new Date()), end: () => new Date() },
};

const toDateStr = (d) => format(d, 'yyyy-MM-dd');

const formatMoney = (amount) =>
  Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function exportCSV(data, period) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [];

  rows.push([cell('Bank Report'), cell(`Period: ${period}`)]);
  rows.push([]);
  rows.push([cell('Summary'), cell('Amount')]);
  rows.push([cell('Total Deposits'), cell(formatMoney(data.summary.totalDeposits))]);
  rows.push([cell('Total Withdrawals'), cell(formatMoney(data.summary.totalWithdrawals))]);
  rows.push([cell('Net Movement'), cell(formatMoney(data.summary.netMovement))]);
  rows.push([]);
  rows.push([cell('Account'), cell('Bank'), cell('Deposits'), cell('Withdrawals'), cell('Net'), cell('Current Balance')]);
  for (const acc of data.reconciliation) {
    rows.push([
      cell(acc.accountName),
      cell(acc.bankName ?? ''),
      cell(formatMoney(acc.periodDeposits)),
      cell(formatMoney(acc.periodWithdrawals)),
      cell(formatMoney(acc.periodDeposits - acc.periodWithdrawals)),
      cell(formatMoney(acc.currentBalance)),
    ]);
  }
  if (data.trend?.length > 0) {
    rows.push([]);
    rows.push([cell('Month'), cell('Deposits'), cell('Withdrawals'), cell('Net')]);
    for (const row of data.trend) {
      rows.push([cell(row.month), cell(formatMoney(row.deposits)), cell(formatMoney(row.withdrawals)), cell(formatMoney(row.deposits - row.withdrawals))]);
    }
  }

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bank-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReconciliation(data, period) {
  const fm = (v) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let running = 0;
  const accountsWithRunning = (data.reconciliation ?? []).map((acc) => {
    running += acc.currentBalance;
    return { ...acc, runningBalance: running };
  });

  const accountsHtml = accountsWithRunning.map((acc) => `
    <div class="account">
      <div class="account-header">
        <div>
          <div class="account-name">${acc.accountName}</div>
          <div class="account-sub">${[acc.bankName, acc.bankShortCode ? `(${acc.bankShortCode})` : '', acc.accountNumber].filter(Boolean).join(' · ')}</div>
          ${acc.currency ? `<div class="account-sub">${acc.currency}</div>` : ''}
        </div>
        <div class="balance-box">
          <div class="balance-label">Current Balance</div>
          <div class="balance-value${acc.currentBalance < 0 ? ' neg' : ''}">${fm(acc.currentBalance)}</div>
        </div>
      </div>
      <div class="account-grid">
        <div><div class="label">Opening Balance</div><div class="val">${fm(acc.openingBalance)}</div></div>
        <div><div class="label">Period Deposits</div><div class="val pos">+${fm(acc.periodDeposits)}</div></div>
        <div><div class="label">Period Withdrawals</div><div class="val neg">−${fm(acc.periodWithdrawals)}</div></div>
      </div>
    </div>
  `).join('');

  const summaryRows = accountsWithRunning.map((acc) => `
    <tr>
      <td>${acc.accountName}</td>
      <td>${acc.bankName ?? '—'}</td>
      <td class="num">${fm(acc.openingBalance)}</td>
      <td class="num pos">+${fm(acc.periodDeposits)}</td>
      <td class="num neg">−${fm(acc.periodWithdrawals)}</td>
      <td class="num bold ${acc.runningBalance < 0 ? 'neg' : ''}">${fm(acc.runningBalance)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html><html><head><title>Bank Reconciliation</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;font-size:12px;color:#111;padding:24px}
    h1{font-size:18px;font-weight:700;margin-bottom:4px}
    .period{color:#666;font-size:11px;margin-bottom:20px}
    .account{border:1px solid #d1d5db;border-radius:6px;padding:14px;margin-bottom:12px;page-break-inside:avoid}
    .account-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
    .account-name{font-weight:600;font-size:13px;margin-bottom:2px}
    .account-sub{color:#6b7280;font-size:11px}
    .balance-box{text-align:right}
    .balance-label{color:#6b7280;font-size:10px;margin-bottom:2px}
    .balance-value{font-size:20px;font-weight:700}
    .account-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;border-top:1px solid #e5e7eb;padding-top:12px}
    .label{color:#6b7280;font-size:10px;margin-bottom:2px}
    .val{font-weight:600;font-size:12px}
    .pos{color:#15803d}.neg{color:#dc2626}
    h2{font-size:14px;font-weight:700;margin:20px 0 8px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#f3f4f6;text-align:left;padding:6px 8px;font-weight:600;border-bottom:2px solid #d1d5db}
    td{padding:5px 8px;border-bottom:1px solid #e5e7eb}
    .num{text-align:right}
    .bold{font-weight:700}
    @media print{body{padding:12px}}
  </style></head><body>
    <h1>Bank Reconciliation Report</h1>
    <div class="period">Period: ${period}</div>
    ${accountsHtml}
    <h2>Summary</h2>
    <table>
      <thead><tr>
        <th>Account</th><th>Bank</th>
        <th class="num">Opening Balance</th>
        <th class="num">Deposits</th>
        <th class="num">Withdrawals</th>
        <th class="num">Running Balance</th>
      </tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}


function DepositsWithdrawalsTab({ data, isLoading, isError, period }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Failed to load report data.
      </div>
    );
  }

  const trendData = (data.trend ?? []).map((row) => {
    const [year, month] = row.month.split('-').map(Number);
    return { ...row, label: format(new Date(year, month - 1, 1), 'MMM yyyy') };
  });

  const accountRows = (data.reconciliation ?? []).map((acc) => ({
    ...acc,
    net: acc.periodDeposits - acc.periodWithdrawals,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportCSV(data, period)}>
          <Download className="mr-1.5 size-3.5" /> Export CSV
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total deposits"
          value={`+${formatMoney(data.summary.totalDeposits)}`}
          icon={ArrowDownToLine}
          colorClass="text-green-700 dark:text-green-400"
        />
        <StatCard
          label="Total withdrawals"
          value={`−${formatMoney(data.summary.totalWithdrawals)}`}
          icon={ArrowUpFromLine}
          colorClass="text-red-700 dark:text-red-400"
        />
        <StatCard
          label="Net movement"
          value={`${data.summary.netMovement >= 0 ? '+' : '−'}${formatMoney(Math.abs(data.summary.netMovement))}`}
          icon={TrendingUp}
          colorClass={data.summary.netMovement >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}
        />
      </div>

      {trendData.length > 0 && (
        <Card className="gap-3 p-5">
          <CardTitle>Deposits vs Withdrawals by month</CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [formatMoney(value), name === 'deposits' ? 'Deposits' : 'Withdrawals']}
                />
                <Bar dataKey="deposits" fill="var(--color-success, #16a34a)" radius={[4, 4, 0, 0]} name="deposits" />
                <Bar dataKey="withdrawals" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} name="withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="gap-3 p-5">
        <CardTitle>By account</CardTitle>
        <DataTable
          columns={[
            {
              key: 'account',
              header: 'Account',
              render: (row) => (
                <div>
                  <p className="font-medium">{row.accountName}</p>
                  <p className="text-xs text-muted-foreground">{row.bankName}{row.bankShortCode ? ` (${row.bankShortCode})` : ''}</p>
                </div>
              ),
            },
            {
              key: 'periodDeposits',
              header: 'Deposits',
              className: 'text-right tabular-nums text-green-700 dark:text-green-400',
              render: (row) => `+${formatMoney(row.periodDeposits)} (${row.depositCount})`,
            },
            {
              key: 'periodWithdrawals',
              header: 'Withdrawals',
              className: 'text-right tabular-nums text-red-700 dark:text-red-400',
              render: (row) => `−${formatMoney(row.periodWithdrawals)} (${row.withdrawalCount})`,
            },
            {
              key: 'net',
              header: 'Net',
              className: 'text-right tabular-nums font-medium',
              render: (row) => (
                <span className={row.net >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                  {row.net >= 0 ? '+' : '−'}{formatMoney(Math.abs(row.net))}
                </span>
              ),
            },
          ]}
          data={accountRows}
          emptyMessage="No transactions in this period."
        />
      </Card>
    </div>
  );
}

function ReconciliationTab({ data, isLoading, isError, period }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Failed to load report data.
      </div>
    );
  }

  const accounts = data.reconciliation ?? [];

  let running = 0;
  const accountsWithRunning = accounts.map((acc) => {
    running += acc.currentBalance;
    return { ...acc, runningBalance: running };
  });

  if (accounts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No bank accounts configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Current balance = Opening balance + all deposits − all withdrawals recorded up to the end of the selected period.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(data, period)}>
            <Download className="mr-1.5 size-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => printReconciliation(data, period)}>
            <Printer className="mr-1.5 size-3.5" /> Print
          </Button>
        </div>
      </div>
      {accounts.map((acc) => (
        <Card key={acc.bankAccountId} className="p-5 gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{acc.accountName}</p>
              <p className="text-sm text-muted-foreground">
                {acc.bankName}{acc.bankShortCode ? ` (${acc.bankShortCode})` : ''} · {acc.accountNumber}
              </p>
              {acc.currency && <p className="text-xs text-muted-foreground">{acc.currency}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Current balance</p>
              <p className={`text-2xl font-bold tabular-nums ${acc.currentBalance >= 0 ? '' : 'text-destructive'}`}>
                {formatMoney(acc.currentBalance)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-muted-foreground">Opening balance</p>
              <p className="font-medium tabular-nums">{formatMoney(acc.openingBalance)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period deposits</p>
              <p className="font-medium tabular-nums text-green-700 dark:text-green-400">+{formatMoney(acc.periodDeposits)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period withdrawals</p>
              <p className="font-medium tabular-nums text-red-700 dark:text-red-400">−{formatMoney(acc.periodWithdrawals)}</p>
            </div>
          </div>
        </Card>
      ))}

      <Card className="gap-3 p-5">
        <CardTitle>Summary</CardTitle>
        <DataTable
          columns={[
            { key: 'accountName', header: 'Account', render: (row) => row.accountName },
            { key: 'bank', header: 'Bank', render: (row) => row.bankName ?? '—' },
            {
              key: 'openingBalance',
              header: 'Opening balance',
              className: 'text-right tabular-nums',
              render: (row) => formatMoney(row.openingBalance),
            },
            {
              key: 'periodDeposits',
              header: 'Deposits',
              className: 'text-right tabular-nums text-green-700 dark:text-green-400',
              render: (row) => `+${formatMoney(row.periodDeposits)}`,
            },
            {
              key: 'periodWithdrawals',
              header: 'Withdrawals',
              className: 'text-right tabular-nums text-red-700 dark:text-red-400',
              render: (row) => `−${formatMoney(row.periodWithdrawals)}`,
            },
            {
              key: 'runningBalance',
              header: 'Running balance',
              className: 'text-right tabular-nums font-semibold',
              render: (row) => (
                <span className={row.runningBalance < 0 ? 'text-destructive' : 'text-brand'}>
                  {formatMoney(row.runningBalance)}
                </span>
              ),
            },
          ]}
          data={accountsWithRunning}
          emptyMessage="No accounts."
        />
      </Card>
    </div>
  );
}

export default function BankReportsPage() {
  const [accountFilter, setAccountFilter] = useState('all');
  const [startDate, setStartDate] = useState(() => toDateStr(PERIOD_PRESETS.thisMonth.start()));
  const [endDate, setEndDate] = useState(() => toDateStr(PERIOD_PRESETS.thisMonth.end()));

  const { data: accountsData } = useBankAccounts({ limit: 100 });
  const accounts = accountsData?.data ?? [];

  const applyPreset = (key) => {
    const preset = PERIOD_PRESETS[key];
    if (preset) {
      setStartDate(toDateStr(preset.start()));
      setEndDate(toDateStr(preset.end()));
    }
  };

  const params = useMemo(() => ({
    startDate,
    endDate,
    bankAccountId: accountFilter === 'all' ? undefined : accountFilter,
  }), [startDate, endDate, accountFilter]);

  const { data, isLoading, isError } = useBankingReport(params);

  const fmtDate = (d) => format(parseISO(d), 'dd-MMMM-yyyy');
  const periodLabel = startDate && endDate ? `${fmtDate(startDate)} – ${fmtDate(endDate)}` : 'Banking analytics for your business.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reports"
        description={periodLabel}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={accountFilter}
              onValueChange={setAccountFilter}
              items={[{ value: 'all', label: 'All accounts' }, ...accounts.map((a) => ({ value: a.id, label: a.accountName }))]}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.accountName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={applyPreset}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Quick range" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>{preset.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <FormattedDateInput
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-42"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <FormattedDateInput
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-42"
              />
            </div>
          </div>
        }
      />

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Deposits & Withdrawals</TabsTrigger>
          <TabsTrigger value="reconciliation">
            <Scale className="mr-1 size-3.5" />
            Reconciliation
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="pt-4">
          <DepositsWithdrawalsTab data={data} isLoading={isLoading} isError={isError} period={periodLabel} />
        </TabsContent>
        <TabsContent value="reconciliation" className="pt-4">
          <ReconciliationTab data={data} isLoading={isLoading} isError={isError} period={periodLabel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
