# 🗺️ GPS Tracking - Quick Reference

## API Endpoints

### Delivery Partner Endpoints (Authenticated)
```
POST   /api/v1/tracking/:deliveryId/start      - Start GPS tracking
POST   /api/v1/tracking/:deliveryId/location   - Update location
POST   /api/v1/tracking/:deliveryId/route      - Update route & ETA
POST   /api/v1/tracking/:deliveryId/stop       - Stop tracking
GET    /api/v1/tracking/active                 - Get active deliveries
```

### Public Endpoints (No Auth Required)
```
GET    /api/v1/tracking/:deliveryId            - Get delivery location
GET    /api/v1/tracking/:deliveryId/history    - Get location history
```

---

## Usage Examples

### Start Tracking (Delivery Partner)
```typescript
await trackingService.startTracking(deliveryId);
```

### Update Location (Delivery Partner)
```typescript
await trackingService.updateLocation(deliveryId, {
  latitude: 28.6139,
  longitude: 77.2090,
  speed: 25.5,
  heading: 180,
  accuracy: 10
});
```

### Get Tracking Data (Customer)
```typescript
const tracking = await trackingService.getDeliveryLocation(deliveryId);
// Returns: delivery location, ETA, route, partner details
```

---

## Component Usage

### Customer Web - DeliveryMap
```tsx
<DeliveryMap
  deliveryPartnerLocation={{
    latitude: 28.6139,
    longitude: 77.2090
  }}
  shopLocation={{
    latitude: 28.6100,
    longitude: 77.2000
  }}
  deliveryLocation={{
    latitude: 28.6200,
    longitude: 77.2100
  }}
  routePolyline="encoded_polyline_string"
  isTracking={true}
/>
```

### Delivery Web - Location Tracker Hook
```tsx
const { isTracking, currentLocation, startTracking, stopTracking } = useLocationTracker({
  deliveryId: 'delivery-uuid',
  enabled: true,
  updateInterval: 10000 // 10 seconds
});
```

---

## Environment Variables

### Customer Web
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Testing Checklist

### Backend
- [ ] Start tracking endpoint works
- [ ] Location updates are saved
- [ ] Route updates calculate ETA correctly
- [ ] Stop tracking endpoint works
- [ ] Active deliveries list is correct
- [ ] Public tracking endpoint returns data
- [ ] Location history is stored

### Customer Web
- [ ] Google Maps loads correctly
- [ ] Shop marker appears
- [ ] Delivery location marker appears
- [ ] Delivery partner marker appears (when tracking)
- [ ] Route polyline displays
- [ ] ETA updates in real-time
- [ ] Distance updates correctly
- [ ] Auto-refresh works (10s interval)
- [ ] Delivery partner info displays
- [ ] Contact button works

### Delivery Web
- [ ] GPS permission request works
- [ ] Start tracking button works
- [ ] Location updates send to backend
- [ ] GPS status banner shows
- [ ] Accuracy displays correctly
- [ ] Speed displays correctly
- [ ] Stop tracking button works
- [ ] Navigation buttons open Google Maps
- [ ] Contact buttons work
- [ ] Cleanup on unmount works

---

## Common Issues & Solutions

### Issue: Google Maps not loading
**Solution**: Check if `VITE_GOOGLE_MAPS_API_KEY` is set correctly in `.env`

### Issue: GPS permission denied
**Solution**: User must manually allow location permissions in browser settings

### Issue: Location not updating
**Solution**: Check if tracking is started and browser has location permissions

### Issue: Inaccurate location
**Solution**: Ensure device has GPS enabled and good signal

### Issue: High battery drain
**Solution**: Increase `updateInterval` in `useLocationTracker` hook

---

## Performance Tips

1. **Update Interval**: Default is 10s, increase for better battery life
2. **High Accuracy**: Can be disabled for less battery usage
3. **Cleanup**: Always stop tracking when component unmounts
4. **Caching**: Location history is cached to reduce API calls
5. **Debouncing**: Location updates are debounced to prevent spam

---

## Security Notes

- Public tracking endpoints don't require authentication
- Delivery partner endpoints require DELIVERY_PARTNER role
- Location data is stored with timestamps for audit
- GPS accuracy is logged for quality control
- No sensitive customer data in location records

---

## Future Enhancements

- [ ] WebSocket real-time broadcasts
- [ ] Geofencing for delivery zones
- [ ] Route optimization
- [ ] Traffic conditions
- [ ] Delivery time predictions
- [ ] Offline support
- [ ] Location caching
- [ ] Battery optimization modes

---

**Quick Links:**
- Full Documentation: `PHASE2_GPS_TRACKING_COMPLETE.md`
- Summary: `GPS_TRACKING_SUMMARY.md`
- Progress: `PHASE2_PROGRESS.md`
