# 0004 — Modello: lezioni ricavate dall'orario

- **Anno scolastico**: inizio, fine, periodi (quadrimestri o trimestre + pentamestre) e
  giorni senza lezione. Proposto già pronto con le festività nazionali e la Pasqua calcolata;
  quelle regionali si ritoccano a mano.
- **Classe** (`Course`): classe + materia, ore per giorno della settimana, regole dei voti,
  appunti liberi.
- **Argomento** (`Topic`): macro-punto del programma con ore stimate, periodo e sotto-punti.
  I sotto-punti sono un promemoria, non si pianificano uno per uno.
- **Lezione** (`Lesson`): esiste solo per i giorni in cui c'è qualcosa (attività, spunta,
  annullamento, appunto). I giorni di lezione si **ricavano** dall'orario e dal calendario:
  cambiando l'orario o aggiungendo un ponte, tutto si ricalcola senza migrazioni.
- **Attività**: spiegazione, esercitazione, laboratorio, ripasso, valutazione, altro, con gli
  argomenti che tocca. Le ore di una lezione si dividono tra le sue attività per stimare
  l'avanzamento del programma.
- **Lezione persa**: il giorno si annulla e tutto il piano non ancora fatto slitta di una
  lezione (`cancelAndShift`).
