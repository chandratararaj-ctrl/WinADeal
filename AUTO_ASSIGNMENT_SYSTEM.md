# Auto-Assignment System Documentation

## Overview

The WinADeal platform now features a fully automated delivery partner assignment system. Vendors no longer need to manually assign delivery partners - the system automatically finds and assigns the best available delivery partner for each order.

## Core Features

### 1. **Hybrid Assignment Strategy**

The system uses a two-tier approach:

#### **Tier 1: Exclusive Assignment (Primary)**
- System selects the best delivery partner based on:
  - **Distance** (70% weight): Closest to pickup location
  - **Rating** (20% weight): Higher rated partners preferred
  - **Experience** (10% weight): More deliveries = higher priority
- Sends exclusive request with **15-second response window**
- If rejected/timed out, tries next best partner
- Maximum **3 exclusive attempts**

#### **Tier 2: Broadcast Mode (Fallback)**
- If all exclusive attempts fail, order becomes visible to ALL nearby partners
- **First to accept** gets the order
- **5-minute broadcast window**
- Ensures no order goes unassigned

### 2. **Penalty System**

To discourage frivolous rejections:
- **₹10 penalty** per rejection
- Tracked in `DeliveryPartner.penaltyAmount`
- Visible in delivery partner's penalty summary
- Deducted from future payouts

### 3. **Smart Partner Selection**

Partners must meet ALL criteria:
- ✅ Online (`isOnline = true`)
- ✅ Verified (`isVerified = true`)
- ✅ Same city as shop
- ✅ Within 10km radius (configurable)
- ✅ Has current location data

## Database Schema

### New Models

#### `DeliveryRequest`
```prisma
model DeliveryRequest {
  id                String          @id @default(uuid())
  orderId           String
  deliveryPartnerId String
  status            RequestStatus   @default(PENDING)
  
  createdAt         DateTime        @default(now())
  expiresAt         DateTime
  respondedAt       DateTime?
  
  isExclusive       Boolean         @default(true)
  attemptNumber     Int             @default(1)
  
  penaltyApplied    Boolean         @default(false)
  penaltyAmount     Float           @default(0)
}
```

#### `RequestStatus` Enum
```prisma
enum RequestStatus {
  PENDING    // Waiting for response
  ACCEPTED   // Partner accepted
  REJECTED   // Partner rejected
  TIMED_OUT  // No response within timeout
  EXPIRED    // Order assigned to someone else
}
```

### Updated Models

#### `DeliveryPartner` - Added Fields
```prisma
// Current location for distance calculation
currentLatitude  Float?
currentLongitude Float?
lastLocationUpdate DateTime?

// Penalty tracking
rejectionCount  Int       @default(0)
penaltyAmount   Float     @default(0.0)
```

## API Endpoints

### For Delivery Partners

#### 1. Get Pending Requests
```http
GET /api/v1/delivery-requests/pending
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "req-123",
      "orderId": "order-456",
      "order": {
        "orderNumber": "ORD-1234567890",
        "deliveryFee": 50,
        "shop": {
          "name": "Pizza Palace",
          "latitude": 12.9716,
          "longitude": 77.5946
        },
        "deliveryAddress": {
          "addressLine1": "123 Main St",
          "latitude": 12.9800,
          "longitude": 77.6000
        }
      },
      "expiresAt": "2026-01-02T22:30:00Z",
      "isExclusive": true
    }
  ]
}
```

#### 2. Accept Request
```http
POST /api/v1/delivery-requests/:requestId/accept
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Request accepted successfully"
}
```

#### 3. Reject Request
```http
POST /api/v1/delivery-requests/:requestId/reject
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected"
}
```

**Note:** ₹10 penalty will be applied automatically.

#### 4. Get Request History
```http
GET /api/v1/delivery-requests/history?page=1&limit=20
Authorization: Bearer {token}
```

#### 5. Get Penalty Summary
```http
GET /api/v1/delivery-requests/penalties
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRejections": 5,
    "totalPenalty": 50,
    "recentRejections": [...]
  }
}
```

#### 6. Update Location
```http
POST /api/v1/delivery-requests/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

## How It Works

### Flow Diagram

```
Order Created (PLACED)
         ↓
Vendor Accepts (ACCEPTED)
         ↓
Auto-Assignment Triggered
         ↓
    ┌────────────────────────┐
    │ Find Eligible Partners │
    │ - Online & Verified    │
    │ - Same City            │
    │ - Within 10km          │
    │ - Sort by Priority     │
    └────────────────────────┘
         ↓
    ┌─────────────────────────┐
    │ EXCLUSIVE MODE          │
    │ Try Top 3 Partners      │
    │ 15s timeout each        │
    └─────────────────────────┘
         ↓
    Partner Accepts? ──YES──→ Delivery Assigned ✅
         ↓ NO
    All 3 Rejected/Timeout?
         ↓ YES
    ┌─────────────────────────┐
    │ BROADCAST MODE          │
    │ Show to All Partners    │
    │ 5min window             │
    │ First Accept Wins       │
    └─────────────────────────┘
         ↓
    Partner Accepts? ──YES──→ Delivery Assigned ✅
         ↓ NO
    Timeout → Notify Admin ⚠️
