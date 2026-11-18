from __future__ import annotations

import asyncio
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .asr import load_model, model_status, transcribe_pcm

app = FastAPI(title="SubtitleFlow Local Service", version="0.0.2")
app.add_middleware(CORSMiddleware,
    allow_origin_regex=r"^(chrome-extension://[a-p]{32}|http://(127\.0\.0\.1|localhost)(:\d+)?)$",
    allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"],
    allow_credentials=False)

class TranslateRequest(BaseModel):
    text: str
    sourceLanguage: str = "auto"
    targetLanguage: str = "zh-CN"
    context: list[dict[str, Any]] = Field(default_factory=list)
    model: str = ""

@app.get("/health")
async def health() -> dict[str, Any]:
    status = model_status()
    return {"service": "subtitleflow-local", "status": "ready" if status["modelLoaded"] else "degraded",
        **status, "timestamp": time.time()}

@app.get("/v1/models")
async def models() -> dict[str, Any]:
    status = model_status()
    return {"models": [status] if status["modelLoaded"] else [],
        "availableModelNames": ["tiny", "base", "small", "medium", "large-v3"],
        "message": "首次连接时下载并加载所选 Whisper 模型" if not status["modelLoaded"] else "模型已加载"}

@app.post("/v1/translate")
async def translate(request: TranslateRequest) -> dict[str, Any]:
    model = request.model or os.getenv("SUBTITLEFLOW_TRANSLATION_MODEL", "")
    if not model:
        raise HTTPException(503, "请填写本地翻译模型名称，并启动 Ollama 或 LM Studio 的 OpenAI 兼容服务")
    endpoint = os.getenv("SUBTITLEFLOW_TRANSLATION_URL", "http://127.0.0.1:11434/v1")
    if not (endpoint.startswith("http://127.0.0.1:") or endpoint.startswith("http://localhost:")):
        raise HTTPException(400, "本地翻译转发仅允许本机地址")
    messages = [{"role": "system", "content": "Translate subtitles to " + request.targetLanguage +
        ". Preserve meaning and tone. Return only the translation."}]
    for item in request.context[-10:]:
        messages.append({"role": "user", "content": str(item.get("original", ""))})
        if item.get("translated"):
            messages.append({"role": "assistant", "content": str(item["translated"])})
    messages.append({"role": "user", "content": request.text})
    def call() -> str:
        payload = json.dumps({"model": model, "messages": messages, "temperature": 0.2}).encode("utf-8")
        req = urllib.request.Request(endpoint.rstrip("/") + "/chat/completions", data=payload,
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)["choices"][0]["message"]["content"]
    try:
        text = await asyncio.to_thread(call)
        return {"translation": text, "configured": True}
    except (urllib.error.URLError, KeyError, ValueError) as error:
        raise HTTPException(503, "本地翻译服务不可用，请检查 Ollama/LM Studio 的模型和端口") from error

@app.websocket("/v1/asr")
async def asr(websocket: WebSocket) -> None:
    origin = websocket.headers.get("origin", "")
    if origin and not origin.startswith(("chrome-extension://", "http://127.0.0.1:", "http://localhost:")):
        await websocket.close(code=1008)
        return
    await websocket.accept()
    session_id = ""
    language = "auto"
    metadata: dict[str, Any] = {}
    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            if message.get("text"):
                data = json.loads(message["text"])
                if data.get("type") == "start":
                    session_id = str(data.get("sessionId", ""))
                    language = str(data.get("language", "auto"))
                    model = str(data.get("model") or os.getenv("SUBTITLEFLOW_MODEL_SIZE", "small"))
                    allowed = {"tiny", "base", "small", "medium", "large-v3", "large-v3-turbo", "tiny.en", "base.en", "small.en"}
                    if model not in allowed:
                        raise ValueError("不支持的 Whisper 模型名称")
                    try:
                        timeout_ms = max(5_000, min(600_000, int(data.get("timeoutMs", 120_000))))
                        await asyncio.wait_for(asyncio.to_thread(load_model, model), timeout=timeout_ms / 1000)
                    except ImportError:
                        await websocket.send_json({"type": "error", "message": "未安装 faster-whisper，请运行 scripts/start-local-service.ps1 安装并启动本地服务"})
                        break
                    except asyncio.TimeoutError:
                        await websocket.send_json({"type": "error", "message": "Whisper 模型加载超时，请检查网络后重试，或改用 tiny 模型并增加超时时间"})
                        break
                    except Exception:
                        await websocket.send_json({"type": "error", "message": "Whisper 模型下载或加载失败，请检查网络、磁盘和 CUDA 配置；可改用 tiny/CPU"})
                        break
                    await websocket.send_json({"type": "ready", "state": "ready", **model_status()})
                elif data.get("type") == "audio":
                    metadata = data
                elif data.get("type") == "stop":
                    break
            elif message.get("bytes") and session_id and metadata:
                pcm = message["bytes"]
                segments = await asyncio.to_thread(transcribe_pcm, pcm, language)
                start = float(metadata.get("startTime", 0))
                end = float(metadata.get("endTime", start + len(pcm) / 32000))
                rate = float(metadata.get("playbackRate", 1))
                for index, segment in enumerate(segments):
                    await websocket.send_json({"type": "final", "sessionId": session_id,
                        "text": segment["text"], "sourceLanguage": segment["language"],
                        "startTime": start + segment["start"] * rate,
                        "endTime": min(end, start + segment["end"] * rate),
                        "isPartial": False, "epoch": metadata.get("epoch"),
                        "segmentId": str(metadata.get("segmentId", "")) + "-" + str(index)})
                await websocket.send_json({"type": "complete", "epoch": metadata.get("epoch")})
                metadata = {}
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.send_json({"type": "error", "message": "音频推理失败，请检查 PCM16/16kHz 单声道数据和模型状态"})
        except RuntimeError:
            pass
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass



\n