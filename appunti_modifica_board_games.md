# 🎮 Appunti Pratici: Board Games App → Adattamento per Verifica

## 📖 ANALISI STRUTTURA ATTUALE (Board Games App 2)

### Entità Esistenti
```
GIOCHI (entità principale)
├── id (PK)
├── nome
├── numero_giocatori_massimo
├── durata_media
└── categoria

PARTITE (entità dipendente)
├── id (PK)
├── gioco_id (FK → giochi.id)
├── data
├── vincitore
└── punteggio_vincitore

Relazione: 1:N (un gioco ha molte partite)
```

### File Chiave da Modificare
```
video-app/
├── app/
│   ├── __init__.py                    [✓ Cambiare nome DB]
│   ├── schema.sql                     [★ MODIFICARE TUTTO]
│   ├── main.py                        [★ Modificare routes]
│   ├── repositories/
│   │   ├── game_repository.py         [★ Rinominare + modificare]
│   │   └── match_repository.py        [★ Rinominare + modificare]
│   └── templates/
│       ├── base.html                  [✓ Cambiare titoli nav]
│       ├── index.html                 [★ Adattare campi]
│       ├── game_detail.html           [★ Adattare campi]
│       ├── create_game.html           [★ Adattare form]
│       └── create_match.html          [★ Adattare form]
└── setup_db.py                        [✓ Cambiare path DB]
```

---

## 🔄 WORKFLOW: Da Board Games a [NUOVA APP]

### STEP 1: Leggi il README della verifica

**Esempio README Verifica:**
```markdown
# App Flask per Libri e Prestiti

## Entità
- Libri: titolo, autore, anno_pubblicazione, genere
- Prestiti: data_prestito, lettore, data_restituzione_prevista

Relazione: Un libro può avere più prestiti
```

### STEP 2: Mappa le corrispondenze

| Board Games (OLD) | Nuova App (NEW) | Azione |
|-------------------|-----------------|--------|
| giochi | libri | Rinomina tabella |
| nome | titolo | Rinomina campo |
| numero_giocatori_massimo | autore | Cambia tipo dato |
| durata_media | anno_pubblicazione | Cambia tipo dato |
| categoria | genere | Ok stesso tipo |
| partite | prestiti | Rinomina tabella |
| data | data_prestito | Rinomina campo |
| vincitore | lettore | Rinomina campo |
| punteggio_vincitore | data_restituzione_prevista | Cambia tipo dato |

---

## 📝 TEMPLATE MODIFICHE PASSO-PASSO

### MODIFICA 1: `app/__init__.py`

**PRIMA:**
```python
DATABASE=os.path.join(app.instance_path, "board_games.sqlite"),
```

**DOPO:**
```python
DATABASE=os.path.join(app.instance_path, "biblioteca.sqlite"),  # ← Cambia nome
```

---

### MODIFICA 2: `app/schema.sql` ⭐ PIÙ IMPORTANTE

**TEMPLATE DA SEGUIRE:**
```sql
-- PASSO 1: DROP (ordine inverso!)
DROP TABLE IF EXISTS [tabella_dipendente];
DROP TABLE IF EXISTS [tabella_principale];

-- PASSO 2: CREATE tabella principale
CREATE TABLE [tabella_principale] (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  [campo1] TEXT NOT NULL,              -- Es: titolo
  [campo2] TEXT NOT NULL,              -- Es: autore
  [campo3] INTEGER NOT NULL,           -- Es: anno_pubblicazione
  [campo4] TEXT NOT NULL               -- Es: genere
);

-- PASSO 3: CREATE tabella dipendente
CREATE TABLE [tabella_dipendente] (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  [principale_id] INTEGER NOT NULL,    -- Es: libro_id
  [campo1] DATE NOT NULL,              -- Es: data_prestito
  [campo2] TEXT NOT NULL,              -- Es: lettore
  [campo3] DATE NOT NULL,              -- Es: data_restituzione_prevista
  FOREIGN KEY ([principale_id]) REFERENCES [tabella_principale] (id)
);

-- PASSO 4: INSERT dati esempio (almeno 3-5)
INSERT INTO [tabella_principale] ([campo1], [campo2], [campo3], [campo4]) 
VALUES ('Valore1', 'Valore2', 2020, 'Categoria1');

INSERT INTO [tabella_dipendente] ([principale_id], [campo1], [campo2], [campo3])
VALUES (1, '2024-01-15', 'Mario Rossi', '2024-02-15');
```

