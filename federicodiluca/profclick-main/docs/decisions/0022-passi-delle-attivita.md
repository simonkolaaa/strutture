# 0022 — I passi di un'attività: cosa preparare prima, cosa fare dopo; il colore delle classi

## Contesto

Ogni attività aveva una sola spunta, "materiale pronto" (ADR 0017). Una verifica scritta però
non finisce in classe: va corretta, riconsegnata e i voti vanno sul registro. E prima, oltre
alla prova (con le sue versioni), a volte vanno stampate le copie. Anche una lezione può chiedere
cose diverse: slide, esercizi, fotocopie.

I colori scelti per le classi, poi, si vedevano solo in un pallino accanto al nome.

## Decisione

- Ogni attività ha i suoi **passi** (`Activity.steps`). Finché non si toccano valgono quelli
  proposti per il tipo di attività (`core/steps.ts`):
  - verifica scritta o pratica, e recupero: preparare la prova e le sue versioni; poi
    correggere, riconsegnare, voti sul registro. "Stampare le copie" si aggiunge quando serve;
  - interrogazione (anche ogni giro successivo): voti sul registro. La seconda parte di uno
    scritto non chiede niente;
  - spiegazione: rivedere la lezione. Le slide no, perché non sempre servono o ci sono già
    dagli anni prima;
    esercitazione: esercizi o attività; laboratorio: preparare il laboratorio; ripasso,
    educazione civica, altro: materiale. Slide, "Stampare o fotocopiare" e gli altri si
    aggiungono.

  Toccandoli, si salvano nell'attività. Cambiando il tipo di attività o di valutazione tornano
  quelli proposti. Le ripetizioni di un'attività hanno ognuna i loro passi.
- **Prima e dopo.** I passi da preparare stanno nel Da fare fino alla lezione, come prima. Quelli
  dopo (correggere, riconsegnare, registro) compaiono dal giorno della lezione e **restano finché
  non sono fatti**, come il verbale di una riunione (ADR 0021). Quelli spuntati non spariscono:
  restano barrati, con la lezione o la riunione, finché non sono chiusi tutti e la settimana non
  è passata; così si vede cosa si è già fatto e si toglie una spunta data per sbaglio. Dopo, le
  spunte si ritrovano nella finestra della lezione o della riunione. Le valutazioni passate prima del
  28 settembre 2026, quando i passi non c'erano, non li chiedono, a meno di averli toccati.
- Il Da fare ha **tre liste**: *Da chiudere*, quello da fare dopo lezioni e riunioni già fatte
  (correzioni, registro, verbali); *Da preparare*, per quelle che vengono, divise per settimana;
  *A cose fatte*, quello che toccherà dopo le prossime verifiche e riunioni, per vederlo per tempo.
  Quest'ultima non conta nel numero sul tab né nella riga della settimana.
- Nel Da fare i passi della stessa **lezione** stanno **in una riga**, anche con più attività
  ("Spiegazione + Esercitazione"): la lezione, e sotto le spunte.
- Ogni lista (nel Da fare e nelle Riunioni) si vede **estesa**, **compatta** (una riga per voce)
  o **chiusa** (il titolo con il numero, da riaprire). La scelta si ricorda su questo dispositivo,
  lista per lista, come il filtro delle classi. Di base sono compatte, perché le voci sono tante;
  le riunioni passate partono chiuse.
- Anche la **Settimana** si vede estesa o compatta (una riga per lezione: classe, attività,
  argomenti, ore, spunta), e ogni giorno si chiude toccandone il titolo: resta "3 lezioni ·
  1 riunione". Nella settimana in corso i giorni già passati si chiudono da soli, finché non
  li si riapre; nelle settimane prima restano aperti, perché ci si torna per guardarli; la scelta si
  ricorda su questo dispositivo.
  "Tutte pronte" spunta solo quello da preparare: la correzione e i voti sul registro si spuntano
  uno per uno. La vecchia spunta `ready` vale come "tutto il prima pronto" finché non si toccano
  i passi.
- Nella settimana, sulle lezioni che vengono e hanno qualcosa da preparare, un'icona dice a colpo
  d'occhio se il materiale è pronto (verde) o no (arancione); un tocco segna pronto tutto, o lo
  rimette da preparare. È distinta dal cerchio di "fatta".
- Nella finestra della lezione, al posto di "Materiale pronto", i passi prima e dopo da spuntare,
  da togliere, e quelli da aggiungere.
- **Il colore della classe** sta sulle sue cose: una striscia a sinistra e un fondo appena tinto
  su lezioni, schede del Riepilogo e card delle Classi; solo la striscia nelle righe del Da fare.
  La tavolozza resta quella di prima, così come le superfici del tema scuro: le varianti provate
  (tinte lontane dai colori di stato, card grigie) non hanno convinto.

## Alternative scartate

- **Passi come voci `PrepItem` della classe**: duplicherebbero il piano, come già scartato
  nell'ADR 0017.
- **Una riga per passo nel Da fare**: una verifica occupava quattro righe.
- **Mostrare i passi dopo già prima della lezione**: "Correggere" una settimana prima della
  verifica è solo rumore.
