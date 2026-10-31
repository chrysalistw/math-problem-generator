/**
 * Cloudflare Pages Function: POST /api/checkout
 * Placeholder for one-time payment. Replace with a real checkout session
 * (e.g. Stripe Checkout) and return { url } for the browser to redirect to.
 * Keep provider secrets in Pages environment variables, never in the frontend.
 */
export const onRequestPost = (): Response =>
  new Response(JSON.stringify({ error: 'not_implemented' }), {
    status: 501,
    headers: { 'content-type': 'application/json' },
  });
