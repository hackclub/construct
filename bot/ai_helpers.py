from typing import Tuple
import re
import os
from pathlib import Path
import requests


def read_faq(local_docs_path: str = None) -> str:
    if not local_docs_path:
        local_docs_path = str(Path(__file__).resolve().parents[1] / "docs.md")
    try:
        with open(local_docs_path, "r", encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


def local_validate(candidate: str, source_text: str) -> Tuple[bool, str]:
    if not candidate or not isinstance(candidate, str):
        return False, "empty or non-string candidate"
    stripped = candidate.strip()
    if not stripped:
        return False, "empty candidate"
    lines = [l for l in stripped.splitlines() if l.strip()]
    if not lines:
        return False, "candidate only whitespace"
    first = lines[0]
    if not re.match(r"^(Hi|Hello|Hey|Hi,|Hello,|Hey,)\b", first, re.IGNORECASE):
        return False, "missing greeting"
    # Require a one-line mention of the FAQ source and that information may be incomplete
    if source_text and source_text not in candidate:
        if not re.search(r"(taken from|Information above is taken from|may be incomplete|taken from the FAQ)", candidate, re.IGNORECASE):
            return False, "missing source mention or incompleteness disclaimer"
    close_ticket_re = re.compile(r"If this helped, please close the ticket\.|please close the ticket\.?", re.IGNORECASE)
    if not close_ticket_re.search(candidate):
        return False, "missing close-ticket suggestion"
    disallow_re = re.compile(r"let me know|do you need|follow up|follow-up|any other questions|contact me", re.IGNORECASE)
    if disallow_re.search(candidate):
        return False, "encourages follow-up"
    return True, "OK"
