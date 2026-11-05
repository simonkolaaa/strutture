import asyncio
import functools
import logging

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

import config
from utils import fetch_public_ip, format_ip_info, get_system_metrics, read_last_logs, truncate_message

logger = logging.getLogger(__name__)

DEFAULT_LOG_LINES = 10


def is_authorized(chat_id):
    """Solo la chat configurata in CHAT_ID può usare i comandi."""
    return config.CHAT_ID is not None and str(chat_id) == str(config.CHAT_ID)


def authorized_only(handler):
    """Decoratore: ignora i comandi provenienti da chat diverse da CHAT_ID."""

    @functools.wraps(handler)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        chat = update.effective_chat
        chat_id = chat.id if chat else None
        if not is_authorized(chat_id):
            logger.warning("Comando rifiutato da chat non autorizzata: %s", chat_id)
            if update.effective_message:
                await update.effective_message.reply_text("Non autorizzato.")
            return
        await handler(update, context)

    return wrapper


def parse_log_count(args, default=DEFAULT_LOG_LINES, maximum=config.MAX_LOG_LINES):
    """Interpreta l'argomento di /log; restituisce un intero in [1, maximum] o None se non valido."""
    if not args:
        return default
    try:
        value = int(args[0])
    except (TypeError, ValueError):
        return None
    if value < 1:
        return None
    return min(value, maximum)


@authorized_only
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Inizializza il bot e invia un messaggio di benvenuto."""
    await update.effective_message.reply_text(
        "Benvenuto! Usa i seguenti comandi:\n"
        "- /ip per ottenere l'IP corrente e i dettagli\n"
        f"- /log [n] per visualizzare gli ultimi n log degli IP del giorno corrente (predefinito: {DEFAULT_LOG_LINES})\n"
        "- /metrics per ottenere le metriche di sistema (CPU, RAM, Internet, etc.)"
    )


@authorized_only
async def ip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce il comando /ip per recuperare l'IP pubblico."""
    ip_info = await asyncio.to_thread(fetch_public_ip)
    if ip_info:
        await update.effective_message.reply_text(
            f"L'IP pubblico corrente è: {ip_info.get('ip')}\nDettagli:\n{format_ip_info(ip_info)}"
        )
    else:
        await update.effective_message.reply_text("Impossibile recuperare l'IP pubblico.")


@authorized_only
async def log(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce il comando /log per visualizzare il log degli IP del giorno corrente."""
    num_logs = parse_log_count(context.args)
    if num_logs is None:
        await update.effective_message.reply_text(
            f"Uso: /log [n] con n intero tra 1 e {config.MAX_LOG_LINES}."
        )
        return

    logs = read_last_logs(config.LOG_DIR, num_logs)
    if logs:
        await update.effective_message.reply_text(truncate_message(f"Log degli IP:\n{''.join(logs)}"))
    else:
        await update.effective_message.reply_text("Nessun log disponibile per oggi.")


@authorized_only
async def metrics(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce il comando /metrics per recuperare le metriche di sistema."""
    text = await asyncio.to_thread(get_system_metrics)
    await update.effective_message.reply_text(text)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Logga le eccezioni sollevate dagli handler invece di perderle."""
    logger.error("Eccezione durante la gestione di un update: %s", context.error, exc_info=context.error)


def register_handlers(application: Application) -> None:
    """Registra i gestori dei comandi."""
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("ip", ip))
    application.add_handler(CommandHandler("log", log))
    application.add_handler(CommandHandler("metrics", metrics))
    application.add_error_handler(error_handler)
