# 0019 — Una lezione pianificata e passata è fatta

## Contesto

Ogni lezione passata con qualcosa in programma andava segnata fatta a mano, e finché non lo
era la settimana mostrava un avviso ("lezioni passate ancora da segnare"). Quasi sempre la
lezione era andata come previsto: l'avviso chiedeva di confermare cose già fatte, cioè
lavoro in più, contro l'obiettivo di ProfClick.

## Decisione

- Una lezione è fatta se è segnata a mano, oppure se è passata, ha qualcosa in programma e
  non è saltata (`isDone`). Non si salva niente: è una regola di lettura, vale anche per i
  dati di prima e non crea modifiche da sincronizzare.
- L'avviso delle lezioni passate da segnare non c'è più.
- La spunta di una lezione passata e pianificata non si toglie: se non è andata così, la si
  apre e si usa "Lezione saltata", "Cambia" o "Elimina lezione" (ADR 0018).
- Oggi e le lezioni future si segnano ancora a mano, se si vuole: oggi conta da domani.
- Avanzamento del programma, voti, educazione civica e riepiloghi usano la stessa regola,
  sempre rispetto a oggi.

## Alternative scartate

- **Segnarle fatte da sole nei dati**: scritture continue all'apertura, e ripetute su ogni
  dispositivo.
- **Lasciare l'avviso con "Segna tutte fatte"**: un tocco, ma ogni settimana, per niente.
