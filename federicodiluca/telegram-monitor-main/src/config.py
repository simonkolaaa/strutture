"""Configurazione centralizzata letta dalle variabili d'ambiente (o dal file .env)."""
import os

from dotenv import load_dotenv

# Carica il file .env se presente (in Docker le variabili arrivano da env_file)
load_dotenv()


def _get_int(name, default):
    """Legge un intero dall'ambiente, ricadendo sul default se assente o non valido."""
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        raise SystemExit(f"La variabile {name} deve essere un intero, trovato: {raw!r}")


TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")
POLLING_INTERVAL = _get_int("POLLING_INTERVAL", 120)
LOG_RETENTION_DAYS = _get_int("LOG_RETENTION_DAYS", 14)
LOG_DIR = os.getenv("LOG_DIR", "log")
IP_FILE = os.getenv("IP_FILE", "current_ip.json")  # File per memorizzare l'IP corrente
HTTP_TIMEOUT = _get_int("HTTP_TIMEOUT", 10)

# Limite di Telegram per il testo di un singolo messaggio
TELEGRAM_MAX_MESSAGE_LENGTH = 4096
# Numero massimo di righe restituite da /log
MAX_LOG_LINES = 200


def validate():
    """Verifica che la configurazione minima sia presente; termina con un messaggio chiaro."""
    missing = [name for name, value in (("TELEGRAM_TOKEN", TOKEN), ("CHAT_ID", CHAT_ID)) if not value]
    if missing:
        raise SystemExit(f"Variabili d'ambiente mancanti: {', '.join(missing)}")
    if POLLING_INTERVAL <= 0:
        raise SystemExit("POLLING_INTERVAL deve essere maggiore di 0")
    if LOG_RETENTION_DAYS < 0:
        raise SystemExit("LOG_RETENTION_DAYS non può essere negativo")
