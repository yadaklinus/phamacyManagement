'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BalanceService } from '@/lib/balance-service';
import { toast } from 'react-hot-toast';

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onBalanceAdded: () => void;
}

export function AddBalanceModal({ 
  isOpen, 
  onClose, 
  customerId, 
  customerName, 
  onBalanceAdded 
}: AddBalanceModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddBalance = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await BalanceService.addBalance(
        customerId,
        parseFloat(amount),
        description || 'Balance added by admin',
        'current-admin-id' // Replace with actual admin ID
      );

      toast.success(`Successfully added $${amount} to ${customerName}'s account`);
      setAmount('');
      setDescription('');
      onBalanceAdded();
      onClose();
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Failed to add balance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Balance</DialogTitle>
          <DialogDescription>
            Add money to {customerName}&apos;s account balance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional description..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddBalance} 
            disabled={isLoading || !amount}
          >
            {isLoading ? 'Adding...' : 'Add Balance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}