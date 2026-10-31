/**
 * Placeholder for the one-time payment feature.
 * Nothing is gated yet. When a payment provider is wired up:
 *   1. /api/checkout creates a checkout session and returns its URL.
 *   2. After payment, the server verifies it and issues a signed token.
 *   3. isPremium() checks that token; feature gates call isPremium().
 */

export function isPremium(): boolean {
  // TODO: return true only for a server-verified, signed purchase token.
  return false;
}

export async function startCheckout(): Promise<void> {
  try {
    const res = await fetch('/api/checkout', { method: 'POST' });
    if (res.ok) {
      const { url } = (await res.json()) as { url?: string };
      if (url) {
        location.href = url;
        return;
      }
    }
  } catch {
    // Network error or no backend (e.g. local `vite dev`): fall through.
  }
  alert('完整版即將推出，敬請期待！');
}
