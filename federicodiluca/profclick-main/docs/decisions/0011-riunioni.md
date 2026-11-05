# 0011 — Riunioni con le cose da preparare e il riepilogo della classe

## Contesto

Consigli di classe, scrutini, GLO, collegi, dipartimenti e corsi arrivano nel pomeriggio, e
per molti c'è qualcosa da preparare: le proposte di voto prima dello scrutinio, la situazione
della classe per il consiglio, il verbale se si è coordinatori. Finora stavano in note a parte,
senza un legame con quello che ProfClick sa già della classe.

## Decisione

- Una nuova collezione `meetings` nel documento, con la stessa unione record per record delle
  altre (ADR 0003). Una riunione ha tipo, giorno, ora facoltativa, classe facoltativa, titolo
  facoltativo, una lista di cose da preparare e gli appunti.
- La classe è il **nome** della classe (`3J`), non una classe con materia: chi insegna due
  materie nella stessa classe va a un solo consiglio.
- Le cose da preparare nascono già proposte per tipo (es. per lo scrutinio "proposte di voto
  sul registro") e si modificano. "Sono coordinatore" aggiunge le voci del coordinatore; per
  una classe si ricorda dall'ultima riunione, senza un'impostazione a parte.
- Le cose da preparare compaiono nel "Da preparare" della settimana, con scadenza il giorno
  della riunione, e la riunione compare nel suo giorno, dopo le lezioni.
- Per consiglio, scrutinio e GLO la riunione mostra il **riepilogo della classe** ricavato dai
  dati: per ogni materia voti previsti e fatti, tipi mancanti, argomenti svolti, educazione
  civica. Lo scrutinio guarda il periodo appena finito; le altre il periodo in corso quel
  giorno. Il riepilogo si copia come testo, da incollare negli appunti o nel verbale.
- Sul calendario come le verifiche (ADR 0009): "Aggiungi a Google Calendar" con l'ora, se
  c'è, e le riunioni nel file `.ics`.
- Nessun dato degli studenti: il GLO resta "GLO 3J" e il campo degli appunti ricorda di non
  scrivere nomi.

## Alternative scartate

- **Riunioni come attività di una lezione**: una riunione non è un'ora di lezione e non deve
  togliere ore al programma.
- **Impostazione "coordinatore" sulla classe**: la classe in ProfClick è classe + materia;
  ricordarlo dalle riunioni evita un campo in più da tenere aggiornato.
- **Importare il piano annuale delle attività**: utile, ma da fare dopo, con il formato dei
  documenti veri delle scuole sotto mano.
