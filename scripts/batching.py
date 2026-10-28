"""Run structured-output Claude requests as a Message Batch (50% off tokens) or one by one.

Batches usually finish within an hour (the API allows up to 24); use one-by-one
(--no-batch) for quick tests. Each request gets the output model's JSON schema,
the same one messages.parse() would send, and results are validated against it.
"""
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request
from pydantic import ValidationError

POLL_SECONDS = 20
# Models that support server-side refusal fallbacks. The Batches API rejects the
# parameter, so it's only sent on one-by-one requests.
FALLBACK_MODELS = {"claude-opus-5-5", "claude-sonnet-5-5", "claude-fable-5-1"}
CUSTOM_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def with_schema(params, output_model):
    output_config = {**params.get("output_config", {}),
                     "format": {"type": "json_schema", "schema": anthropic.transform_schema(output_model)}}
    return {**params, "output_config": output_config}


def outcome_of(message, output_model, batch):
    """Status, validated output (or None), usage and model for one response."""
    outcome = {"model": message.model, "batch": batch, "parsed": None,
               "usage": {"input_tokens": message.usage.input_tokens, "output_tokens": message.usage.output_tokens}}
    if message.stop_reason == "refusal":
        category = message.stop_details.category if message.stop_details else None
        return {**outcome, "status": f"refused ({category})"}
    text = next((block.text for block in message.content if block.type == "text"), None)
    if text is None:
        return {**outcome, "status": f"no output (stop_reason={message.stop_reason})"}
    try:
        return {**outcome, "status": "ok", "parsed": output_model.model_validate_json(text)}
    except ValidationError:
        return {**outcome, "status": f"invalid output (stop_reason={message.stop_reason})"}


def stop_on_account_errors(error):
    if isinstance(error, anthropic.AuthenticationError):
        sys.exit("Anthropic API key is missing or invalid. Add ANTHROPIC_API_KEY to .env.")
    if isinstance(error, anthropic.BadRequestError) and "credit balance" in error.message:
        sys.exit("Anthropic account is out of credits. Add credits at console.anthropic.com -> Plans & Billing, then rerun.")


def run_batch(client, requests, output_model, on_result):
    ids = {}  # batch custom_id -> caller's id (custom IDs allow only [A-Za-z0-9_-], up to 64 chars)
    batch_requests = []
    for number, (key, params) in enumerate(requests.items()):
        custom_id = key if CUSTOM_ID.match(key) else f"req-{number}"
        ids[custom_id] = key
        batch_requests.append(Request(custom_id=custom_id,
                                      params=MessageCreateParamsNonStreaming(**with_schema(params, output_model))))
    try:
        batch = client.messages.batches.create(requests=batch_requests)
    except anthropic.APIStatusError as error:
        stop_on_account_errors(error)
        raise
    print(f"  Submitted batch {batch.id} ({len(batch_requests)} requests, 50% off); checking every {POLL_SECONDS}s")
    last = None
    while batch.processing_status != "ended":
        time.sleep(POLL_SECONDS)
        batch = client.messages.batches.retrieve(batch.id)
        counts = batch.request_counts
        progress = (counts.processing, counts.succeeded, counts.errored)
        if progress != last:
            print(f"  ... {counts.processing} processing, {counts.succeeded} done, {counts.errored} errored")
            last = progress
    for result in client.messages.batches.results(batch.id):
        key = ids[result.custom_id]
        if result.result.type == "succeeded":
            on_result(key, outcome_of(result.result.message, output_model, batch=True))
        else:
            # errored / canceled / expired: not saved, so a rerun retries it.
            detail = getattr(getattr(result.result, "error", None), "type", "")
            print(f"  {key}: {result.result.type} {detail}; rerun to retry")


def run_one_by_one(client, requests, output_model, on_result, workers):
    def send(params):
        params = with_schema(params, output_model)
        if params["model"] in FALLBACK_MODELS:
            return client.beta.messages.create(**params, betas=["server-side-fallback-2026-07-01"], fallbacks="default")
        return client.messages.create(**params)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(send, params): key for key, params in requests.items()}
        for future in as_completed(futures):
            key = futures[future]
            try:
                message = future.result()
            except anthropic.APIStatusError as error:
                stop_on_account_errors(error)
                print(f"  {key}: API error {error.status_code}: {error.message[:120]}; rerun to retry")
                continue
            except anthropic.APIConnectionError:
                print(f"  {key}: connection error; rerun to retry")
                continue
            on_result(key, outcome_of(message, output_model, batch=False))


def run(client, requests, output_model, on_result, batch=True, workers=3):
    """Send requests ({id: Messages API params}) and call on_result(id, outcome) for each
    response. Requests that fail at the API level are skipped so a rerun retries them."""
    if not requests:
        return
    if batch:
        run_batch(client, requests, output_model, on_result)
    else:
        run_one_by_one(client, requests, output_model, on_result, workers)
