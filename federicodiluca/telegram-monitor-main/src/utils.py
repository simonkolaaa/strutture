import datetime
import json
import logging
import os
import re

import psutil
import requests

import config

logger = logging.getLogger(__name__)

IPINFO_URL = "https://ipinfo.io/json"
LOG_FILE_PATTERN = re.compile(r"^log_(\d{4}-\d{2}-\d{2})\.txt$")


def fetch_public_ip(timeout=None):
    """Fetch the public IP address from ipinfo.io. Returns a dict or None on failure."""
    timeout = config.HTTP_TIMEOUT if timeout is None else timeout
    try:
        response = requests.get(IPINFO_URL, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as e:
        logger.error("Error fetching IP: %s", e)
        return None
    if not isinstance(data, dict) or not data.get("ip"):
        logger.error("Unexpected response from ipinfo.io: %r", data)
        return None
    data.pop("readme", None)  # Remove the "readme" field if it exists
    return data


def format_ip_info(ip_info):
    """Formatta le informazioni sull'IP come righe `chiave: valore`."""
    return "\n".join(f"{key}: {value}" for key, value in ip_info.items())


def load_ip_info(path=None):
    """Carica l'IP corrente dal file. Restituisce None se il file manca o non è valido."""
    path = config.IP_FILE if path is None else path
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
    except (OSError, json.JSONDecodeError) as e:
        logger.warning("Impossibile leggere il file IP (%s), sarà ricreato.", e)
        return None
    if not isinstance(data, dict) or not data.get("ip"):
        logger.warning("Contenuto del file IP non valido, sarà ricreato.")
        return None
    return data


def save_ip_info(ip_info, path=None):
    """Salva l'IP corrente nel file in modo atomico (scrittura su file temporaneo + rename)."""
    path = config.IP_FILE if path is None else path
    tmp_path = f"{path}.tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as file:
            json.dump(ip_info, file)
        os.replace(tmp_path, path)
    except OSError as e:
        logger.error("Impossibile salvare il file IP %s: %s", path, e)
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def ensure_log_directory(log_dir):
    """Ensure the log directory exists."""
    os.makedirs(log_dir, exist_ok=True)


def get_log_file_path(log_dir, date=None):
    """Get the log file path for the given day (default: today)."""
    date = datetime.datetime.now() if date is None else date
    return os.path.join(log_dir, f"log_{date.strftime('%Y-%m-%d')}.txt")


def clean_old_logs(log_dir, retention_days):
    """Remove log files older than the retention period. Files not matching the
    `log_YYYY-MM-DD.txt` pattern are ignored."""
    if not os.path.isdir(log_dir):
        return
    today = datetime.date.today()
    for filename in os.listdir(log_dir):
        match = LOG_FILE_PATTERN.match(filename)
        if not match:
            continue
        try:
            file_date = datetime.datetime.strptime(match.group(1), "%Y-%m-%d").date()
        except ValueError:
            continue
        if (today - file_date).days > retention_days:
            file_path = os.path.join(log_dir, filename)
            try:
                os.remove(file_path)
                logger.info("Rimosso log obsoleto: %s", file_path)
            except OSError as e:
                logger.warning("Impossibile rimuovere %s: %s", file_path, e)


def _append_log_line(log_dir, line):
    ensure_log_directory(log_dir)
    with open(get_log_file_path(log_dir), "a", encoding="utf-8") as f:
        f.write(f"{line}\n")


def _timestamp():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log_ip_check(ip_info, log_dir="log"):
    """Log the IP check to a specified log directory."""
    log_message = f"IP Check: {ip_info.get('ip')} - {ip_info.get('city')}"
    logger.info(log_message)
    _append_log_line(log_dir, f"[{_timestamp()}] {log_message}")


def log_ip_change(old_ip_info, new_ip_info, log_dir="log"):
    """Log the IP change to a specified log directory."""
    log_message = (
        f"IP CAMBIATO DA {old_ip_info.get('ip')} - {old_ip_info.get('city')} "
        f"A {new_ip_info.get('ip')} - {new_ip_info.get('city')}"
    )
    logger.info(log_message)
    _append_log_line(log_dir, f"[{_timestamp()}] {log_message}")


def read_last_logs(log_dir, num_lines):
    """Restituisce le ultime `num_lines` righe del log di oggi (lista vuota se assente)."""
    log_file = get_log_file_path(log_dir)
    if num_lines <= 0 or not os.path.isfile(log_file):
        return []
    with open(log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return lines[-num_lines:]


def truncate_message(text, limit=config.TELEGRAM_MAX_MESSAGE_LENGTH):
    """Tronca il testo al limite di Telegram, conservando la parte finale (i log più recenti)."""
    if len(text) <= limit:
        return text
    marker = "[...]\n"
    return marker + text[-(limit - len(marker)):]


def get_system_metrics(cpu_interval=1):
    """Get system metrics such as CPU, RAM, and internet usage. Blocking: run in a thread."""
    cpu_usage = psutil.cpu_percent(interval=cpu_interval)
    ram_usage = psutil.virtual_memory().percent
    net_io = psutil.net_io_counters()
    return (
        f"CPU Usage: {cpu_usage}%\n"
        f"RAM Usage: {ram_usage}%\n"
        f"Bytes Sent: {net_io.bytes_sent}\n"
        f"Bytes Received: {net_io.bytes_recv}"
    )
