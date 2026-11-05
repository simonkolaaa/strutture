# 0017 — Da fare: le cose da preparare nascono dalle lezioni

## Contesto

Pianificate le prossime settimane, mancava un posto solo con tutto quello da preparare. La lista
dell'ADR 0009 conteneva solo le voci scritte a mano nella classe, e si vedeva in fondo alla
settimana corrente: chi pianificava due spiegazioni doveva scrivere anche due promemoria.

## Decisione

- **Ogni attività in programma è una cosa da preparare**: spiegazione, esercitazione,
  laboratorio, ripasso, verifica scritta o pratica, voto minore, educazione civica. Restano
  fuori le interrogazioni e le seconde parti di una valutazione già iniziata, che non chiedono
  materiale. Due spiegazioni in due lezioni sono due voci.
- **La spunta sta sull'attività** (`Activity.ready`; dall'ADR 0022, i suoi passi), dentro la lezione: niente collezione
  nuova, si sincronizza con la lezione, e se la lezione slitta la voce pronta resta pronta.
  La stessa spunta c'è anche nella finestra della lezione.
- **Un tab "Da fare"**, subito dopo Settimana: le prossime tre settimane (estendibili di due
  in due), divise per settimana, con quante voci sono pronte. Ci stanno anche le voci scritte
  nelle classi (ADR 0009) e quelle delle riunioni (ADR 0011); quelle senza data vanno in fondo.
  Una voce pronta resta in elenco, spuntata, finché la lezione non è fatta. Si spunta anche
  tutta una settimana, o tutto l'elenco, in un tocco, con Annulla.
- Sul tab, un numero: quante cose servono nei prossimi sette giorni e non sono pronte. Nella
  settimana una riga sola dice a che punto è: lezioni ancora da pianificare, oppure, se è tutto
  pianificato, quante cose restano da preparare (porta al tab), oppure che è tutto pronto.
- Il filtro delle classi vale anche qui.

## Alternative scartate

- **Voci generate e salvate come `PrepItem`**: duplicano il piano e restano orfane quando la
  lezione cambia o slitta.
- **Tutte le lezioni dell'anno**: con il piano proposto per l'anno intero la lista sarebbe di
  centinaia di voci.