**ESEMPIO CONCRETO (Biblioteca):**
```sql
DROP TABLE IF EXISTS prestiti;
DROP TABLE IF EXISTS libri;

CREATE TABLE libri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titolo TEXT NOT NULL,
  autore TEXT NOT NULL,
  anno_pubblicazione INTEGER NOT NULL,
  genere TEXT NOT NULL
);

CREATE TABLE prestiti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libro_id INTEGER NOT NULL,
  data_prestito DATE NOT NULL,
  lettore TEXT NOT NULL,
  data_restituzione_prevista DATE NOT NULL,
  FOREIGN KEY (libro_id) REFERENCES libri (id)
);

INSERT INTO libri (titolo, autore, anno_pubblicazione, genere) 
VALUES ('1984', 'George Orwell', 1949, 'Distopia');
INSERT INTO libri (titolo, autore, anno_pubblicazione, genere) 
VALUES ('Il Signore degli Anelli', 'J.R.R. Tolkien', 1954, 'Fantasy');
INSERT INTO libri (titolo, autore, anno_pubblicazione, genere) 
VALUES ('Orgoglio e Pregiudizio', 'Jane Austen', 1813, 'Romantico');

INSERT INTO prestiti (libro_id, data_prestito, lettore, data_restituzione_prevista)
VALUES (1, '2024-01-10', 'Mario Rossi', '2024-02-10');
INSERT INTO prestiti (libro_id, data_prestito, lettore, data_restituzione_prevista)
VALUES (1, '2024-03-15', 'Lucia Bianchi', '2024-04-15');
INSERT INTO prestiti (libro_id, data_prestito, lettore, data_restituzione_prevista)
VALUES (2, '2024-01-20', 'Giuseppe Verdi', '2024-02-20');
```

---

### MODIFICA 3: Repository Principale

**FILE: Rinomina `game_repository.py` → `libro_repository.py`**

**PATTERN DI MODIFICA:**

```python
# FUNZIONE 1: get_all
def get_all_[entita]():  # Es: get_all_libri()
    """Recupera tutte le [entità]."""
    db = get_db()
    query = """
        SELECT id, [campo1], [campo2], [campo3], [campo4]
        FROM [tabella]
        ORDER BY [campo1]
    """
    results = db.execute(query).fetchall()
    return [dict(row) for row in results]

# FUNZIONE 2: get_by_id
def get_[entita]_by_id([entita]_id):  # Es: get_libro_by_id(libro_id)
    """Recupera una singola [entità] per ID."""
    db = get_db()
    query = """
        SELECT id, [campo1], [campo2], [campo3], [campo4]
        FROM [tabella]
        WHERE id = ?
    """
    result = db.execute(query, ([entita]_id,)).fetchone()
    if result:
        return dict(result)
    return None

# FUNZIONE 3: create
def create_[entita]([campo1], [campo2], [campo3], [campo4]):
    """Crea una nuova [entità]."""
    db = get_db()
    cursor = db.execute(
        "INSERT INTO [tabella] ([campo1], [campo2], [campo3], [campo4]) VALUES (?, ?, ?, ?)",
        ([campo1], [campo2], [campo3], [campo4])
    )
    db.commit()
    return cursor.lastrowid
```

