# 0014 — Classi da vedere nella settimana, e ora d'inizio facoltativa

## Contesto

Con molte classi la settimana si riempie, e a volte serve guardarne solo alcune. Inoltre le
lezioni di un giorno comparivano nell'ordine delle classi, non in quello della giornata.

## Decisione

- Nella settimana una fila di etichette accende e spegne le classi, e le riunioni come se fossero
  una classe in più. Le spente spariscono da lezioni e materiale da preparare (gli avvisi sui voti
  ora stanno nel Riepilogo, ADR 0015). Un giorno con solo lezioni nascoste lo dice, così non sembra
  libero.
- La scelta è di chi guarda su quel dispositivo, come il tema: sta in `localStorage` e non
  si sincronizza.
- Nell'orario con i giorni ogni lezione può avere l'ora di scuola da cui inizia (`start`,
  1 = prima ora). È facoltativa: serve solo a ordinare la giornata, e la lezione mostra
  "2ª–3ª ora" al posto delle ore. Le lezioni senza ora vanno dopo, nell'ordine delle classi.
- L'ora d'inizio non conta come cambio d'orario (`sameSchedule` la ignora): cambiarla non
  chiede da quando vale e non sposta il piano.

## Alternative scartate

- Orario con ora vera (`15:00`), come le riunioni: a scuola si ragiona per "seconda ora", e
  un campo orario non sta nella griglia dei giorni.
- Filtro salvato nei dati: si sincronizzerebbe tra dispositivi, mentre è una vista del momento.
