# City-Based Shop Filtering - Implementation Summary

## ✅ What Was Implemented:

### 1. **Backend API Endpoints**

Created `/api/v1/cities` routes:

- **GET `/api/v1/cities/available`** - Returns list of cities where shops are registered
  - Extracts cities from shop addresses
  - Includes cities from verified delivery partners
  - Falls back to West Bengal cities if none found
  
- **GET `/api/v1/cities/shops?city={cityName}`** - Returns shops filtered by city
  - Case-insensitive city matching
  - Returns all shops if no city parameter provided
  - Only shows verified and open shops

### 2. **Frontend Components**

#### **City Store** (`customer-web/src/store/cityStore.ts`)
- Zustand store for managing selected city
- Persists city selection in localStorage
- Stores available cities list

#### **City Service** (`customer-web/src/services/city.service.ts`)
- API calls for fetching available cities
- API calls for fetching shops by city

#### **Updated Navbar** (`customer-web/src/components/Navbar.tsx`)
- Replaced hardcoded "Mumbai, 400002" with dynamic city selector
- Dropdown menu showing all available cities
- Highlights currently selected city
- Auto-fetches cities on app load
- Sets first city as default if none selected

#### **Updated Home Page** (`customer-web/src/pages/Home.tsx`)
- Fetches shops based on selected city
- Automatically refetches when city changes
- Falls back to all shops if no city selected

## 🎯 How It Works:

### User Flow:
```
1. User opens customer app
   ↓
2. Navbar fetches available cities from backend
   ↓
3. First city is auto-selected (or previously selected city from localStorage)
   ↓
4. Home page loads shops from selected city
   ↓
5. User clicks city dropdown in navbar
   ↓
6. Selects different city
   ↓
7. Page reloads with shops from new city
```

### City Extraction Logic:
```
Backend extracts cities from:
1. Shop addresses (parsing address strings)
2. Delivery partner city field
3. Falls back to default West Bengal cities:
   - Kolkata, Siliguri, Durgapur, Asansol
   - Bardhaman, Malda, Baharampur, Habra
```

## 📋 Features:

✅ **Dynamic City List** - Based on actual registered shops
✅ **Persistent Selection** - City choice saved in localStorage
✅ **Auto-Refresh** - Shops update when city changes
✅ **Fallback Cities** - Default West Bengal cities if no shops registered
✅ **Case-Insensitive Search** - Works with any case variation
✅ **Visual Feedback** - Selected city highlighted in dropdown
✅ **Mobile Responsive** - City selector hidden on mobile (can be added)

## 🚀 Testing:

1. **Open customer app** (http://localhost:5173)
2. **Check navbar** - Should show city dropdown instead of "Mumbai, 400002"
3. **Click city dropdown** - Should show list of available cities
4. **Select a city** - Page should reload with shops from that city
5. **Refresh page** - Selected city should persist

## 🔧 Configuration:

### Adding More Cities:

**Option 1: Register shops in new cities**
- When vendors register, they provide shop address
- City is automatically extracted and added to available cities

**Option 2: Update delivery partner cities**
- Update `DeliveryPartner.city` field in database
- Cities from delivery partners are included in available cities list

**Option 3: Modify fallback cities**
Edit `city.controller.ts`:
```typescript
// Add your cities here
cityList.push(
    'YourCity1',
    'YourCity2',
    'YourCity3'
);
```

## 📝 Database Considerations:

### For Better City Matching:

Consider adding a dedicated `city` field to the `Shop` model:

```prisma
model Shop {
  // ... existing fields
  city String? // Add this field
  // ... rest of fields
}
```

Then update the city extraction logic to use this field directly instead of parsing addresses.

## 🎨 UI Improvements (Future):

1. **Add city icons** - Show state/district icons next to city names
2. **Group by district** - Organize cities by West Bengal districts
3. **Search functionality** - Add search bar in city dropdown for large lists
4. **Recent cities** - Show recently selected cities at top
5. **Mobile city selector** - Add city selection for mobile view
6. **City-based delivery radius** - Show delivery coverage on map

## 🐛 Known Limitations:

1. **Address Parsing** - City extraction from address strings may not be 100% accurate
2. **Page Reload** - Changing city causes full page reload (could be optimized)
3. **No Mobile Selector** - City dropdown hidden on mobile screens
4. **No Empty State** - If no shops in selected city, shows empty list (could add message)

## 📞 Support:

If city selector doesn't show:
1. Check backend is running
2. Check `/api/v1/cities/available` endpoint
3. Check browser console for errors
4. Verify shops have addresses with city names

---

**Last Updated**: January 2, 2026, 11:30 PM IST
**Status**: ✅ Complete and Ready for Testing