**ESEMPIO CONCRETO:**
```python
# libro_repository.py
from app.db import get_db

def get_all_libri():
    """Recupera tutti i libri."""
    db = get_db()
    query = """
        SELECT id, titolo, autore, anno_pubblicazione, genere
        FROM libri
        ORDER BY titolo
    """
    libri = db.execute(query).fetchall()
    return [dict(libro) for libro in libri]

def get_libro_by_id(libro_id):
    """Recupera un singolo libro per ID."""
    db = get_db()
    query = """
        SELECT id, titolo, autore, anno_pubblicazione, genere
        FROM libri
        WHERE id = ?
    """
    libro = db.execute(query, (libro_id,)).fetchone()
    if libro:
        return dict(libro)
    return None

def create_libro(titolo, autore, anno_pubblicazione, genere):
    """Crea un nuovo libro."""
    db = get_db()
    cursor = db.execute(
        "INSERT INTO libri (titolo, autore, anno_pubblicazione, genere) VALUES (?, ?, ?, ?)",
        (titolo, autore, anno_pubblicazione, genere)
    )
    db.commit()
    return cursor.lastrowid
```

---

### MODIFICA 4: Repository Dipendente

**FILE: Rinomina `match_repository.py` → `prestito_repository.py`**

```python
# prestito_repository.py
from app.db import get_db

def get_prestiti_by_libro(libro_id):
    """Recupera tutti i prestiti di un libro specifico."""
    db = get_db()
    query = """
        SELECT id, libro_id, data_prestito, lettore, data_restituzione_prevista
        FROM prestiti
        WHERE libro_id = ?
        ORDER BY data_prestito DESC
    """
    prestiti = db.execute(query, (libro_id,)).fetchall()
    return [dict(prestito) for prestito in prestiti]

def create_prestito(libro_id, data_prestito, lettore, data_restituzione_prevista):
    """Crea un nuovo prestito."""
    db = get_db()
    cursor = db.execute(
        "INSERT INTO prestiti (libro_id, data_prestito, lettore, data_restituzione_prevista) VALUES (?, ?, ?, ?)",
        (libro_id, data_prestito, lettore, data_restituzione_prevista)
    )
    db.commit()
    return cursor.lastrowid
```

---

### MODIFICA 5: `app/main.py` - Routes

**PATTERN DI MODIFICA:**

```python
from app.repositories import [entita1]_repository, [entita2]_repository

bp = Blueprint("main", __name__)

# ROUTE 1: Index
@bp.route("/")
def index():
    [entita] = [entita1]_repository.get_all_[entita]()
    return render_template("index.html", [entita]=[entita])

# ROUTE 2: Detail
@bp.route("/[entita]/<int:id>")
def [entita]_detail(id):
    [entita_singola] = [entita1]_repository.get_[entita]_by_id(id)
    if [entita_singola] is None:
        abort(404, "[Entità] non trovata.")
    
    [entita_correlate] = [entita2]_repository.get_[entita2]_by_[entita1](id)
    return render_template("[entita]_detail.html", 
                          [entita_singola]=[entita_singola], 
                          [entita_correlate]=[entita_correlate])

# ROUTE 3: Create principale
@bp.route("/create_[entita]", methods=("GET", "POST"))
def create_[entita]():
    if request.method == "POST":
        [campo1] = request.form["[campo1]"]
        [campo2] = request.form["[campo2]"]
        # ... validazione ...
        
        if error is None:
            [entita1]_repository.create_[entita]([campo1], [campo2], ...)
            return redirect(url_for("main.index"))
    
    return render_template("create_[entita].html")

# ROUTE 4: Create dipendente
@bp.route("/create_[entita2]", methods=("GET", "POST"))
def create_[entita2]():
    if request.method == "POST":
        [entita1_id] = request.form.get("[entita1]_id", type=int)
        # ... validazione ...
        
        if error is None:
            [entita2]_repository.create_[entita2]([entita1_id], ...)
            return redirect(url_for("main.[entita]_detail", id=[entita1_id]))
    
    [lista_entita1] = [entita1]_repository.get_all_[entita1]()
    return render_template("create_[entita2].html", [lista]=[lista_entita1])
```

