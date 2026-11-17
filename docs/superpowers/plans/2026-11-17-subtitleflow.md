# SubtitleFlow Implementation Plan

> This plan is executed inline because the user explicitly requested direct implementation and the workspace has no existing Git history.

**Goal:** Build a loadable Chrome/Edge Manifest V3 extension with a real native-subtitle translation path, a real tab-audio capture path that preserves playback, configurable AI providers, a Shadow DOM subtitle overlay, an optional local FastAPI service, and documented verification.

**Architecture:** The extension uses a Vite multi-entry build for popup, options, content script, background service worker, and offscreen document. Shared TypeScript modules define messages, settings, subtitle parsing/timing, provider interfaces, queues, and storage. The offscreen document owns getUserMedia/AudioContext/tab audio processing; the background service worker owns sessions, provider orchestration, and cross-context messages; the content script owns video detection, native track extraction, timeline rendering, and the isolated overlay. The optional Python service exposes health, translation, model, and WebSocket ASR endpoints.

**Tech Stack:** TypeScript, React, Vite, Manifest V3, Chrome Extensions APIs, Web Audio API, WebSocket, IndexedDB/chrome.storage, Vitest, Python FastAPI, optional faster-whisper.

## Global Constraints

- Chrome/Edge Manifest V3; active capture begins only after explicit user action.
- Audio capture runs in an offscreen document and reconnects captured audio to AudioContext.destination.
- No DRM bypass; inaccessible media/subtitles report an explicit limitation.
- API keys are configurable, never hard-coded, and never logged.
- Mock providers are test-only; UI surfaces unconfigured or unavailable providers.
- Native subtitles use video time for display; ASR segments carry timestamps and are cached.
- Stop/pause/video switch/page unload release media tracks, sockets, timers, and session state.
- Tests report only executed checks as PASS.

### Task 1: Project skeleton and test harness

Create package/build configuration, MV3 public assets, Vitest, TypeScript, a multi-entry Vite config, and tests for subtitle parsing, timeline lookup, provider configuration, and PCM conversion. Run focused tests and confirm they fail before production modules exist.

### Task 2: Shared contracts and subtitle core

Create typed messages/settings/entities, subtitle parser/exporter/timeline, PCM conversion, bounded queue, and storage adapter. Implement only behavior required by the failing tests, then add edge-case tests for malformed timestamps, overlap, duplicate text, and cancellation.

### Task 3: Provider and translation engine

Create provider interfaces, OpenAI-compatible/local HTTP translation, WebSocket ASR adapter, mock providers for tests, translation context/cache/retry/concurrency/cancellation, and explicit unconfigured-provider errors.

### Task 4: Background session orchestration

Create session state machine, typed runtime message handling, tab lookup, capture permission flow, offscreen lifecycle, native subtitle forwarding, ASR translation forwarding, and cleanup on tab removal or stop.

### Task 5: Offscreen capture engine

Create offscreen document/controller and worklet/fallback processing. Implement tab stream acquisition, source-to-destination playback, level/VAD filtering, 16 kHz PCM chunking, WebSocket send/receive, pause/resume, and full resource release.

### Task 6: Content script, adapters, timeline overlay

Create generic video detection, independent YouTube/Bilibili/Vimeo adapters, native TextTrack extraction, playback event reporting, and a Shadow DOM overlay with bilingual/original/translated modes, drag, fullscreen reparenting, style updates, and current-time lookup.

### Task 7: Popup and options UI

Create dark blue/cyan popup and options pages with real start/pause/stop/display actions, provider configuration, language/mode/style controls, subtitle import/export, persisted settings, and explicit loading/error states.

### Task 8: Optional FastAPI local service

Create GET /health, GET /v1/models, POST /v1/translate, and WS /v1/asr. Make faster-whisper optional, report unavailable model state honestly, and clean up WebSocket sessions.

### Task 9: Packaging, docs, and verification artifacts

Create README.md, CHANGELOG.md, LICENSE, architecture/testing docs, environment/package scripts, and Playwright-ready tests. Run unit tests, typecheck, build, package, and Python compile checks. Report PASS/PARTIAL/BLOCKED per check and never claim live AI/DRM acceptance without evidence.
