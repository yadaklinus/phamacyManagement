// import { NextRequest, NextResponse } from "next/server";
// import pMap from "p-map";

// import onlinePrisma from "@/lib/onlinePrisma";
// import offlinePrisma from "@/lib/oflinePrisma";

// interface SyncProgress {
//   entity: string;
//   completed: number;
//   total: number;
//   status: 'pending' | 'syncing' | 'completed' | 'error';
//   error?: string;
// }

// interface SyncResult {
//   success: boolean;
//   totalEntities: number;
//   completedEntities: number;
//   progress: SyncProgress[];
//   errors: string[];
//   startTime: Date;
//   endTime?: Date;
//   duration?: number;
// }

// // Global sync state (in production, use Redis or database)
// let currentSyncStatus: SyncResult | null = null;
// let isSyncing = false;

// // Helper function with retry logic
// async function ensureConnections(maxRetries = 3) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       await Promise.all([
//         onlinePrisma.$connect(),
//         offlinePrisma.$connect()
//       ]);
//       console.log("Both Prisma clients connected successfully");
//       return;
//     } catch (error) {
//       console.error(`Connection attempt ${attempt} failed:`, error);
//       if (attempt === maxRetries) {
//         throw new Error(`Database connection failed after ${maxRetries} attempts`);
//       }
//       // Wait before retrying (exponential backoff)
//       await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
//     }
//   }
// }

// // Helper function to test connections with retry
// async function testConnections(maxRetries = 3) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       await Promise.all([
//         onlinePrisma.$queryRaw`SELECT 1`,
//         offlinePrisma.$queryRaw`SELECT 1`
//       ]);
//       console.log("Database connections tested successfully");
//       return;
//     } catch (error) {
//       console.error(`Connection test attempt ${attempt} failed:`, error);
//       if (attempt === maxRetries) {
//         throw new Error(`Database connection test failed after ${maxRetries} attempts`);
//       }
//       await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
//     }
//   }
// }

// // Safe upsert with error handling
// async function safeUpsert<T>(
//   operation: () => Promise<T>,
//   entityName: string,
//   entityId: string | number,
//   maxRetries = 2
// ): Promise<{ success: boolean; error?: string }> {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       await operation();
//       return { success: true };
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error(`${entityName} upsert failed for ID ${entityId}, attempt ${attempt}:`, errorMessage);
      
//       if (attempt === maxRetries) {
//         return { success: false, error: errorMessage };
//       }
      
//       // Wait before retrying
//       await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
//     }
//   }
//   return { success: false, error: 'Max retries exceeded' };
// }

// // Update sync progress
// function updateProgress(entityName: string, completed: number, total: number, status: SyncProgress['status'], error?: string) {
//   if (!currentSyncStatus) return;
  
//   const progressIndex = currentSyncStatus.progress.findIndex(p => p.entity === entityName);
//   if (progressIndex >= 0) {
//     currentSyncStatus.progress[progressIndex] = {
//       entity: entityName,
//       completed,
//       total,
//       status,
//       error
//     };
//   }
  
//   // Update overall progress
//   const completedEntities = currentSyncStatus.progress.filter(p => p.status === 'completed').length;
//   currentSyncStatus.completedEntities = completedEntities;
// }

// export async function POST(req: NextRequest) {
//   // Prevent concurrent syncs
//   if (isSyncing) {
//     return NextResponse.json({
//       status: 409,
//       message: "Sync already in progress",
//       currentProgress: currentSyncStatus
//     }, { status: 409 });
//   }

//   const body = await req.json();
//   console.log("Sync request body:", body);

//   // Initialize sync status
//   const syncEntities = [
//     'warehouses', 'users', 'products', 'customers', 'suppliers',
//     'sales', 'purchases', 'saleItems', 'purchaseItems', 'paymentMethods', 'balancePayment'
//   ];

//   currentSyncStatus = {
//     success: false,
//     totalEntities: syncEntities.length,
//     completedEntities: 0,
//     progress: syncEntities.map(entity => ({
//       entity,
//       completed: 0,
//       total: 0,
//       status: 'pending'
//     })),
//     errors: [],
//     startTime: new Date()
//   };

//   isSyncing = true;

//   try {
//     // Ensure connections before starting sync
//     await ensureConnections();
//     await testConnections();

//     // 1. Warehouses (Down sync - online to offline)
//     updateProgress('warehouses', 0, 0, 'syncing');
//     try {
//       console.log("Starting warehouses sync...");
//       const warehouses = await onlinePrisma.warehouses_online.findMany();
//       updateProgress('warehouses', 0, warehouses.length, 'syncing');
      
