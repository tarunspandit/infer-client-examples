# Infer client examples

Run **GPT-6 Astra** and **GPT-5.6 Sol** through **Infer by Flow7** using pay-as-you-go wallet credit. The currently available **Low cost** options offer these USD rates per million tokens:

- **GPT-6 Astra:** $1.18 input, $0.12 cached input, and $4.42 output per million tokens.
- **GPT-5.6 Sol:** $0.59 input, $0.06 cached input, and $2.65 output per million tokens.

**[Start with Infer: create your account, add wallet credit, and connect OpenCode](https://infer.flow7.org/opencode?utm_source=github&utm_medium=referral&utm_campaign=infer-organic-202609&utm_content=c01-github-client-examples).**

Prices and availability were checked against the [public Infer catalog](https://infer.flow7.org/api/public/catalog) on September 12, 2026 UTC. These are the Low cost options with Standard privacy, text input/output, a 131,072-token context limit, and a 16,384-token output limit. Cache-write rates are $1.48 for Astra and $0.74 for Sol per million tokens when applicable. Check the live catalog and current product terms before funding or choosing a model; availability and rates can change.

This is a small client example repository published by Tarun Pandit from Infer's side. It is not an endorsement or partnership announcement from OpenAI, OpenCode, or Models.dev.

## Choose an example

- [Python Responses client](responses.py): one request, no third-party packages, explicit output cap, and no automatic retry.
- [OpenCode configuration](opencode.json): both exact Low cost selectors with an environment-based API key.

The examples contain no API key. [Create your Infer account](https://infer.flow7.org/signup?utm_source=github&utm_medium=referral&utm_campaign=infer-organic-202609&utm_content=c01-github-client-examples), verify your email, add wallet credit, then create an Infer API key. Keep that key in your environment rather than saving it in a committed file. Both examples can incur normal usage charges when you run them with a funded account.

## One Responses request with Python

Requires Python 3.9 or newer. Set `INFER_API_KEY` in your local environment using your preferred secret manager or shell. The default model is `infer/gpt-6-astra:low-cost`.

```bash
python3 responses.py "In one sentence, explain what a software regression is."
```

To use Sol instead:

```bash
INFER_MODEL=infer/gpt-5.6-sol:low-cost python3 responses.py "In one sentence, explain what a software regression is."
```

The client sends a non-streaming request to `https://infer.flow7.org/v1/responses` with a 1,024-token output cap. This is a token cap, not a dollar budget. Input and other applicable token charges still apply. If a request times out, check your Infer usage before retrying because the service may already have received it.

## Use the models in OpenCode

Merge the `provider.infer` section from [opencode.json](opencode.json) into your existing project or user configuration, then select the model. Preserve any other providers and project settings already in your configuration.

The default choice is `infer/gpt-6-astra:low-cost`. To choose Sol, set the top-level `model` field to `infer/gpt-5.6-sol:low-cost`.

The configuration uses `@ai-sdk/openai`, Infer's `/v1` base URL, and `{env:INFER_API_KEY}`. The keys inside `provider.infer.models` omit the leading `infer/`; each model's `id` keeps the complete Infer API selector. This follows Infer's [public OpenCode configuration generator](https://infer.flow7.org/opencode).

OpenCode agent tasks can make several requests. Review your account usage and task scope as you work.

## Verify the example without spending credit

```bash
python3 -m unittest -v test_responses.py
```

These tests mock the HTTP transport. They check the exact selector and endpoint, response text extraction, missing-key handling, and an HTTP failure without retries or key output. No live paid Infer request was made to validate this repository. The OpenCode configuration was checked against Infer's public generator, but this repository does not claim a completed paid OpenCode run.

## Sources and support

- [Current model availability and prices](https://infer.flow7.org/api/public/catalog)
- [Infer API documentation](https://infer.flow7.org/docs#responses)
- [Infer OpenCode setup](https://infer.flow7.org/opencode)
- Business support: infer@flow7.org

Example code is available under the [MIT License](LICENSE). Infer usage is governed by Infer's own service terms.
