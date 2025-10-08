"use client";
import useSWR from "swr";
import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Users, Stethoscope } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useSWR("/api/admin/dashboard", fetcher, { refreshInterval: 10000 });

  const metrics = data?.metrics ?? {};
  const alerts = data?.alerts ?? {};
  const charts = data?.charts ?? {};
  const recentActivities = data?.recentActivities ?? [];

  if (error) {
    return <div className="p-6 text-red-600">Failed to load dashboard.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="w-5 h-5" />} title="Students" value={metrics.totalStudents} isLoading={isLoading} />
        <MetricCard icon={<Stethoscope className="w-5 h-5" />} title="Physicians" value={metrics.activePhysicians} isLoading={isLoading} />
        <MetricCard icon={<Package className="w-5 h-5" />} title="Low Stock" value={metrics.lowStockCount} isLoading={isLoading} />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} title="Expiring (30d)" value={metrics.expiringDrugsCount} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div className="font-semibold">Recent Activities</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-11/12" />
                <Skeleton className="h-6 w-10/12" />
              </div>
            ) : (
              <ul className="divide-y">
                {recentActivities.map((a: any) => (
                  <li key={a.id} className="py-3">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold">Alerts</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-10/12" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Low Stock</div>
                  <ul className="space-y-2">
                    {(alerts.lowStock ?? []).map((l: any) => (
                      <li key={l.id} className="text-sm flex justify-between">
                        <span>{l.name}</span>
                        <span className="text-muted-foreground">{l.quantity}/{l.reorderLevel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Expiring Soon</div>
                  <ul className="space-y-2">
                    {(alerts.expiringDrugs ?? []).map((e: any) => (
                      <li key={e.id} className="text-sm flex justify-between">
                        <span>{e.name}</span>
                        <span className="text-muted-foreground">{new Date(e.expiryDate).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placeholders for charts if needed later */}
    </div>
  );
}

function MetricCard({ icon, title, value, isLoading }: { icon: React.ReactNode; title: string; value: number; isLoading: boolean }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm">{title}</span>
          </div>
          {isLoading ? <Skeleton className="h-6 w-10" /> : <div className="text-xl font-semibold">{Number(value || 0)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

