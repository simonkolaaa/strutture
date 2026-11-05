# Decisioni architetturali

Ogni file registra una decisione: il contesto, cosa si è scelto, le alternative scartate e le
conseguenze. Formato ADR ([Architecture Decision Record](https://adr.github.io/)), in breve.
Una decisione superata non si cancella: si scrive un nuovo ADR che la sostituisce.

| # | Decisione | Stato |
| --- | --- | --- |
| [0001](0001-local-first-login-facoltativo.md) | App statica local-first, login Google facoltativo | Accettata |
| [0002](0002-stack.md) | Stack: React, Vite, shadcn/ui, wouter con indirizzi # | Accettata |
| [0003](0003-drive-e-unione.md) | Dati su IndexedDB e Drive, unione record per record | Accettata |
| [0004](0004-modello-dati.md) | Modello: lezioni ricavate dall'orario, piano salvato solo dove c'è | Accettata |
| [0005](0005-voti.md) | Voti della classe, non degli studenti | Accettata |
| [0006](0006-proposta-di-piano.md) | Proposta di piano, applicata solo su conferma | Sostituita in parte da 0020 |
| [0007](0007-seo.md) | Pagina pubblica indicizzabile sul sottodominio, app sotto /app/ | Accettata |
| [0008](0008-orario-flessibile.md) | Orario con i giorni, o solo le lezioni in ordine; ore con ITP | Accettata |
| [0009](0009-calendario-e-preparazione.md) | Verifiche sul calendario senza permessi; materiale da preparare | Accettata |
| [0010](0010-orario-che-cambia.md) | Orario che cambia da una data; argomenti e voti spuntati senza lezione | Accettata |
| [0011](0011-riunioni.md) | Riunioni con le cose da preparare e il riepilogo della classe | Accettata |
| [0012](0012-anni-precedenti.md) | Programma copiato da un'altra classe; anni precedenti in archivio | Accettata |
| [0013](0013-programma-come-testo.md) | Programma svolto e piano di lavoro come testo da incollare | Accettata |
| [0014](0014-filtro-e-ora-di-inizio.md) | Classi da vedere nella settimana; ora d'inizio facoltativa | Accettata |
| [0015](0015-riepilogo.md) | Riepilogo per periodo a barre, con le note per lo scrutinio | Sostituita da 0020 e 0023 |
| [0016](0016-registro-e-orario.md) | Argomenti da incollare nel registro; orario da stampare | Accettata |
| [0017](0017-da-fare.md) | Da fare: le cose da preparare nascono dalle lezioni | Accettata |
| [0018](0018-lezioni-cambiate-a-mano.md) | Lezioni in più, spostate o eliminate a mano | Accettata |
| [0019](0019-passata-vuol-dire-fatta.md) | Una lezione pianificata e passata è fatta, senza confermarla | Accettata |
| [0020](0020-senza-ore-stimate.md) | Senza ore stimate: piano a settimane, riepilogo dei prossimi voti | Accettata |
| [0021](0021-dopo-la-riunione-e-settimana.md) | Cose da fare dopo una riunione, verifiche abbinate al programma, settimana dall'orario | Accettata |
| [0022](0022-passi-delle-attivita.md) | I passi di un'attività: cosa preparare prima, cosa fare dopo; il colore delle classi | Accettata |
| [0023](0023-note-al-posto-del-riepilogo.md) | Note come su Keep, collegabili alle classi; il riepilogo si scioglie in Classi, Voti e Anno | Accettata |
