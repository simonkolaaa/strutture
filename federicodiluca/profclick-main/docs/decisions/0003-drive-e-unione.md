# 0003 — Dati su IndexedDB e Drive, unione record per record

## Contesto

Il docente usa ProfClick da PC e da telefono, a volte offline, e non deve mai trovarsi a
scegliere "quale versione tenere": sarebbe proprio la manutenzione che l'app deve evitare.

## Decisione

- Un solo documento JSON, su IndexedDB e in un file `profclick-dati.json` sul Drive
  dell'utente, con lo scope `drive.file`: non sensibile (niente verifica Google), e l'app non
  vede altri file. Il file è visibile nel Drive e fa anche da backup.
- Ogni record (classe, argomento, lezione) ha `updatedAt`; le cancellazioni lasciano una
  "lapide" in `deleted`. La sincronizzazione **unisce** le due versioni: per ogni record vince
  la modifica più recente (`core/merge.ts`). L'unione è commutativa, quindi tutti i
  dispositivi arrivano agli stessi dati senza conflitti da risolvere.
- "Annulla" riscrive i record di prima con un timestamp nuovo, così vince anche altrove.

## Alternative scartate

- **Rebase delle modifiche + dialog di conflitto** (Duetrack): corretto, ma dopo modifiche
  offline su due dispositivi fa scegliere all'utente, e una delle due versioni si perde.
- **appDataFolder**: file nascosto, l'utente non lo vede e non può farne una copia.

## Conseguenze

- Due modifiche allo stesso record da due dispositivi: vince la più recente, per intero (una
  lezione è un record). Accettabile: è raro e riguarda un giorno di una classe.
- Scritture concorrenti su Drive: una può sovrascrivere l'altra, ma il dispositivo "perdente"
  ha ancora i suoi dati e li riunisce alla sincronizzazione successiva.
