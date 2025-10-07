import { PrismaClient as prismaClient } from "@/prisma/generated/offline";
import { PrismaClient as OnlinePrismaClient } from "@/prisma/generated/online";

const offlineDb = new prismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
const onlineDb = new OnlinePrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

// Ensure connections
async function ensureConnections() {
  try {
    await Promise.all([
      offlineDb.$connect(),
      onlineDb.$connect()
    ]);
    console.log("Sync service: Both database clients connected");
  } catch (error) {
    console.error("Sync service: Failed to connect database clients:", error);
    throw new Error("Database connection failed in sync service");
  }
}

// Initialize connections
ensureConnections().catch(console.error);

export interface SyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  totalSynced: number;
}

export class DataSyncService {
  private isOnline: boolean = false;
  private isSyncing: boolean = false;

  constructor(isOnline: boolean = false) {
    this.isOnline = isOnline;
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  async syncAllData(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedTables: [],
        errors: ["No internet connection"],
        totalSynced: 0
      };
    }

    if (this.isSyncing) {
      return {
        success: false,
        syncedTables: [],
        errors: ["Sync already in progress"],
        totalSynced: 0
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      totalSynced: 0
    };

    try {
      // Ensure database connections before starting
      await ensureConnections();
      
      // Test connections
      await Promise.all([
        offlineDb.$queryRaw`SELECT 1`,
        onlineDb.$queryRaw`SELECT 1`
      ]);

      // Sync in order of dependencies to avoid foreign key conflicts
      await this.syncWarehouses(result);
      await this.syncUsers(result);
      await this.syncCustomers(result);
      await this.syncSuppliers(result);
      await this.syncProducts(result);
      await this.syncSales(result);
      await this.syncSaleItems(result);
      await this.syncPurchases(result);
      await this.syncPurchaseItems(result);
      await this.syncPaymentMethods(result);
      await this.syncReceiptSettings(result);
      await this.syncSettings(result);
      await this.syncSuperAdmins(result);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Sync failed: ${errorMessage}`);
      console.error("Sync service error:", error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncWarehouses(result: SyncResult) {
    try {
      const unsyncedWarehouses = await onlineDb.warehouses_online.findMany();

      for (const warehouse of unsyncedWarehouses) {
        const { sync, syncedAt, ...warehouseData } = warehouse;
        
        await offlineDb.warehouses.upsert({
          where: { warehouseCode: warehouse.warehouseCode },
          update: {
            ...warehouseData,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...warehouseData,
            sync: true,
            syncedAt: new Date()
          }
        });

        

        result.totalSynced++;
      }

      if (unsyncedWarehouses.length > 0) {
        result.syncedTables.push(`Warehouses (${unsyncedWarehouses.length})`);
      }
    } catch (error) {
      result.errors.push(`Warehouses sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncUsers(result: SyncResult) {
    try {
      const unsyncedUsers = await onlineDb.users_online.findMany();

      for (const user of unsyncedUsers) {
        const { sync, syncedAt,warehouses_onlineId, ...userData } = user;
        
        await offlineDb.users.upsert({
          where: { userName: user.userName },
          update: {
            id:user.id,
            warehousesId: user.warehouses_onlineId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...userData,
            warehousesId: user.warehouses_onlineId,
            sync: true,
            syncedAt: new Date()
          }
        });

        result.totalSynced++;
      }

      if (unsyncedUsers.length > 0) {
        result.syncedTables.push(`Users (${unsyncedUsers.length})`);
      }
    } catch (error) {
      result.errors.push(`Users sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncCustomers(result: SyncResult) {
    try {
      const unsyncedCustomers = await offlineDb.customer.findMany({
        where: { sync: false }
      });

      for (const customer of unsyncedCustomers) {
        const { sync, syncedAt, warehousesId, ...customerData } = customer;
        
        await onlineDb.customer_online.upsert({
          where: { id: customer.id },
          update: {
            ...customerData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...customerData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.customer.update({
          where: { id: customer.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedCustomers.length > 0) {
        result.syncedTables.push(`Customers (${unsyncedCustomers.length})`);
      }
    } catch (error) {
      result.errors.push(`Customers sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSuppliers(result: SyncResult) {
    try {
      const unsyncedSuppliers = await offlineDb.supplier.findMany({
        where: { sync: false }
      });

      for (const supplier of unsyncedSuppliers) {
        const { sync, syncedAt, warehousesId, ...supplierData } = supplier;
        
        await onlineDb.supplier_online.upsert({
          where: { id: supplier.id },
          update: {
            ...supplierData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...supplierData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.supplier.update({
          where: { id: supplier.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSuppliers.length > 0) {
        result.syncedTables.push(`Suppliers (${unsyncedSuppliers.length})`);
      }
    } catch (error) {
      result.errors.push(`Suppliers sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncProducts(result: SyncResult) {
    try {
      const unsyncedProducts = await offlineDb.product.findMany({
        where: { sync: false }
      });

      for (const product of unsyncedProducts) {
        const { sync, syncedAt, warehousesId, ...productData } = product;
        
        await onlineDb.product_online.upsert({
          where: { id: product.id },
          update: {
            ...productData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...productData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.product.update({
          where: { id: product.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedProducts.length > 0) {
        result.syncedTables.push(`Products (${unsyncedProducts.length})`);
      }
    } catch (error) {
      result.errors.push(`Products sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSales(result: SyncResult) {
    try {
      const unsyncedSales = await offlineDb.sale.findMany({
        where: { sync: false }
      });

      for (const sale of unsyncedSales) {
        const { sync, syncedAt, warehousesId,taxRate, selectedCustomerId, ...saleData } = sale;
        
        await onlineDb.sale_online.upsert({
          where: { invoiceNo: sale.invoiceNo,taxRate },
          update: {
            ...saleData,
            warehouses_onlineId: warehousesId,
            customer_onlineId: selectedCustomerId,
            sync: true,
            taxRate,
            syncedAt: new Date()
          },
          create: {
            ...saleData,
            warehouses_onlineId: warehousesId,
            customer_onlineId: selectedCustomerId,
            taxRate,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.sale.update({
          where: { id: sale.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSales.length > 0) {
        result.syncedTables.push(`Sales (${unsyncedSales.length})`);
      }
    } catch (error) {
      result.errors.push(`Sales sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSaleItems(result: SyncResult) {
    try {
      const unsyncedSaleItems = await offlineDb.saleItem.findMany({
        where: { sync: false }
      });

      for (const saleItem of unsyncedSaleItems) {
        const { sync, syncedAt, warehousesId, productId, customerId, saleId, ...saleItemData } = saleItem;
        
        await onlineDb.saleItem_online.upsert({
          where: { id: saleItem.id },
          update: {
            ...saleItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            customer_onlineId: customerId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...saleItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            customer_onlineId: customerId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.saleItem.update({
          where: { id: saleItem.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSaleItems.length > 0) {
        result.syncedTables.push(`Sale Items (${unsyncedSaleItems.length})`);
      }
    } catch (error) {
      result.errors.push(`Sale Items sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPurchases(result: SyncResult) {
    try {
      const unsyncedPurchases = await offlineDb.purchase.findMany({
        where: { sync: false }
      });

      for (const purchase of unsyncedPurchases) {
        const { sync, syncedAt, warehousesId, supplierId, ...purchaseData } = purchase;
        
        await onlineDb.purchase_online.upsert({
          where: { referenceNo: purchase.referenceNo },
          update: {
            ...purchaseData,
            warehouses_onlineId: warehousesId,
            supplier_onlineId: supplierId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...purchaseData,
            warehouses_onlineId: warehousesId,
            supplier_onlineId: supplierId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.purchase.update({
          where: { id: purchase.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPurchases.length > 0) {
        result.syncedTables.push(`Purchases (${unsyncedPurchases.length})`);
      }
    } catch (error) {
      result.errors.push(`Purchases sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPurchaseItems(result: SyncResult) {
    try {
      const unsyncedPurchaseItems = await offlineDb.purchaseItem.findMany({
        where: { sync: false }
      });

      for (const purchaseItem of unsyncedPurchaseItems) {
        const { sync, syncedAt, warehousesId, productId, purchaseId,productName, ...purchaseItemData } = purchaseItem;
        
        await onlineDb.purchaseItem_online.upsert({
          where: { id: purchaseItem.id },
          update: {
            ...purchaseItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            purchase_onlineId: purchaseId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...purchaseItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            purchase_onlineId: purchaseId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPurchaseItems.length > 0) {
        result.syncedTables.push(`Purchase Items (${unsyncedPurchaseItems.length})`);
      }
    } catch (error) {
      result.errors.push(`Purchase Items sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPaymentMethods(result: SyncResult) {
    try {
      const unsyncedPaymentMethods = await offlineDb.paymentMethod.findMany({
        where: { sync: false }
      });

      for (const paymentMethod of unsyncedPaymentMethods) {
        const { sync, syncedAt, warehousesId, saleId, ...paymentMethodData } = paymentMethod;
        
        await onlineDb.paymentMethod_online.upsert({
          where: { id: paymentMethod.id },
          update: {
            ...paymentMethodData,
            warehouses_onlineId: warehousesId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...paymentMethodData,
            warehouses_onlineId: warehousesId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPaymentMethods.length > 0) {
        result.syncedTables.push(`Payment Methods (${unsyncedPaymentMethods.length})`);
      }
    } catch (error) {
      result.errors.push(`Payment Methods sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncReceiptSettings(result: SyncResult) {
    try {
      const unsyncedReceiptSettings = await offlineDb.receiptSettings.findMany({
        where: { sync: false }
      });

      for (const receiptSetting of unsyncedReceiptSettings) {
        const { sync, syncedAt, warehousesId, ...receiptSettingData } = receiptSetting;
        
        await onlineDb.receiptSettings_online.upsert({
          where: { id: receiptSetting.id },
          update: {
            ...receiptSettingData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...receiptSettingData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.receiptSettings.update({
          where: { id: receiptSetting.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedReceiptSettings.length > 0) {
        result.syncedTables.push(`Receipt Settings (${unsyncedReceiptSettings.length})`);
      }
    } catch (error) {
      result.errors.push(`Receipt Settings sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSettings(result: SyncResult) {
    try {
      const unsyncedSettings = await offlineDb.settings.findMany({
        where: { sync: false }
      });

      for (const setting of unsyncedSettings) {
        const { sync, syncedAt, ...settingData } = setting;
        
        await onlineDb.settings_online.upsert({
          where: { setting_id: setting.setting_id },
          update: {
            ...settingData,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...settingData,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.settings.update({
          where: { setting_id: setting.setting_id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSettings.length > 0) {
        result.syncedTables.push(`Settings (${unsyncedSettings.length})`);
      }
    } catch (error) {
      result.errors.push(`Settings sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSuperAdmins(result: SyncResult) {
    try {
      const unsyncedSuperAdmins = await offlineDb.superAdmin.findMany({
        where: { sync: false }
      });

      for (const superAdmin of unsyncedSuperAdmins) {
        const { sync, syncedAt, ...superAdminData } = superAdmin;
        
        await onlineDb.superAdmin_online.upsert({
          where: { email: superAdmin.email },
          update: {
            ...superAdminData,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...superAdminData,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.superAdmin.update({
          where: { id: superAdmin.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSuperAdmins.length > 0) {
        result.syncedTables.push(`Super Admins (${unsyncedSuperAdmins.length})`);
      }
    } catch (error) {
      result.errors.push(`Super Admins sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSyncStatus() {
    try {
      const counts = await Promise.all([
        offlineDb.warehouses.count({ where: { sync: false } }),
        offlineDb.users.count({ where: { sync: false } }),
        offlineDb.customer.count({ where: { sync: false } }),
        offlineDb.supplier.count({ where: { sync: false } }),
        offlineDb.product.count({ where: { sync: false } }),
        offlineDb.sale.count({ where: { sync: false } }),
        offlineDb.saleItem.count({ where: { sync: false } }),
        offlineDb.purchase.count({ where: { sync: false } }),
        offlineDb.purchaseItem.count({ where: { sync: false } }),
        offlineDb.paymentMethod.count({ where: { sync: false } }),
        offlineDb.receiptSettings.count({ where: { sync: false } }),
        offlineDb.settings.count({ where: { sync: false } }),
        offlineDb.superAdmin.count({ where: { sync: false } })
      ]);

      const totalUnsynced = counts.reduce((sum, count) => sum + count, 0);

      return {
        totalUnsynced,
        unsyncedTables: {
          warehouses: counts[0],
          users: counts[1],
          customers: counts[2],
          suppliers: counts[3],
          products: counts[4],
          sales: counts[5],
          saleItems: counts[6],
          purchases: counts[7],
          purchaseItems: counts[8],
          paymentMethods: counts[9],
          receiptSettings: counts[10],
          settings: counts[11],
          superAdmins: counts[12]
        }
      };
    } catch (error) {
      throw new Error(`Failed to get sync status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const dataSyncService = new DataSyncService();