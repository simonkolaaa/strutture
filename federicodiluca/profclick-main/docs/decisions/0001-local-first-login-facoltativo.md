# 0001 — App statica local-first, login Google facoltativo

## Contesto

ProfClick sostituisce le note sparse su Keep: deve aprirsi subito, funzionare in classe anche
senza rete e non chiedere manutenzione. Deve poterlo provare chiunque, ma senza che l'autore
gestisca dati o account di altri. Per il deploy deve bastare GitHub Pages.

## Decisione

- **Nessun backend**: SPA statica su GitHub Pages, tutto gira nel browser.
- **Si usa subito, senza login**: i dati stanno su IndexedDB. Google serve solo per avere gli
  stessi dati su più dispositivi (ADR 0003). "Registrarsi" coincide con collegare Drive.
- Il token Google vive in memoria e dura un'ora: dopo, il pulsante "Sincronizza" lo rinnova
  con un tocco. Un flag in localStorage ricorda che il dispositivo era collegato.

## Alternative scartate

- **Firebase / Supabase**: login e sync pronti, ma i dati degli utenti starebbero su un
  servizio gestito dall'autore, con i relativi obblighi (GDPR, costi, backup).
- **Login obbligatorio all'apertura**, come Duetrack: lì serve per leggere il calendario; qui
  sarebbe solo attrito prima di vedere la propria settimana.
