// components/balance-deposit-dialog.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, CreditCard, Banknote, Smartphone, Building } from "lucide-react"

interface BalanceDepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
  currentBalance: number
  warehouseId: string
  onDepositSuccess: () => void
}

export function BalanceDepositDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentBalance,
  warehouseId,
  onDepositSuccess,
}: BalanceDepositDialogProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const depositAmount = parseFloat(amount)
    if (!depositAmount || depositAmount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/customer/balance/${customerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: depositAmount,
          description: description || `Balance deposit - ${paymentMethod}`,
          paymentMethod,
          reference,
          warehouseId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add balance")
      }

      alert(`Balance added successfully! New balance: ${formatCurrency(data.newBalance)}`)
      
      // Reset form
      setAmount("")
      setDescription("")
      setReference("")
      setPaymentMethod("cash")
      
      onDepositSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding balance:", error)
      alert(error instanceof Error ? error.message : "Failed to add balance")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "bank_transfer":
        return <Building className="h-4 w-4" />
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Add Balance
          </DialogTitle>
          <DialogDescription>
            Add money to {customerName}'s account balance
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Balance:</span>
            <span className="font-semibold text-lg">{formatCurrency(currentBalance)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="mobile_money">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile Money
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Reference/Transaction ID</Label>
              <Input
                id="reference"
                placeholder="Enter transaction reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this deposit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {amount && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>New Balance Will Be:</span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(currentBalance + parseFloat(amount || "0"))}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Balance
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}