-- Quick Start: Add Initial Cities to WinADeal Platform
-- Run this SQL script in your PostgreSQL database to add common West Bengal cities

INSERT INTO "City" (id, name, state, "isActive", "displayOrder", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'Kolkata', 'West Bengal', true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'Siliguri', 'West Bengal', true, 2, NOW(), NOW()),
    (gen_random_uuid(), 'Durgapur', 'West Bengal', true, 3, NOW(), NOW()),
    (gen_random_uuid(), 'Asansol', 'West Bengal', true, 4, NOW(), NOW()),
    (gen_random_uuid(), 'Bardhaman', 'West Bengal', true, 5, NOW(), NOW()),
    (gen_random_uuid(), 'Malda', 'West Bengal', true, 6, NOW(), NOW()),
    (gen_random_uuid(), 'Baharampur', 'West Bengal', true, 7, NOW(), NOW()),
    (gen_random_uuid(), 'Habra', 'West Bengal', true, 8, NOW(), NOW()),
    (gen_random_uuid(), 'Kharagpur', 'West Bengal', true, 9, NOW(), NOW()),
    (gen_random_uuid(), 'Shantipur', 'West Bengal', true, 10, NOW(), NOW()),
    (gen_random_uuid(), 'Howrah', 'West Bengal', true, 11, NOW(), NOW()),
    (gen_random_uuid(), 'Jalpaiguri', 'West Bengal', true, 12, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify the cities were added
SELECT id, name, state, "isActive", "displayOrder" FROM "City" ORDER BY "displayOrder";
