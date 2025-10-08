"use client";
import * as React from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DrugsListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const pageSize = 20;

  const { data, isLoading } = useSWR(`/api/drugs?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`, fetcher);

  const onSearch = (formData: FormData) => {
    const qVal = String(formData.get("q") || "");
    const sVal = String(formData.get("status") || "");
    const params = new URLSearchParams();
    if (qVal) params.set("q", qVal);
    if (sVal) params.set("status", sVal);
    params.set("page", "1");
    router.push(`/drugs?${params.toString()}`);
  };

  const onPageChange = (newPage: number) => {
    const params = new URLSearchParams();
    searchParams.forEach((value: string, key: string) => params.append(key, value));
    params.set("page", String(newPage));
    router.push(`/drugs?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Drugs Inventory</h1>
        <Link href="/drugs/add">
          <Button>Add Drug</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <form action={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input name="q" defaultValue={q} placeholder="Search by name, code, manufacturer..." />
            <select name="status" defaultValue={status} className="border rounded px-3 py-2 bg-background">
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <div>
              <Button type="submit" className="w-full">Filter</Button>
            </div>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Expiry</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items || []).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.drugCode}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.category}</TableCell>
                      <TableCell>{d.currentStock}</TableCell>
                      <TableCell>{d.reorderLevel}</TableCell>
                      <TableCell className="capitalize">{d.status.replaceAll("_"," ")}</TableCell>
                      <TableCell>{d.nextExpiryDate ? new Date(d.nextExpiryDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Link href={`/drugs/${d.id}`} className="text-primary">View</Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={data?.page || 1}
                totalPages={data?.totalPages || 1}
                totalCount={data?.total || 0}
                hasNext={(data?.page || 1) < (data?.totalPages || 1)}
                hasPrev={(data?.page || 1) > 1}
                onPageChange={onPageChange}
                limit={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

