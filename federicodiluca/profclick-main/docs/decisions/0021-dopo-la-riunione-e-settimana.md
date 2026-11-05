# 0021 — Cose da fare dopo una riunione, verifiche abbinate al programma, settimana dall'orario

## Contesto

- Il verbale stava tra le cose da preparare di una riunione. Spariva quando la riunione passava,
  cioè proprio quando andava scritto. E lo scrive chi fa da segretario, non sempre il
  coordinatore.
- Una verifica aggiunta a mano in una lezione non si collegava a quella prevista nel programma.
  Nel riepilogo lo stesso orale compariva due volte: una volta in calendario e una "da mettere".
- Il sabato la settimana mostrata era ancora quella che finiva, anche per chi il sabato non ha
  scuola.

## Decisione

- Una voce di una riunione può essere **da fare dopo** (`MeetingPrep.after`). Resta nel Da fare e
  nella sezione "Da completare" delle Riunioni, anche passata la riunione, finché non si spunta.
- Il ruolo **"Scrivo il verbale"** (`Meeting.minutes`) è separato da "Sono coordinatore". Vale per
  consiglio, scrutinio, GLO, collegio e dipartimento, e aggiunge il verbale tra le cose da fare
  dopo. Come per il coordinatore, si ricorda dall'ultima riunione dello stesso tipo e della stessa
  classe. Altre voci proposte da fare dopo: le comunicazioni alle famiglie dopo lo scrutinio, per
  il coordinatore, e l'attestato dopo un corso. Nei dati salvati, "Verbale", "Verbale del GLO" e
  "Comunicazioni alle famiglie" diventano da fare dopo.
- Una verifica in calendario senza collegamento si **abbina da sola** alla prima valutazione
  prevista ancora libera del suo argomento e dello stesso tipo. Se possibile si abbinano voto
  pieno con voto pieno e minore con minore. Non si salva niente: l'abbinamento si ricalcola.
- La settimana da mostrare (Settimana, Da fare, Orario) passa alla successiva **quando la scuola
  della settimana è finita**. L'ultimo giorno di scuola si ricava dall'orario: il sabato se qualche
  classe ha lezione il sabato, altrimenti il venerdì. Senza un'impostazione da ricordare.
  Aggiornamento: il cambio arriva già la sera di quell'ultimo giorno, dalle 19:00, quando la
  scuola è finita e si comincia a pensare alla settimana dopo. L'ora (`VITE_NEXT_WEEK_TIME`) e,
  se serve, il giorno (`VITE_NEXT_WEEK_DAY`, 1 lunedì … 7 domenica) si cambiano da `.env`. Il
  numerino sul tab Da fare conta su quella stessa settimana, più quello ancora da chiudere.

## Alternative scartate

- **Un'impostazione "sabato a scuola"**: l'orario lo dice già. Un'impostazione andrebbe tenuta
  allineata a mano.
- **Collegare la verifica al programma quando la si aggiunge nella lezione**: non sistemerebbe
  le verifiche già messe, e un collegamento salvato andrebbe tenuto in ordine a ogni modifica di
  tipo o di argomento.
