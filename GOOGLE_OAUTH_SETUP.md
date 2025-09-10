# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Banter application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" and then "New Project"
3. Enter project name (e.g., "Banter App") and click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and click on it
3. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for testing
   - Fill in required fields:
     - App name: "Banter"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `../auth/userinfo.email` and `../auth/userinfo.profile`
   - Add test users (your email addresses)

4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "Banter Web Client"
   - Authorized redirect URIs:
     - `http://localhost:5000/api/v1/oauth/google/callback`
     - `https://yourdomain.com/api/v1/oauth/google/callback` (for production)

5. Save the Client ID and Client Secret

## Environment Variables Setup

### Backend (.env)

Create a `.env` file in the `server` directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/oauth/google/callback
FRONTEND_REDIRECT_URL=http://localhost:3000/auth/callback

# Other required variables...
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

### Frontend (.env.local)

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Testing the Setup

1. Start the backend server: `npm run start:dev`
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:3000/login`
4. Click "Continue with Google"
5. Complete the OAuth flow

## Production Deployment

### Additional Steps for Production:

1. **Update Authorized Redirect URIs** in Google Cloud Console:
   - Add your production domain: `https://yourdomain.com/api/v1/oauth/google/callback`

2. **Update Environment Variables**:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/oauth/google/callback
   FRONTEND_REDIRECT_URL=https://yourdomain.com/auth/callback
   ```

3. **OAuth Consent Screen**:
   - Submit for verification if needed for production use
   - Update privacy policy and terms of service URLs

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Ensure the callback URL in Google Console exactly matches your backend URL
   - Check for trailing slashes and protocol (http vs https)

2. **"access_denied" error**:
   - Check if the user email is added to test users (for development)
   - Verify OAuth consent screen configuration

3. **Token not received**:
   - Check backend logs for errors
   - Verify environment variables are loaded correctly
   - Ensure frontend and backend URLs match

### Debugging Tips:

1. Check browser network tab for failed requests
2. Verify backend OAuth routes are accessible: `GET /api/v1/oauth/google`
3. Test callback URL directly in browser
4. Check server logs for OAuth-related errors

## Security Considerations

1. **Never commit credentials** to version control
2. **Use HTTPS** in production
3. **Regularly rotate** client secrets
4. **Limit scope** to only required permissions
5. **Validate tokens** on the backend
6. **Implement rate limiting** for OAuth endpoints

## Flow Diagram

```
User clicks "Continue with Google" 
    ↓
Frontend redirects to: /api/v1/oauth/google
    ↓
Backend redirects to: Google OAuth consent screen
    ↓
User approves permissions
    ↓
Google redirects to: /api/v1/oauth/google/callback
    ↓
Backend processes OAuth response, creates/finds user
    ↓
Backend redirects to: /auth/callback?token=jwt_token
    ↓
Frontend processes token and logs in user
    ↓
User redirected to: /chat
```

## API Endpoints

- `GET /api/v1/oauth/google` - Initiates Google OAuth flow
- `GET /api/v1/oauth/google/callback` - Handles OAuth callback
- `GET /auth/callback` - Frontend callback handler (Next.js page)