//       let warehouseErrors = 0;
//       await pMap(warehouses, async (data, index) => {
//         const result = await safeUpsert(
//           () => offlinePrisma.warehouses.upsert({
//             where: { warehouseCode: data.warehouseCode },
//             update: { ...data, syncedAt: new Date() },
//             create: { ...data, syncedAt: new Date() },
//           }),
//           'warehouses',
//           data.warehouseCode
//         );
        
//         if (!result.success) {
//           warehouseErrors++;
//           currentSyncStatus?.errors.push(`Warehouse ${data.warehouseCode}: ${result.error}`);
//         }
        
//         updateProgress('warehouses', index + 1, warehouses.length, 'syncing');
//       }, { concurrency: 2 });
      
//       updateProgress('warehouses', warehouses.length, warehouses.length, 'completed');
//       console.log(`Synced ${warehouses.length - warehouseErrors} warehouses (${warehouseErrors} errors)`);
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       updateProgress('warehouses', 0, 0, 'error', errorMessage);
//       currentSyncStatus.errors.push(`Warehouses sync failed: ${errorMessage}`);
//     }

//     // 2. Users (Down sync - online to offline)
//     updateProgress('users', 0, 0, 'syncing');
//     try {
//       console.log("Starting users sync...");
//       const users = await onlinePrisma.users_online.findMany();
//       updateProgress('users', 0, users.length, 'syncing');
      
//       let userErrors = 0;
//       await pMap(users, async (data, index) => {
//         const { warehouses_onlineId: warehousesId, ...rest } = data;
//         const result = await safeUpsert(
//           () => offlinePrisma.users.upsert({
//             where: { userName: data.userName },
//             update: { ...rest, warehousesId, syncedAt: new Date() },
//             create: { ...rest, warehousesId, syncedAt: new Date() },
//           }),
//           'users',
//           data.userName
//         );
        
//         if (!result.success) {
//           userErrors++;
//           currentSyncStatus?.errors.push(`User ${data.userName}: ${result.error}`);
//         }
        
//         updateProgress('users', index + 1, users.length, 'syncing');
//       }, { concurrency: 2 });
      
//       updateProgress('users', users.length, users.length, 'completed');
//       console.log(`Synced ${users.length - userErrors} users (${userErrors} errors)`);
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       updateProgress('users', 0, 0, 'error', errorMessage);
//       currentSyncStatus.errors.push(`Users sync failed: ${errorMessage}`);
//     }

//     // 3. Products (Up sync - offline to online)
//     updateProgress('products', 0, 0, 'syncing');
//     try {
//       console.log("Starting products sync...");
//       const products = await offlinePrisma.product.findMany({ where: { sync: false } });
//       updateProgress('products', 0, products.length, 'syncing');
      
//       if (products.length > 0) {
//         let productErrors = 0;
//         const successfulIds: string[] = [];
        
//         await pMap(products, async (data, index) => {
//           const { warehousesId: warehouses_onlineId, ...rest } = data;
//           const result = await safeUpsert(
//             () => onlinePrisma.product_online.upsert({
//               where: { id: data.id },
//               update: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//               create: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//             }),
//             'products',
//             data.id
//           );
          
//           if (result.success) {
//             successfulIds.push(data.id);
//           } else {
//             productErrors++;
//             currentSyncStatus?.errors.push(`Product ${data.id}: ${result.error}`);
//           }
          
//           updateProgress('products', index + 1, products.length, 'syncing');
//         }, { concurrency: 2 });
        
//         // Update sync status for successful products only
//         if (successfulIds.length > 0) {
//           await offlinePrisma.product.updateMany({
//             where: { id: { in: successfulIds } },
//             data: { sync: true }
//           });
//         }
        
//         console.log(`Synced ${successfulIds.length} products (${productErrors} errors)`);
//       }
      
//       updateProgress('products', products.length, products.length, 'completed');
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       updateProgress('products', 0, 0, 'error', errorMessage);
//       currentSyncStatus.errors.push(`Products sync failed: ${errorMessage}`);
//     }

//     // 4. Customers (Up sync - offline to online)
//     updateProgress('customers', 0, 0, 'syncing');
//     try {
//       console.log("Starting customers sync...");
//       const customers = await offlinePrisma.customer.findMany({ where: { sync: false } });
//       updateProgress('customers', 0, customers.length, 'syncing');
      
