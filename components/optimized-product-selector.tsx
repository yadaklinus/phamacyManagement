"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { ChevronsUpDown, Check, Loader2 } from "lucide-react"
import { useProductSearch } from "@/hooks/use-product-search"

interface Product {
  id: string;
  name: string;
  barcode: string;
  cost: number;
  wholeSalePrice: number;
  retailPrice: number;
  quantity: number;
  unit: string;
  taxRate: number;
  description?: string;
}

interface OptimizedProductSelectorProps {
  warehouseId: string;
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export function OptimizedProductSelector({
  warehouseId,
  selectedProductId,
  onProductSelect,
  open,
  onOpenChange,
  placeholder = "Select product..."
}: OptimizedProductSelectorProps) {
  const [searchValue, setSearchValue] = useState("")
  const { products, loading, search, loadMore, pagination } = useProductSearch({
    warehouseId,
    limit: 50
  })
  
  const commandListRef = useRef<HTMLDivElement>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Find selected product
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [selectedProductId, products])

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    search(value)
  }

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && pagination.hasNext && !loading) {
      loadMore()
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", text: "Out of Stock" }
    if (stock <= 5) return { color: "text-yellow-600", text: "Low Stock" }
    return { color: "text-green-600", text: "In Stock" }
  }

  const handleProductSelect = (productId: string) => {
    onProductSelect(productId)
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {selectedProduct ? selectedProduct.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search products..." 
            value={searchValue}
            onValueChange={handleSearchChange}
            className="h-9"
          />
          <CommandList 
            ref={commandListRef}
            onScroll={handleScroll}
            className="max-h-[300px] overflow-y-auto"
          >
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching products...
                </div>
              ) : (
                "No products found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => {
                const stockStatus = getStockStatus(product.quantity)
                return (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleProductSelect(product.id)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          W: {formatCurrency(product.wholeSalePrice)}
                        </span>
                        <span className="font-semibold">R: {formatCurrency(product.retailPrice)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                      <span>
                        {product.barcode} • {product.unit}
                      </span>
                      <span className={stockStatus.color}>{product.quantity} in stock</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedProductId === product.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                )
              })}
              {loading && products.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading more...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}