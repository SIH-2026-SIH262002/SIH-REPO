import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './QueryStates';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  accessor: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string; // for screen readers -- describes what this table is
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

type SortDirection = 'asc' | 'desc';

/**
 * Generic sortable, paginated data table. Filtering/search happens in the
 * parent page (rows passed in already filtered) -- this component owns only
 * sort + pagination + presentation, matching the "tables are important, use
 * proper tables" requirement across every Admin oversight page.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  pageSize = 25,
  emptyTitle = 'No records found.',
  emptyDescription,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
  const clampedPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
    setPage(1);
  };

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-[var(--adm-raised)] border-b border-[var(--adm-border)]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const ariaSort = isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortable ? (ariaSort as any) : undefined}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--adm-ink)]"
                      >
                        {col.header}
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3 h-3" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--adm-border)]">
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-[var(--adm-primary-wash)] transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ textAlign: col.align || 'left' }}
                    className="px-4 py-3 align-middle text-[var(--adm-ink)]"
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={clampedPage}
        totalPages={totalPages}
        totalItems={sortedRows.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
