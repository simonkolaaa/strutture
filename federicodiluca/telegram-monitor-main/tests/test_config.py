import pytest

import config


def test_validate_ok(isolated_config):
    config.validate()


@pytest.mark.parametrize("name", ["TOKEN", "CHAT_ID"])
def test_validate_missing_required(monkeypatch, name):
    monkeypatch.setattr(config, name, None)
    with pytest.raises(SystemExit, match="mancanti"):
        config.validate()


def test_validate_rejects_non_positive_interval(monkeypatch):
    monkeypatch.setattr(config, "POLLING_INTERVAL", 0)
    with pytest.raises(SystemExit, match="POLLING_INTERVAL"):
        config.validate()


def test_validate_rejects_negative_retention(monkeypatch):
    monkeypatch.setattr(config, "LOG_RETENTION_DAYS", -1)
    with pytest.raises(SystemExit, match="LOG_RETENTION_DAYS"):
        config.validate()


def test_get_int_default_and_parse(monkeypatch):
    monkeypatch.delenv("X_INT", raising=False)
    assert config._get_int("X_INT", 42) == 42
    monkeypatch.setenv("X_INT", "")
    assert config._get_int("X_INT", 42) == 42
    monkeypatch.setenv("X_INT", "7")
    assert config._get_int("X_INT", 42) == 7


def test_get_int_invalid_exits(monkeypatch):
    monkeypatch.setenv("X_INT", "abc")
    with pytest.raises(SystemExit, match="X_INT"):
        config._get_int("X_INT", 42)
