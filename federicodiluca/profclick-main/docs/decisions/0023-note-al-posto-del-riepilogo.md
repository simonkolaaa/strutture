# 0023 — Note come su Keep, collegabili alle classi; il riepilogo si scioglie

## Contesto

Fuori da ProfClick restavano le note sparse su Keep: slide da preparare, idee per l'anno dopo,
numeri e scadenze della scuola. Ognuna con un titolo, un elenco, a volte delle caselle, a volte
un link. Non c'è una forma fissa: il titolo fa già da categoria.

Il tab Riepilogo, intanto, si apriva poco: dopo l'ADR 0020 il Piano di ogni classe mostra già
lezioni rimaste, settimane da pianificare, voti ed educazione civica. Al riepilogo restavano la
vista di tutte le classi insieme e le note per lo scrutinio.

## Decisione

- **Un tab Note**, al posto del Riepilogo: una bacheca a colonne di note (`ProfclickData.notes`,
  una collezione nuova che si unisce record per record come le altre).
- Una nota è **un titolo e un testo libero**. Niente editor a blocchi né categorie: si scrive
  come su un foglio, con poche convenzioni che si leggono già nel testo (`core/notes.ts`):
  `[ ]` e `[x]` sono caselle da spuntare direttamente sulla scheda, `-` è un elenco,
  `**grassetto**`, e gli indirizzi web diventano link. Andando a capo dopo una casella o una voce
  l'elenco continua; un pulsante mette o toglie la casella sulla riga.
- Una nota si può **collegare a una o più classi**: compare anche negli Appunti della classe e,
  se è di una classe sola, ne prende il colore. Nella bacheca si filtra per classe o per note
  generali. Si può **fissare in cima**; le nuove vanno sopra le altre.
- Le note **restano al cambio d'anno**, senza le classi che non ci sono più.
- **Gli Appunti della classe** (`Course.notes`, un testo solo) diventano una nota collegata alla
  classe, "Appunti 3A", e il campo sparisce: due posti per la stessa cosa erano uno di troppo.
  La nota ha l'id della classe (`appunti-<id>`), così ogni dispositivo crea la stessa e non un
  doppione; cancellata, non torna. Il tab Appunti della classe mostra le cose da preparare e
  le sue note.
- **Il riepilogo si scioglie**:
  - in **Classi**, ogni scheda dice anche educazione civica, lezioni rimaste e fino a quando è
    pianificato il periodo;
  - le **note per lo scrutinio** (`Course.periodNotes`) stanno nel tab Voti, sotto ogni periodo;
  - in **Anno**, una barra con le settimane di scuola passate e quelle che restano, divisa nei
    periodi;
  - `#/riepilogo` porta a Classi.

## Alternative scartate

- **Categorie o etichette a parte**: un'altra cosa da mantenere, quando il titolo basta.
- **Editor ricco (blocchi, liste vere)**: più codice e più tocchi per scrivere una riga.
- **Importare da Keep**: le note si riscrivono una volta, e intanto si riordinano.
- **Riepilogo dentro Anno**: Anno raccoglie le impostazioni, e il riepilogo ci sarebbe finito in
  fondo. Le cose per classe stanno meglio nella classe.
