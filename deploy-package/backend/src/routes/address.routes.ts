import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createAddress, getMyAddresses, updateAddress, deleteAddress } from '../controllers/address.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
// router.use(authorize('CUSTOMER')); // Authorization removed to allow all authenticated users
// For now, let's assume Vendors/Admins also have addresses (e.g. for their profile), so maybe just authenticate.
// But the schema links Address to User, so any User can have an address.
// However, the checkout flow is primarily for Customers.
// Let's remove the strict 'CUSTOMER' check if we want Vendors to buy things too, but typically 'CUSTOMER' role is for buying.
// Let's keep it open to any authenticated user for utility.

router.post('/', createAddress);
router.get('/', getMyAddresses);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
