import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from telegram.error import NetworkError

import config
import main
import utils


@pytest.fixture
def bot():
    b = MagicMock()
    b.send_message = AsyncMock()
    return b


def test_build_change_message(ip_info, other_ip_info):
    text = main.build_change_message(ip_info, other_ip_info)
    assert text.startswith("IP CAMBIATO DA 203.0.113.42 A 198.51.100.7")
    assert "Vecchie Info:\nip: 203.0.113.42" in text
    assert "Nuove Info:\nip: 198.51.100.7" in text


# --- check_ip_once ---------------------------------------------------------

async def test_check_fetch_failure_keeps_state(bot, ip_info):
    with patch("main.fetch_public_ip", return_value=None):
        assert await main.check_ip_once(bot, ip_info) == ip_info
    bot.send_message.assert_not_called()
    assert utils.load_ip_info() is None


async def test_check_first_run_saves_without_notifying(bot, ip_info):
    with patch("main.fetch_public_ip", return_value=ip_info):
        assert await main.check_ip_once(bot, None) == ip_info
    bot.send_message.assert_not_called()
    assert utils.load_ip_info() == ip_info
    assert len(utils.read_last_logs(config.LOG_DIR, 10)) == 1


async def test_check_same_ip_no_notification(bot, ip_info):
    updated = {**ip_info, "city": "Turin"}
    with patch("main.fetch_public_ip", return_value=updated):
        assert await main.check_ip_once(bot, ip_info) == updated
    bot.send_message.assert_not_called()
    assert utils.load_ip_info() == updated


async def test_check_ip_changed_notifies_and_saves(bot, ip_info, other_ip_info):
    with patch("main.fetch_public_ip", return_value=other_ip_info):
        result = await main.check_ip_once(bot, ip_info)
    assert result == other_ip_info
    bot.send_message.assert_awaited_once()
    kwargs = bot.send_message.call_args.kwargs
    assert kwargs["chat_id"] == config.CHAT_ID
    assert kwargs["text"] == main.build_change_message(ip_info, other_ip_info)
    assert utils.load_ip_info() == other_ip_info
    lines = utils.read_last_logs(config.LOG_DIR, 10)
    assert any("IP CAMBIATO" in line for line in lines)


async def test_check_notification_failure_retries_next_time(bot, ip_info, other_ip_info):
    bot.send_message.side_effect = NetworkError("telegram down")
    with patch("main.fetch_public_ip", return_value=other_ip_info):
        result = await main.check_ip_once(bot, ip_info)
    assert result == ip_info  # stato non avanzato: si ritenta al prossimo giro
    assert utils.load_ip_info() is None

    bot.send_message.side_effect = None
    with patch("main.fetch_public_ip", return_value=other_ip_info):
        result = await main.check_ip_once(bot, ip_info)
    assert result == other_ip_info
    assert utils.load_ip_info() == other_ip_info


async def test_check_cleans_old_logs(bot, ip_info, tmp_path):
    log_dir = tmp_path / "log"
    log_dir.mkdir()
    old = log_dir / "log_2000-01-01.txt"
    old.write_text("old", encoding="utf-8")
    with patch("main.fetch_public_ip", return_value=ip_info):
        await main.check_ip_once(bot, ip_info)
    assert not old.exists()


async def test_check_runs_fetch_in_thread(bot, ip_info):
    to_thread = AsyncMock(side_effect=lambda fn, *a: fn(*a))
    with patch("main.fetch_public_ip", return_value=ip_info) as fetch, \
         patch("main.asyncio.to_thread", new=to_thread):
        await main.check_ip_once(bot, None)
    to_thread.assert_awaited_once_with(fetch)


# --- check_ip_change loop --------------------------------------------------

async def test_loop_survives_exceptions_and_persists_state(bot, ip_info):
    calls = []

    async def fake_sleep(_):
        calls.append("sleep")
        if len(calls) >= 3:
            raise asyncio.CancelledError

    once = AsyncMock(side_effect=[RuntimeError("boom"), ip_info, ip_info])
    with patch("main.check_ip_once", once), patch("main.asyncio.sleep", fake_sleep):
        with pytest.raises(asyncio.CancelledError):
            await main.check_ip_change(bot)

    assert once.await_count == 3
    # dopo l'eccezione lo stato resta None; poi avanza a ip_info
    assert [c.args[1] for c in once.await_args_list] == [None, None, ip_info]


async def test_loop_loads_persisted_state(bot, ip_info):
    utils.save_ip_info(ip_info)

    async def fake_sleep(_):
        raise asyncio.CancelledError

    once = AsyncMock(return_value=ip_info)
    with patch("main.check_ip_once", once), patch("main.asyncio.sleep", fake_sleep):
        with pytest.raises(asyncio.CancelledError):
            await main.check_ip_change(bot)
    once.assert_awaited_once_with(bot, ip_info)


# --- task lifecycle --------------------------------------------------------

async def test_start_and_stop_monitor():
    application = MagicMock()
    application.bot_data = {}
    started = asyncio.Event()

    async def forever(_bot):
        started.set()
        await asyncio.sleep(3600)

    with patch("main.check_ip_change", forever):
        await main.start_monitor(application)
        task = application.bot_data[main.MONITOR_TASK_KEY]
        await started.wait()
        assert not task.done()

        await main.stop_monitor(application)

    assert task.cancelled()
    assert main.MONITOR_TASK_KEY not in application.bot_data


async def test_stop_monitor_without_task():
    application = MagicMock()
    application.bot_data = {}
    await main.stop_monitor(application)


def test_main_validates_config_before_building(monkeypatch):
    monkeypatch.setattr(config, "TOKEN", None)
    with patch("main.Application") as app:
        with pytest.raises(SystemExit):
            main.main()
    app.builder.assert_not_called()


def test_main_wires_application():
    with patch("main.Application") as app, patch("main.register_handlers") as register:
        main.main()
    builder = app.builder.return_value
    builder.token.assert_called_once_with(config.TOKEN)
    builder.token.return_value.post_init.assert_called_once_with(main.start_monitor)
    builder.token.return_value.post_init.return_value.post_stop.assert_called_once_with(main.stop_monitor)
    built = builder.token.return_value.post_init.return_value.post_stop.return_value.build.return_value
    register.assert_called_once_with(built)
    built.run_polling.assert_called_once()
