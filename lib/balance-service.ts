export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    balance: number;
    debt: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface BalanceTransaction {
    id: string;
    customerId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    reference?: string;
    createdAt: Date;
    createdBy: string;
  }
  
  export class BalanceService {
    // Add money to customer balance
    static async addBalance(customerId: string, amount: number, description: string, adminId: string): Promise<BalanceTransaction> {
      const transaction: BalanceTransaction = {
        id: `tx_${Date.now()}`,
        customerId,
        type: 'credit',
        amount,
        description,
        createdAt: new Date(),
        createdBy: adminId
      };
  
      await this.updateCustomerBalance(customerId, amount);
      await this.recordTransaction(transaction);
      
      return transaction;
    }
  
    // Deduct money from customer balance (for sales)
    static async deductBalance(customerId: string, amount: number, description: string, saleId: string): Promise<{ success: boolean, debtCreated: number, balanceUsed: number }> {
      const customer = await this.getCustomer(customerId);
      
      if (!customer) {
        throw new Error('Customer not found');
      }
  
      let balanceUsed = 0;
      let debtCreated = 0;
  
      if (customer.balance >= amount) {
        balanceUsed = amount;
        await this.updateCustomerBalance(customerId, -amount);
      } else {
        balanceUsed = customer.balance;
        debtCreated = amount - customer.balance;
        
        if (balanceUsed > 0) {
          await this.updateCustomerBalance(customerId, -balanceUsed);
        }
        
        await this.addDebt(customerId, debtCreated);
      }
  
      const transaction: BalanceTransaction = {
        id: `tx_${Date.now()}`,
        customerId,
        type: 'debit',
        amount: balanceUsed,
        description,
        reference: saleId,
        createdAt: new Date(),
        createdBy: 'system'
      };
  
      await this.recordTransaction(transaction);
  
      return { success: true, debtCreated, balanceUsed };
    }
  
    static async getCustomer(customerId: string): Promise<Customer | null> {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
      }
    }
  
    static async updateCustomerBalance(customerId: string, amount: number): Promise<void> {
      await fetch(`/api/customers/${customerId}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
    }
  
    static async addDebt(customerId: string, amount: number): Promise<void> {
      await fetch(`/api/customers/${customerId}/debt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
    }
  
    static async recordTransaction(transaction: BalanceTransaction): Promise<void> {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
    }
  
    static async getCustomerTransactions(customerId: string): Promise<BalanceTransaction[]> {
      try {
        const response = await fetch(`/api/customers/${customerId}/transactions`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    }
  }