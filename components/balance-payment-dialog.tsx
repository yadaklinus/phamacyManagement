// components/balance-payment-dialog.tsx (Updated to use account balance)
"use client"

import { useState, useEffect } from "react"
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
import { DollarSign, CreditCard, Banknote, Smartphone, Building, Wallet, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface BalancePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  saleId?: string
  invoiceNo?: string
  outstandingBalance?: number
  customerName: string
  warehousesId: string
  onPaymentSuccess: () => void
}

export function BalancePaymentDialog({
  open,
  onOpenChange,
  customerId,
  saleId,
  invoiceNo,
  outstandingBalance = 0,
  customerName,
  warehousesId,
  onPaymentSuccess,
}: BalancePaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Account balance payment states
  const [customerBalance, setCustomerBalance] = useState(0)
  const [useAccountBalance, setUseAccountBalance] = useState(false)
  const [accountBalanceAmount, setAccountBalanceAmount] = useState("")
  const [additionalPaymentMethod, setAdditionalPaymentMethod] = useState("cash")
  const [additionalAmount, setAdditionalAmount] = useState("")
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Fetch customer balance when dialog opens
  useEffect(() => {
    if (open && customerId) {
      fetchCustomerBalance()
      // Auto-fill description based on whether it's linked to a sale
      if (saleId && invoiceNo) {
        setDescription(`Balance payment for Invoice ${invoiceNo}`)
      } else {
        setDescription("General balance payment")
      }
    }
  }, [open, customerId, saleId, invoiceNo])

  const fetchCustomerBalance = async () => {
    setLoadingBalance(true)
    try {
      const response = await fetch(`/api/customer/balance/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomerBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching customer balance:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (useAccountBalance) {
      // Handle account balance payment
      return handleAccountBalancePayment()
    } else {
      // Handle traditional cash/card payment
      return handleTraditionalPayment()
    }
  }

  const handleAccountBalancePayment = async () => {
    const balanceAmountNum = parseFloat(accountBalanceAmount) || 0
    const additionalAmountNum = parseFloat(additionalAmount) || 0
    const totalPayment = balanceAmountNum + additionalAmountNum

    if (balanceAmountNum > customerBalance) {
      alert("Cannot use more than available account balance")
      return
    }

    if (totalPayment <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    if (totalPayment > outstandingBalance) {
      alert(`Payment cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}`)
      return
    }

    setIsSubmitting(true)

    try {
      // First, deduct from customer account balance if using it
      if (balanceAmountNum > 0) {
        const balanceResponse = await fetch(`/api/customer/balance/${customerId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: balanceAmountNum,
            description: description || `Balance payment for Invoice ${invoiceNo}`,
            saleId: invoiceNo,
            warehouseId: warehousesId,
          }),
        })

        if (!balanceResponse.ok) {
          const errorData = await balanceResponse.json()
          throw new Error(errorData.error || "Failed to deduct from account balance")
        }
      }

      // Then create the balance payment record
      const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      const paymentResponse = await fetch("/api/balance-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          saleId: saleId || null,
          amount: totalPayment,
          paymentMethod: balanceAmountNum > 0 ? "account_balance" : additionalPaymentMethod,
          receiptNo,
          notes: notes || `Paid ${formatCurrency(balanceAmountNum)} from account balance${additionalAmountNum > 0 ? ` + ${formatCurrency(additionalAmountNum)} via ${additionalPaymentMethod}` : ''}`,
          warehousesId,
        }),
      })

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Failed to create payment record")
      }

      alert(`Payment successful! ${formatCurrency(totalPayment)} paid towards outstanding balance.`)
      
      // Reset form
      resetForm()
      onPaymentSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert(error instanceof Error ? error.message : "Failed to process payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTraditionalPayment = async () => {
    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    if (paymentAmount > outstandingBalance) {
      alert(`Payment cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}`)
      return
    }

    setIsSubmitting(true)

    try {
      const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      const response = await fetch("/api/balance-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          saleId: saleId || null,
          amount: paymentAmount,
          paymentMethod,
          receiptNo,
          notes: notes || description,
          warehousesId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      alert(`Payment successful! ${formatCurrency(paymentAmount)} paid towards outstanding balance.`)
      
      // Reset form
      resetForm()
      onPaymentSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert(error instanceof Error ? error.message : "Failed to process payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setAmount("")
    setDescription("")
    setReference("")
    setNotes("")
    setPaymentMethod("cash")
    setUseAccountBalance(false)
    setAccountBalanceAmount("")
    setAdditionalAmount("")
    setAdditionalPaymentMethod("cash")
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
      case "account_balance":
        return <Wallet className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  // Calculate totals for account balance payment
  const balanceAmountNum = parseFloat(accountBalanceAmount) || 0
  const additionalAmountNum = parseFloat(additionalAmount) || 0
  const totalAccountPayment = balanceAmountNum + additionalAmountNum
  const remainingBalance = outstandingBalance - totalAccountPayment
  const availableBalance = customerBalance - balanceAmountNum

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Balance Payment
          </DialogTitle>
          <DialogDescription>
            Pay outstanding balance for {customerName}
          </DialogDescription>
        </DialogHeader>

        {/* Outstanding Balance Display */}
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-600">Outstanding Balance:</span>
            <span className="font-bold text-lg text-red-700">{formatCurrency(outstandingBalance)}</span>
          </div>
          {saleId && (
            <div className="text-xs text-red-600 mt-1">
              Invoice: {invoiceNo}
            </div>
          )}
        </div>

        {/* Customer Account Balance Display */}
        {loadingBalance ? (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Loading account balance...</div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600">Account Balance:</span>
              </div>
              <span className="font-bold text-lg text-blue-700">{formatCurrency(customerBalance)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAccountBalance"
                checked={useAccountBalance}
                onCheckedChange={(checked) => setUseAccountBalance(checked as boolean)}
              />
              <Label htmlFor="useAccountBalance" className="text-sm font-medium">
                Pay from account balance
              </Label>
            </div>

            {useAccountBalance ? (
              /* Account Balance Payment Form */
              <div className="space-y-4 p-4 border rounded-lg ">
                <div className="space-y-2">
                  <Label htmlFor="accountBalanceAmount">Amount from account balance</Label>
                  <Input
                    id="accountBalanceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={Math.min(customerBalance, outstandingBalance)}
                    placeholder="0.00"
                    value={accountBalanceAmount}
                    onChange={(e) => setAccountBalanceAmount(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAccountBalanceAmount(Math.min(customerBalance, outstandingBalance).toString())}
                    >
                      Use All Available ({formatCurrency(Math.min(customerBalance, outstandingBalance))})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAccountBalanceAmount(outstandingBalance.toString())}
                      disabled={customerBalance < outstandingBalance}
                    >
                      Pay Full Balance
                    </Button>
                  </div>
                </div>

                {/* Additional Payment if needed */}
                {balanceAmountNum > 0 && balanceAmountNum < outstandingBalance && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-sm font-medium">Additional payment needed: {formatCurrency(outstandingBalance - balanceAmountNum)}</Label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="additionalAmount">Amount</Label>
                        <Input
                          id="additionalAmount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={outstandingBalance - balanceAmountNum}
                          placeholder="0.00"
                          value={additionalAmount}
                          onChange={(e) => setAdditionalAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="additionalMethod">Method</Label>
                        <Select value={additionalPaymentMethod} onValueChange={setAdditionalPaymentMethod}>
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
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                {balanceAmountNum > 0 && (
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="text-sm font-medium">Payment Summary:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>From account balance:</span>
                        <span className="font-medium">{formatCurrency(balanceAmountNum)}</span>
                      </div>
                      {additionalAmountNum > 0 && (
                        <div className="flex justify-between">
                          <span>Additional payment:</span>
                          <span className="font-medium">{formatCurrency(additionalAmountNum)}</span>
                        </div>
                      )}
                      <div className="border-t pt-1 flex justify-between font-semibold">
                        <span>Total Payment:</span>
                        <span>{formatCurrency(totalAccountPayment)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Remaining balance after payment:</span>
                        <span>{formatCurrency(remainingBalance)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>Account balance after payment:</span>
                        <span>{formatCurrency(availableBalance)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Traditional Payment Form */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={outstandingBalance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(outstandingBalance.toString())}
                  >
                    Pay Full Balance ({formatCurrency(outstandingBalance)})
                  </Button>
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
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                (useAccountBalance ? totalAccountPayment <= 0 : (!amount || parseFloat(amount) <= 0))
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}