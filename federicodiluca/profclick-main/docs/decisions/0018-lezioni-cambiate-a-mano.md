# 0018 — Lezioni in più, spostate o eliminate a mano

## Contesto

Le lezioni si ricavano dall'orario (ADR 0004, 0010), ma la settimana vera non lo segue
sempre: sostituzioni, recuperi, ore scambiate con un collega, una lezione che quel giorno non
c'era. Chi inizia a usare ProfClick a anno avviato vuole correggere anche le settimane
passate, senza dover compilare tutto per non ricevere avvisi su cose già fatte.

## Decisione

- **Lezione in più** (`Lesson.extra`): dal "+" accanto a ogni giorno della settimana si
  sceglie la classe, l'ora d'inizio, la durata e l'ITP. Sta in quel giorno anche fuori
  dall'orario o in vacanza, conta come le altre e non si muove con un cambio d'orario.
- **Cambia** nella finestra della lezione: giorno, ora d'inizio, durata, ITP. Nello stesso
  giorno si salva solo quello che differisce dall'orario (`hours`, `start`, `lab`). In un
  altro giorno la lezione diventa "in più" e porta con sé il piano; quella dell'orario si
  toglie (`removed`).
- **Elimina lezione**: la lezione non c'era. Sparisce con il suo piano, senza restare
  barrata e senza far slittare niente: è diversa da "Lezione saltata". Si torna indietro con
  Annulla.
- Una classe ha al massimo una lezione al giorno: per due blocchi nello stesso giorno si
  allunga la durata.
- Una lezione passata senza niente segnato non è "da pianificare": si vede tranquilla, con
  "Niente segnato". Le lezioni passate con qualcosa in programma contano come fatte da sole
  (ADR 0019).

## Alternative scartate

- **Eliminare come "saltata"**: una lezione che non c'era non è persa, e non deve far
  slittare il piano né restare in vista.
- **Più lezioni della stessa classe nello stesso giorno**: cambierebbe la chiave delle
  lezioni (`classe@giorno`) in tutta l'app, per un caso che la durata già copre.
