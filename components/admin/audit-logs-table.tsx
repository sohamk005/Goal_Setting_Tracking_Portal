"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLog } from "@/types/admin";

function formatJson(value: Record<string, unknown> | null): string {
  if (!value) return "—";
  return JSON.stringify(value);
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface AuditLogsTableProps {
  logs: AuditLog[];
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle>Audit log</CardTitle>
        <CardDescription>
          Historical alterations from{" "}
          <code className="rounded bg-muted px-1 text-xs">public.audit_logs</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full min-w-0 overflow-x-auto pt-4">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No audit entries recorded yet.
          </p>
        ) : (
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead className="min-w-[140px]">Before</TableHead>
                <TableHead className="min-w-[140px]">After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatTimestamp(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.table_name}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate font-mono text-xs">
                    {log.record_id}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.changed_by ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                    {formatJson(log.old_values)}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate font-mono text-xs">
                    {formatJson(log.new_values)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
