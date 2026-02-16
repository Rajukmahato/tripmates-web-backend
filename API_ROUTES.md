# API Routes Documentation

## Base URL
```
http://localhost:5050
```

## Authentication Header Format
```
Authorization: Bearer <jwt-token>
```

---

## Authentication Routes (`/api/auth`)

### POST `/api/auth/register`
Register a new user.

**Auth Required:** No

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "phoneNumber": "9876543210",
  "password": "Test@123",
  "confirmPassword": "Test@123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registered Successfully",
  "data": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "9876543210",
    "role": "user",
    "createdAt": "2026-02-16T00:00:00.000Z",
    "updatedAt": "2026-02-16T00:00:00.000Z"
  }
}
```

---

### POST `/api/auth/login`
Login user and receive JWT token.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Test@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login Successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "9876543210",
    "role": "user"
  }
}
```

---

### POST `/api/auth/forgot-password` ✨ NEW
Request password reset email.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent"
}
```

**Notes:**
- Sends password reset email with token link
- Token expires in 1 hour
- Returns generic message for security (doesn't reveal if email exists)

---

### POST `/api/auth/reset-password` ✨ NEW
Reset password using token from email.

**Auth Required:** No

**Request Body:**
```json
{
  "token": "reset-token-from-email-link",
  "password": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Password Requirements:**
- Minimum 6 characters
- At least one uppercase letter
- At least one number

---

### PUT `/api/auth/:id`
Update user's own profile.

**Auth Required:** Yes (User must update their own profile only)

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "phoneNumber": "9876543210",
  "bio": "My bio",
  "location": "New York"
}
```

**With File Upload:**
```
Content-Type: multipart/form-data

Fields:
- fullName (optional)
- phoneNumber (optional)
- bio (optional)
- location (optional)
- profileImage (file, optional)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id",
    "fullName": "Updated Name",
    "email": "user@example.com",
    "phoneNumber": "9876543210",
    "bio": "My bio",
    "location": "New York",
    "profileImagePath": "/uploads/profiles/user_id.jpg",
    "role": "user"
  }
}
```

---

## User Routes (`/api/user`)

### GET `/api/user/profile/:userId`
Get user profile by ID.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "9876543210",
    "bio": "My bio",
    "location": "New York",
    "profileImagePath": "/uploads/profiles/user_id.jpg",
    "role": "user",
    "createdAt": "2026-02-16T00:00:00.000Z",
    "updatedAt": "2026-02-16T00:00:00.000Z"
  }
}
```

---

### PUT `/api/user/profile/:userId`
Update user profile.

**Auth Required:** Yes

**Request Body:** Same as `PUT /api/auth/:id`

---

## Admin Routes (`/api/admin`)

**All admin routes require:**
- Authentication (JWT token)
- Admin role

---

### POST `/api/admin/users`
Create new user as admin.

**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "fullName": "New User",
  "email": "newuser@example.com",
  "phoneNumber": "9876543210",
  "password": "Test@123",
  "bio": "User bio",
  "location": "City"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "fullName": "New User",
    "email": "newuser@example.com",
    "phoneNumber": "9876543210",
    "role": "user"
  }
}
```

---

### GET `/api/admin/users` 📄 Paginated
Get all users with pagination.

**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Example Request:**
```
GET /api/admin/users?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "fullName": "User 1",
      "email": "user1@example.com",
      "phoneNumber": "9876543210",
      "role": "user",
      "createdAt": "2026-02-16T00:00:00.000Z"
    },
    {
      "_id": "user_id_2",
      "fullName": "User 2",
      "email": "user2@example.com",
      "phoneNumber": "9876543211",
      "role": "user",
      "createdAt": "2026-02-16T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50,
    "limit": 10
  }
}
```

---

### GET `/api/admin/users/:id`
Get user by ID (admin access).

**Auth Required:** Yes (Admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "9876543210",
    "bio": "My bio",
    "location": "New York",
    "role": "user",
    "createdAt": "2026-02-16T00:00:00.000Z",
    "updatedAt": "2026-02-16T00:00:00.000Z"
  }
}
```

---

### PUT `/api/admin/users/:id`
Update user by ID (admin can change role).

**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "email": "newemail@example.com",
  "phoneNumber": "9876543210",
  "bio": "Updated bio",
  "location": "Updated location",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "user_id",
    "fullName": "Updated Name",
    "email": "newemail@example.com",
    "phoneNumber": "9876543210",
    "role": "admin"
  }
}
```

---

### DELETE `/api/admin/users/:id`
Delete user by ID.

**Auth Required:** Yes (Admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation error details"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "No token provided" // or "Invalid token"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Admin access required" // or "You can only update your own profile"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Email already in use" // or "Phone Number already in use"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Testing

Run tests with:
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

**Test Coverage:** 53 integration test cases covering all endpoints.

---

## Environment Variables

See `.env.example` for required configuration:
- `PORT` - Server port (default: 5050)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_HOST` - SMTP host for sending emails
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - Email account username
- `EMAIL_PASSWORD` - Email account password (use app password for Gmail)
- `EMAIL_FROM` - From email address
- `FRONTEND_URL` - Frontend URL for reset password links
