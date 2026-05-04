-- Add is_active column to users table
-- This allows disabling user logins without deleting accounts

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_active IS 'Controls whether user can login. FALSE = account disabled, TRUE = account active';

-- Set all existing users to active by default
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
