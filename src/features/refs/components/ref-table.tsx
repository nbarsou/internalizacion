import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ── Column definition ─────────────────────────────────────────────────────────

export interface RefColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

// ── Generic RefTable ──────────────────────────────────────────────────────────

interface RefTableProps<T extends { id: number }> {
  title: string;
  description?: string;
  rows: T[];
  columns: RefColumn<T>[];
}

export function RefTable<T extends { id: number }>({
  title,
  description,
  rows,
  columns,
}: RefTableProps<T>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-0.5">
                {description}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {rows.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Sin registros.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16 font-mono text-xs">ID</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {row.id}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(row)
                          : String(
                              (row as Record<string, unknown>)[col.key] ?? '—'
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