**ESEMPIO CONCRETO:**
```python
# main.py
from flask import Blueprint, flash, redirect, render_template, request, url_for
from werkzeug.exceptions import abort
from app.repositories import libro_repository, prestito_repository

bp = Blueprint("main", __name__)

@bp.route("/")
def index():
    libri = libro_repository.get_all_libri()
    return render_template("index.html", libri=libri)

@bp.route("/libro/<int:id>")
def libro_detail(id):
    libro = libro_repository.get_libro_by_id(id)
    if libro is None:
        abort(404, "Libro non trovato.")
    
    prestiti = prestito_repository.get_prestiti_by_libro(id)
    return render_template("libro_detail.html", libro=libro, prestiti=prestiti)

@bp.route("/create_libro", methods=("GET", "POST"))
def create_libro():
    if request.method == "POST":
        titolo = request.form["titolo"]
        autore = request.form["autore"]
        anno_pubblicazione = request.form.get("anno_pubblicazione", 0, type=int)
        genere = request.form["genere"]
        error = None

        if not titolo:
            error = "Il titolo è obbligatorio."
        if not autore:
            error = "L'autore è obbligatorio."
        if anno_pubblicazione <= 0:
            error = "L'anno deve essere valido."
        if not genere:
            error = "Il genere è obbligatorio."

        if error is not None:
            flash(error)
        else:
            libro_repository.create_libro(titolo, autore, anno_pubblicazione, genere)
            return redirect(url_for("main.index"))

    return render_template("create_libro.html")

@bp.route("/create_prestito", methods=("GET", "POST"))
def create_prestito():
    if request.method == "POST":
        libro_id = request.form.get("libro_id", type=int)
        data_prestito = request.form["data_prestito"]
        lettore = request.form["lettore"]
        data_restituzione_prevista = request.form["data_restituzione_prevista"]
        error = None

        if libro_id is None:
            error = "Seleziona un libro."
        if not data_prestito:
            error = "La data di prestito è obbligatoria."
        if not lettore:
            error = "Il nome del lettore è obbligatorio."
        if not data_restituzione_prevista:
            error = "La data di restituzione è obbligatoria."

        if error is not None:
            flash(error)
        else:
            prestito_repository.create_prestito(libro_id, data_prestito, lettore, data_restituzione_prevista)
            return redirect(url_for("main.libro_detail", id=libro_id))

    libri = libro_repository.get_all_libri()
    return render_template("create_prestito.html", libri=libri)
```

---

### MODIFICA 6: Templates

#### `templates/base.html`

**MODIFICHE:**
```html
<title>{% block title %}Biblioteca App{% endblock %}</title>  <!-- ← Cambia titolo -->

<nav>
    <a href="{{ url_for('main.index') }}">Biblioteca App</a>        <!-- ← Cambia -->
    <a href="{{ url_for('main.create_libro') }}">Aggiungi Libro</a>  <!-- ← Cambia -->
    <a href="{{ url_for('main.create_prestito') }}">Registra Prestito</a> <!-- ← Cambia -->
</nav>

<footer>
    <small>&copy; 2024 - Biblioteca App</small>  <!-- ← Cambia -->
</footer>
```

#### `templates/index.html`

**PATTERN:**
```html
{% extends 'base.html' %}

{% block content %}
<h1>[Entità Principale] Disponibili</h1>

{% for item in [lista_entita] %}
<article>
    <header>
        <h2><a href="{{ url_for('main.[entita]_detail', id=item['id']) }}">
            {{ item['[campo_principale]'] }}
        </a></h2>
        <small>[Campo2]: {{ item['[campo2]'] }} - [Campo3]: {{ item['[campo3]'] }}</small>
    </header>
</article>
<hr>
{% endfor %}
{% endblock %}
```

**ESEMPIO CONCRETO:**
```html
{% extends 'base.html' %}

{% block content %}
<h1>Libri Disponibili</h1>

{% for libro in libri %}
<article>
    <header>
        <h2><a href="{{ url_for('main.libro_detail', id=libro['id']) }}">
            {{ libro['titolo'] }}
        </a></h2>
        <small>Autore: {{ libro['autore'] }} - Anno: {{ libro['anno_pubblicazione'] }} - Genere: {{ libro['genere'] }}</small>
    </header>
</article>
<hr>
{% endfor %}
{% endblock %}
```

