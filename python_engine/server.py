"""
FastAPI Backend Server for Doodle Lip-Sync Studio
Provides REST API endpoints for audio acoustic analysis, preset listing,
and deterministic video export (ProRes 4444 Alpha, WebM VP9 Alpha, Green Screen).
"""

import os
import glob
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from .audio_engine import AudioEngine
from .video_exporter import VideoExporter

app = FastAPI(title="Doodle Lip-Sync Studio Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "input_audio"
OUTPUT_DIR = "output_videos"
PRESETS_DIR = "presets"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


class RenderRequest(BaseModel):
    audio_file_path: str
    style: str = "googly"
    export_format: str = "greenscreen"  # "greenscreen" | "prores" | "webm"
    fps: int = 30
    resolution: List[int] = [1080, 1080]
    layers: Optional[Dict[str, bool]] = None
    transform: Optional[Dict[str, Any]] = None
    mood_markers: Optional[List[Dict[str, Any]]] = None
    gaze_markers: Optional[List[Dict[str, Any]]] = None


@app.get("/api/status")
def get_status():
    return {"status": "ok", "engine": "Python PyCairo + FFmpeg", "version": "1.0.0"}


@app.get("/api/presets")
def get_presets():
    preset_files = glob.glob(os.path.join(PRESETS_DIR, "*.json"))
    presets = []
    for pf in sorted(preset_files):
        with open(pf, "r", encoding="utf-8") as f:
            presets.append(json.load(f))
    return {"presets": presets}


@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"status": "uploaded", "file_path": file_path, "filename": file.filename}


@app.post("/api/analyze-audio")
def analyze_audio(file_path: str = Form(...), fps: int = Form(30)):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    engine = AudioEngine(fps=fps)
    return engine.analyze(file_path)


@app.post("/api/render-video")
def render_video(req: RenderRequest):
    preset_path = os.path.join(PRESETS_DIR, f"{req.style}.json")
    if not os.path.exists(preset_path):
        raise HTTPException(status_code=404, detail=f"Preset '{req.style}' not found")
    if not os.path.exists(req.audio_file_path):
        raise HTTPException(status_code=404, detail=f"Audio file '{req.audio_file_path}' not found")

    base_name = os.path.splitext(os.path.basename(req.audio_file_path))[0]
    ext = "mov" if req.export_format == "prores" else ("webm" if req.export_format == "webm" else "mp4")
    output_filename = f"{base_name}_{req.style}_{req.export_format}.{ext}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    exporter = VideoExporter(fps=req.fps, resolution=(req.resolution[0], req.resolution[1]))
    result = exporter.export(
        audio_file=req.audio_file_path,
        preset_path=preset_path,
        output_path=output_path,
        export_format=req.export_format,
        layers=req.layers,
        transform=req.transform,
        mood_markers=req.mood_markers,
        gaze_markers=req.gaze_markers,
    )
    result["download_url"] = f"/api/download/{output_filename}"
    return result


@app.get("/api/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Rendered video not found")
    return FileResponse(file_path)