//       if (customers.length > 0) {
//         let customerErrors = 0;
//         const successfulIds: string[] = [];
        
//         await pMap(customers, async (data, index) => {
//           const { warehousesId: warehouses_onlineId, ...rest } = data;
//           const result = await safeUpsert(
//             () => onlinePrisma.customer_online.upsert({
//               where: { id: data.id },
//               update: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//               create: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//             }),
//             'customers',
//             data.id
//           );
          
//           if (result.success) {
//             successfulIds.push(data.id);
//           } else {
//             customerErrors++;
//             currentSyncStatus?.errors.push(`Customer ${data.id}: ${result.error}`);
//           }
          
//           updateProgress('customers', index + 1, customers.length, 'syncing');
//         }, { concurrency: 2 });
        
//         if (successfulIds.length > 0) {
//           await offlinePrisma.customer.updateMany({
//             where: { id: { in: successfulIds } },
//             data: { sync: true }
//           });
//         }
        
//         console.log(`Synced ${successfulIds.length} customers (${customerErrors} errors)`);
//       }
      
//       updateProgress('customers', customers.length, customers.length, 'completed');
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       updateProgress('customers', 0, 0, 'error', errorMessage);
//       currentSyncStatus.errors.push(`Customers sync failed: ${errorMessage}`);
//     }

//     // Suppliers
//     updateProgress('suppliers', 0, 0, 'syncing');
// try {
//   console.log("Starting suppliers sync...");
//   const suppliers = await offlinePrisma.supplier.findMany({ where: { sync: false } });
//   updateProgress('suppliers', 0, suppliers.length, 'syncing');
  
//   if (suppliers.length > 0) {
//     let supplierErrors = 0;
//     const successfulIds: string[] = [];
    
//     await pMap(suppliers, async (data, index) => {
//       const { warehousesId: warehouses_onlineId, ...rest } = data;
//       const result = await safeUpsert(
//         () => onlinePrisma.supplier_online.upsert({
//           where: { id: data.id },
//           update: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'suppliers',
//         data.id
//       );
      
//       if (result.success) {
//         successfulIds.push(data.id);
//       } else {
//         supplierErrors++;
//         currentSyncStatus?.errors.push(`Supplier ${data.id}: ${result.error}`);
//       }
      
//       updateProgress('suppliers', index + 1, suppliers.length, 'syncing');
//     }, { concurrency: 2 });
    
//     if (successfulIds.length > 0) {
//       await offlinePrisma.supplier.updateMany({
//         where: { id: { in: successfulIds } },
//         data: { sync: true }
//       });
//     }
    
//     console.log(`Synced ${successfulIds.length} suppliers (${supplierErrors} errors)`);
//   }
  
//   updateProgress('suppliers', suppliers.length, suppliers.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('suppliers', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Suppliers sync failed: ${errorMessage}`);
// }

// //Sales
// updateProgress('sales', 0, 0, 'syncing');
// try {
//   console.log("Starting sales sync...");
//   const sales = await offlinePrisma.sale.findMany({ where: { sync: false } });
//   updateProgress('sales', 0, sales.length, 'syncing');

//   if (sales.length > 0) {
//     let salesErrors = 0;
//     const successfulInvoiceNos: string[] = [];

//     await pMap(sales, async (data, index) => {
//       const { warehousesId: warehouses_onlineId, selectedCustomerId: customer_onlineId, ...rest } = data;
//       const result = await safeUpsert(
//         () => onlinePrisma.sale_online.upsert({
//           where: { invoiceNo: data.invoiceNo },
//           update: { ...rest, warehouses_onlineId, customer_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, customer_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'sales',
//         data.invoiceNo
//       );

//       if (result.success) {
//         successfulInvoiceNos.push(data.invoiceNo);
//       } else {
//         salesErrors++;
//         currentSyncStatus?.errors.push(`Sale ${data.invoiceNo}: ${result.error}`);
//       }

//       updateProgress('sales', index + 1, sales.length, 'syncing');
//     }, { concurrency: 2 });

//     if (successfulInvoiceNos.length > 0) {
//       await offlinePrisma.sale.updateMany({
//         where: { invoiceNo: { in: successfulInvoiceNos } },
//         data: { sync: true }
//       });
//     }

//     console.log(`Synced ${successfulInvoiceNos.length} sales (${salesErrors} errors)`);
//   }

//   updateProgress('sales', sales.length, sales.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('sales', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Sales sync failed: ${errorMessage}`);
// }

