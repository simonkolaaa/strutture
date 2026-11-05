// Login con Google Identity Services, "token model": il browser riceve direttamente un
// access token (valido circa un'ora) senza passare da un backend. Non esistono refresh
// token nel browser: a scadenza si richiede un nuovo token, e se il consenso è già stato
// dato Google lo rilascia senza chiedere di nuovo.

const GIS_SRC = 'https://accounts.google.com/gsi/client'

let gisLoaded: Promise<void> | undefined

function loadGis(): Promise<void> {
  gisLoaded ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      gisLoaded = undefined
      reject(new Error('Impossibile caricare Google Identity Services'))
    }
    document.head.append(script)
  })
  return gisLoaded
}

export interface AccessToken {
  value: string
  expiresAt: number
}

/**
 * Apre il popup di Google e restituisce un access token con tutti gli scope richiesti.
 * Va chiamata in risposta a un click: i browser bloccano i popup aperti senza un gesto
 * dell'utente.
 */
export async function requestAccessToken(clientId: string, scopes: string[]): Promise<AccessToken> {
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error))
          return
        }
        // Con il consenso granulare l'utente può togliere la spunta a singoli permessi:
        // meglio accorgersene qui che con un 403 più avanti.
        if (!google.accounts.oauth2.hasGrantedAllScopes(response, scopes[0], ...scopes.slice(1))) {
          reject(new Error('Servono tutti i permessi richiesti per leggere il calendario'))
          return
        }
        resolve({ value: response.access_token, expiresAt: Date.now() + Number(response.expires_in) * 1000 })
      },
      error_callback: (error) => reject(new Error(error.message)),
    })
    client.requestAccessToken()
  })
}
