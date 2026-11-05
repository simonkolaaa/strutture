# 0015 — Riepilogo per periodo, con le note per lo scrutinio

## Contesto

Gli avvisi sui voti mancanti stavano in cima alla settimana. Ma la settimana serve a fare
lezione: cosa c'è oggi, cosa spuntare. A che punto è una classe nel periodo è un'altra
domanda, che ci si fa ogni tanto e soprattutto prima dello scrutinio.

## Decisione

- Una sezione nuova, **Riepilogo**, tra Classi e Riunioni. Per il periodo scelto (di base
  quello in corso) mostra una scheda per classe con barre di avanzamento: voti, programma del
  periodo in ore, educazione civica se prevista. Il pieno è il fatto, il chiaro quello già in
  calendario.
- Sulla barra del programma un segno indica dove si dovrebbe essere: la quota di lezioni del
  periodo già passate. Se il fatto resta indietro di oltre il 10%, lo dice.
- In cima, quanto del periodo è passato: il metro con cui leggere le barre.
- Lo stato della classe (in regola, da pianificare, a rischio) e cosa manca prendono il posto
  degli avvisi della settimana, che li perde.
- Ogni scheda ha due righe di note per quel periodo (`Course.periodNotes`, per id del
  periodo), salvate nei dati e sincronizzate come il resto della classe. Sono diverse dagli
  Appunti della classe: valgono per un periodo e servono allo scrutinio.

## Alternative scartate

- Lasciare gli avvisi nella settimana con un collegamento al riepilogo: la settimana
  resterebbe affollata per una cosa che non cambia di giorno in giorno.
- Note generali del riepilogo, non per classe: allo scrutinio si ragiona classe per classe.
