# Signup Form Update - Database Schema Alignment

## Changes Made

Updated the signup flow to match your database schema (User table with `username`, `DOB`, `sex`, `password_encrypted`, `salt_random_value`).

### 1. **API Route Updated** (`app/api/auth/signup/route.ts`)

**From:**

```typescript
body: { firstName, lastName, email, password, userType }
INSERT INTO User (username, password_encrypted, salt_random_value, email, DOB, sex)
VALUES (?, ?, ?, ?, null, 'Other')
```

**To:**

```typescript
body: { username, dateOfBirth, sex, password, userType }
INSERT INTO User (username, password_encrypted, salt_random_value, DOB, sex)
VALUES (?, ?, ?, ?, ?)
```

- ✅ User provides their own username (no auto-generation)
- ✅ Date of birth is required and stored in `DOB` column
- ✅ Sex/Gender is required and stored in `sex` column
- ✅ No email column used (matches schema)

### 2. **Signup Form Updated** (`app/signup/page.tsx`)

New form fields with **real-time validation**:

#### New Fields:

1. **Username** - Text input (required)
2. **Date of Birth** - Date picker (required)
3. **Sex** - Dropdown select: Male, Female, Other (required)
4. **Password** - With show/hide toggle (required)
5. **Confirm Password** - With show/hide toggle and match indicator (required)

#### Real-Time Password Strength Validation:

- ✅ At least 8 characters
- ✅ At least one UPPERCASE letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one digit (0-9)
- ✅ At least one special character (!@#$%^&\*)

Each requirement shows as:

- **Green checkmark** ✓ when met
- **Gray text** when not met
- Counter: "Password Strength: 3/5"

#### Password Confirmation:

- Shows "✓ Passwords match" in green when passwords match
- Shows "✗ Passwords do not match" in red when they don't

#### Submit Button:

- Disabled if:
  - Password doesn't meet all requirements
  - Passwords don't match
  - Loading

### 3. **Auth Context Updated** (`lib/auth-context.tsx`)

Updated signup function signature:

**From:**

```typescript
signup(firstName, lastName, email, password, userType);
```

**To:**

```typescript
signup(username, dateOfBirth, sex, password, userType);
```

## Testing the New Signup

1. **Go to signup page:** `http://localhost:3000/signup`

2. **Fill in form:**

   - Username: `john_doe` (any username)
   - Date of Birth: Select a date
   - Sex: Choose one (Male, Female, Other)
   - Password: `Test@1234` (or similar with all requirements)
   - Confirm Password: Enter same password

3. **Watch real-time validation:**

   - As you type password, see requirements light up green
   - Confirm password field shows match status
   - Submit button enables when everything is valid

4. **Click "Join us"**
   - Account created successfully
   - Redirect to login page after 2 seconds

## Database Integration

The form now perfectly matches your User table schema:

```sql
INSERT INTO User (username, password_encrypted, salt_random_value, DOB, sex)
VALUES ('john_doe', '[hashed_password]', '[salt_bytes]', '1990-01-15', 'Male')
```

**No more NULL errors!** ✅

## Features

### Show/Hide Password Toggle

- Click eye icon to toggle between password and text visibility
- Helpful for confirming password entry
- Works on both password and confirm password fields

### Real-Time Validation

- Green checkmarks appear as requirements are met
- Immediate feedback while typing
- Password strength counter (e.g., "3/5 requirements met")

### Match Confirmation

- Confirm password field shows match status
- Prevents typos by letting user verify before submitting
- Red text if passwords don't match, green if they do

### Smart Submit Button

- Disabled until:
  - All password requirements met
  - Passwords match
  - Loading complete

## What's Removed

- ❌ First name field
- ❌ Last name field
- ❌ Email field
- ❌ Auto-generated username

## What's Added

- ✅ Username field (user-provided)
- ✅ Date of birth picker
- ✅ Sex/Gender dropdown
- ✅ Confirm password field
- ✅ Real-time password strength indicator
- ✅ Show/hide password toggles
- ✅ Password match indicator
- ✅ Smart form validation

## Next Steps

1. Test the signup flow: `http://localhost:3000/signup`
2. Create a test account with:
   - Username: `testuser`
   - DOB: Any date
   - Sex: Any option
   - Password: `SecurePass@123`
3. Login with username and password at `http://localhost:3000`
4. Verify session persists on refresh

## Error Handling

If you get an error like "Username already taken", just choose a different username.

All other database errors will display clear messages at the top of the form.
