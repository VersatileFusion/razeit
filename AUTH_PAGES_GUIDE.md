# Razeit Authentication Pages Guide

## Overview
I've created beautiful sign-in and sign-up pages that match your gaming theme with extensive console logging for backend connection tracking.

## Files Created
- `public/en/signin.html` - Sign In page
- `public/en/signup.html` - Sign Up page

## How to Access

### Start your server:
```bash
npm start
# or
node server.js
```

### Access the pages:
- Sign In: `http://localhost:5000/en/signin.html`
- Sign Up: `http://localhost:5000/en/signup.html`

## Features

### 🎨 Design Features
- ✅ Matches your existing gaming theme (Razeit style)
- ✅ Dark theme with neon accents (#ff0054 pink/red)
- ✅ Same fonts: Goldman, Poppins, Rajdhani
- ✅ Responsive design for all devices
- ✅ Gaming background with overlay
- ✅ Smooth animations and transitions
- ✅ Back to Home button
- ✅ Password strength indicator (Sign Up)

### 📊 Console Logging
Both pages include extensive console logging that tracks:

#### Sign Up Page Logs:
```
🎮 Razeit Sign Up Page Loaded
📡 API URL: http://localhost:5000/api
✏️ firstName field changed: [value]
✏️ lastName field changed: [value]
✏️ username field changed: [value]
✏️ email field changed: [value]
✏️ password field changed: [HIDDEN]
🔒 Password strength: Weak/Medium/Strong
🔍 Validating form data...
✅ Form validation passed
📤 Sending registration request...
📊 Status Code: 201
📊 Status Text: Created
📦 Response Data: {...}
✅ Registration successful!
🔄 Redirecting to sign in page...
```

#### Sign In Page Logs:
```
🎮 Razeit Sign In Page Loaded
📡 API URL: http://localhost:5000/api
✏️ Login field changed: [value]
✏️ Password field changed: [HIDDEN]
📝 Form submitted
📤 Sending login request to backend
👤 Login: user@example.com
🔒 Password: [HIDDEN]
🌐 Endpoint: http://localhost:5000/api/auth/login
⏳ Waiting for response...
📥 Response received
📊 Status Code: 200
📊 Status Text: OK
📦 Response Data: {...}
✅ Login successful!
🎫 Token received: YES
👤 User Data: {...}
💾 Token saved to localStorage
🔄 Redirecting to homepage...
```

#### Error Logs:
```
❌ Login failed
💥 Request failed with error:
Error Type: TypeError
Error Message: Failed to fetch
💡 Tip: Make sure your backend server is running on http://localhost:5000/api
```

## Backend Endpoints Used

### Sign Up
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "username": "gamer123",
    "email": "user@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }
  ```

### Sign In
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "login": "user@example.com",
    "password": "password123"
  }
  ```

## Testing Steps

### 1. Test Sign Up
1. Open browser console (F12)
2. Navigate to `http://localhost:5000/en/signup.html`
3. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Username: testgamer123
   - Email: test@example.com
   - Password: Test123!
   - Confirm Password: Test123!
4. Watch console logs as you type
5. Click "Create Account"
6. Watch the request/response logs
7. On success, automatically redirects to signin.html

### 2. Test Sign In
1. Navigate to `http://localhost:5000/en/signin.html`
2. Fill in the form:
   - Login: test@example.com (or testgamer123)
   - Password: Test123!
3. Watch console logs
4. Click "Sign In"
5. Watch the authentication flow
6. On success, token is saved to localStorage and redirects to index.html

### 3. Test Error Handling
**Backend Not Running:**
- Console will show: "Failed to fetch" error
- Alert will show: "Backend server is not running or not accessible"

**Invalid Credentials:**
- Console will show: "Login failed" with error message
- Alert will show: "Invalid credentials"

**Validation Errors:**
- Console will show validation details
- Alert will show specific error messages

## Form Validations

### Sign Up Validations:
- ✅ First Name: Required
- ✅ Last Name: Required
- ✅ Username: 3-20 characters, alphanumeric + underscore only
- ✅ Email: Valid email format
- ✅ Password: Minimum 6 characters
- ✅ Passwords must match
- ✅ Phone: Optional

### Sign In Validations:
- ✅ Login: Required (accepts email/username/phone)
- ✅ Password: Required

## Stored Data

After successful login, the following is stored in localStorage:
- `authToken` - JWT token for authentication
- `userData` - User profile information

You can check this in browser console:
```javascript
localStorage.getItem('authToken')
localStorage.getItem('userData')
```

## Customization

### Change API URL
In both files, modify the API_URL constant:
```javascript
const API_URL = 'http://your-api-url.com/api';
```

### Change Styling
All styles are in the `<style>` section of each HTML file. Key colors:
- Primary: `#ff0054` (pink/red)
- Secondary: `#ff4081` (lighter pink)
- Background: `rgba(15, 15, 15, 0.95)` (dark)
- Text: `#ffffff` (white)
- Muted: `#a0a0a0` (gray)

## Troubleshooting

### Console shows "Failed to fetch"
- ✅ Make sure your backend server is running
- ✅ Check that MongoDB is connected
- ✅ Verify the API_URL matches your server URL

### "User already exists" error
- ✅ Try a different username or email
- ✅ Check your database for existing users

### Password validation errors
- ✅ Make sure password is at least 6 characters
- ✅ Ensure passwords match (sign up only)

### Styling looks different
- ✅ Clear browser cache
- ✅ Check that all CSS files are loading
- ✅ Verify paths to assets are correct

## Browser Support
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

## Next Steps
You can enhance these pages by adding:
- Email verification flow
- Forgot password functionality
- Social login (Steam, Discord, etc.)
- Two-factor authentication (2FA)
- Remember me checkbox
- Terms & Conditions checkbox

---

**Note:** Make sure your MongoDB is running and your backend server is started before testing!

