# APPUNTI INFO

**Relazione** è sinonimo → **TABELLA** = **classe** → **colonne** = **attributi**  
**Riga** = **oggetto**

**PK (Primary Key)** = identificativo univoco che distingue il record dagli altri

## Cardinalità
- `o` = 0  
- `|` = 1  
- `}` = N


### Combinazioni di Cardinalità
- `||` = 1:1 (uno a uno)
- `|{` = 1:N (uno a molti)  prendo la PK della tabella con cardinalità 1 e la metto come FK nella tabella con cardinalità N
- `o{` = 0:N (zero a molti)
- `o|` = 0:1 (zero a uno)

||
|{
o{

FK = Foreign Key (chiave esterna) = attributo che fa riferimento alla PK di un'altra entità
serve per tradurre le relazioni tra entità in tabelle relazionali

comprare nella 1-N, metto una colonna nella "N" che fa riferimento alla PK della "1"

solitamente si mette il nome dell'entità _id
nella N-N mtto due foreing key perchè ha due entità

DATABASE
varchar (STRING) = stringa lunghezza variabile
char = stringa lunghezza fissa
NOT NULL = obbligatorio (non vuoto)

select * from tabella = prendi tutto da tabella
where = filtra le righe
per ogni = uso il group by 90%
unione join = unire la primary key con la foreign key della tabella collegata

se nell'esercizio leggo che ci sono due tabelle uso il join

# APPUNTI INFO - DATABASE E DIAGRAMMI ER

## TERMINOLOGIA BASE
**Relazione** = **TABELLA** = **classe**  
**Colonne** = **attributi** (proprietà dei dati)  
**Righe** = **oggetti/record** (singole istanze)

## CHIAVI
**PK (Primary Key)** = identificativo univoco che distingue ogni record dagli altri
- Non può essere NULL
- Deve essere unico
- Non dovrebbe mai cambiare
```sql
-- Esempio: ID_STUDENTE INT PRIMARY KEY
```

**FK (Foreign Key)** = chiave esterna, attributo che fa riferimento alla PK di un'altra entità
- Serve per tradurre le relazioni tra entità in tabelle relazionali
- Si nomina solitamente: `nome_entità_id`
```sql
-- Esempio: ID_CLASSE INT, FOREIGN KEY (ID_CLASSE) REFERENCES CLASSE(ID_CLASSE)
```

## CARDINALITÀ NEI DIAGRAMMI ER
- `o` = 0 (zero)
- `|` = 1 (una)  
- `}` = N (molte)

### Combinazioni di Cardinalità
- `||` = 1:1 (uno a uno)
- `|{` = 1:N (uno a molti)
- `o{` = 0:N (zero a molti)
- `o|` = 0:1 (zero a uno)

### REGOLA IMPORTANTE per 1:N
Nella relazione 1:N, metto una colonna nella tabella "N" che fa riferimento alla PK della tabella "1"
```sql
-- Esempio: CLASSE (1) --- (N) STUDENTE
-- Nella tabella STUDENTE aggiungo: ID_CLASSE INT
```

### REGOLA per N:N
Nella relazione N:N creo una tabella intermedia con due Foreign Key
con n-n faccio due classi e in quella intermedia metto le due pk che sono fk e diventano la PK di quella in mezzo (scomposta)
```sql
-- Esempio: STUDENTE (N) --- (N) CORSO
-- Creo tabella: ISCRIZIONE (ID_STUDENTE, ID_CORSO)
```

## TIPI DI DATI SQL
- `VARCHAR(n)` = stringa a lunghezza variabile (max n caratteri)
- `CHAR(n)` = stringa a lunghezza fissa (esattamente n caratteri)
- `INT` = numero intero
- `FLOAT` = numero decimale
- `NOT NULL` = campo obbligatorio (non può essere vuoto)

```sql
-- Esempio:
NOME VARCHAR(50) NOT NULL,
CODICE CHAR(5),
ETA INT,
VOTO FLOAT
```

## COMANDI SQL PRINCIPALI

### SELECT
`SELECT * FROM tabella` = seleziona tutto da una tabella

```sql
-- Esempio:
SELECT * FROM STUDENTE;
SELECT NOME, ETA FROM STUDENTE;
```

### WHERE
`WHERE` = filtra le righe in base a condizioni

```sql
-- Esempio:
SELECT * FROM STUDENTE WHERE ETA > 18;
SELECT NOME FROM STUDENTE WHERE CITTA = 'Milano';
```
### HAVING
`HAVING` = filtra i risultati di aggregazioni 
(usato con GROUP BY)

### GROUP BY
`GROUP BY` = raggruppa righe per calcolare aggregazioni


```sql
-- Esempio:
SELECT CITTA, COUNT(*) FROM STUDENTE GROUP BY CITTA;
SELECT CLASSE, AVG(VOTO) FROM STUDENTE GROUP BY CLASSE;
```

### JOIN
`JOIN` = unisce tabelle collegando PK con FK

```sql
-- Esempio:
SELECT S.NOME, C.NOME_CLASSE 
FROM STUDENTE S 
JOIN CLASSE C ON S.ID_CLASSE = C.ID_CLASSE;
```
### LEFT JOIN
mantiene le informazioni della tabella di sinistra
anche se non ci sono corrispondenze nella tabella di destra
la tabella di sinistra è quella dopo il FROM
### REGOLA PRATICA
- Se vedo "per ogni" → uso `GROUP BY` al 90%
- Se ci sono due o più tabelle collegate → uso `JOIN`

## FUNZIONI AGGREGATE (con GROUP BY)
- `COUNT(*)` = conta le righe
- `SUM(campo)` = somma i valori
- `AVG(campo)` = calcola la media
- `MAX(campo)` = valore massimo
- `MIN(campo)` = valore minimo

```sql
-- Esempi:
SELECT COUNT(*) FROM STUDENTE; -- conta tutti gli studenti
SELECT SUM(VOTO) FROM ESAME; -- somma tutti i voti
SELECT AVG(ETA) FROM STUDENTE; -- età media
SELECT MAX(VOTO), MIN(VOTO) FROM ESAME; -- voto più alto e più basso

-- Con GROUP BY:
SELECT CLASSE, COUNT(*) FROM STUDENTE GROUP BY CLASSE; -- studenti per classe
SELECT MATERIA, AVG(VOTO) FROM ESAME GROUP BY MATERIA; -- voto medio per materia
```

### SQL IN PYTHON
quando si lavora con i database in Python, bisogna sempre usare il terminale per stampare i risultati, il db serve solo per vedere che ho fatto,
ma devo avere i risultati nel terminale

bisogna creare un cursore
cursor = sqlite3.connect('nome_database.db') -- creo il collegamento al database
cursor =conn.cursor() -- creo il cursore

try = prova ad eseguire il codice nel blocco successivo
except = se c'è un errore esegui il codice nel blocco successivo
finally =  anche se trovi errori lo esegui comunque
create table if not exists = crea la tabella solo se non esiste già
conn.commit() = salva le modifiche
eseguo una select
cursor.execute("SELECT * FROM tabella")
eseguo una select con una riga
cursor.execute("SELECT * FROM tabella WHERE colonna=?", (valore,))
fetchall() = prendi tutte le righe, vanno usati quasi sempre per le query
fetchone() = prendi una riga
conn.rollback() = annulla le modifiche

LIMIT = ha un limite di righe che può prendere

LIKE ci permette di usare le wildcard, per ricerche parziali (simile a)
IN = per cercare più valori in una colonna
_ = un carattere
% = più caratteri o anche zero caratteri

## Modello per la verifica (esercizio Studenti + Esami) — sintetico

Schema SQL essenziale:
```sql
CREATE TABLE Studenti (
  Matricola INTEGER PRIMARY KEY,
  Nome TEXT NOT NULL,
  Cognome TEXT NOT NULL
);

CREATE TABLE Esami (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Matricola INTEGER NOT NULL,
  Corso TEXT NOT NULL,
  Voto INTEGER,
  FOREIGN KEY (Matricola) REFERENCES Studenti(Matricola)
);
```

Dataclass (tipi):
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Student:
    matricola: int
    nome: str
    cognome: str

@dataclass
class Exam:
    id: Optional[int]
    matricola: int
    corso: str
    voto: Optional[int]
```

Funzioni consigliate (con type hints):
- get_connection(db_path: str) -> sqlite3.Connection
- create_tables(conn: sqlite3.Connection) -> None
- insert_students(conn, students: List[Student]) -> None  (INSERT OR IGNORE)
- insert_exams(conn, exams: List[Exam]) -> None
- list_students(conn) -> List[Student]
- exams_by_student(conn, matricola: int) -> List[Tuple[str, Optional[int]]]
- exams_count_by_student(conn) -> List[Tuple[int, int]]

Query richieste:
1) Elenco studenti (Matricola, Nome, Cognome)
2) Corsi e voti di una matricola (es. 101)
3) Numero esami per studente (GROUP BY Matricola)

Note rapide per la correzione: usare placeholder `?`, separare funzioni (schema/inserimento/query), testare con `':memory:'`, controllare type hints e idempotenza.
## Modello basato sull'esercizio del professore (Studenti + Esami)

Di seguito una versione sintetica e direttamente applicabile dell'esercizio che ha usato il docente: schema, dataclass, funzioni e query richieste. Usa questa sezione come modello per la verifica.

Schema SQL (essenziale):
```sql
CREATE TABLE IF NOT EXISTS Studenti (
  Matricola INTEGER PRIMARY KEY,
  Nome TEXT NOT NULL,
  Cognome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Esami (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Matricola INTEGER NOT NULL,
  Corso TEXT NOT NULL,
  Voto INTEGER,
  FOREIGN KEY (Matricola) REFERENCES Studenti(Matricola)
);
```

Dataclass (Python, tipizzata):
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Student:
    matricola: int
    nome: str
    cognome: str

@dataclass
class Exam:
    id: Optional[int]
    matricola: int
    corso: str
    voto: Optional[int]
```
#  GUIDA COMPLETA SQL E QUERY PER LA VERIFICA

Questa guida unisce **tutti gli esempi e spiegazioni fondamentali** per affrontare la verifica di informatica su **diagramma ER, SQL e query**.

---

## 📘 STRUTTURA BASE (esempio)

Immagina che dal testo ricavi questo schema ER:

* **Studente (Matricola, Nome, Cognome)**
* **Corso (ID_Corso, NomeCorso)**
* **Esame (ID_Esame, Matricola, ID_Corso, Voto)** → relazione molti-a-molti (Studente–Corso)

### SQL — Creazione tabelle (DDL)

```sql
CREATE TABLE Studente (
  Matricola INTEGER PRIMARY KEY,
  Nome TEXT NOT NULL,
  Cognome TEXT NOT NULL
);

CREATE TABLE Corso (
  ID_Corso INTEGER PRIMARY KEY,
  NomeCorso TEXT NOT NULL
);

CREATE TABLE Esame (
  ID_Esame INTEGER PRIMARY KEY AUTOINCREMENT,
  Matricola INTEGER,
  ID_Corso INTEGER,
  Voto INTEGER,
  FOREIGN KEY (Matricola) REFERENCES Studente(Matricola),
  FOREIGN KEY (ID_Corso) REFERENCES Corso(ID_Corso)
);
```

---

##  QUERY BASE (DML)

###  Mostrare tutti i dati

```sql
SELECT * FROM Studente;
```

 “*” vuol dire “tutte le colonne”. È utile per controllare i dati velocemente.

---

### 2️⃣ Selezionare alcune colonne

```sql
SELECT Nome, Cognome FROM Studente;
```

 Mostra solo nome e cognome.

---

### 3️⃣ Filtrare righe — `WHERE`

```sql
SELECT * FROM Esame WHERE Voto >= 28;
```

Mostra solo gli esami con voto ≥ 28.

---

### 4️⃣ Ordinare — `ORDER BY`

```sql
SELECT * FROM Studente ORDER BY Cognome ASC, Nome ASC;
```

Ordina alfabeticamente per cognome e poi per nome.

---

### 5️⃣ Raggruppare — `GROUP BY`

```sql
SELECT Matricola, COUNT(*) AS Numero_Esami
FROM Esame
GROUP BY Matricola;
```

Conta quanti esami ha fatto ogni studente.
Regola: se nel testo leggi **“per ogni”**, devi usare **GROUP BY**.

---

### 6️⃣ Filtrare gruppi — `HAVING`

```sql
SELECT Matricola, COUNT(*) AS Numero_Esami
FROM Esame
GROUP BY Matricola
HAVING COUNT(*) >= 3;
```

 Mostra solo gli studenti che hanno fatto **almeno 3 esami**.

---

### 7️⃣ Media, somma, massimo, minimo

```sql
SELECT AVG(Voto) AS MediaVoti FROM Esame;
SELECT MAX(Voto) AS Migliore, MIN(Voto) AS Peggiore FROM Esame;
```

 Usi le **funzioni aggregate**: `AVG`, `MAX`, `MIN`, `COUNT`, `SUM`.

---

### 8️⃣ LIKE e ricerche parziali

```sql
SELECT * FROM Studente WHERE Nome LIKE 'Mar%';
```

`%` = qualunque sequenza di caratteri → trova nomi che **iniziano con “Mar”** (Marco, Martina...).

---

### 9️⃣ LIMIT e IN

```sql
SELECT * FROM Esame LIMIT 5;
SELECT * FROM Studente WHERE Città IN ('Milano', 'Torino');
```

👉 `LIMIT` mostra solo le prime righe; `IN` filtra più valori insieme.

---

# SQL JOIN e QUERY spiegate per la verifica

##  Cosa fa un JOIN

Un **JOIN** serve per **collegare i dati di due o più tabelle** usando una colonna in comune (di solito una **chiave esterna**, FK).
È quello che ti permette di “mettere insieme” le informazioni.

### Esempio pratico

Abbiamo tre tabelle: `Studente`, `Corso` ed `Esame` (vedi sopra).

### Obiettivo

Voglio sapere: **quale studente ha sostenuto quale corso e con che voto**.

---

##  INNER JOIN (il più usato)

```sql
SELECT S.Nome, S.Cognome, C.NomeCorso, E.Voto
FROM Studente S
JOIN Esame E ON S.Matricola = E.Matricola
JOIN Corso C ON E.ID_Corso = C.ID_Corso;
```

### Spiegazione passo-passo

1. `FROM Studente S` → la tabella principale è `Studente`.
   `S` è un **alias**: un nome abbreviato per scrivere meno.
   S = Studente, C = Corso, E = Esame
2. `JOIN Esame E ON S.Matricola = E.Matricola` → collega Studente con Esame tramite Matricola.
3. `JOIN Corso C ON E.ID_Corso = C.ID_Corso` → collega Esame con Corso.
4. `SELECT ...` → mostra solo le colonne utili.

### Cosa ottengo

| Nome  | Cognome | NomeCorso   | Voto |
| ----- | ------- | ----------- | ---- |
| Mario | Rossi   | Matematica  | 28   |
| Luca  | Bianchi | Informatica | 30   |

Solo gli studenti che **hanno fatto almeno un esame** compaiono (gli altri no).

---

## LEFT JOIN

Serve per **non perdere i dati della tabella di sinistra** anche se non ci sono corrispondenze nella tabella di destra.

```sql
SELECT S.Nome, S.Cognome, C.NomeCorso, E.Voto
FROM Studente S
LEFT JOIN Esame E ON S.Matricola = E.Matricola
LEFT JOIN Corso C ON E.ID_Corso = C.ID_Corso;
```

### Spiegazione

* Se uno studente **non ha ancora fatto esami**, apparirà comunque nel risultato.
* Le colonne di `Esame` o `Corso` saranno **NULL** (vuote).

### Esempio

| Nome  | Cognome | NomeCorso  | Voto |
| ----- | ------- | ---------- | ---- |
| Mario | Rossi   | Matematica | 28   |
| Luca  | Bianchi | NULL       | NULL |

👉 `LEFT JOIN` = mostra **tutti gli studenti**, anche se non hanno corrispondenze negli esami.

---

## JOIN: Schema mentale

| Tipo JOIN    | Cosa mostra                                                            | Quando usarlo                                                                 |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `INNER JOIN` | Solo le righe che coincidono in entrambe le tabelle                    | Quando vuoi solo i dati collegati                                             |
| `LEFT JOIN`  | Tutte le righe della tabella di sinistra + corrispondenze (se ci sono) | Quando vuoi vedere anche chi non ha corrispondenze (es. studenti senza esami) |

---

## Query spiegate passo-passo

### 1️⃣ Elenco studenti con corsi e voti

```sql
SELECT S.Nome, S.Cognome, C.NomeCorso, E.Voto
FROM Studente S
JOIN Esame E ON S.Matricola = E.Matricola
JOIN Corso C ON E.ID_Corso = C.ID_Corso;
```

👉 Mostra nome, cognome, corso e voto.
Serve quando hai **più tabelle collegate** tra loro.

---

### 2️⃣ Numero di esami per studente

```sql
SELECT S.Nome, S.Cognome, COUNT(E.ID_Esame) AS NumeroEsami
FROM Studente S
JOIN Esame E ON S.Matricola = E.Matricola
GROUP BY S.Matricola;
```

👉 “Per ogni studente” (`GROUP BY`) conta quanti esami ha fatto (`COUNT`).
**Regola**: se nel testo c’è scritto “PER OGNI” → usa `GROUP BY`.

---

### 3️⃣ Media dei voti per corso

```sql
SELECT C.NomeCorso, AVG(E.Voto) AS MediaVoto
FROM Corso C
JOIN Esame E ON C.ID_Corso = E.ID_Corso
GROUP BY C.NomeCorso;
```

👉 Calcola la media dei voti (`AVG`) raggruppando per corso.

---

### 4️⃣ Studenti con voto 30

```sql
SELECT S.Nome, S.Cognome, C.NomeCorso, E.Voto
FROM Studente S
JOIN Esame E ON S.Matricola = E.Matricola
JOIN Corso C ON E.ID_Corso = C.ID_Corso
WHERE E.Voto = 30;
```

👉 Usa `WHERE` per filtrare solo i voti perfetti.

---

### 5️⃣ Corsi senza esami (LEFT JOIN + IS NULL)

```sql
SELECT C.NomeCorso
FROM Corso C
LEFT JOIN Esame E ON C.ID_Corso = E.ID_Corso
WHERE E.ID_Esame IS NULL;
```

👉 Trova i corsi **senza esami associati**.
Con `LEFT JOIN` mostro tutti i corsi, e con `IS NULL` filtro quelli **senza corrispondenza**.

---

### 6️⃣ Studenti senza esami

```sql
SELECT S.Nome, S.Cognome
FROM Studente S
LEFT JOIN Esame E ON S.Matricola = E.Matricola
WHERE E.ID_Esame IS NULL;
```

👉 Stesso principio: `LEFT JOIN` per non perdere gli studenti, `IS NULL` per trovare chi non ha esami.

---

## Riepilogo comandi utili per la verifica

| Situazione nel testo                 | Comando SQL da usare    |
| ------------------------------------ | ----------------------- |
| "Elenca tutti..."                    | `SELECT * FROM ...`     |
| "Solo chi..." o "solo quelli con..." | `WHERE`                 |
| "Per ogni..."                        | `GROUP BY`              |
| "Numero di..."                       | `COUNT()`               |
| "Media di..."                        | `AVG()`                 |
| "Somma di..."                        | `SUM()`                 |
| "Studenti senza..."                  | `LEFT JOIN ... IS NULL` |
| "Studenti con..."                    | `JOIN + WHERE`          |

---

✅ **Consiglio finale**
Durante la verifica, prima fai **diagramma ER**, poi scrivi le **CREATE TABLE** con le chiavi giuste (PK, FK).
Infine fai le query seguendo le parole chiave nel testo:

* “Per ogni” → `GROUP BY`
* “Senza” → `LEFT JOIN ... IS NULL`
* “Con” → `INNER JOIN + WHERE`

---
