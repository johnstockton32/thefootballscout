// Shared CORS configuration for all edge functions
// Uses specific allowed origins instead of wildcard for security

const ALLOWED_ORIGINS = [
  'https://thefootballscout.lovable.app',
  'https://id-preview--41da28e9-3268-4e53-b142-1c3a1191a168.lovable.app',
];

// In development, also allow localhost
if (Deno.env.get('DENO_ENV') !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173');
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  
  // Check if origin is in allowed list
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0]; // Default to primary production URL
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(request) });
  }
  return null;
}
