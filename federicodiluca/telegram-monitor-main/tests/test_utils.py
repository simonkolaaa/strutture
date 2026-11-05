import datetime
import json
import os
from unittest.mock import MagicMock, patch

import pytest
import requests

import config
import utils


# --- fetch_public_ip -------------------------------------------------------

def _response(payload=None, status_error=None, json_error=None):
    resp = MagicMock()
    resp.raise_for_status.side_effect = status_error
    if json_error:
        resp.json.side_effect = json_error
    else:
        resp.json.return_value = payload
    return resp


def test_fetch_public_ip_success_strips_readme(ip_info):
    with patch("utils.requests.get", return_value=_response({**ip_info, "readme": "x"})) as get:
        result = utils.fetch_public_ip()
    assert result == ip_info
    assert "readme" not in result
    assert get.call_args.kwargs["timeout"] == config.HTTP_TIMEOUT


def test_fetch_public_ip_uses_explicit_timeout(ip_info):
    with patch("utils.requests.get", return_value=_response(ip_info)) as get:
        utils.fetch_public_ip(timeout=3)
    assert get.call_args.kwargs["timeout"] == 3


@pytest.mark.parametrize(
    "kwargs",
    [
        {"status_error": requests.HTTPError("500")},
        {"json_error": ValueError("bad json")},
        {"payload": ["not", "a", "dict"]},
        {"payload": {"city": "Milan"}},  # missing ip
    ],
)
def test_fetch_public_ip_failure_returns_none(kwargs):
    with patch("utils.requests.get", return_value=_response(**kwargs)):
        assert utils.fetch_public_ip() is None


def test_fetch_public_ip_network_error_returns_none():
    with patch("utils.requests.get", side_effect=requests.ConnectionError("down")):
        assert utils.fetch_public_ip() is None


# --- load / save ip info ---------------------------------------------------

def test_load_ip_info_missing_file(tmp_path):
    assert utils.load_ip_info(str(tmp_path / "nope.json")) is None


def test_save_and_load_roundtrip(tmp_path, ip_info):
    path = str(tmp_path / "ip.json")
    utils.save_ip_info(ip_info, path)
    assert utils.load_ip_info(path) == ip_info
    assert not os.path.exists(path + ".tmp")


def test_save_and_load_use_config_default(ip_info):
    utils.save_ip_info(ip_info)
    assert os.path.isfile(config.IP_FILE)
    assert utils.load_ip_info() == ip_info


@pytest.mark.parametrize("content", ["", "{not json", "[1, 2]", "null", '{"city": "Milan"}'])
def test_load_ip_info_invalid_content(tmp_path, content):
    path = tmp_path / "ip.json"
    path.write_text(content, encoding="utf-8")
    assert utils.load_ip_info(str(path)) is None


def test_load_ip_info_path_is_directory(tmp_path):
    # docker-compose crea una directory se il file bind-mountato non esiste sull'host
    d = tmp_path / "current_ip.json"
    d.mkdir()
    assert utils.load_ip_info(str(d)) is None


def test_save_ip_info_unwritable_path_does_not_raise(tmp_path, ip_info):
    utils.save_ip_info(ip_info, str(tmp_path / "missing_dir" / "ip.json"))


def test_save_ip_info_replaces_existing_atomically(tmp_path, ip_info, other_ip_info):
    path = str(tmp_path / "ip.json")
    utils.save_ip_info(ip_info, path)
    utils.save_ip_info(other_ip_info, path)
    with open(path, encoding="utf-8") as f:
        assert json.load(f) == other_ip_info


# --- log files -------------------------------------------------------------

def test_get_log_file_path_for_date(tmp_path):
    day = datetime.datetime(2025, 1, 2)
    assert utils.get_log_file_path(str(tmp_path), day) == os.path.join(str(tmp_path), "log_2025-01-02.txt")


def test_ensure_log_directory_idempotent(tmp_path):
    d = str(tmp_path / "a" / "b")
    utils.ensure_log_directory(d)
    utils.ensure_log_directory(d)
    assert os.path.isdir(d)


def _touch(directory, name):
    p = directory / name
    p.write_text("x", encoding="utf-8")
    return p


