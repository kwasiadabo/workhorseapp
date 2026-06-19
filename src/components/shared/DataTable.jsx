import { AlertCircle } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_ROWS = 5;

export default function DataTable({
  columns,
  data,
  isLoading,
  isError,
  errorMessage = 'Something went wrong. Please try again.',
  emptyMessage = 'No records found.',
  onRowClick,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-transparent">
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  <Skeleton className="h-4 w-full max-w-32" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : isError ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="size-5" />
                <span>{errorMessage}</span>
              </div>
            </TableCell>
          </TableRow>
        ) : data?.length ? (
          data.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
