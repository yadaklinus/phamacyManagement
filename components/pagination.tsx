"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
  onPageChange: (page: number) => void
  loading?: boolean
  limit?: number
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrev,
  onPageChange,
  loading = false,
  limit = 50
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, totalCount)

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, currentPage - 2)
      const end = Math.min(totalPages, start + maxVisible - 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalCount} results
      </div>
      
      <div className="flex items-center space-x-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPrev || loading}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev || loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={loading}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
        
        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext || loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext || loading}
          className="hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        
        {/* Page size selector (optional) */}
        <div className="hidden md:flex items-center space-x-2 ml-4">
          <span className="text-sm text-muted-foreground">Page</span>
          <Select
            value={currentPage.toString()}
            onValueChange={(value) => onPageChange(parseInt(value))}
            disabled={loading}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <SelectItem key={page} value={page.toString()}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">of {totalPages}</span>
        </div>
      </div>
    </div>
  )
}