// //Purchase
// updateProgress('purchases', 0, 0, 'syncing');
// try {
//   console.log("Starting purchases sync...");
//   const purchases = await offlinePrisma.purchase.findMany({ where: { sync: false } });
//   updateProgress('purchases', 0, purchases.length, 'syncing');

//   if (purchases.length > 0) {
//     let purchaseErrors = 0;
//     const successfulReferenceNos: string[] = [];

//     await pMap(purchases, async (data, index) => {
//       const { warehousesId: warehouses_onlineId, supplierId: supplier_onlineId, ...rest } = data;
//       const result = await safeUpsert(
//         () => onlinePrisma.purchase_online.upsert({
//           where: { referenceNo: data.referenceNo },
//           update: { ...rest, warehouses_onlineId, supplier_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, supplier_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'purchases',
//         data.referenceNo
//       );

//       if (result.success) {
//         successfulReferenceNos.push(data.referenceNo);
//       } else {
//         purchaseErrors++;
//         currentSyncStatus?.errors.push(`Purchase ${data.referenceNo}: ${result.error}`);
//       }

//       updateProgress('purchases', index + 1, purchases.length, 'syncing');
//     }, { concurrency: 2 });

//     if (successfulReferenceNos.length > 0) {
//       await offlinePrisma.purchase.updateMany({
//         where: { referenceNo: { in: successfulReferenceNos } },
//         data: { sync: true }
//       });
//     }

//     console.log(`Synced ${successfulReferenceNos.length} purchases (${purchaseErrors} errors)`);
//   }

//   updateProgress('purchases', purchases.length, purchases.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('purchases', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Purchases sync failed: ${errorMessage}`);
// }

// // SaleItems
// updateProgress('saleItems', 0, 0, 'syncing');
// try {
//   console.log("Starting sale items sync...");
//   const saleItems = await offlinePrisma.saleItem.findMany({ where: { sync: false } });
//   updateProgress('saleItems', 0, saleItems.length, 'syncing');

//   if (saleItems.length > 0) {
//     let saleItemErrors = 0;
//     const successfulIds: string[] = [];

//     await pMap(saleItems, async (data, index) => {
//       const { 
//         warehousesId: warehouses_onlineId, 
//         saleId: sale_onlineId, 
//         customerId: customer_onlineId, 
//         productId: product_onlineId, 
//         ...rest 
//       } = data;

//       const result = await safeUpsert(
//         () => onlinePrisma.saleItem_online.upsert({
//           where: { id: data.id },
//           update: { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'saleItems',
//         data.id
//       );

//       if (result.success) {
//         successfulIds.push(data.id);
//       } else {
//         saleItemErrors++;
//         currentSyncStatus?.errors.push(`Sale Item ${data.id}: ${result.error}`);
//       }

//       updateProgress('saleItems', index + 1, saleItems.length, 'syncing');
//     }, { concurrency: 2 });

//     if (successfulIds.length > 0) {
//       await offlinePrisma.saleItem.updateMany({
//         where: { id: { in: successfulIds } },
//         data: { sync: true }
//       });
//     }

//     console.log(`Synced ${successfulIds.length} sale items (${saleItemErrors} errors)`);
//   }

//   updateProgress('saleItems', saleItems.length, saleItems.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('saleItems', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Sale Items sync failed: ${errorMessage}`);
// }

// //PurchaseItems

// updateProgress('purchaseItems', 0, 0, 'syncing');
// try {
//   console.log("Starting purchase items sync...");
//   const purchaseItems = await offlinePrisma.purchaseItem.findMany({ where: { sync: false } });
//   updateProgress('purchaseItems', 0, purchaseItems.length, 'syncing');

//   if (purchaseItems.length > 0) {
//     let purchaseItemErrors = 0;
//     const successfulIds: string[] = [];

//     await pMap(purchaseItems, async (data, index) => {
//       const { 
//         warehousesId: warehouses_onlineId, 
//         purchaseId: purchase_onlineId, 
//         productId: product_onlineId, 
//         ...rest 
//       } = data;

//       const result = await safeUpsert(
//         () => onlinePrisma.purchaseItem_online.upsert({
//           where: { id: data.id },
//           update: { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'purchaseItems',
//         data.id
//       );

//       if (result.success) {
//         successfulIds.push(data.id);
//       } else {
//         purchaseItemErrors++;
//         currentSyncStatus?.errors.push(`Purchase Item ${data.id}: ${result.error}`);
//       }

//       updateProgress('purchaseItems', index + 1, purchaseItems.length, 'syncing');
//     }, { concurrency: 2 });

