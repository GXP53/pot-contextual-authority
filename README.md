# Proof of Trust (PoT): Contextual Authority

A governance layer for Alexa+ that evaluates identity, device context, mandates, and human authorization before consequential actions-and produces a tamper-evident receipt for every decision.

> **Status:** Active development for the Build, Ship, Shape: Amazon Developer Hackathon. Features described as planned are not yet represented as complete.

## The problem

Authentication can establish who someone is, but it does not necessarily establish whether a particular action should be allowed:

- Here and now
- From this device
- Within an active mandate
- Under this person’s authority
- With sufficient evidence and approval

PoT introduces a governance boundary between an AI agent’s proposed action and its execution.

## Decision model

PoT evaluates a structured request and returns one of four decisions:

- `ALLOW` - The request satisfies the applicable mandate and may proceed.
- `CAUTION` - The request may proceed with a documented warning or limitation.
- `BLOCK` - The request violates policy or exceeds established authority.
- `DEFERRED` - The request requires additional evidence or action-specific human approval.

Authentication does not override a `BLOCK`.

## Initial demonstration

The planned demonstration represents four established nodes:

- A Fire TV Cube in the living room
- A Fire TV Stick in the bedroom
- A roaming Fire TV Stick used while travelling
- A phone providing action-specific passkey or biometric approval

The same verified user may receive different decisions depending on the device, context, mandate, and proposed action.

Simulated context will be explicitly identified as simulated.

## First milestone

The first reproducible build will implement:

`request → mandate evaluation → decision → verifiable receipt`

Initial tests will demonstrate:

1. An authorized household request returns "ALLOW".
2. A roaming request requiring approval returns "DEFERRED".
3. An out-of-mandate action returns "BLOCK".
4. Altering a completed receipt causes verification to fail.

## Decision receipts

Each evaluation is intended to produce a receipt containing:

- Receipt identifier and timestamp
- Request digest
- Actor and device references
- Evidence references and evidence status
- Applicable mandate and policy version
- Decision and reasons
- Approval requirement or reference
- Integrity value and verification result

Receipts will not contain passwords, private keys, one-time codes, raw biometric data, or unnecessary location details.

## Planned architecture

The build is expected to include:

- A TypeScript policy engine
- A self-hosted MCP server
- AWS Lambda and API Gateway
- DynamoDB for mandates and replay protection
- AWS KMS or Secrets Manager for protected signing material
- CloudWatch for operational evidence
- A phone-based approval flow
- An Alexa+ or clearly labeled web-based demonstration interface

Amazon Bedrock may assist with converting natural-language requests into structured proposed actions. The deterministic PoT policy engine-not the language model-will make the authorization decision.

## Repository structure

- `src/` - Core policy engine, receipt logic, and MCP interface
- `policies/` - Example mandates and policy definitions
- `examples/` - Synthetic demonstration requests
- `tests/` - Decision and receipt-verification tests
- `docs/` - Architecture, semantics, scenarios, and build evidence

## Security principles

- Human authority remains explicit.
- Approval is bound to the exact action being authorized.
- Changed, expired, replayed, or revoked approvals are rejected.
- Evidence, interpretation, and authority remain separate.
- Consequential execution remains gated by the final PoT decision.
- Demonstrated functionality is distinguished from planned functionality.

## Hackathon development

This repository contains the distinct Alexa+ implementation developed for the Amazon hackathon. Earlier Proof of Trust concepts and implementations predate this event. New work will be identified through repository history and the hackathon change log.

## License

Licensed under the Apache License 2.0. See "LICENSE" (LICENSE).