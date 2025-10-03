# Drug Inventory Management System

A comprehensive drug inventory management system for pharmacy operations with advanced features for stock tracking, expiry management, and reporting.

## 🚀 Features

### Core Functionality
- **Complete Drug Inventory Management** - Add, edit, view, and manage all drugs
- **Advanced Search & Filtering** - Search by name, code, manufacturer with multiple filters
- **Stock Status Indicators** - Color-coded status system with emoji indicators
- **Category Management** - Organize drugs into customizable categories
- **Low Stock Monitoring** - Automated alerts for drugs below reorder levels
- **Expiry Management** - Track drugs expiring in 30/60/90 days
- **Expired Drug Disposal** - Manage disposal of expired drugs with audit trail

### Advanced Features
- **Stock Adjustments** - Manual stock in/out/adjustment with reasons
- **Usage History** - Complete audit trail of all stock movements
- **CSV Import/Export** - Bulk import drugs and export reports
- **Batch Management** - Track batch numbers and expiry dates
- **Prescription Requirements** - Flag drugs requiring prescriptions
- **Storage Conditions** - Track special storage requirements

## 📁 File Structure

```
/admin/drugs/
├── page.tsx                        # Main drug inventory dashboard
├── add/
│   └── page.tsx                    # Add new drug form
├── import/
│   └── page.tsx                    # CSV import functionality
├── categories/
│   └── page.tsx                    # Drug categories management
├── low-stock/
│   └── page.tsx                    # Low stock monitoring
├── expiring/
│   └── page.tsx                    # Expiring drugs (30/60/90 days)
├── expired/
│   └── page.tsx                    # Expired drugs management
└── [drugId]/
    ├── page.tsx                    # Drug details view
    ├── edit/
    │   └── page.tsx                # Edit drug information
    ├── history/
    │   └── page.tsx                # Usage history & analytics
    └── adjust-stock/
        └── page.tsx                # Stock adjustment interface
```

## 🔌 API Endpoints

### Core Drug Operations
- `GET/POST /api/drugs` - List/create drugs
- `GET/PUT/DELETE /api/drugs/[drugId]` - Individual drug operations
- `POST /api/drugs/create` - Create new drug
- `POST /api/drugs/list` - Get paginated drug list

### Stock Management
- `POST /api/drugs/low-stock` - Get low stock drugs
- `POST /api/drugs/expiring` - Get expiring drugs
- `POST /api/drugs/expired` - Get expired drugs
- `POST /api/drugs/dispose` - Mark drugs as disposed

### Categories
- `GET/POST /api/drugs/categories` - List/create categories
- `PUT/DELETE /api/drugs/categories/[categoryId]` - Category operations

### Stock Movements
- `GET/POST /api/drugs/[drugId]/movements` - Stock movement history

## 🎨 Stock Status System

### Visual Indicators
- ✅ **In Stock** (Green) - Stock above reorder level
- ⚠️ **Low Stock** (Yellow) - Stock near reorder level (10% margin)
- 🔴 **Critical** (Red) - Stock below reorder level
- ⚫ **Out of Stock** (Black) - Zero stock
- 🟠 **Expiring Soon** (Orange) - Expiring within 30 days
- 🔴 **Expired** (Red) - Past expiry date

### Status Logic
```javascript
if (expiryDate < today) return 'expired'
if (daysToExpiry <= 30) return 'expiring_soon'
if (quantity === 0) return 'out_of_stock'
if (quantity <= reorderLevel) return 'low_stock'
return 'in_stock'
```

## 📊 Database Schema

### Drug Model
```prisma
model Drug {
  id                      String              @id @default(uuid())
  code                    String              // Drug code (e.g., PAI001)
  name                    String              // Drug name
  category                String              // Category
  manufacturer            String              // Manufacturer
  description             String?             // Description
  activeIngredient        String?             // Active ingredient
  strength                String?             // Strength (e.g., 500mg)
  dosageForm              String?             // Tablet, Capsule, etc.
  
  // Stock Management
  quantity                Int                 @default(0)
  reorderLevel            Int                 @default(0)
  
  // Pricing
  price                   Float               // Selling price
  cost                    Float               // Cost price
  
  // Batch & Expiry
  expiryDate              DateTime
  batchNumber             String
  
  // Additional Info
  unit                    String              @default("Pieces")
  storageConditions       String?
  prescriptionRequired    Boolean             @default(false)
  supplier                String?
  
  // Disposal Info
  isDisposed              Boolean             @default(false)
  disposalDate            DateTime?
  disposalMethod          String?
  disposalReason          String?
  
  // Relations
  stockMovements          DrugStockMovement[]
  disposalRecords         DrugDisposal[]
  
  // Warehouse & Audit
  warehouseId             String
  createdBy               String?
  lastStockUpdate         DateTime?
  
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  sync                    Boolean             @default(false)
  isDeleted               Boolean             @default(false)
}
```

