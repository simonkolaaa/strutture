import pytest

import config


@pytest.fixture(autouse=True)
def isolated_config(tmp_path, monkeypatch):
    """Punta log e file IP a una directory temporanea e fissa una configurazione nota."""
    monkeypatch.setattr(config, "LOG_DIR", str(tmp_path / "log"))
    monkeypatch.setattr(config, "IP_FILE", str(tmp_path / "current_ip.json"))
    monkeypatch.setattr(config, "CHAT_ID", "12345")
    monkeypatch.setattr(config, "TOKEN", "test-token")
    monkeypatch.setattr(config, "POLLING_INTERVAL", 1)
    monkeypatch.setattr(config, "LOG_RETENTION_DAYS", 7)
    return config


@pytest.fixture
def ip_info():
    return {
        "ip": "203.0.113.42",
        "hostname": "example.host",
        "city": "Milan",
        "region": "Lombardy",
        "country": "IT",
        "loc": "45.4642,9.1900",
        "org": "AS12345 Example ISP",
        "postal": "20100",
        "timezone": "Europe/Rome",
    }


@pytest.fixture
def other_ip_info(ip_info):
    return {**ip_info, "ip": "198.51.100.7", "city": "Rome"}
