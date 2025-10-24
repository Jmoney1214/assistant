import { Integration, IntegrationStatus } from '../types';

// IMPORTANT: Replace with your actual Microsoft Entra application client ID.
// This ID is safe to be exposed in the frontend.
const OUTLOOK_CLIENT_ID = 'YOUR_MICROSOFT_ENTRA_CLIENT_ID';

// IMPORTANT: Replace with your actual Google Cloud application client ID.
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLOUD_CLIENT_ID';

// IMPORTANT: Replace with your actual Notion Integration client ID.
const NOTION_CLIENT_ID = 'YOUR_NOTION_INTEGRATION_CLIENT_ID';

// The redirect URI must be registered in your application registrations.
const REDIRECT_URI = window.location.origin;

// Define the scopes required for Outlook.
const OUTLOOK_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send'
].join(' ');

// Define the scopes required for Google Calendar.
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile'
].join(' ');

/**
 * Initiates the OAuth 2.0 authorization code flow for Microsoft Outlook.
 */
export const signInWithOutlook = () => {
  if (OUTLOOK_CLIENT_ID === 'YOUR_MICROSOFT_ENTRA_CLIENT_ID') {
      alert('Please configure the OUTLOOK_CLIENT_ID in services/authService.ts');
      return;
  }
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.append('client_id', OUTLOOK_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_mode', 'query');
  authUrl.searchParams.append('scope', OUTLOOK_SCOPES);
  authUrl.searchParams.append('state', 'outlook_auth_12345'); // A random state string for CSRF protection

  // Redirect the user to the Microsoft login page.
  window.location.href = authUrl.toString();
};

/**
 * Initiates the OAuth 2.0 authorization code flow for Google Calendar.
 */
export const signInWithGoogleCalendar = () => {
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLOUD_CLIENT_ID') {
      alert('Please configure the GOOGLE_CLIENT_ID in services/authService.ts');
      return;
  }
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', GOOGLE_SCOPES);
  authUrl.searchParams.append('access_type', 'offline'); // To get a refresh token
  authUrl.searchParams.append('prompt', 'consent'); // Ensures the user is prompted for consent
  authUrl.searchParams.append('state', 'gcal_auth_12345'); // A random state string for CSRF protection

  // Redirect the user to the Google login page.
  window.location.href = authUrl.toString();
};

/**
 * Initiates the OAuth 2.0 authorization code flow for Notion.
 */
export const signInWithNotion = () => {
    if (NOTION_CLIENT_ID === 'YOUR_NOTION_INTEGRATION_CLIENT_ID') {
        alert('Please configure the NOTION_CLIENT_ID in services/authService.ts');
        return;
    }
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.append('client_id', NOTION_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('owner', 'user');
    authUrl.searchParams.append('state', 'notion_auth_12345'); // A random state string for CSRF protection

    // Redirect the user to the Notion authorization page.
    window.location.href = authUrl.toString();
};

/**
 * Handles the redirect from OAuth providers after the user authenticates.
 * It checks for an authorization code or an error in the URL parameters.
 * @returns A promise that resolves to an object with the service and new status, or null.
 */
export const handleAuthCallback = async (): Promise<{ service: Integration; status: IntegrationStatus } | null> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const state = urlParams.get('state');

  let service: Integration | null = null;
  if (state === 'outlook_auth_12345') {
    service = 'outlook';
  } else if (state === 'gcal_auth_12345') {
    service = 'gcal';
  } else if (state === 'notion_auth_12345') {
    service = 'notion';
  } else {
    return null; // Not a valid callback for our app
  }
  
  // Clean the URL to remove the auth code and state.
  window.history.replaceState({}, document.title, window.location.pathname);

  if (error) {
    console.error(`${service} OAuth Error:`, urlParams.get('error_description') || error);
    return { service, status: 'error' };
  }

  if (code) {
    // --- THIS IS A SIMULATION OF A BACKEND TOKEN EXCHANGE ---
    // IN A REAL-WORLD, PRODUCTION APPLICATION, THE FOLLOWING STEPS ARE CRITICAL FOR SECURITY:
    // 1.  **DO NOT** handle the token exchange in the frontend. The authorization `code`
    //     you receive here is short-lived and single-use.
    // 2.  **SEND THE `code` TO YOUR BACKEND SERVER.** Create a secure API endpoint on your
    //     backend (e.g., `/api/auth/callback/outlook`).
    // 3.  **PERFORM TOKEN EXCHANGE ON THE BACKEND.** Your backend server will make a POST
    //     request to the provider's token endpoint (e.g., Microsoft's `/token` endpoint).
    //     This request MUST include your **Client Secret**, which should NEVER be exposed
    //     in the frontend code.
    // 4.  **STORE TOKENS SECURELY.** Your backend should receive an `access_token` and a
    //     `refresh_token`. Store these tokens securely, associating them with the user's account.
    //     The `refresh_token` is particularly sensitive and should be encrypted at rest.
    // 5.  **MANAGE USER SESSION.** Your backend can then create a session for the frontend
    //     (e.g., using a secure, HTTP-only cookie) to indicate that the user is authenticated.
    //
    // This simulation is for demonstration purposes only.
    console.log(`Received authorization code for ${service}. Simulating backend token exchange...`);
    // In a real app, this would be an API call to your server:
    // await fetch(`/api/auth/callback/${service}`, { method: 'POST', body: JSON.stringify({ code }) });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Backend token exchange successful (simulated). Frontend receives confirmation.');

    return { service, status: 'connected' };
  }
  
  return null;
};