### Stock Movement Model
```prisma
model DrugStockMovement {
  id                      String              @id @default(uuid())
  drugId                  String
  type                    String              // 'in', 'out', 'adjustment'
  quantity                Int                 // Quantity moved
  reason                  String              // Reason for movement
  reference               String?             // Reference number
  balanceAfter            Int                 // Stock balance after movement
  warehouseId             String
  createdBy               String              @default("system")
  createdAt               DateTime            @default(now())
}
```

## 🔧 Configuration

### Drug Categories
Default categories include:
- Painkillers
- Antibiotics
- Antimalarial
- Vitamins
- Diabetes
- Hypertension
- Respiratory
- Gastrointestinal
- Dermatological
- Cardiovascular
- Neurological
- Hormonal
- Antiseptic
- Emergency
- Other

### Dosage Forms
- Tablet
- Capsule
- Syrup
- Injection
- Cream
- Ointment
- Drops
- Inhaler
- Patch
- Suppository

### Units
- Pieces
- Bottles
- Boxes
- Vials
- Tubes
- Sachets
- Strips

## 📈 Analytics & Reporting

### Stock Analytics
- Total drugs in inventory
- Low stock alerts count
- Expiring drugs (30/60/90 days)
- Expired drugs count
- Total inventory value
- Category distribution

### Usage Analytics
- Total stock in/out movements
- Average monthly usage
- Usage trends (increasing/decreasing/stable)
- Peak usage periods
- Stock turnover rates

### Export Options
- Complete inventory export
- Low stock report
- Expiry report
- Usage history export
- Category-wise reports

## 🚨 Alerts & Notifications

### Automated Alerts
1. **Low Stock Alert** - When quantity ≤ reorder level
2. **Critical Stock** - When quantity ≤ 50% of reorder level
3. **Out of Stock** - When quantity = 0
4. **Expiring Soon** - Drugs expiring in 30 days
5. **Expired** - Drugs past expiry date

### Alert Levels
- 🟢 **Normal** - Stock above reorder level
- 🟡 **Warning** - Stock near reorder level
- 🔴 **Critical** - Stock below reorder level or expiring
- ⚫ **Emergency** - Out of stock or expired

## 🔒 Security & Permissions

### Access Control
- **Admin** - Full access to all features
- **Pharmacist** - Drug management, dispensing, stock adjustments
- **Physician** - View drug information, check availability
- **Receptionist** - View-only access to drug information

### Audit Trail
- All stock movements logged with user, timestamp, and reason
- Drug creation/modification history
- Disposal records with approval workflow
- Export/import activity logging

## 🛠️ Installation & Setup

### Prerequisites
- Next.js 14+
- Prisma ORM
- SQLite/PostgreSQL database
- Node.js 18+

### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

### Environment Variables
```env
DATABASE_URL="your_database_url"
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="your_app_url"
```

## 📝 Usage Examples

### Adding a New Drug
1. Navigate to `/admin/drugs/add`
2. Fill in required fields (name, category, manufacturer)
3. Set stock levels and pricing
4. Add batch and expiry information
5. Save the drug

### Stock Adjustment
1. Go to drug details page
2. Click "Adjust Stock"
3. Select adjustment type (in/out/adjustment)
4. Enter quantity and reason
5. Add reference number if applicable
6. Submit adjustment

### CSV Import
1. Download the template from `/admin/drugs/import`
2. Fill in drug data following the template format
3. Upload the CSV file
4. Review and fix any validation errors
5. Process the import

### Expiry Management
1. Visit `/admin/drugs/expiring` for upcoming expiries
2. Use tabs to filter by 30/60/90 days
3. Export reports for procurement planning
4. Move expired drugs to disposal workflow

## 🤝 Contributing

1. Follow the existing code structure and naming conventions
2. Add proper TypeScript types for all new features
3. Include error handling and loading states
4. Update this documentation for new features
5. Test all CRUD operations thoroughly

## 📄 License

This project is part of the pharmacy management system and follows the same licensing terms.

---

For technical support or feature requests, please contact the development team.