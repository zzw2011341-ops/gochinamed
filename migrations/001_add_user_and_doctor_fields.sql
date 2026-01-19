-- Migration: Add gender enum and new user/doctor fields
-- Date: 2025-01-XX

-- Step 1: Create gender enum type
DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add gender column to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS gender gender;

-- Step 3: Add new travel preference columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS origin_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS destination_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN doctors.gender IS 'Doctor gender: male, female, or other';
COMMENT ON COLUMN users.origin_city IS 'User departure city mentioned in conversation';
COMMENT ON COLUMN users.destination_city IS 'User destination city mentioned in conversation';
COMMENT ON COLUMN users.budget IS 'User budget for medical travel';
