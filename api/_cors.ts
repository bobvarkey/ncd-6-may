/**
 * Shared CORS + preflight helper for the api/ functions.
 *
 * The API may be hosted on a different origin than the frontend
 * (e.g. api.ncdapp.store on Vercel while the SPA lives on ncdapp.store
 * served by Lovable). Browser fetches then need permissive CORS for the
 * custom x-ncd-device-id header.
 */

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => Res;
  end: (chunk?: string) => Res;
};

export function setCors(res: Res): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-ncd-device-id'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
}

/** Returns true when the request was an OPTIONS preflight (already answered). */
export function handlePreflight(req: { method?: string }, res: Res): boolean {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}