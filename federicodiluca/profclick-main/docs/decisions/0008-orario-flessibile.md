# 0008 — Orario con i giorni, o solo le lezioni in ordine

## Contesto

L'orario definitivo arriva tardi e cambia nelle prime settimane. Per pianificare basta sapere
quante lezioni ha una classe ogni settimana e di quante ore: il giorno serve solo a mostrarle
nella settimana e a capire quali salta una festività. Alcune ore sono in laboratorio o in
compresenza con l'ITP, e lì vanno le prove pratiche.

## Decisione

- L'orario è un elenco di lezioni della settimana tipo: `{ day, hours, lab }`, con `day`
  facoltativo. Nel dialog della classe si sceglie "Con i giorni" oppure "Solo le lezioni";
  passando dall'uno all'altro, ore e laboratorio restano.
- Le lezioni senza giorno si mettono, per il calcolo, nei giorni liberi della settimana in
  ordine (la prima il lunedì, …). La data è un segnaposto e non si mostra: nella settimana
  compaiono come "Lezione 1 · 2 ore" in una sezione a parte. Così una festività in settimana
  toglie una lezione, come succede davvero; se era un'altra, si corregge con "Persa, slitta
  il piano".
- `lab` segna le ore in laboratorio o con l'ITP: la proposta di piano ci mette le prove
  pratiche (ADR 0006), e la settimana le indica con "ITP".
- Più lezioni nello stesso giorno diventano una sola, con le ore sommate.

## Conseguenze

- I dati delle prime versioni (orario come oggetto giorno → ore) si leggono ancora:
  `normalizeData` li converte.
