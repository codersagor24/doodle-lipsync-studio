# 🐍 PYTHON AUDIO & VIDEO ENGINE SPECIFICATION
## Doodle Lip-Sync Studio (ডুডল লিপ-সিঙ্ক স্টুডিও)

> **Purpose:** High-performance, deterministic audio analysis and video export engine for high-volume educational cartoon production.

---

## ১. কারিগরি লাইব্রেরি ও ডিপেনডেন্সি (Dependencies)

- **অডিও প্রসেসিং:** `scipy`, `numpy`, `soundfile` (লাইটওয়েট, সুপার-ফাস্ট, কোনো জটিল সি-কম্পাইলার ডিপেনডেন্সি নেই)।
- **ভিডিও এনকোডিং:** সিস্টেম `ffmpeg` (ভার্সন 6.1.1 ইতিমধ্যে ইন্সটল করা আছে)।
- **ভেক্টর ফ্রেম রেন্ডারিং:** `Pillow` (PIL) / `pycairo` বা হেডলেস ভেক্টর পাইপলাইন।
- **ওয়েব এপিআই (যদি হাইব্রিড নির্বাচন করা হয়):** `fastapi`, `uvicorn` (লোকালহস্টে আল্ট্রা-ফাস্ট রেসপন্স)।

---

## ২. মডিউল ডিজাইন (Module Architecture)

```
python_engine/
├── audio_engine.py      # RMS ভলিউম এনভেলপ ও ফ্রিকোয়েন্সি থেকে ভিসিম এক্সট্রাক্ট
├── viseme_mapper.py     # REST, AA, OO, EE, SMILE শেপ ইন্টারপোলেশন ও স্মুথিং
├── frame_renderer.py    # ক্যানভাস ভেক্টর ফেস ফ্রেম বাই ফ্রেম ড্রয়িং
├── video_exporter.py    # FFmpeg পাইপলাইন (ProRes 4444 Alpha, WebM VP9 Alpha, Green Screen)
├── batch_runner.py      # ইনপুট ফোল্ডার থেকে ২০-৫০টি অডিও একসাথে এক ক্লিকে রেন্ডার
└── server.py            # হাইব্রিড মোডের জন্য লোকাল REST API
```

---

## ৩. লিপ-সিঙ্ক ফ্রেম ডেটা স্ট্রাকচার (JSON Contract)

অডিও বিশ্লেষণ শেষে পাইথন ইঞ্জিন একটি সুনির্দিষ্ট টাইম-সিরিজ ডেটা তৈরি করবে:

```json
{
  "audio_file": "input_audio/cucumber_dialogue_01.wav",
  "duration": 5.42,
  "fps": 30,
  "total_frames": 163,
  "frames": [
    {
      "frame": 0,
      "time": 0.000,
      "rms": 0.012,
      "viseme": "REST",
      "open_y": 0.00,
      "width_x": 1.00,
      "is_silent": true
    },
    {
      "frame": 12,
      "time": 0.400,
      "rms": 0.620,
      "viseme": "AA",
      "open_y": 0.78,
      "width_x": 1.05,
      "is_silent": false
    }
  ]
}
```

---

## ৪. FFmpeg এক্সপোর্ট কমান্ড স্পেসিফিকেশন

### ১. Apple ProRes 4444 with Alpha Channel (ভিডিও এডিটরদের জন্য সেরা):
```bash
ffmpeg -y -f rawvideo -pix_fmt rgba -s 1080x1080 -r 30 -i - -i audio.wav \
  -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le \
  -c:a pcm_s16le output_prores_alpha.mov
```

### ২. WebM VP9 with Alpha Channel (ক্যাপকাট ও ওয়েবের জন্য হালকা):
```bash
ffmpeg -y -f rawvideo -pix_fmt rgba -s 1080x1080 -r 30 -i - -i audio.wav \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 8M \
  -c:a libopus output_alpha.webm
```

### ৩. Green Screen MP4 (#00FF00 Chroma Key):
```bash
ffmpeg -y -f rawvideo -pix_fmt rgba -s 1080x1080 -r 30 -i - -i audio.wav \
  -c:v libx264 -pix_fmt yuv420p -b:v 10M \
  -c:a aac -b:a 192k output_greenscreen.mp4
```

---

## ৫. হাই-ভলিউম ব্যাচ প্রসেসিং ওয়ার্কফ্লো (Batch Production)
ইউজার প্রতিদিন যখন প্রচুর ভিডিও তৈরি করবেন:
1. ইউজার তার সমস্ত ডায়ালগ ভয়েস ফাইল `input_audio/` ফোল্ডারে পেস্ট করবেন।
2. কমান্ড লাইনে `python batch_runner.py --style googly --preset cucumber` চালাবেন (অথবা ওয়েব ইউআই থেকে ব্যাচ বাটন চাপবেন)।
3. পাইথন প্যারালাল থ্রেডে প্রতিটি অডিও ফাইল বিশ্লেষণ করে কয়েক মিনিটের মধ্যে সমস্ত আলফা চ্যানেল ও গ্রিন স্ক্রিন ভিডিও `output_videos/` ফোল্ডারে জমা করে দেবে।
