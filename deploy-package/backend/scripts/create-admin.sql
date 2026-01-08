-- Create Admin User for WinADeal
-- Password: admin123 (hashed with bcrypt)

INSERT INTO "User" (
    id,
    role,
    name,
    phone,
    email,
    "passwordHash",
    "isVerified",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'ADMIN',
    'Admin User',
    '+919876543210',
    'admin@winadeal.com',
    '$2a$10$YourHashedPasswordHere',  -- This will be replaced with actual hash
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (phone) DO NOTHING;

-- Note: The password hash above is a placeholder
-- To generate the actual hash for 'admin123', run:
-- bcrypt.hash('admin123', 10)
