"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, EmptyState, inputClass } from "@/components/ui";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type FetchPageResult<T> = {
  rows: T[];
};

type DataTableProps<T> = {
  title: string;
  searchPlaceholder?: string;
  pageSize: number;
  columns: DataTableColumn<T>[];
  queryKey: string;
  emptyTitle: string;
  emptyDescription: string;
  createAction?: ReactNode;
  fetchPage: (input: { offset: number; limit: number; search: string }) => Promise<FetchPageResult<T>>;
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  title,
  searchPlaceholder = "Search...",
  pageSize,
  columns,
  queryKey,
  emptyTitle,
  emptyDescription,
  createAction,
  fetchPage,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const offset = page * pageSize;

  const tableQuery = useQuery({
    queryKey: [queryKey, offset, pageSize, search],
    queryFn: () => fetchPage({ offset, limit: pageSize, search }),
  });

  const rows = tableQuery.data?.rows ?? [];
  const hasPrevious = page > 0;
  const hasNext = rows.length === pageSize;

  const pageLabel = useMemo(() => {
    const start = rows.length === 0 ? 0 : offset + 1;
    const end = offset + rows.length;
    return `${start}-${end}`;
  }, [offset, rows.length]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setSearch(searchDraft.trim());
  }

  return (
    <section className="card">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          {createAction}
        </div>
        <form onSubmit={onSearch} className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${inputClass} max-w-md`}
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={searchPlaceholder}
          />
          <Button type="submit" variant="secondary">Search</Button>
          {search ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchDraft("");
                setSearch("");
                setPage(0);
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>
      </div>

      <div className="p-4">
        {tableQuery.isError ? (
          <EmptyState title="Could not load data" description="Check that the backend service is running and CORS allows this frontend." />
        ) : rows.length === 0 && !tableQuery.isLoading ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--accent-weak)] text-left">
                  {columns.map((column) => (
                    <th key={column.key} className={`px-3 py-2 font-semibold ${column.className ?? ""}`}>
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tableQuery.isLoading ? [] : rows).map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className={`border-b border-[var(--line)] bg-white last:border-0 hover:bg-[#faf7ef] ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    } : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "link" : undefined}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={`px-3 py-3 align-top ${column.className ?? ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {tableQuery.isLoading ? <p className="p-4 text-sm text-[var(--muted)]">Loading...</p> : null}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
          <span className="text-[var(--muted)]">Showing {pageLabel} · {pageSize} per page</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!hasPrevious || tableQuery.isFetching} onClick={() => setPage((value) => Math.max(0, value - 1))}>
              Previous
            </Button>
            <Button variant="secondary" disabled={!hasNext || tableQuery.isFetching} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
