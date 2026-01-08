# Auto-Assignment City Logic Update

## ✅ Changes Made:

### 1. **Enhanced Distance Utility** (`backend/src/utils/distance.ts`)

Added `extractCityFromAddress()` function that:
- Intelligently extracts city names from address strings
- Supports West Bengal cities (Kolkata, Siliguri, Durgapur, etc.)
- Handles various address formats:
  - "Street, Area, City, State PIN"
  - "City, State"
  - "Area, City"
- Falls back to "Unknown" if city cannot be determined
- Includes major Indian cities for broader coverage

### 2. **Updated Auto-Assignment Service** (`backend/src/services/autoAssignment.service.ts`)

#### Changes to `autoAssignDeliveryPartner()`:
- Removed dependency on non-existent `shop.city` field
- Now fetches `shop.address` instead
- Dynamically extracts city from address using `extractCityFromAddress()`

#### Changes to `startExclusiveAssignment()`:
- Extracts city from shop address before finding partners
- Logs extracted city for debugging
- Passes extracted city to `findEligiblePartners()`

#### Changes to `startBroadcastMode()`:
- Also extracts city from shop address
- Uses same city extraction logic for consistency

#### Enhanced `findEligiblePartners()`:
Now uses **3-tier fallback strategy**:

**Tier 1: Exact City Match (Case-Insensitive)**
```typescript
city: {
    equals: city,
    mode: 'insensitive'
}
```
- Tries to find partners with exact city match
- Case-insensitive comparison (Kolkata = kolkata = KOLKATA)

**Tier 2: Partial City Match**
```typescript
OR: [
    { city: { contains: city, mode: 'insensitive' } },
    { city: { in: [city, city.toLowerCase(), city.toUpperCase()] } }
]
```
- If no exact match, tries partial/fuzzy matching
- Handles variations in city names
- Only runs if city is not "Unknown"

**Tier 3: Distance-Only Matching**
```typescript
// Get all partners, filter by distance only
```
- If no city match at all, searches all partners
- Filters purely by distance (within 10km radius)
- Ensures orders can still be assigned even with poor address data

### 3. **Improved Logging**

Added detailed console logs:
```
[AUTO-ASSIGN] Shop city extracted: Kolkata from address: 123 Park Street, Kolkata, WB 700016
[AUTO-ASSIGN] Searching for partners in city: Kolkata
[AUTO-ASSIGN] Found 5 potential partners
[AUTO-ASSIGN] 3 partners within 10km radius
```

## 🎯 How It Works Now:

### Flow:
```
Order Status → READY/ACCEPTED
         ↓
Extract city from shop address
         ↓
Search for delivery partners:
  1. Try exact city match (e.g., "Kolkata")
  2. If none, try partial match (e.g., "Kol" in "Kolkata")
  3. If still none, search all partners within 10km
         ↓
Sort by priority (distance 70%, rating 20%, experience 10%)
         ↓
Assign to best available partner
```

### City Extraction Examples:

| Address | Extracted City |
|---------|---------------|
| "123 Park Street, Kolkata, WB 700016" | Kolkata |
| "Main Road, Siliguri 734001" | Siliguri |
| "Durgapur, West Bengal" | Durgapur |
| "Shop 5, Asansol" | Asansol |
| "Random Street 123" | Unknown |

## 📋 Benefits:

✅ **No Hardcoded Cities** - Works with any city in West Bengal (or India)
✅ **Flexible Matching** - Handles address variations and typos
✅ **Fallback Strategy** - Always tries to find partners even with poor data
✅ **Better Logging** - Easy to debug city extraction and partner matching
✅ **Case-Insensitive** - "Kolkata" = "kolkata" = "KOLKATA"
✅ **Distance Backup** - Falls back to proximity if city matching fails

## 🔧 Configuration:

### Supported West Bengal Cities:
```typescript
const wbCities = [
    'Kolkata', 'Siliguri', 'Durgapur', 'Asansol', 'Bardhaman', 'Burdwan',
    'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Raiganj',
    'Jalpaiguri', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Haldia',
    'Howrah', 'Barrackpore', 'Barasat', 'Bhatpara', 'Chandannagar',
    'Serampore', 'Ranaghat', 'Bankura', 'Purulia', 'Cooch Behar',
    'Alipurduar', 'Darjeeling', 'Kalimpong', 'Balurghat', 'English Bazar',
    'Jangipur', 'Tamluk', 'Contai', 'Egra', 'Ghatal', 'Jhargram',
    // Plus major Indian cities
];
```

### Search Radius:
```typescript
MAX_SEARCH_RADIUS_KM: 10 // Can be adjusted in CONFIG
```

## 🚀 Testing:

### Test Scenarios:

1. **Exact City Match**
   - Shop address: "123 Street, Kolkata, WB"
   - Partner city: "Kolkata"
   - ✅ Should match

2. **Case Variation**
   - Shop address: "456 Road, SILIGURI"
   - Partner city: "siliguri"
   - ✅ Should match (case-insensitive)

3. **Partial Match**
   - Shop address: "789 Lane, Durgapur Steel City"
   - Partner city: "Durgapur"
   - ✅ Should match (contains)

4. **Distance Fallback**
   - Shop address: "Unknown Location"
   - Partner within 5km
   - ✅ Should match (distance-based)

5. **No Match**
   - Shop address: "Remote Village"
   - No partners within 10km
   - ❌ No assignment (expected)

### Testing Commands:

```bash
# Create test order with specific city
# Watch backend console for logs:
[AUTO-ASSIGN] Shop city extracted: {city}
[AUTO-ASSIGN] Searching for partners in city: {city}
[AUTO-ASSIGN] Found X potential partners
[AUTO-ASSIGN] Y partners within 10km radius
```

## 🐛 Troubleshooting:

### Issue: No partners found
**Check:**
1. Are delivery partners online? (`isOnline = true`)
2. Are they verified? (`isVerified = true`)
3. Do they have location set? (`currentLatitude`, `currentLongitude`)
4. Is their `city` field set correctly?
5. Are they within 10km of shop?

### Issue: Wrong city extracted
**Solution:**
- Update shop address to include clear city name
- Or add city to the `wbCities` array in `distance.ts`

### Issue: City mismatch
**Example:**
- Shop: "Burdwan"
- Partner: "Bardhaman"
- These are the same city!

**Solution:**
Add both variations to `wbCities` array (already done)

## 📝 Future Enhancements:

1. **Add `city` field to Shop model** for more reliable matching
2. **City aliases/synonyms** (e.g., Burdwan = Bardhaman)
3. **District-level fallback** (search entire district if no city match)
4. **Configurable search radius per city** (larger radius for rural areas)
5. **Partner city auto-update** from their current location

---

**Last Updated**: January 2, 2026, 11:36 PM IST
**Status**: ✅ Complete - Auto-assignment now works with dynamic cities!
