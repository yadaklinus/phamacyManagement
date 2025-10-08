"use client";
import * as React from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DrugDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, error } = useSWR(id ? `/api/drugs/${id}` : null, fetcher, { refreshInterval: 15000 });

  if (error) return <div className="p-6 text-red-600">Failed to load drug.</div>;

  const drug = data;
  const batches = drug?.batches || [];
  const movements = drug?.drugMovements || [];
  const records = drug?.drugRecords || [];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          {isLoading ? (
            <Skeleton className="h-7 w-64" />
          ) : (
            <div className="text-xl font-semibold">{drug?.name} <span className="text-muted-foreground font-normal">({drug?.drugCode})</span></div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </>
          ) : (
            <>
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div>{drug?.category}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Manufacturer</div>
                <div>{drug?.manufacturer || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unit</div>
                <div>{drug?.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Stock</div>
                <div>{drug?.currentStock}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reorder Level</div>
                <div>{drug?.reorderLevel}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Price (Unit)</div>
                <div>{drug?.currentUnitPrice}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="font-semibold">Batches</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Initial Qty</TableHead>
                    <TableHead>Current Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.batchNumber}</TableCell>
                      <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{b.initialQuantity}</TableCell>
                      <TableCell>{b.currentQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold">Recent Movements</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Stock After</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.movementNo}</TableCell>
                      <TableCell className="capitalize">{m.movementType.toLowerCase()}</TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.stockAfter}</TableCell>
                      <TableCell>{new Date(m.performedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="font-semibold">Administration Records</div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Physician</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.recordNo}</TableCell>
                    <TableCell>{r.student?.name || `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}</TableCell>
                    <TableCell>{r.physicianName || (r.physician ? `Dr. ${r.physician.firstName} ${r.physician.lastName}` : '-')}</TableCell>
                    <TableCell>{r.quantity} {r.unit}</TableCell>
                    <TableCell>{new Date(r.administeredAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

