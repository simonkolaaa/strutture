# 0009 — Verifiche sul calendario e materiale da preparare

## Contesto

Le verifiche finiscono anche sul Google Calendar personale, per vederle accanto a consigli di
classe e impegni. Il materiale da preparare (slide, esercizi, laboratori) stava in note a
parte, senza sapere entro quando serviva.

## Decisione

- **Nessun permesso su Google Calendar**: gli scope di Calendar sono sensibili (verifica di
  Google) e ProfClick resta con il solo `drive.file` (ADR 0003). Al loro posto:
  - per ogni valutazione, il collegamento "Aggiungi a Google Calendar", che apre Calendar con
    l'evento di un giorno intero già compilato (`calendar.google.com/calendar/render?action=TEMPLATE`);
  - nella pagina Anno, un file `.ics` con tutte le valutazioni, con UID stabili: importandolo
    di nuovo, gli eventi si aggiornano invece di duplicarsi.
- **Da preparare**: una lista per classe (`Course.prep`), ogni voce legata, se si vuole, a un
  argomento. La scadenza è la prima lezione in calendario con quell'argomento: la settimana
  mostra quello che serve nelle prossime tre settimane.

## Alternative scartate

- **Scrivere sul calendario con l'API**: sincronizzazione automatica, ma serve uno scope
  sensibile per un beneficio piccolo rispetto a un tocco per verifica.
- **Un calendario pubblico in .ics servito dall'app**: senza server non c'è un indirizzo
  per utente da cui Calendar possa leggere gli aggiornamenti.
