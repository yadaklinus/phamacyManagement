"use client"

import * as XLSX from 'xlsx';
import { useEffect, useState,useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Package, Search, Filter, Plus, MoreHorizontal, Edit, Trash2, Eye, Download, Upload, Trash, Activity, DollarSign } from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios";



export default function ListProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
   const [endpoint,setEndPoint] = useState("")
const [openModalId, setOpenModalId] = useState(null);
const [searchQuery, setSearchQuery] = useState("")
const [isSearching, setIsSearching] = useState(false)
    const {data:session} = useSession()

  const warehouseId = getWareHouseId()

  const {data:productsData,loading,error,refetch} = fetchWareHouseData("/api/product/list",{warehouseId})

  const filteredProducts = useMemo(() => {
    if (!productsData) return []
    
    const query = searchQuery.toLowerCase().trim()
    if (query.length === 0) {
      // Show only first 50 products when no search query
      return productsData.slice(0, 50)
    }
    
    if (query.length < 2) {
      // Don't search until at least 2 characters
      return []
    }
    
    // Filter products based on search query
    const filtered = productsData.filter((product:any) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query) 
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesStatus = statusFilter === "all" || product.status === statusFilter
  
      return matchesSearch && matchesCategory && matchesStatus
    })
    
    // Limit results to 100 for performance
    return filtered.slice(0, 100)
  }, [productsData, searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsSearching(true)
    
    // Clear searching state after a delay
    setTimeout(() => {
      setIsSearching(false)
    }, 300)
  }
  
  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])


  if(!productsData) return (
    <Loading/>
  )

  const handleOpen = (id:any) => {
    setOpenModalId(id);
    

  };

  const handleClose = () => {
    setOpenModalId(null);
  };


  const handleDelete = async (productId: string) => {
     console.log(productId)
  
     await axios.post("/api/product/delete",{productId})
     
  
     setOpenModalId(null);
     refetch()
    }
  
  

  // useEffect(()=>{
  //   async function main(){
  //     await axios.post("/api/product/list",{warehouseId}).then((data)=>{
  //       console.log(data.data)
  //     })
  //   }
  //   main()
  // },[warehouseId])

 

 
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "low_stock":
        return <Badge variant="secondary">Low Stock</Badge>
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600"
    if (stock <= 5) return "text-yellow-600"
    return "text-green-600"
  }
  function exportData(){
     // 1. Format the data
     const formattedData = productsData.map((product:any) => ({
      Name: product.name,
      Barcode: product.barcode,
      "Wholesale Price": product.wholeSalePrice,
      "Retail Price": product.retailPrice,
      Cost: product.cost,
      Quantity: product.quantity,
      "Tax Rate": product.taxRate,
      Unit: product.unit,
      Description: product.description,
      "Created At": product.createdAt,
      "Updated At": product.updatedAt,
      "Is Synced": product.sync ? "Yes" : "No",
      "Is Deleted": product.isDeleted ? "Yes" : "No"
    }));

    // 2. Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // 3. Trigger file download
    XLSX.writeFile(workbook, "products_export.xlsx");
  }


  const totalCost = productsData.reduce((sum:any, products:any) => sum + (products.cost * products.quantity), 0)
  const totalRetail = productsData.reduce((sum:any, products:any) => sum + (products.retailPrice * products.quantity), 0)
  const totalWholesale = productsData.reduce((sum:any, products:any) => sum + (products.wholeSalePrice * products.quantity), 0)

  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endpoint}/dashboard`}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endpoint}/products/list`}>Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>List Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>


        

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Products</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button asChild>
                <Link href={`${endpoint}/products/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>

            {/* <div className="grid gap-4 md:grid-cols-3">
                       <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total Cost Value</CardTitle>
                           <DollarSign className="h-4 w-4 text-muted-foreground" />
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
                           
                         </CardContent>
                       </Card>
                       <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total Retail Value</CardTitle>
                           <DollarSign className="h-4 w-4 text-muted-foreground" />
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold">{formatCurrency(totalRetail)}</div>
                           
                         </CardContent>
                       </Card>
                       <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total Retail WholeSale</CardTitle>
                           <DollarSign className="h-4 w-4 text-muted-foreground" />
                         </CardHeader>
                         <CardContent>
                           <div className="text-2xl font-bold">{formatCurrency(totalWholesale)}</div>
                           
                         </CardContent>
                       </Card>
                      
                     </div> */}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, code, or brand..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products List</CardTitle>
              <CardDescription>
                Showing {filteredProducts.length} of {productsData.length} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Wholesale Price</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    {/* <TableHead>Delete</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product:any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{formatCurrency(product.cost)}</TableCell>
                      <TableCell>{formatCurrency(product.wholeSalePrice)}</TableCell>
                      <TableCell>{formatCurrency(product.retailPrice.toFixed(2))}</TableCell>
                      <TableCell>{product.quantity}</TableCell>                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem asChild>
                              <Link href={`${endpoint}/products/${product.id}/stock-tracking`}>
                                <Activity className="mr-2 h-4 w-4" />
                                Stock Tracking
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/warehouse/${warehouseId}/admin/products/edit/${product.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                            
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      {/* <TableCell>
                      <Button className="bg-red-500" variant="ghost" size="sm" onClick={() => handleOpen(product.id)} >
                              <Trash className="h-4 w-4" />
                                <Modal
                                    isOpen={openModalId === product.id}
                                    onOpenChange={handleClose}
                                    backdrop="opaque"
                                    classNames={{
                                      backdrop: "bg-linear-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                                    }}
                                  >
                                    <ModalContent>
                                      {(onClose) => (
                                        <>
                                          <ModalHeader>{product.name}</ModalHeader>
                                          <ModalBody>
                                            <p>{product.name}</p>
                                          </ModalBody>
                                          <ModalFooter>
                                            <Button color="danger" onClick={onClose}>
                                              Close
                                            </Button>
                                            <Button color="primary" onClick={() => {handleDelete(product.id)}}>
                                              Delete
                                            </Button>
                                          </ModalFooter>
                                        </>
                                      )}
                                    </ModalContent>
                                  </Modal>
                          </Button>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
    </>
  )
}