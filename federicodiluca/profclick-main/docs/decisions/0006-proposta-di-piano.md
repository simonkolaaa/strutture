# 0006 — Proposta di piano, applicata solo su conferma

## Decisione

`core/proposal.ts` riempie **solo le lezioni future ancora vuote** di un periodo:

1. Gli argomenti del periodo (o senza periodo) si mettono in ordine, ciascuno per le ore
   stimate non ancora in calendario, **seguito dalle valutazioni previste per lui** (ADR 0005).
2. Se i voti pieni non bastano, se ne aggiungono: prima i tipi richiesti assenti, poi a
   rotazione. Si distribuiscono a intervalli regolari lungo il tratto occupato dal programma,
   entro il 92% del periodo: l'ultimo tratto resta per i recuperi.
3. Le **prove pratiche vanno nelle ore con l'ITP** (ADR 0008): se la lezione giusta è entro le
   due successive, prima si fa un ripasso dell'argomento. Gli scritti preferiscono una lezione
   lunga. Ogni valutazione riguarda gli argomenti trattati dopo la precedente.
4. Le ore di **educazione civica** mancanti diventano lezioni sparse a metà dei tratti.
5. Quello che non ci sta si dichiara ("restano fuori 6 ore", "una valutazione prevista non ci
   sta"), e così le lezioni che avanzano.

La proposta si vede tratteggiata nel piano e diventa piano solo con **Applica** (annullabile).

## Alternative scartate

- **Trascinare argomenti sulle lezioni**: comodo su PC, scomodo su telefono; e sistemare a mano
  settanta lezioni è proprio il lavoro da evitare. Il ritocco puntuale resta nel dialog della
  lezione.
