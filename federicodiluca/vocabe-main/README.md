# Vocabe

Una parola italiana al giorno: significato, esempi, etimologia. Il giorno dopo un quiz per ripassarla.

**[vocabe.federicodiluca.com](https://vocabe.federicodiluca.com/)**

Ripetizione spaziata per il ripasso, glossario di 1027 parole su cinque livelli di rarità e
8 raccolte tematiche da completare. Un test di livello iniziale sceglie una parola del giorno
adatta a chi la usa; ogni parola e ogni traguardo si possono condividere come card, e c'è un
riepilogo settimanale. Web app (PWA), funziona offline. Nessun account: i progressi stanno in
`localStorage`, esportabili come file JSON dalle impostazioni.

## Sviluppo

Node 20.19.1.

```bash
npm install
npm run dev
npm test                 # ~100 test sulla logica pura
npm run lint
npm run words:validate   # valida words.json e collections.json
npm run build            # build + pagine SEO statiche
npm run icons:build       # rigenera le icone da scripts/icon-source.svg
npm run social:build      # rigenera l'immagine di anteprima public/social-share.png
```

Stack: Vite, React, TypeScript, Tailwind, react-router, vite-plugin-pwa.

```text
src/
  app/        shell, routing, tema
  core/       content, storage, srs (Leitner), streak, badges, share, challenge, recap,
              placement (test di livello), quiz, install
  state/      store esterno + persistenza
  features/   daily · recall · explore · progress · settings · challenge · recap ·
              placement · share · install
  ui/         componenti condivisi (Logo, Icon, Button, Card, Sheet)
  data/       words.json (1027 voci) + collections.json (8 raccolte)
scripts/
  build-seo.mjs           genera dopo la build /parole/<slug>/, glossario, sitemap.xml
  build-icons.mjs         rigenera le icone da icon-source.svg (npm run icons:build)
  build-social-image.mjs  immagine di anteprima per i link condivisi (npm run social:build)
  validate-words.ts       controlli su words.json e collections.json (npm run words:validate)
```

## Deploy

GitHub Actions pubblica su GitHub Pages a ogni push su `main`
(`.github/workflows/deploy.yml`), servito dal dominio personalizzato `vocabe.federicodiluca.com`
(impostato in Settings → Pages del repository).

## Note

Vocabe è gratuito e senza pubblicità: nessun account, nessun acquisto, nessun servizio di
terze parti, nessuna analitica. Non c'è app da installare dagli store: dal browser si
installa col pulsante «Installa» (sotto la parola del giorno), che usa la finestra del browser
dove c'è e mostra le istruzioni passo passo dove manca (iPhone, iPad, Safari). Poi si comporta
come un'app, anche offline. Informativa privacy in `public/privacy/`.

## Licenza

Codice: [MIT](LICENSE). Dati (`src/data/`): [CC BY-SA 4.0](src/data/LICENSE) — riusabili
citando Vocabe e mantenendo la stessa licenza.

---

[Federico Di Luca](https://federicodiluca.com/)