#### `templates/[entita]_detail.html`

**ESEMPIO CONCRETO:**
```html
{% extends 'base.html' %}

{% block content %}
<h1>Libro: {{ libro['titolo'] }}</h1>
<p>Autore: {{ libro['autore'] }} - Anno: {{ libro['anno_pubblicazione'] }} - Genere: {{ libro['genere'] }}</p>

<h2>Prestiti Registrati</h2>
{% if prestiti %}
{% for prestito in prestiti %}
<article>
    <header>
        <h3>Lettore: {{ prestito['lettore'] }}</h3>
        <small>Prestito: {{ prestito['data_prestito'] }} - Restituzione prevista: {{ prestito['data_restituzione_prevista'] }}</small>
    </header>
</article>
<hr>
{% endfor %}
{% else %}
<p>Nessun prestito registrato per questo libro.</p>
{% endif %}

<a href="{{ url_for('main.index') }}">Torna ai libri</a>
{% endblock %}
```

#### `templates/create_[entita].html`

**ESEMPIO CONCRETO:**
```html
{% extends 'base.html' %}

{% block content %}
<h1>Aggiungi Nuovo Libro</h1>
<form method="post">
    <label for="titolo">Titolo del Libro</label>
    <input name="titolo" id="titolo" required>

    <label for="autore">Autore</label>
    <input name="autore" id="autore" required>

    <label for="anno_pubblicazione">Anno di Pubblicazione</label>
    <input name="anno_pubblicazione" id="anno_pubblicazione" type="number" min="1" required>

    <label for="genere">Genere</label>
    <input name="genere" id="genere" required>

    <input type="submit" value="Aggiungi Libro">
</form>
{% endblock %}
```

#### `templates/create_[entita2].html`

**ESEMPIO CONCRETO:**
```html
{% extends 'base.html' %}

{% block content %}
<h1>Registra Nuovo Prestito</h1>
<form method="post">
    <label for="libro_id">Libro</label>
    <select name="libro_id" id="libro_id" required>
        <option value="">Seleziona un libro</option>
        {% for libro in libri %}
        <option value="{{ libro['id'] }}">{{ libro['titolo'] }}</option>
        {% endfor %}
    </select>

    <label for="data_prestito">Data del Prestito</label>
    <input name="data_prestito" id="data_prestito" type="date" required>

    <label for="lettore">Nome del Lettore</label>
    <input name="lettore" id="lettore" required>

    <label for="data_restituzione_prevista">Data Restituzione Prevista</label>
    <input name="data_restituzione_prevista" id="data_restituzione_prevista" type="date" required>

    <input type="submit" value="Registra Prestito">
</form>
{% endblock %}
```

---

### MODIFICA 7: `setup_db.py`

**MODIFICHE:**
```python
db_path = os.path.join("instance", "biblioteca.sqlite")  # ← Cambia nome DB
```

---

## 🎯 CHECKLIST VELOCE MODIFICHE

### Setup Iniziale (5 min)
- [ ] Copia cartella `video-app` → `[nome-nuovo-progetto]`
- [ ] Leggi README verifica per capire entità e campi
- [ ] Scrivi su carta: mappatura OLD → NEW

### Modifiche Codice (60-90 min)
- [ ] `app/__init__.py`: Cambia nome database
- [ ] `app/schema.sql`: Riscrivi tutto da zero seguendo template
- [ ] Rinomina file repository:
  - [ ] `game_repository.py` → `[entita1]_repository.py`
  - [ ] `match_repository.py` → `[entita2]_repository.py`
- [ ] Modifica contenuto repositories (get_all, get_by_id, create)
- [ ] `app/main.py`: Cambia tutti i nomi (import, funzioni, variabili)
- [ ] `setup_db.py`: Cambia nome database

