-- Check admin user roles
SELECT id, name, phone, email, roles, "isActive", "isVerified" 
FROM "User" 
WHERE phone = '+919999999999' OR email = 'admin@winadeal.com';

-- If you need to fix the admin user's roles, run this:
-- UPDATE "User" 
-- SET roles = ARRAY['ADMIN']::text[]
-- WHERE phone = '+919999999999' OR email = 'admin@winadeal.com';