//     if (successfulIds.length > 0) {
//       await offlinePrisma.purchaseItem.updateMany({
//         where: { id: { in: successfulIds } },
//         data: { sync: true }
//       });
//     }

//     console.log(`Synced ${successfulIds.length} purchase items (${purchaseItemErrors} errors)`);
//   }

//   updateProgress('purchaseItems', purchaseItems.length, purchaseItems.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('purchaseItems', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Purchase Items sync failed: ${errorMessage}`);
// }

// //PaymentMethod
// updateProgress('paymentMethods', 0, 0, 'syncing');
// try {
//   console.log("Starting payment methods sync...");
//   const paymentMethods = await offlinePrisma.paymentMethod.findMany({ where: { sync: false } });
//   updateProgress('paymentMethods', 0, paymentMethods.length, 'syncing');

//   if (paymentMethods.length > 0) {
//     let paymentMethodErrors = 0;
//     const successfulIds: string[] = [];

//     await pMap(paymentMethods, async (data, index) => {
//       const { 
//         warehousesId: warehouses_onlineId, 
//         saleId: sale_onlineId, 
//         ...rest 
//       } = data;

//       const result = await safeUpsert(
//         () => onlinePrisma.paymentMethod_online.upsert({
//           where: { id: data.id },
//           update: { ...rest, warehouses_onlineId, sale_onlineId, syncedAt: new Date(), sync: true },
//           create: { ...rest, warehouses_onlineId, sale_onlineId, syncedAt: new Date(), sync: true },
//         }),
//         'paymentMethods',
//         data.id
//       );

//       if (result.success) {
//         successfulIds.push(data.id);
//       } else {
//         paymentMethodErrors++;
//         currentSyncStatus?.errors.push(`Payment Method ${data.id}: ${result.error}`);
//       }

//       updateProgress('paymentMethods', index + 1, paymentMethods.length, 'syncing');
//     }, { concurrency: 2 });

//     if (successfulIds.length > 0) {
//       await offlinePrisma.paymentMethod.updateMany({
//         where: { id: { in: successfulIds } },
//         data: { sync: true }
//       });
//     }

//     console.log(`Synced ${successfulIds.length} payment methods (${paymentMethodErrors} errors)`);
//   }

//   updateProgress('paymentMethods', paymentMethods.length, paymentMethods.length, 'completed');
// } catch (error) {
//   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//   updateProgress('paymentMethods', 0, 0, 'error', errorMessage);
//   currentSyncStatus.errors.push(`Payment Methods sync failed: ${errorMessage}`);
// }



//     // Continue with other entities following the same pattern...
//     // (suppliers, sales, purchases, etc.)

//     // Mark sync as completed
//     currentSyncStatus.success = currentSyncStatus.errors.length === 0;
//     currentSyncStatus.endTime = new Date();
//     currentSyncStatus.duration = currentSyncStatus.endTime.getTime() - currentSyncStatus.startTime.getTime();

//     console.log("Sync completed", { 
//       success: currentSyncStatus.success, 
//       errors: currentSyncStatus.errors.length,
//       duration: currentSyncStatus.duration 
//     });

//     return NextResponse.json({
//       status: 200,
//       message: currentSyncStatus.success ? "Sync completed successfully" : "Sync completed with errors",
//       result: currentSyncStatus
//     });

//   } catch (error) {
//     console.error("Critical sync error:", error);
    
//     const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
//     if (currentSyncStatus) {
//       currentSyncStatus.success = false;
//       currentSyncStatus.endTime = new Date();
//       currentSyncStatus.duration = currentSyncStatus.endTime.getTime() - currentSyncStatus.startTime.getTime();
//       currentSyncStatus.errors.push(`Critical error: ${errorMessage}`);
//     }

//     return NextResponse.json({
//       status: 500,
//       message: "Sync failed critically",
//       error: errorMessage,
//       result: currentSyncStatus,
//       timestamp: new Date().toISOString()
//     }, { status: 500 });

//   } finally {
//     isSyncing = false;
//   }
// }

// // GET endpoint to check sync status
// export async function GET() {
//   const overallPercentage = currentSyncStatus ? 
//     Math.round((currentSyncStatus.completedEntities / currentSyncStatus.totalEntities) * 100) : 0;

//   return NextResponse.json({
//     status: 200,
//     isSyncing,
//     overallPercentage,
//     syncStatus: currentSyncStatus,
//     lastSync: currentSyncStatus?.endTime || null
//   });
// }