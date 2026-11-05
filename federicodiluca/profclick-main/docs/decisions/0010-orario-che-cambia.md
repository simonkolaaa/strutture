# 0010 — L'orario che cambia, e quello fatto senza lezione

## Contesto

L'orario cambia più volte fino a novembre. Con un solo orario per tutto l'anno, cambiarlo
ricalcolava anche le lezioni passate: i giorni già fatti cambiavano data, e il piano scritto
sui vecchi giorni spariva. Inoltre chi inizia a usare ProfClick a anno avviato ha già svolto
argomenti e valutazioni, e non vuole ricostruire le lezioni passate per farli contare.

## Decisione

- Una classe tiene, oltre all'orario in vigore, gli orari precedenti con il giorno fino a cui
  valevano (`pastSchedules`). Ogni giorno segue l'orario in vigore quel giorno.
- Cambiando l'orario a anno iniziato si sceglie da quando vale (di default il lunedì della
  settimana in corso, anche una data passata; "dall'inizio dell'anno" lo corregge per tutto
  l'anno). Dalla data scelta il piano passa sulle nuove lezioni nello stesso ordine, come
  "Persa, slitta il piano": la prima lezione col nuovo orario fa quello che faceva la prima col
  vecchio. Le lezioni annullate restano nel loro giorno, se c'è ancora; con meno lezioni di
  prima, quello che esce dall'anno finisce nell'ultima.
- Nel Programma un argomento si spunta come fatto con un tocco sul suo numero, e una
  valutazione prevista non ancora in calendario con un tocco sul suo nome (`done`). Una
  valutazione spuntata conta tra i voti del suo periodo, senza data. Quella già in calendario
  si segna fatta dalla sua lezione.
- Un argomento concluso non si propone più nelle lezioni, ma le sue valutazioni non fatte
  restano da collocare: non si perdono di vista.

## Alternative scartate

- Spostare a mano le singole lezioni: troppi tocchi per un cambio che riguarda tutte le
  settimane.
- Rendere "concluso" anche tutte le valutazioni dell'argomento: un voto mancante sparirebbe
  senza avviso.

## Conseguenze

- Nei dati di prima, le valutazioni di un argomento concluso si leggono come fatte, così il
  conto dei voti non cambia.
