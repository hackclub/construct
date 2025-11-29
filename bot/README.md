# Slack FAQ Assistant (short)

A tiny Slack bot that answers short Qs using your FAQ. It reads a local FAQ and posts concise, FAQ-backed replies in threads.

Requirements
- Python 3.8+
- Install deps: `pip install -r bot/requirements.txt`

Quick setup
1. Copy `bot/.env.example` → `bot/.env` and set at least:
   - `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `AI_API_KEY`, `LOCAL_DOCS_PATH`
2. Add your FAQ to `LOCAL_DOCS_PATH` (default `bot/faq.md`).

Run
```bash
source .venv/bin/activate
python -m bot.bot
```

Config
- `AI_MAX_WORKERS` — concurrent requests (default 5)
- `AI_MAX_RETRIES` — retry attempts (default 2)

# Slack FAQ Assistant Bot 

Why it exists
- Because people ask the same things and we want consistent, FAQ-backed answers.
- The bot keeps replies short and cites the FAQ so people can trust the answer and close their tickets quickly.

Quick start
1. Set up the Python environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r bot/requirements.txt
```

2. Create a Slack app with Socket Mode enabled, add `chat:write` and install it.
3. Make a `.env` file (copy `bot/.env.example`) and fill in the tokens and API keys.
4. Put your FAQ in `bot/faq.md` or point `LOCAL_DOCS_PATH` to your document.

Run it

```bash
source .venv/bin/activate
python -m bot.bot
```

Tip: If imports cause headaches, run as a module with `python -m bot.bot` — that helps Python find the `bot` package.

Config highlights
- `AI_MAX_WORKERS` — concurrent workers (default 5)
- `AI_MAX_RETRIES` — retries for generation/validation (default 2)
- `AI_MODEL`, `AI_VALIDATION_MODEL`, `AI_API_BASE` — model and endpoint (if applicable)
- `LOCAL_DOCS_PATH` — where your FAQ lives