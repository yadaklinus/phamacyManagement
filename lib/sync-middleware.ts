// import { NextRequest, NextResponse } from "next/server";
// import { 
//   markProductAsUnsynced, 
//   markCustomerAsUnsynced, 
//   markSupplierAsUnsynced,
//   markRelatedRecordsAsUnsynced 
// } from "@/lib/sync-helpers";

// /**
//  * Middleware functions to automatically handle sync status updates
//  */

// // Generic wrapper for API routes that need sync tracking
// export function withSyncTracking<T extends any[]>(
//   handler: (...args: T) => Promise<NextResponse>,
//   syncConfig: {
//     entityType: 'product' | 'customer' | 'supplier' | 'sale' | 'purchase';
//     operation: 'create' | 'update' | 'delete';
//     getEntityId?: (requestData: any) => string;
//     getRelatedIds?: (requestData: any) => any;
//   }
// ) {
//   return async (...args: T): Promise<NextResponse> => {
//     try {
//       // Execute the original handler
//       const response = await handler(...args);
      
//       // If the operation was successful, handle sync tracking
//       if (response.status >= 200 && response.status < 300) {
//         const request = args[0] as NextRequest;
//         const requestData = await request.json();
        
//         const entityId = syncConfig.getEntityId ? 
//           syncConfig.getEntityId(requestData) : 
//           requestData.id || requestData.productId || requestData.customerId || requestData.supplierId;
        
//         if (entityId) {
//           switch (syncConfig.entityType) {
//             case 'product':
//               await markProductAsUnsynced(entityId);
//               break;
//             case 'customer':
//               await markCustomerAsUnsynced(entityId);
//               break;
//             case 'supplier':
//               await markSupplierAsUnsynced(entityId);
//               break;
//             case 'sale':
//             case 'purchase':
//               const relatedIds = syncConfig.getRelatedIds ? 
//                 syncConfig.getRelatedIds(requestData) : {};
              
//               await markRelatedRecordsAsUnsynced({
//                 type: syncConfig.entityType,
//                 entityId,
//                 relatedIds
//               });
//               break;
//           }
//         }
//       }
      
//       return response;
//     } catch (error) {
//       console.error(`Sync tracking error for ${syncConfig.entityType} ${syncConfig.operation}:`, error);
//       // Don't fail the original operation due to sync tracking errors
//       return await handler(...args);
//     }
//   };
// }

// // Specific middleware for different operations
// export const withProductSync = (handler: Function, operation: 'create' | 'update' | 'delete') =>
//   withSyncTracking(handler, {
//     entityType: 'product',
//     operation,
//     getEntityId: (data) => data.productId || data.id
//   });

// export const withCustomerSync = (handler: Function, operation: 'create' | 'update' | 'delete') =>
//   withSyncTracking(handler, {
//     entityType: 'customer',
//     operation,
//     getEntityId: (data) => data.customerId || data.id
//   });

// export const withSupplierSync = (handler: Function, operation: 'create' | 'update' | 'delete') =>
//   withSyncTracking(handler, {
//     entityType: 'supplier',
//     operation,
//     getEntityId: (data) => data.supplierId || data.id
//   });

// export const withSaleSync = (handler: Function, operation: 'create' | 'update' | 'delete') =>
//   withSyncTracking(handler, {
//     entityType: 'sale',
//     operation,
//     getEntityId: (data) => data.invoiceNo || data.saleId,
//     getRelatedIds: (data) => ({
//       productIds: data.items?.map((item: any) => item.productId) || [],
//       customerId: data.customer?.id,
//       saleItemIds: [], // These will be generated during creation
//       paymentMethodIds: [] // These will be generated during creation
//     })
//   });

// export const withPurchaseSync = (handler: Function, operation: 'create' | 'update' | 'delete') =>
//   withSyncTracking(handler, {
//     entityType: 'purchase',
//     operation,
//     getEntityId: (data) => data.referenceNo || data.purchaseId,
//     getRelatedIds: (data) => ({
//       productIds: data.items?.map((item: any) => item.productId) || [],
//       supplierId: data.supplierId,
//       purchaseItemIds: [] // These will be generated during creation
//     })
//   });

// // Helper function to create sync-aware API responses
// export function createSyncResponse(
//   data: any, 
//   message: string, 
//   syncInfo?: {
//     entityType: string;
//     operation: string;
//     affectedRecords: number;
//   }
// ) {
//   return NextResponse.json({
//     success: true,
//     data,
//     message,
//     sync: syncInfo ? {
//       ...syncInfo,
//       timestamp: new Date().toISOString(),
//       status: 'pending'
//     } : undefined
//   });
// }

// // Helper to add sync metadata to responses
// export function addSyncMetadata(response: any, syncData: {
//   totalUnsynced: number;
//   lastSyncTime?: Date;
//   syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
// }) {
//   return {
//     ...response,
//     _sync: {
//       ...syncData,
//       timestamp: new Date().toISOString()
//     }
//   };
// }