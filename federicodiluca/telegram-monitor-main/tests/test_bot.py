from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from telegram.ext import CommandHandler

import bot
import config
import utils


def make_update(chat_id="12345"):
    update = MagicMock()
    update.effective_chat.id = chat_id
    update.effective_message.reply_text = AsyncMock()
    return update


def make_context(args=None):
    context = MagicMock()
    context.args = args or []
    return context


def reply_text_of(update):
    return update.effective_message.reply_text.call_args.args[0]


# --- authorization ---------------------------------------------------------

@pytest.mark.parametrize("chat_id", ["12345", 12345])
def test_is_authorized_accepts_configured_chat(chat_id):
    assert bot.is_authorized(chat_id)


@pytest.mark.parametrize("chat_id", ["999", 999, None])
def test_is_authorized_rejects_other_chats(chat_id):
    assert not bot.is_authorized(chat_id)


def test_is_authorized_without_chat_id_configured(monkeypatch):
    monkeypatch.setattr(config, "CHAT_ID", None)
    assert not bot.is_authorized("12345")


@pytest.mark.parametrize("handler", [bot.start, bot.ip, bot.log, bot.metrics])
async def test_handlers_reject_unauthorized_chat(handler, caplog):
    update = make_update(chat_id=999)
    with patch("bot.fetch_public_ip") as fetch, patch("bot.get_system_metrics") as metrics:
        await handler(update, make_context())
    assert reply_text_of(update) == "Non autorizzato."
    fetch.assert_not_called()
    metrics.assert_not_called()
    assert "999" in caplog.text


async def test_unauthorized_update_without_message_does_not_crash():
    update = make_update(chat_id=999)
    update.effective_message = None
    await bot.start(update, make_context())


async def test_unauthorized_update_without_chat():
    update = make_update()
    update.effective_chat = None
    await bot.start(update, make_context())
    assert reply_text_of(update) == "Non autorizzato."


# --- /start ----------------------------------------------------------------

async def test_start_lists_commands():
    update = make_update()
    await bot.start(update, make_context())
    text = reply_text_of(update)
    for cmd in ("/ip", "/log", "/metrics"):
        assert cmd in text


# --- /ip -------------------------------------------------------------------

async def test_ip_success(ip_info):
    update = make_update()
    with patch("bot.fetch_public_ip", return_value=ip_info):
        await bot.ip(update, make_context())
    text = reply_text_of(update)
    assert "L'IP pubblico corrente è: 203.0.113.42" in text
    assert "city: Milan" in text


async def test_ip_failure():
    update = make_update()
    with patch("bot.fetch_public_ip", return_value=None):
        await bot.ip(update, make_context())
    assert reply_text_of(update) == "Impossibile recuperare l'IP pubblico."


# --- /log ------------------------------------------------------------------

@pytest.mark.parametrize(
    "args, expected",
    [
        ([], bot.DEFAULT_LOG_LINES),
        (["5"], 5),
        (["1"], 1),
        ([str(config.MAX_LOG_LINES + 50)], config.MAX_LOG_LINES),
        (["0"], None),
        (["-3"], None),
        (["abc"], None),
        (["1.5"], None),
    ],
)
def test_parse_log_count(args, expected):
    assert bot.parse_log_count(args) == expected


async def test_log_returns_last_n_lines(ip_info):
    for _ in range(12):
        utils.log_ip_check(ip_info, config.LOG_DIR)
    update = make_update()
    await bot.log(update, make_context(["3"]))
    text = reply_text_of(update)
    assert text.startswith("Log degli IP:\n")
    assert text.count("IP Check") == 3


async def test_log_default_count(ip_info):
    for _ in range(12):
        utils.log_ip_check(ip_info, config.LOG_DIR)
    update = make_update()
    await bot.log(update, make_context())
    assert reply_text_of(update).count("IP Check") == bot.DEFAULT_LOG_LINES


async def test_log_no_file():
    update = make_update()
    await bot.log(update, make_context())
    assert reply_text_of(update) == "Nessun log disponibile per oggi."


@pytest.mark.parametrize("arg", ["abc", "0", "-1"])
async def test_log_invalid_argument_replies_usage(arg, ip_info):
    utils.log_ip_check(ip_info, config.LOG_DIR)
    update = make_update()
    await bot.log(update, make_context([arg]))
    assert reply_text_of(update).startswith("Uso: /log [n]")


async def test_log_output_respects_telegram_limit(ip_info):
    for _ in range(config.MAX_LOG_LINES):
        utils.log_ip_check({**ip_info, "city": "A" * 100}, config.LOG_DIR)
    update = make_update()
    await bot.log(update, make_context([str(config.MAX_LOG_LINES)]))
    assert len(reply_text_of(update)) <= config.TELEGRAM_MAX_MESSAGE_LENGTH


# --- /metrics --------------------------------------------------------------

async def test_metrics():
    update = make_update()
    with patch("bot.get_system_metrics", return_value="CPU Usage: 1%"):
        await bot.metrics(update, make_context())
    assert reply_text_of(update) == "CPU Usage: 1%"


# --- registration ----------------------------------------------------------

def test_register_handlers():
    application = MagicMock()
    bot.register_handlers(application)
    handlers = [call.args[0] for call in application.add_handler.call_args_list]
    assert all(isinstance(h, CommandHandler) for h in handlers)
    commands = {cmd for h in handlers for cmd in h.commands}
    assert commands == {"start", "ip", "log", "metrics"}
    application.add_error_handler.assert_called_once_with(bot.error_handler)


async def test_error_handler_logs(caplog):
    context = MagicMock()
    context.error = RuntimeError("boom")
    await bot.error_handler(None, context)
    assert "boom" in caplog.text
