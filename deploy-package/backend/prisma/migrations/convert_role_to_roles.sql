-- Migration: Convert role to roles array
-- This migration converts the existing single 'role' field to a 'roles' array

-- Step 1: Add the new roles column as an array
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[];

-- Step 2: Migrate existing data - convert single role to array with one element
UPDATE "User" SET "roles" = ARRAY[role]::"UserRole"[];

-- Step 3: Make roles column NOT NULL (since every user must have at least one role)
ALTER TABLE "User" ALTER COLUMN "roles" SET NOT NULL;

-- Step 4: Drop the old role column
ALTER TABLE "User" DROP COLUMN "role";

-- Step 5: Drop the old index on role
DROP INDEX IF EXISTS "User_role_idx";
