/**
 * TEST POST ENDPOINT
 * Para diagnosticar problemas con POST requests
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  console.log('[TEST-POST] Request received');
  console.log('[TEST-POST] Method:', context.request.method);
  console.log('[TEST-POST] Content-Type:', context.request.headers.get('content-type'));
  console.log('[TEST-POST] Origin:', context.request.headers.get('origin'));
  
  const body = await context.request.text();
  console.log('[TEST-POST] Body length:', body.length);
  console.log('[TEST-POST] Body:', body.substring(0, 100));
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'POST request received successfully',
      method: context.request.method,
      contentType: context.request.headers.get('content-type'),
      bodyLength: body.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
