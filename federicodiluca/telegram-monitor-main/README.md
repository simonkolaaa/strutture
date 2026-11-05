# Telegram Raspberry Monitor

This is a Telegram bot that monitors the public IP address of your Raspberry Pi and notifies you of any changes. It also provides system metrics such as CPU, RAM, and internet usage.

## Features

- Monitor public IP address changes and notify via Telegram
- Log IP checks and changes to a file
- Provide system metrics (CPU, RAM, internet usage)
- View the log of IP changes
- Commands are only accepted from the chat configured in `CHAT_ID` (the bot ignores anyone else)

## Setup

### Prerequisites

- Docker
- Docker Compose
- A Telegram bot token (you can create one by talking to [BotFather](https://core.telegram.org/bots#botfather) on Telegram)

### Environment Variables

Create a `.env` file in the root directory of the project by copying the `.example.env` file:

```sh
cp .example.env .env
```

Then, edit the `.env`

 file to include your specific configuration:

```plaintext
TELEGRAM_TOKEN=<your_telegram_token>
CHAT_ID=<your_chat_id>
POLLING_INTERVAL=120
LOG_RETENTION_DAYS=14
```

- `TELEGRAM_TOKEN` (required): Your Telegram bot token
- `CHAT_ID` (required): Your Telegram chat ID. Notifications are sent here and **only this chat is allowed to use the bot commands** (the bot logs the chat ID of rejected requests, so you can find yours by sending `/start` and reading the container logs)
- `POLLING_INTERVAL`: Interval in seconds to check for IP changes (default: 120)
- `LOG_RETENTION_DAYS`: Number of days to retain log files (default: 14)
- `LOG_DIR`: Directory for the daily log files (default: `log`)
- `IP_FILE`: File where the last known IP is persisted across restarts (default: `current_ip.json`)
- `HTTP_TIMEOUT`: Timeout in seconds for the request to ipinfo.io (default: 10)

The bot exits at startup with a clear error if `TELEGRAM_TOKEN` or `CHAT_ID` is missing.

### Build and Run

1. Clone the repository:

    ```sh
    git clone <repository-url>
    cd telegram-monitor
    ```

2. Create the `.env` file from the `.example.env` file:

    ```sh
    cp .example.env .env
    ```

3. Edit the `.env` file to include your specific configuration.

4. Build the Docker image:

    ```sh
    docker compose build
    ```

5. Run the Docker container:

    ```sh
    docker compose up -d
    ```

> **Note:** `docker-compose.yml` bind-mounts `./current_ip.json` into the container. Make sure the file exists on the host before the first `docker compose up` (`echo '{}' > current_ip.json`), otherwise Docker creates a *directory* with that name and the IP state cannot be persisted (the bot keeps working, but it logs a warning and will not remember the last IP across restarts).

### Run locally (without Docker)

```sh
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scriptsctivate
pip install -r requirements.txt
python src/main.py
```

The `.env` file in the project root is loaded automatically.

### Tests

```sh
pip install -r requirements-dev.txt
pytest
```

### Commands

- `/start`: Initialize the bot and get a welcome message with available commands.
- `/ip`: Get the current public IP address and details.
- `/log [n]`: View the last `n` log entries for the current day (default: 10, max: 200). Long outputs are truncated to fit Telegram's message limit, keeping the most recent lines.
- `/metrics`: Get system metrics such as CPU, RAM, and internet usage.

### File Structure

```plaintext
.
├── Dockerfile
├── docker-compose.yml
├── .env
├── .example.env
├── .gitignore
├── current_ip.json
├── README.md
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── src
│   ├── bot.py       # Telegram command handlers
│   ├── config.py    # Environment configuration
│   ├── main.py      # Entry point and IP monitor loop
│   └── utils.py     # IP lookup, persistence, log files, metrics
├── tests
└── log
```

### Example Usage

1. Start the bot by sending the `/start` command.
2. Get the current public IP address by sending the `/ip` command.
3. View the log of IP changes by sending the `/log` command.
4. Get system metrics by sending the `/metrics` command.

### License

This project is licensed under the MIT License.