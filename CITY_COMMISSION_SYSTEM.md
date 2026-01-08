# City-Based Commission System - Implementation Guide

## ✅ What Was Implemented:

### 1. **Database Schema** (`backend/prisma/schema.prisma`)

Added `CityCommission` model:

```prisma
model CityCommission {
  id                      String   @id @default(uuid())
  city                    String   @unique
  
  // Commission rates
  vendorCommissionRate    Float    @default(10.0)     // % of order subtotal
  deliveryCommissionRate  Float    @default(15.0)     // % of delivery fee
  
  // Optional city-specific settings
  minOrderAmount          Float?                      // Minimum order for this city
  baseDeliveryFee         Float?                      // Base delivery fee
  perKmDeliveryFee        Float?                      // Per km delivery fee
  
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

### 2. **Backend API** (`backend/src/controllers/cityCommission.controller.ts`)

**Endpoints:**
- `GET /api/v1/city-commissions` - Get all city commissions (Admin only)
- `GET /api/v1/city-commissions/:city` - Get commission for specific city (Admin only)
- `PUT /api/v1/city-commissions/:city` - Create/update city commission (Admin only)
- `DELETE /api/v1/city-commissions/:city` - Delete city commission (Admin only)
- `POST /api/v1/city-commissions/bulk` - Bulk create/update (Admin only)
- `GET /api/v1/city-commissions/rates?city={name}` - Get rates (Public)

### 3. **Admin Panel UI** (`admin-panel/src/pages/CityCommissions.tsx`)

**Features:**
- ✅ View all city commissions in a table
- ✅ Inline editing of commission rates
- ✅ Add new city commissions
- ✅ Delete city commissions
- ✅ Set vendor commission rate (%)
- ✅ Set delivery partner commission rate (%)
- ✅ Optional: Set minimum order amount
- ✅ Optional: Set base delivery fee
- ✅ Optional: Set per km delivery fee
- ✅ Enable/disable city commissions
- ✅ Statistics cards showing averages

## 🎯 How It Works:

### Commission Calculation Flow:

```
Order Created in City X
         ↓
Check if CityCommission exists for City X
         ↓
    YES ↓                    NO ↓
Use city-specific rates    Use default rates
         ↓                       ↓
Vendor Commission = Subtotal × vendorCommissionRate%
Delivery Commission = DeliveryFee × deliveryCommissionRate%
         ↓
Calculate earnings and payouts
```

### Example:

**City: Kolkata**
- Vendor Commission: 12%
- Delivery Commission: 18%
- Min Order: ₹100
- Base Delivery Fee: ₹20
- Per Km Fee: ₹5

**Order Details:**
- Subtotal: ₹500
- Distance: 3km
- Delivery Fee: ₹20 + (3 × ₹5) = ₹35

**Commission Calculation:**
- Vendor Commission: ₹500 × 12% = ₹60
- Vendor Earnings: ₹500 - ₹60 = ₹440
- Delivery Commission: ₹35 × 18% = ₹6.30
- Partner Earnings: ₹35 - ₹6.30 = ₹28.70

## 📋 Features:

### Admin Panel:
✅ **City Management** - Add/edit/delete city-specific commissions
✅ **Flexible Rates** - Different rates for each city
✅ **Optional Settings** - Min order, delivery fees per city
✅ **Active/Inactive** - Enable/disable cities
✅ **Statistics** - View average commission rates
✅ **Inline Editing** - Quick updates without modals
✅ **Validation** - Commission rates must be 0-100%

### API Features:
✅ **Public Rate API** - Anyone can query commission rates
✅ **Admin Protection** - Only admins can modify
✅ **Bulk Operations** - Update multiple cities at once
✅ **Fallback to Defaults** - If no city commission set, uses defaults

## 🚀 Usage Guide:

### For Admins:

1. **Access City Commissions Page**
   - Navigate to Admin Panel → City Commissions
   - Or go to `/dashboard/city-commissions`

2. **Add New City**
   - Click "Add City" button
   - Select city from dropdown
   - Set vendor commission rate (default: 10%)
   - Set delivery commission rate (default: 15%)
   - Optionally set min order amount
   - Optionally set delivery fees
   - Click "Add Commission"

3. **Edit Existing City**
   - Click edit icon (pencil) next to city
   - Modify values inline
   - Click save icon (checkmark)
   - Or click X to cancel

4. **Delete City**
   - Click delete icon (trash) next to city
   - Confirm deletion
   - City will revert to default rates

### For Developers:

**Query Commission Rates:**
```typescript
// Public API - no auth required
const rates = await fetch('/api/v1/city-commissions/rates?city=Kolkata');
const data = await rates.json();

