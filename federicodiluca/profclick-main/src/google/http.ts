// Chiamate REST alle API Google con un access token. Nessuna libreria client: con fetch
// bastano poche righe, e googleapis è pensata per Node e pesa troppo per il browser.

export class GoogleApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function googleFetch(token: string, url: string | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new GoogleApiError(response.status, body?.error?.message ?? response.statusText)
  }
  return response
}

export function withParams(base: string, params: Record<string, string | undefined>): URL {
  const url = new URL(base)
  for (const [name, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(name, value)
  return url
}
