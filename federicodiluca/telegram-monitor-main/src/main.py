import asyncio
import contextlib
import logging

from telegram.error import TelegramError
from telegram.ext import Application

import config
from bot import register_handlers
from utils import (
    clean_old_logs,
    fetch_public_ip,
    format_ip_info,
    load_ip_info,
    log_ip_change,
    log_ip_check,
    save_ip_info,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)  # evita una riga di log per ogni chiamata a Telegram

logger = logging.getLogger(__name__)

MONITOR_TASK_KEY = "ip_monitor_task"


def build_change_message(old_ip_info, new_ip_info):
    """Costruisce il testo della notifica di cambio IP."""
    return (
        f"IP CAMBIATO DA {old_ip_info.get('ip')} A {new_ip_info.get('ip')}\n\n"
        f"Vecchie Info:\n{format_ip_info(old_ip_info)}\n\n"
        f"Nuove Info:\n{format_ip_info(new_ip_info)}"
    )


async def check_ip_once(bot, current_ip_info):
    """Esegue un singolo controllo dell'IP e restituisce lo stato aggiornato.

    Se la notifica Telegram fallisce lo stato non viene aggiornato, così il cambio
    viene ritentato al controllo successivo invece di andare perso.
    """
    new_ip_info = await asyncio.to_thread(fetch_public_ip)
    if not new_ip_info:
        return current_ip_info

    log_ip_check(new_ip_info, config.LOG_DIR)
    clean_old_logs(config.LOG_DIR, config.LOG_RETENTION_DAYS)

    if current_ip_info and new_ip_info.get("ip") != current_ip_info.get("ip"):
        log_ip_change(current_ip_info, new_ip_info, config.LOG_DIR)
        try:
            await bot.send_message(chat_id=config.CHAT_ID, text=build_change_message(current_ip_info, new_ip_info))
        except TelegramError as e:
            logger.error("Notifica di cambio IP fallita, riprovo al prossimo controllo: %s", e)
            return current_ip_info

    # Aggiorna l'IP corrente e salva su file
    save_ip_info(new_ip_info)
    return new_ip_info


async def check_ip_change(bot):
    """Loop di monitoraggio: controlla l'IP ogni POLLING_INTERVAL secondi."""
    # Carica l'IP persistito all'avvio
    current_ip_info = load_ip_info()
    while True:
        try:
            current_ip_info = await check_ip_once(bot, current_ip_info)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Errore inatteso durante il controllo dell'IP")
        await asyncio.sleep(config.POLLING_INTERVAL)


async def start_monitor(application: Application) -> None:
    """Avvia il monitor in background dopo l'inizializzazione dell'applicazione."""
    application.bot_data[MONITOR_TASK_KEY] = asyncio.create_task(check_ip_change(application.bot))
    logger.info("Monitor IP avviato (intervallo: %ss)", config.POLLING_INTERVAL)


async def stop_monitor(application: Application) -> None:
    """Ferma il monitor in background allo shutdown."""
    task = application.bot_data.pop(MONITOR_TASK_KEY, None)
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


def main():
    """Funzione principale per avviare il bot."""
    config.validate()
    application = (
        Application.builder()
        .token(config.TOKEN)
        .post_init(start_monitor)
        .post_stop(stop_monitor)
        .build()
    )
    register_handlers(application)
    application.run_polling()


if __name__ == "__main__":
    main()
