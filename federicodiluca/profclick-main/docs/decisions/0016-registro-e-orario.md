# 0016 — Argomenti per il registro e orario da stampare

## Contesto

Il registro elettronico si compila ogni giorno, spesso in arretrato, e gli argomenti delle
lezioni sono già in ProfClick. L'orario di tutte le classi serve a colpo d'occhio, sul telefono
o stampato. Ogni scuola ha i suoi modelli per i documenti formali: qui contano le cose che
servono al docente.

## Decisione

- **Nessun collegamento al registro** (ClasseViva, Argo, Axios, Nuvola): non hanno API
  pubbliche, quelle non ufficiali chiedono le credenziali della scuola e passano per i dati
  degli studenti. Al loro posto, il testo da incollare:
  - nella lezione, "Copia per il registro": una riga con le attività, gli argomenti e i
    dettagli (es. "Spiegazione: Reti, modello ISO/OSI. Esercitazione.");
  - nella Settimana, "Registro": le lezioni fino a oggi delle classi accese, per giorno o per
    classe, per recuperare in un colpo. Le lezioni annullate o vuote restano fuori; il peso dei
    voti minori non serve sul registro.
- **Orario** (Classi, "Orario"): la griglia giorni × ore di scuola con i colori delle classi,
  per una settimana, con le frecce per andare avanti e indietro come nella Settimana. Si
  ricava dalle stesse lezioni: l'orario in vigore giorno per giorno, le lezioni cambiate a
  mano o in più (ADR 0018), le festività; le lezioni saltate restano barrate e ogni lezione si
  apre. Prima seguiva solo l'orario in vigore oggi, e non combaciava con la Settimana. Le lezioni senza ora d'inizio restano nel loro giorno, quelle
  senza giorno fisso a parte. Si stampa (o si salva in PDF) su un A4 orizzontale, sempre con
  il tema chiaro.
- Due soli modi di esportare, testo da copiare e stampa: niente DOCX o PDF generati da
  mantenere (come nell'ADR 0013).

## Alternative scartate

- **Integrazione con il registro tramite API non ufficiali**: fragile, contro i termini d'uso,
  e romperebbe le promesse di nessun server e nessun dato degli studenti (ADR 0001).
- **Immagine dell'orario generata per lo sfondo del telefono**: la pagina sul telefono e il PDF
  bastano; un'immagine sarebbe un secondo disegno da tenere allineato.
