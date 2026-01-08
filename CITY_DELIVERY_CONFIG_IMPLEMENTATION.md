# City-Specific Delivery Configuration - Implementation Complete

## Overview
Extended the city management system to support city-specific delivery configurations, allowing admins to set different delivery parameters for each city. Also added city dropdown selection for delivery partner registration.

## Features Implemented

### 1. Database Schema Updates

**Extended CityCommission Model:**
```prisma
model CityCommission {
  id                      String   @id @default(uuid())
  city                    String   @unique
  
  // Vendor commission (percentage of order subtotal)
  vendorCommissionRate    Float    @default(10.0)
  
  // Delivery partner commission (percentage of delivery fee)
  deliveryCommissionRate  Float    @default(15.0)
  
  // Optional: Minimum order amount for this city
  minOrderAmount          Float?
  
  // Delivery Configuration
  baseDeliveryFee         Float?   // Base delivery fee for this city
  perKmDeliveryFee        Float?   // Per km delivery fee for this city
  baseDistance            Float?   // Base distance in km (free delivery up to this distance)
  maxDeliveryRadius       Float?   // Maximum delivery radius in km
  
  // Tax configuration
  taxRate                 Float?   // Tax rate percentage for this city
  
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

**New Fields Added:**
- ✅ `baseDistance` - Free delivery up to this distance (km)
- ✅ `maxDeliveryRadius` - Maximum delivery radius (km)
- ✅ `taxRate` - Tax rate percentage for the city

### 2. Admin Panel - City Commissions Page

**File: `admin-panel/src/pages/CityCommissions.tsx`**

**New Features:**
- ✅ Added 3 new columns to the table:
  - Base Distance (km)
  - Max Radius (km)
  - Tax (%)
- ✅ Inline editing for all delivery configuration fields
- ✅ Form fields in Add City modal for new parameters
- ✅ Helper text explaining each field's purpose

**Updated Interface:**
```typescript
export interface CityCommission {
    id: string;
    city: string;
    vendorCommissionRate: number;
    deliveryCommissionRate: number;
    minOrderAmount?: number | null;
    baseDeliveryFee?: number | null;
    perKmDeliveryFee?: number | null;
    baseDistance?: number | null;           // NEW
    maxDeliveryRadius?: number | null;      // NEW
    taxRate?: number | null;                // NEW
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
```

### 3. Delivery Partner Registration

**File: `delivery-web/src/pages/Register.tsx`**

**Changes:**
- ✅ Changed city input from text field to dropdown
- ✅ Fetches cities from API on component mount
- ✅ Delivery partners can only select from admin-created cities
- ✅ Ensures data consistency across the platform

**Implementation:**
```tsx
// Fetch cities on mount
useEffect(() => {
    fetchCities();
}, []);

const fetchCities = async () => {
    const response = await fetch(`${API_URL}/cities/all`);
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
        setCities(result.data.map((city: any) => city.name));
    }
};

// City dropdown
<select
    required
    value={formData.city}
    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
>
    <option value="">Select City</option>
    {cities.map((city) => (
        <option key={city} value={city}>{city}</option>
    ))}