def test_clean_old_logs_removes_only_expired(tmp_path):
    today = datetime.date.today()
    old = _touch(tmp_path, f"log_{today - datetime.timedelta(days=10):%Y-%m-%d}.txt")
    boundary = _touch(tmp_path, f"log_{today - datetime.timedelta(days=7):%Y-%m-%d}.txt")
    recent = _touch(tmp_path, f"log_{today:%Y-%m-%d}.txt")
    utils.clean_old_logs(str(tmp_path), retention_days=7)
    assert not old.exists()
    assert boundary.exists()  # esattamente retention_days giorni: conservato
    assert recent.exists()


def test_clean_old_logs_ignores_unrelated_and_malformed_files(tmp_path):
    keep = [
        _touch(tmp_path, ".gitkeep"),
        _touch(tmp_path, "notes.txt"),
        _touch(tmp_path, "log_2020-13-45.txt"),  # data non valida
        _touch(tmp_path, "log_2020-01-01.txt.bak"),
    ]
    (tmp_path / "subdir").mkdir()
    utils.clean_old_logs(str(tmp_path), retention_days=0)
    assert all(p.exists() for p in keep)


def test_clean_old_logs_missing_dir_is_noop(tmp_path):
    utils.clean_old_logs(str(tmp_path / "missing"), retention_days=1)


def test_clean_old_logs_remove_error_is_logged(tmp_path, caplog):
    _touch(tmp_path, "log_2000-01-01.txt")
    with patch("utils.os.remove", side_effect=OSError("busy")):
        utils.clean_old_logs(str(tmp_path), retention_days=1)
    assert "Impossibile rimuovere" in caplog.text


def test_log_ip_check_writes_line(tmp_path, ip_info):
    log_dir = str(tmp_path / "log")
    utils.log_ip_check(ip_info, log_dir)
    content = open(utils.get_log_file_path(log_dir), encoding="utf-8").read()
    assert content.count("\n") == 1
    assert "IP Check: 203.0.113.42 - Milan" in content
    assert content.startswith("[")


def test_log_ip_change_writes_line(tmp_path, ip_info, other_ip_info):
    log_dir = str(tmp_path / "log")
    utils.log_ip_change(ip_info, other_ip_info, log_dir)
    content = open(utils.get_log_file_path(log_dir), encoding="utf-8").read()
    assert "IP CAMBIATO DA 203.0.113.42 - Milan A 198.51.100.7 - Rome" in content


def test_read_last_logs(tmp_path, ip_info):
    log_dir = str(tmp_path / "log")
    for _ in range(5):
        utils.log_ip_check(ip_info, log_dir)
    assert len(utils.read_last_logs(log_dir, 3)) == 3
    assert len(utils.read_last_logs(log_dir, 100)) == 5
    assert utils.read_last_logs(log_dir, 0) == []
    assert utils.read_last_logs(log_dir, -1) == []


def test_read_last_logs_no_file(tmp_path):
    assert utils.read_last_logs(str(tmp_path / "nolog"), 10) == []


# --- misc ------------------------------------------------------------------

def test_format_ip_info(ip_info):
    text = utils.format_ip_info({"ip": "1.2.3.4", "city": "X"})
    assert text == "ip: 1.2.3.4\ncity: X"


def test_truncate_message_short_unchanged():
    assert utils.truncate_message("abc", limit=10) == "abc"


def test_truncate_message_keeps_tail_within_limit():
    text = "\n".join(f"line {i}" for i in range(1000))
    out = utils.truncate_message(text, limit=100)
    assert len(out) <= 100
    assert out.startswith("[...]\n")
    assert out.endswith("line 999")


def test_get_system_metrics_format():
    net = MagicMock(bytes_sent=10, bytes_recv=20)
    with patch("utils.psutil.cpu_percent", return_value=12.5) as cpu, \
         patch("utils.psutil.virtual_memory", return_value=MagicMock(percent=40.0)), \
         patch("utils.psutil.net_io_counters", return_value=net):
        text = utils.get_system_metrics(cpu_interval=0)
    cpu.assert_called_once_with(interval=0)
    assert text == "CPU Usage: 12.5%\nRAM Usage: 40.0%\nBytes Sent: 10\nBytes Received: 20"
