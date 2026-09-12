"""Offline checks. These tests never call Infer or incur model charges."""

import io
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch
from urllib.error import HTTPError

import responses


class ResponsesExampleTest(unittest.TestCase):
    def test_request_uses_exact_selector_and_extracts_message_text(self):
        result = io.BytesIO(json.dumps({
            "status": "completed",
            "output": [
                {"type": "reasoning", "summary": []},
                {"type": "message", "content": [{"type": "output_text", "text": "A regression breaks existing behavior."}]},
            ],
        }).encode())
        with patch.dict("os.environ", {"INFER_API_KEY": "offline-test-placeholder"}, clear=True), \
             patch("sys.argv", ["responses.py", "Explain a regression"]), \
             patch("responses.urlopen", return_value=result) as send, \
             redirect_stdout(io.StringIO()) as output:
            self.assertEqual(responses.main(), 0)
        request = send.call_args.args[0]
        self.assertEqual(request.full_url, "https://infer.flow7.org/v1/responses")
        self.assertEqual(json.loads(request.data)["model"], "infer/gpt-6-astra:low-cost")
        self.assertEqual(json.loads(request.data)["max_output_tokens"], 1024)
        self.assertEqual(output.getvalue().strip(), "A regression breaks existing behavior.")
        send.assert_called_once()

    def test_missing_key_never_sends(self):
        with patch.dict("os.environ", {}, clear=True), patch("responses.urlopen") as send, redirect_stderr(io.StringIO()):
            self.assertEqual(responses.main(), 2)
        send.assert_not_called()

    def test_http_error_has_no_retry_or_secret_output(self):
        failure = HTTPError(responses.ENDPOINT, 401, "unauthorized", {}, None)
        with patch.dict("os.environ", {"INFER_API_KEY": "offline-test-placeholder"}, clear=True), \
             patch("sys.argv", ["responses.py", "Hello"]), \
             patch("responses.urlopen", side_effect=failure) as send, \
             redirect_stderr(io.StringIO()) as errors:
            self.assertEqual(responses.main(), 1)
        self.assertNotIn("offline-test-placeholder", errors.getvalue())
        self.assertIn("HTTP 401", errors.getvalue())
        send.assert_called_once()


if __name__ == "__main__":
    unittest.main()
