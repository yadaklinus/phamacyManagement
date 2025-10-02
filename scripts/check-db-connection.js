#!/usr/bin/env node

const { PrismaClient: prismaClient } = require('../prisma/generated/offline');
const { PrismaClient: OnlinePrismaClient } = require('../prisma/generated/online');

async function checkConnections() {
  console.log('🔍 Checking database connections...\n');

  const offlineDb = new prismaClient();
  const onlineDb = new OnlinePrismaClient();

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`DATABASE_URL_ONLINE: ${process.env.DATABASE_URL_ONLINE ? '✅ Set' : '❌ Not set'}\n`);

  // Test offline database connection
  try {
    console.log('🔄 Testing offline database connection...');
    await offlineDb.$connect();
    await offlineDb.$queryRaw`SELECT 1`;
    console.log('✅ Offline database connection successful\n');
  } catch (error) {
    console.error('❌ Offline database connection failed:');
    console.error(error.message);
    console.log('');
  }

  // Test online database connection
  try {
    console.log('🔄 Testing online database connection...');
    await onlineDb.$connect();
    await onlineDb.$queryRaw`SELECT 1`;
    console.log('✅ Online database connection successful\n');
  } catch (error) {
    console.error('❌ Online database connection failed:');
    console.error(error.message);
    console.log('');
  }

  // Test specific table access
  try {
    console.log('🔄 Testing table access...');
    const warehouseCount = await onlineDb.warehouses_online.count();
    console.log(`✅ Can access warehouses_online table (${warehouseCount} records)\n`);
  } catch (error) {
    console.error('❌ Failed to access warehouses_online table:');
    console.error(error.message);
    console.log('');
  }

  // Cleanup
  await offlineDb.$disconnect();
  await onlineDb.$disconnect();
  
  console.log('🏁 Connection check completed');
}

// Run the check
checkConnections().catch((error) => {
  console.error('💥 Connection check failed:', error);
  process.exit(1);
});