### Modifiche Template (30-45 min)
- [ ] `base.html`: Titoli e navbar
- [ ] `index.html`: Campi visualizzati
- [ ] `[entita]_detail.html`: Campi e relazioni
- [ ] `create_[entita].html`: Form fields
- [ ] `create_[entita2].html`: Form fields + select

### Test e Commit (15-30 min)
- [ ] Esegui `python setup_db.py`
- [ ] Verifica creazione DB in `instance/`
- [ ] Esegui `python run.py`
- [ ] Testa tutti i flussi nel browser
- [ ] **GIT COMMIT FINALE**

---

## 💡 TRUCCHI RAPIDI

### Trova e Sostituisci Globale (in VS Code)
```
CTRL + SHIFT + H (Find and Replace in Files)

Sostituisci:
game → libro
games → libri
match → prestito
matches → prestiti
gioco → libro
partita → prestito
Board Games → Biblioteca
```

### Test Rapido Query SQL
```bash
python3
>>> import sqlite3
>>> conn = sqlite3.connect('instance/biblioteca.sqlite')
>>> cursor = conn.execute("SELECT * FROM libri")
>>> print(cursor.fetchall())
```

### Debug Print in Routes
```python
print(f"DEBUG: form data = {dict(request.form)}")
print(f"DEBUG: libri trovati = {len(libri)}")
```

---

## 📊 ESEMPI DI TRACCIATI COMUNI

### 1. Ristorante (Piatti e Ordinazioni)
```
Piatti: nome, prezzo, categoria, tempo_preparazione
Ordinazioni: piatto_id, tavolo, quantità, ora_ordinazione
```

### 2. Palestra (Corsi e Iscrizioni)
```
Corsi: nome, istruttore, giorno_settimana, orario, posti_disponibili
Iscrizioni: corso_id, partecipante, data_iscrizione
```

### 3. Cinema (Film e Proiezioni)
```
Film: titolo, regista, anno, durata, genere
Proiezioni: film_id, sala, data_proiezione, ora_inizio, biglietti_venduti
```

### 4. Negozio (Prodotti e Vendite)
```
Prodotti: nome, marca, prezzo, categoria, giacenza
Vendite: prodotto_id, quantità, data_vendita, cliente
```

### 5. Università (Corsi e Esami)
```
Corsi: nome, docente, crediti, semestre
Esami: corso_id, studente, data_esame, voto
```

---

## ⚠️ ATTENZIONE A...

### Cambio Tipo Dati
Se il tracciato cambia tipo di dato:
- `numero_giocatori_massimo INTEGER` → `autore TEXT`
- Cambia anche validazione nel form!
- Cambia anche il tipo di `<input>`!

```html
<!-- DA: -->
<input name="numero_giocatori_massimo" type="number" min="1" required>

<!-- A: -->
<input name="autore" type="text" required>
```

```python
# DA:
numero_giocatori = request.form.get("numero_giocatori_massimo", 0, type=int)
if numero_giocatori <= 0:
    error = "Numero giocatori deve essere positivo"

# A:
autore = request.form["autore"]
if not autore:
    error = "L'autore è obbligatorio"
```

### Ordine Import
```python
# CORRETTO
from app.repositories import libro_repository, prestito_repository

# SBAGLIATO (errore se i file non esistono più!)
from app.repositories import game_repository, match_repository
```

---

## 🚀 COMANDO FINALE VERIFICA

```bash
# 1. Setup database
python setup_db.py

# 2. Verifica creazione
ls -la instance/

# 3. Avvia app
python run.py

# 4. Apri browser
http://127.0.0.1:5000

# 5. Test tutti i flussi:
# - Visualizza lista
# - Crea entità principale
# - Visualizza dettaglio
# - Crea entità dipendente
# - Verifica dati salvati

# 6. Git commit
git add .
git commit -m "Complete biblioteca app implementation"
git push origin main
```

---

**Stampa questa guida e tienila accanto durante la verifica!** 📄

Ogni sezione ha un esempio concreto che puoi copiare e adattare. 🎯