console.log(data.vendorCommissionRate);     // 12
console.log(data.deliveryCommissionRate);   // 18
```

**Create/Update Commission:**
```typescript
// Admin only
await api.put('/api/v1/city-commissions/Kolkata', {
    vendorCommissionRate: 12.0,
    deliveryCommissionRate: 18.0,
    minOrderAmount: 100,
    baseDeliveryFee: 20,
    perKmDeliveryFee: 5,
    isActive: true
});
```

## 🔧 Configuration:

### Default Rates (if no city commission set):
```typescript
{
    vendorCommissionRate: 10.0,      // 10%
    deliveryCommissionRate: 15.0,    // 15%
    minOrderAmount: null,            // No minimum
    baseDeliveryFee: null,           // Use global setting
    perKmDeliveryFee: null           // Use global setting
}
```

### Database Migration:

Run this to apply the schema changes:
```bash
cd backend
npx prisma migrate dev --name add_city_commission
npx prisma generate
```

## 📊 Use Cases:

### 1. **Urban vs Rural Pricing**
- **Kolkata** (Urban): 10% vendor, 15% delivery
- **Malda** (Rural): 8% vendor, 12% delivery (lower to attract vendors)

### 2. **Competitive Markets**
- **Siliguri** (High competition): 7% vendor, 10% delivery
- **Habra** (Low competition): 12% vendor, 18% delivery

### 3. **Promotional Rates**
- **New City Launch**: 5% vendor, 8% delivery (temporary)
- **Established City**: 10% vendor, 15% delivery (standard)

### 4. **Premium Services**
- **Metro Cities**: Higher base delivery fee (₹30)
- **Tier-2 Cities**: Lower base delivery fee (₹15)

## 🎨 UI Features:

### Stats Cards:
- **Total Cities** - Number of cities with custom commissions
- **Avg Vendor Commission** - Average across all cities
- **Avg Delivery Commission** - Average across all cities

### Table Columns:
1. City name (with map pin icon)
2. Vendor commission rate (editable)
3. Delivery commission rate (editable)
4. Minimum order amount (editable, optional)
5. Base delivery fee (editable, optional)
6. Per km fee (editable, optional)
7. Status (Active/Inactive toggle)
8. Actions (Edit, Save, Cancel, Delete)

### Add Modal:
- City dropdown (only shows cities without commissions)
- Commission rate inputs with validation
- Optional settings inputs
- Active checkbox
- Add/Cancel buttons

## 🐛 Troubleshooting:

### Issue: City not showing in dropdown
**Solution:** City must be in `availableCities` list from `/api/v1/cities/available`

### Issue: Commission not applying
**Check:**
1. Is city commission active? (`isActive = true`)
2. Does city name match exactly? (case-insensitive)
3. Has backend been restarted after migration?

### Issue: Cannot edit commission
**Solution:** Ensure you're logged in as ADMIN role

## 📝 Future Enhancements:

1. **Time-based Commissions** - Different rates for peak/off-peak hours
2. **Category-based Commissions** - Different rates for food vs groceries
3. **Volume-based Tiers** - Lower commission for high-volume vendors
4. **Seasonal Rates** - Festival/holiday special rates
5. **Commission History** - Track rate changes over time
6. **Bulk Import/Export** - CSV upload for multiple cities
7. **Commission Analytics** - Revenue breakdown by city

## 🔐 Security:

- All modification endpoints require ADMIN role
- Public rate query endpoint is read-only
- Input validation on commission rates (0-100%)
- SQL injection protection via Prisma ORM

---

**Last Updated**: January 2, 2026, 11:41 PM IST
**Status**: ✅ Complete - Ready for Production Use
**Migration Required**: Yes - Run `npx prisma migrate dev`
