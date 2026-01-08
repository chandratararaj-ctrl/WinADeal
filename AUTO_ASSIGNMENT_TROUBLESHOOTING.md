# Auto-Assignment Troubleshooting Guide

## Issue: Auto-assignment not triggering

### Steps to Fix:

1. **Restart Backend Server**
   ```bash
   cd backend
   # Stop current server (Ctrl+C)
   npm start
   ```

2. **Verify Delivery Partner Setup**
   - ✅ Delivery partners have location set (currentLatitude, currentLongitude)
   - ✅ Delivery partners are online (isOnline = true)
   - ✅ Delivery partners are verified (isVerified = true)
   - ✅ Delivery partners are in the same city as the shop

3. **Test the Flow**
   - Create a new order from customer app
   - Vendor accepts the order (status changes to ACCEPTED)
   - Auto-assignment should trigger automatically
   - Check backend console for `[AUTO-ASSIGN]` logs

4. **Check Backend Logs**
   Look for these log messages:
   ```
   [AUTO-ASSIGN] Order {id} accepted by vendor, triggering auto-assignment
   [AUTO-ASSIGN] Starting assignment for order {id}
   [AUTO-ASSIGN] Found X eligible partners
   [AUTO-ASSIGN] Attempt 1: Sending request to partner {id}
   ```

5. **Verify WebSocket Connection**
   - Delivery partner must be logged in
   - Check browser console for WebSocket connection
   - Should see: `Socket Auth Success: {userId}`

6. **Manual Trigger (Testing)**
   If you need to manually trigger for an existing order:
   ```javascript
   // In backend console or create a script
   const { autoAssignDeliveryPartner } = require('./src/services/autoAssignment.service');
   autoAssignDeliveryPartner('ORDER_ID_HERE');
   ```

## Current Status:

✅ Database schema updated with DeliveryRequest model
✅ Auto-assignment service created
✅ Routes and controllers added
✅ WebSocket global.io configured
✅ Delivery partners have location data
✅ Delivery partners are online and verified

## Next Steps:

1. **Restart backend server** to load new code
2. **Create a NEW order** from customer app
3. **Vendor accepts** the order
4. **Watch delivery app** for incoming request notification
5. **Check backend logs** for auto-assignment activity

## Debugging:

If still not working, check:
- Backend server console for errors
- Network tab in browser for failed API calls
- WebSocket connection status in delivery app
- Database for DeliveryRequest entries

## Quick Test:

1. Open vendor panel → Orders
2. Find order with "Pending" status
3. Click "Accept Order"
4. Watch backend console for `[AUTO-ASSIGN]` logs
5. Delivery partner should receive notification within 15 seconds
