import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function EditSaleLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sales/list">Sales</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Sale</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Original Sale Info Skeleton */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Skeleton */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex justify-end gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