</select>
```

## Configuration Fields Explained

### Delivery Configuration

1. **Base Delivery Fee (₹)**
   - Fixed charge for every delivery
   - Example: ₹20 base fee

2. **Per Km Delivery Fee (₹)**
   - Additional charge per kilometer
   - Example: ₹5 per km

3. **Base Distance (km)**
   - Free delivery up to this distance
   - Example: First 2 km free, then charged per km
   - Formula: `Fee = BaseFee + max(0, Distance - BaseDistance) × PerKmFee`

4. **Max Delivery Radius (km)**
   - Maximum distance for delivery
   - Orders beyond this radius are rejected
   - Example: 10 km maximum radius

5. **Tax Rate (%)**
   - Tax percentage for the city
   - Applied to order total
   - Example: 5% GST

### Commission Configuration

6. **Vendor Commission Rate (%)**
   - Platform commission on vendor earnings
   - Example: 10% commission

7. **Delivery Commission Rate (%)**
   - Platform commission on delivery fee
   - Example: 15% commission

8. **Minimum Order Amount (₹)**
   - Minimum order value required
   - Example: ₹100 minimum order

## Usage Examples

### Example 1: Kolkata Configuration
```
City: Kolkata
Vendor Commission: 10%
Delivery Commission: 15%
Min Order Amount: ₹100
Base Delivery Fee: ₹20
Per Km Fee: ₹5
Base Distance: 2 km
Max Delivery Radius: 10 km
Tax Rate: 5%
```

**Delivery Fee Calculation:**
- Order within 2 km: ₹20 (base fee only)
- Order at 5 km: ₹20 + (5-2) × ₹5 = ₹35
- Order at 12 km: Rejected (exceeds max radius)

### Example 2: Siliguri Configuration
```
City: Siliguri
Vendor Commission: 8%
Delivery Commission: 12%
Min Order Amount: ₹50
Base Delivery Fee: ₹15
Per Km Fee: ₹4
Base Distance: 3 km
Max Delivery Radius: 15 km
Tax Rate: 5%
```

**Delivery Fee Calculation:**
- Order within 3 km: ₹15
- Order at 8 km: ₹15 + (8-3) × ₹4 = ₹35
- Order at 20 km: Rejected

## Files Modified

### Backend
- ✅ `backend/prisma/schema.prisma` - Extended CityCommission model

### Admin Panel
- ✅ `admin-panel/src/pages/CityCommissions.tsx` - Added new fields to UI
- ✅ `admin-panel/src/services/cityCommission.service.ts` - Updated interface

### Delivery Web
- ✅ `delivery-web/src/pages/Register.tsx` - City dropdown

## API Integration

The existing API endpoints already support these fields:

```typescript
// Get all city commissions (includes new fields)
GET /api/v1/city-commissions

// Get specific city commission
GET /api/v1/city-commissions/:city

// Create/Update city commission
PUT /api/v1/city-commissions/:city
{
  "vendorCommissionRate": 10,
  "deliveryCommissionRate": 15,
  "minOrderAmount": 100,
  "baseDeliveryFee": 20,
  "perKmDeliveryFee": 5,
  "baseDistance": 2,
  "maxDeliveryRadius": 10,
  "taxRate": 5,
  "isActive": true
}

// Delete city commission
DELETE /api/v1/city-commissions/:city
```

## Testing Checklist

### Admin Panel - City Commissions
- [ ] Open City Commissions page
- [ ] Click "Add City" button
- [ ] Fill in all delivery configuration fields
- [ ] Verify base distance and max radius fields work
- [ ] Verify tax rate field works
- [ ] Save and verify data is persisted
- [ ] Edit existing city commission
- [ ] Verify inline editing for new fields
- [ ] Check table displays all columns correctly

### Delivery Partner Registration
- [ ] Open delivery partner registration
- [ ] Navigate to step 2 (Vehicle Details)
- [ ] Verify city dropdown is populated
- [ ] Select a city from dropdown
- [ ] Complete registration
- [ ] Verify city is saved correctly

### Order Flow (Future Integration)
- [ ] Create order in a city with delivery config
- [ ] Verify delivery fee calculated using city settings
- [ ] Verify base distance is applied
- [ ] Verify max radius is enforced
- [ ] Verify tax rate is applied

## Benefits

1. **Flexibility**: Different cities can have different pricing
2. **Scalability**: Easy to expand to new cities with custom rates
3. **Control**: Admins have full control over city-specific settings
4. **Consistency**: All delivery partners and vendors use same city list
5. **Transparency**: Clear delivery fee calculation based on distance

## Future Enhancements

1. **Dynamic Pricing**: Time-based or demand-based pricing
2. **Zone-Based Pricing**: Different rates for different zones within a city
3. **Surge Pricing**: Automatic price adjustments during peak hours
4. **Promotional Rates**: Temporary discounts for specific cities
5. **Weather-Based Pricing**: Adjust fees based on weather conditions
6. **Holiday Pricing**: Special rates for holidays

## Migration Notes

- Database migration applied using `npx prisma db push`
- Existing city commissions will have `null` values for new fields
- Admins should update existing cities with delivery configuration
- No breaking changes - all new fields are optional

---

**Status**: ✅ **COMPLETE**  
**Date**: 2026-01-03  
**Impact**: High - Enables city-specific delivery pricing  
**Breaking Changes**: None - backward compatible
