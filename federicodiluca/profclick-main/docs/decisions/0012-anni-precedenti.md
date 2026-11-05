# 0012 — Programma copiato da un'altra classe; anni precedenti in archivio

## Contesto

Il programma di una materia cambia poco tra classi parallele e da un anno all'altro. Riscriverlo
(o reincollarlo) per ogni classe è lavoro ripetuto. I dati però tengono un solo anno scolastico:
a settembre le classi vecchie restavano con orario e lezioni dell'anno prima, oppure si
cancellavano perdendo il programma.

## Decisione

- **Copia il programma da un'altra classe**: nel Programma vuoto di una classe, l'elenco delle
  classi di quest'anno e degli anni archiviati, prima quelle della stessa materia. Si copiano
  argomenti, ore, sotto-punti e valutazioni previste, tutto da fare, in coda a quello che c'è.
  Ogni argomento va nel periodo corrispondente per posizione (il primo nel primo), perché le
  date dei periodi cambiano da un anno all'altro. Il materiale da preparare non si copia: di
  solito è già pronto.
- **Nuovo anno**: dalla pagina Anno, "Inizia il 2027/28". Le classi con il loro programma vanno
  nell'archivio (`archive`, per etichetta dell'anno), ogni argomento con il segno di svolto o
  no. Classi, programmi, lezioni e riunioni dell'anno si tolgono; il nuovo anno parte con le
  festività nazionali e gli stessi tipi di periodo. Si può annullare dall'avviso.
- Le classi nuove si creano da capo: cambiano ogni anno (la 3A diventa 4A, ne arrivano altre),
  e il programma si copia da quelle archiviate.
- L'archivio è una collezione come le altre, con la stessa unione tra dispositivi (ADR 0003).
  Un anno archiviato si toglie dalla pagina Anno.

## Alternative scartate

- **Tenere più anni attivi nello stesso documento**: ogni calcolo dovrebbe sapere di che anno
  è una classe, per un vantaggio che serve solo a settembre.
- **Archiviare anche le lezioni**: il file crescerebbe ogni anno, e per copiare il programma
  bastano gli argomenti. Chi vuole tutto scarica la copia di sicurezza prima di cambiare anno.
- **Passare le classi all'anno dopo (3A → 4A)**: orario, colleghi e a volte la classe stessa
  cambiano; creare la classe e copiare il programma costa due tocchi ed è sempre giusto.
