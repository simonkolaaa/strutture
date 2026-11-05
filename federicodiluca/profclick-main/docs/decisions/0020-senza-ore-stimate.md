# 0020 — Senza ore stimate: piano a settimane, riepilogo dei prossimi voti

## Contesto

Ogni argomento aveva le sue ore stimate. Erano un numero da inventare per ogni riga del
programma e da correggere di continuo, e servivano soprattutto alla proposta di piano, che
riempiva tutto il periodo in una volta: settanta lezioni tratteggiate da controllare. Il
riepilogo aveva tre barre per classe (voti, programma in ore, educazione civica). Per decidere
cosa fare dicevano poco. Quello che serve è sapere qual è il prossimo voto da mettere.

## Decisione

- **Niente ore stimate** (`Topic.hours` sparisce). Una voce che era a 0 ore diventa
  `assessmentOnly`: "Solo valutazione, niente da spiegare". Nei dati salvati la conversione
  avviene da sola, anche per gli anni in archivio. Nell'import da testo le ore scritte ("(10h)")
  si tolgono dal titolo. Se la nota non indica i periodi, gli argomenti si dividono tra i
  periodi in parti uguali per numero.
- **Fatto da solo**: un argomento è fatto quando le sue lezioni in calendario sono tutte fatte
  e si è andati avanti, cioè è iniziato un argomento dopo o c'è stata una sua valutazione. Una
  voce "solo valutazione" è fatta quando lo sono le sue valutazioni. Resta il cerchio per
  segnarlo a mano. Nel Programma, al posto della barra in ore, si leggono le lezioni fatte e in
  calendario.
- **Proposta a settimane** (sostituisce in parte ADR 0006): si scelgono gli argomenti e su quante
  settimane (1, 2, 3, 4, 6 o fino alla fine del periodo), a partire dalla prima settimana con una
  lezione libera. Prima si contano le lezioni per le valutazioni previste. Le lezioni libere che
  restano si dividono tra gli argomenti **in proporzione ai sotto-punti**, almeno una a testa. Si
  ragiona per lezione, non per ora. Il pratico aspetta ancora il laboratorio con un ripasso.
  Quello che non ci sta si dichiara. Non si aggiungono più da soli i voti per arrivare al minimo
  né le ore di educazione civica: li indica il riepilogo.
- **Riepilogo** (sostituisce in parte ADR 0015): in cima una sola barra, misurata in
  **settimane di scuola** (quelle tutte di vacanza non contano). Poi una scheda per classe con:
  - le lezioni che restano;
  - quando la classe non è in regola, quanto resta da pianificare: "pianificato fino al 14
    nov: ancora 6 settimane da pianificare";
  - i **prossimi voti**, nell'ordine: quelli in calendario con la data, quelli previsti nel
    programma ("da mettere"), quelli che mancano al minimo;
  - quante valutazioni del programma sono già messe e quante no;
  - i voti fatti, l'educazione civica e il pulsante delle note, che si scrivono in un popup.

## Alternative scartate

- **Tenere le ore come facoltative**: due modi di funzionare per la proposta e per il "fatto",
  e un campo che nessuno compila volentieri.
- **Lezioni divise in parti uguali tra gli argomenti**: un argomento con molti sotto-punti
  riceverebbe quanto uno con un punto solo. I sotto-punti ci sono già e non chiedono niente in
  più.
- **Proposta di tutto il periodo**: troppo da controllare in una volta, e a metà periodo il
  piano cambia comunque.
