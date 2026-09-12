#!/usr/bin/env python3
"""Make one bounded Responses request to Infer using Python's standard library."""

import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ENDPOINT = "https://infer.flow7.org/v1/responses"
DEFAULT_MODEL = "infer/gpt-6-astra:low-cost"


def output_text(response):
    """Extract text blocks from the Responses API's output array."""
    return "\n".join(
        block["text"]
        for item in response.get("output", [])
        if item.get("type") == "message"
        for block in item.get("content", [])
        if block.get("type") == "output_text" and isinstance(block.get("text"), str)
    )


def main():
    key = os.environ.get("INFER_API_KEY", "").strip()
    if not key:
        print("Set INFER_API_KEY in your environment before running this paid example.", file=sys.stderr)
        return 2

    prompt = " ".join(sys.argv[1:]).strip()
    if not prompt:
        print('Usage: python3 responses.py "Your short prompt"', file=sys.stderr)
        return 2

    payload = {
        "model": os.environ.get("INFER_MODEL", DEFAULT_MODEL),
        "input": prompt,
        "max_output_tokens": 1024,
        "stream": False,
    }
    request = Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "infer-client-examples/0.1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as result:
            response = json.load(result)
    except HTTPError as error:
        print(f"Infer returned HTTP {error.code}. Check your key, wallet credit, and current model availability.", file=sys.stderr)
        return 1
    except (URLError, TimeoutError):
        print("Request failed or timed out. Check Infer usage before retrying; the request may have reached the service.", file=sys.stderr)
        return 1
    except (json.JSONDecodeError, UnicodeDecodeError):
        print("Infer returned an unreadable response. Check usage before retrying.", file=sys.stderr)
        return 1

    text = output_text(response)
    if response.get("status") != "completed" or not text:
        print("Response did not complete with text. Review its status and usage in Infer before retrying.", file=sys.stderr)
        return 1
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
