"""Real faster-whisper inference. No test transcripts or canned responses."""
import os
import threading
from typing import Any

_model: Any = None
_model_name = ""
_lock = threading.Lock()

def load_model(name: str) -> None:
    global _model, _model_name
    with _lock:
        if _model is not None and _model_name == name:
            return
        from faster_whisper import WhisperModel
        device = os.getenv("SUBTITLEFLOW_DEVICE", "cpu")
        try:
            candidate = WhisperModel(name, device=device,
                compute_type="int8" if device == "cpu" else "float16",
                download_root=os.getenv("SUBTITLEFLOW_MODEL_DIR") or None)
        except Exception:
            if device == "cpu":
                raise
            candidate = WhisperModel(name, device="cpu", compute_type="int8",
                download_root=os.getenv("SUBTITLEFLOW_MODEL_DIR") or None)
        _model = candidate
        _model_name = name

def model_status() -> dict[str, Any]:
    return {"modelLoaded": _model is not None, "model": _model_name,
        "device": str(getattr(getattr(_model, "model", None), "device", "unloaded"))}

def transcribe_pcm(pcm: bytes, language: str = "auto") -> list[dict[str, Any]]:
    import numpy as np
    if _model is None:
        raise RuntimeError("Whisper 模型未加载")
    if len(pcm) % 2 or len(pcm) > 16000 * 2 * 10:
        raise ValueError("PCM 片段格式无效或超过 10 秒")
    audio = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
    with _lock:
        segments, info = _model.transcribe(audio, language=None if language == "auto" else language,
            beam_size=3, vad_filter=True, condition_on_previous_text=False)
        return [{"text": segment.text.strip(), "start": float(segment.start),
            "end": float(segment.end), "language": info.language}
            for segment in segments if segment.text.strip()]

