'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface User {
  id: string
  userName: string
  email: string
  phoneNumber: string
  role: string
  warehouse: string
  lastLogin: string | null
}

interface UserTableProps {
  className?: string
}

export function UserTable({ className }: UserTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search
      })
      
      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'sales': return 'secondary'
      case 'purchase': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage system users and their permissions</CardDescription>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            Loading users...
          </div>
        ) : users.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.warehouse}</TableCell>
                    <TableCell>
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  )
}