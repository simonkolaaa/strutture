// I passi di un'attività (ADR 0022): cosa preparare prima della lezione e cosa fare dopo.
// Un'esercitazione chiede gli esercizi; una verifica scritta la prova, poi la correzione, la
// riconsegna e i voti sul registro. Finché non si tocca niente valgono i passi proposti per
// il tipo di attività; toccandoli, si salvano nell'attività.

import type { ISODate } from './dates'
import type { Activity, ActivityStep, StepKey } from './model'

/** I passi che vengono dopo la lezione: restano da fare anche quando la lezione è passata. */
const AFTER: ReadonlySet<StepKey> = new Set(['correggi', 'riconsegna', 'registro', 'recupero', 'archivia'])

/**
 * Le valutazioni passate prima di questa data non chiedono i passi dopo, se non li si è toccati:
 * prima i passi non c'erano, e i voti di settembre sul registro ci sono già.
 */
export const STEPS_SINCE: ISODate = '2026-09-28'

export function isAfter(key: StepKey): boolean {
  return AFTER.has(key) || key.startsWith('dopo:')
}

/** Una valutazione che chiede una prova: scritta o pratica, nuova o di recupero. */
function needsTest(activity: Activity): boolean {
  const a = activity.assessment
  return Boolean(a && a.type !== 'teorico' && (!a.continues || a.makeup))
}

/** I passi proposti per un'attività, in ordine: prima quelli da preparare, poi quelli dopo. */
export function defaultSteps(activity: Activity): StepKey[] {
  const a = activity.assessment
  if (activity.kind === 'verifica' && a) {
    if (needsTest(activity)) return ['prova', 'correggi', 'riconsegna', 'registro', 'recupero', 'archivia']
    // L'interrogazione: i voti di ogni giro vanno sul registro. La seconda parte di uno scritto no.
    return a.type === 'teorico' ? ['registro'] : []
  }
  // Una spiegazione si rivede prima di farla; le slide non sempre servono, o ci sono già: si aggiungono.
  if (activity.kind === 'spiegazione') return ['rivedere']
  if (activity.kind === 'esercitazione') return ['esercizi']
  if (activity.kind === 'laboratorio') return ['laboratorio']
  return ['materiale']
}

/** I passi che si possono aggiungere a un'attività, oltre a quelli che ha. */
export function optionalSteps(activity: Activity): StepKey[] {
  const all: StepKey[] =
    activity.kind === 'verifica' ? ['prova', 'stampa', 'correggi', 'riconsegna', 'registro', 'recupero', 'archivia'] : ['rivedere', 'slide', 'esercizi', 'laboratorio', 'materiale', 'stampa']
  const have = new Set(activitySteps(activity).map((s) => s.key))
  return all.filter((k) => !have.has(k))
}

/** I passi di un'attività: quelli salvati, o quelli proposti (pronti se il materiale era segnato pronto). */
export function activitySteps(activity: Activity): ActivityStep[] {
  return activity.steps ?? defaultSteps(activity).map((key) => ({ key, done: !isAfter(key) && Boolean(activity.ready) }))
}

/** Tutto il materiale da preparare è pronto? (I passi dopo non contano.) */
export function isReady(activity: Activity): boolean {
  return activitySteps(activity).every((s) => isAfter(s.key) || s.done)
}

/** Un passo scritto a mano, prima o dopo: la chiave è il suo testo, così lo stesso testo non si ripete. */
export function customStep(text: string, after = false): StepKey {
  return `${after ? 'dopo' : 'altro'}:${text.trim()}`
}

/**
 * Ordina i passi: prima quelli da preparare, poi quelli dopo, ciascuno nell'ordine proposto;
 * quelli scritti a mano da preparare prima di stampare, quelli dopo in fondo.
 */
const ORDER: StepKey[] = ['prova', 'rivedere', 'slide', 'esercizi', 'laboratorio', 'materiale', 'stampa', 'correggi', 'riconsegna', 'registro', 'recupero', 'archivia']
const order = (key: StepKey) => (key.startsWith('altro:') ? ORDER.indexOf('stampa') - 0.5 : key.startsWith('dopo:') ? ORDER.length : ORDER.indexOf(key))

/** Un passo fatto o da fare; aggiunto o tolto. Da qui i passi sono salvati nell'attività. */
export function withStep(activity: Activity, key: StepKey, change: { done?: boolean; present?: boolean }): Activity {
  let steps = activitySteps(activity)
  if (change.present === false) steps = steps.filter((s) => s.key !== key)
  else if (!steps.some((s) => s.key === key)) steps = [...steps, { key, done: false }]
  if (change.done !== undefined) steps = steps.map((s) => (s.key === key ? { ...s, done: change.done! } : s))
  steps = [...steps].sort((x, y) => order(x.key) - order(y.key))
  const { ready: _, ...rest } = activity
  return { ...rest, steps }
}

export function stepLabel(key: StepKey, activity: Activity): string {
  const test = activity.kind === 'verifica'
  switch (key) {
    case 'prova':
      return activity.assessment?.type === 'teorico' ? 'Preparare le domande' : 'Preparare la prova e le sue versioni'
    case 'rivedere':
      return 'Rivedere la lezione'
    case 'slide':
      return 'Slide'
    case 'esercizi':
      return 'Esercizi o attività'
    case 'laboratorio':
      return 'Preparare il laboratorio'
    case 'materiale':
      return 'Materiale'
    case 'stampa':
      return test ? 'Stampare le copie' : 'Stampare o fotocopiare'
    case 'correggi':
      return 'Correggere'
    case 'riconsegna':
      return 'Riconsegnare'
    case 'registro':
      return 'Voti sul registro'
    case 'recupero':
      return 'Recupero assenti'
    case 'archivia':
      return 'Archiviazione'
    default:
      return key.slice(key.indexOf(':') + 1)
  }
}
