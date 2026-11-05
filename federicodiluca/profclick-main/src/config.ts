import type { WeekSwitch } from '@/core/calendar'

// Il Client ID OAuth non è un segreto: finisce comunque nel JavaScript servito al browser.
// Lo protegge la lista delle "origini JavaScript autorizzate" in Google Cloud Console
// (localhost:5173 e profclick.federicodiluca.com). Chi fa un fork usa il proprio tramite
// VITE_GOOGLE_CLIENT_ID (vuoto: l'app funziona lo stesso, solo sul dispositivo).
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '387074870909-6n2iqa1tnm0dqtp0qp57n2f4u130ol3m.apps.googleusercontent.com'

// Un solo permesso, non sensibile (ADR 0003): gestire sul Drive dell'utente soltanto i
// file creati da ProfClick. Niente accesso al resto del Drive.
export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.file']

// Da quando Settimana, Da fare e Orario guardano alla settimana dopo (ADR 0021). Il giorno, se
// non indicato, è l'ultimo di scuola ricavato dall'orario (venerdì, o sabato se c'è lezione);
// l'ora di default è le 18:00, a scuola finita. VITE_NEXT_WEEK_DAY: 1 lunedì … 7 domenica.
const switchDay = Number(import.meta.env.VITE_NEXT_WEEK_DAY)
const switchTime = import.meta.env.VITE_NEXT_WEEK_TIME
export const NEXT_WEEK: WeekSwitch = {
  day: Number.isInteger(switchDay) && switchDay >= 1 && switchDay <= 7 ? switchDay : undefined,
  time: switchTime && /^([01]\d|2[0-4]):[0-5]\d$/.test(switchTime) ? switchTime : '19:00',
}