```

### Priority Calculation

```javascript
priorityScore = (distanceScore * 0.7) + (ratingScore * 0.2) + (deliveryScore * 0.1)

where:
  distanceScore = distance / maxRadius
  ratingScore = (5 - rating) / 5
  deliveryScore = min(totalDeliveries, 100) / 100

Lower score = Higher priority
```

## WebSocket Events

### Events Emitted to Delivery Partners

#### `delivery-request`
Sent when a new delivery request is created.

```javascript
{
  requestId: "req-123",
  orderId: "order-456",
  orderNumber: "ORD-1234567890",
  pickupLocation: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  deliveryLocation: {
    latitude: 12.9800,
    longitude: 77.6000
  },
  deliveryFee: 50,
  expiresAt: "2026-01-02T22:30:00Z",
  isExclusive: true
}
```

## Configuration

All timeouts and penalties are configurable in `autoAssignment.service.ts`:

```typescript
const CONFIG = {
    EXCLUSIVE_TIMEOUT_SECONDS: 15,      // Time for exclusive requests
    MAX_EXCLUSIVE_ATTEMPTS: 3,          // Number of partners to try
    BROADCAST_TIMEOUT_SECONDS: 300,     // Broadcast window (5 min)
    REJECTION_PENALTY_AMOUNT: 10,       // Penalty in ₹
    MAX_SEARCH_RADIUS_KM: 10            // Search radius
};
```

## Frontend Integration

### Delivery Partner App

#### 1. Listen for Requests
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});

socket.on('delivery-request', (request) => {
  // Show notification/modal
  showDeliveryRequest(request);
  
  // Start countdown timer
  startTimer(request.expiresAt);
});
```

#### 2. Accept/Reject
```typescript
// Accept
const acceptRequest = async (requestId: string) => {
  const response = await api.post(`/delivery-requests/${requestId}/accept`);
  if (response.data.success) {
    // Navigate to delivery screen
    navigateToDelivery();
  }
};

// Reject
const rejectRequest = async (requestId: string) => {
  const response = await api.post(`/delivery-requests/${requestId}/reject`);
  // Show penalty warning
  showPenaltyNotification();
};
```

#### 3. Update Location (Background Service)
```typescript
// Update location every 30 seconds when online
setInterval(async () => {
  const position = await getCurrentPosition();
  await api.post('/delivery-requests/location', {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  });
}, 30000);
```

### Vendor Panel

**No changes needed!** The vendor simply accepts the order, and the system handles the rest.

```typescript
// Existing code - just accept order
const acceptOrder = async (orderId: string) => {
  await api.put(`/orders/${orderId}/status`, { status: 'ACCEPTED' });
  // Auto-assignment happens automatically on backend
};
```

## Testing

### Test Scenarios

1. **Happy Path**
   - Create order
   - Vendor accepts
   - First delivery partner accepts within 15s
   - ✅ Delivery assigned

2. **Rejection Scenario**
   - First partner rejects
   - ₹10 penalty applied
   - Second partner accepts
   - ✅ Delivery assigned

3. **Timeout Scenario**
   - First partner doesn't respond
   - After 15s, request times out
   - Second partner gets request
   - ✅ Delivery assigned

4. **Broadcast Mode**
   - 3 exclusive attempts fail
   - Broadcast to all partners
   - First to accept wins
   - ✅ Delivery assigned

5. **No Partners Available**
   - No online partners in radius
   - ⚠️ Admin notified (TODO: implement notification)

## Maintenance

### Cleanup Job

Run periodically to mark expired requests:

```typescript
import { cleanupExpiredRequests } from './services/autoAssignment.service';

// Run every minute
setInterval(async () => {
  await cleanupExpiredRequests();
}, 60000);
```

### Monitoring

Key metrics to track:
- Average assignment time
- Rejection rate per partner
- Broadcast mode usage rate
- Failed assignment rate

## Future Enhancements

1. **Dynamic Timeouts**
   - Adjust based on time of day
   - Longer timeouts during peak hours

2. **Partner Preferences**
   - Allow partners to set preferred areas
   - Preferred shop types

3. **Batch Assignment**
   - Assign multiple nearby orders to same partner

4. **Predictive Assignment**
   - Pre-assign based on partner's current location and route

5. **Admin Dashboard**
   - Real-time assignment monitoring
   - Manual override capability

## Troubleshooting

### Common Issues

**Issue:** Partners not receiving requests
- ✅ Check if partner is online (`isOnline = true`)
- ✅ Check if partner is verified (`isVerified = true`)
- ✅ Check if partner has updated location
- ✅ Check WebSocket connection

**Issue:** All requests timing out
- ✅ Check timeout configuration
- ✅ Check if partners are within radius
- ✅ Check WebSocket server status

**Issue:** Penalties not applying
- ✅ Check `penaltyApplied` flag in database
- ✅ Verify `applyRejectionPenalty` function is called

## Support

For issues or questions:
- Check logs: `console.log` statements prefixed with `[AUTO-ASSIGN]`
- Database queries: Check `DeliveryRequest` table
- WebSocket: Monitor `delivery-request` events

---

**Last Updated:** January 2, 2026
**Version:** 1.0.0
