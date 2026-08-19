import asyncio
import json
import os
import edge_tts

MANIFEST_PATH = "/Volumes/Data/Kids/hoc-toan-vui/scripts/tonymath_full_audio_manifest.json"
OUTPUT_DIR = "/Volumes/Data/Kids/hoc-toan-vui/public/audio/mascot"

MASCOT_CONFIGS = {
    "robot": {"voice": "vi-VN-NamMinhNeural", "rate": "+10%", "pitch": "+5Hz"},
    "turtle": {"voice": "vi-VN-HoaiMyNeural", "rate": "-5%", "pitch": "-2Hz"},
    "owl": {"voice": "vi-VN-HoaiMyNeural", "rate": "+0%", "pitch": "+0Hz"},
    "shark": {"voice": "vi-VN-HoaiMyNeural", "rate": "+15%", "pitch": "+8Hz"},
    "gen": {"voice": "vi-VN-HoaiMyNeural", "rate": "+5%", "pitch": "+4Hz"},
    "praise": {"voice": "vi-VN-HoaiMyNeural", "rate": "+5%", "pitch": "+4Hz"},
    "encourage": {"voice": "vi-VN-HoaiMyNeural", "rate": "-2%", "pitch": "+0Hz"},
    "default": {"voice": "vi-VN-HoaiMyNeural", "rate": "+0%", "pitch": "+0Hz"}
}

def get_config(item_id):
    for key, config in MASCOT_CONFIGS.items():
        if item_id.startswith(key):
            return config
    return MASCOT_CONFIGS["default"]

sem = asyncio.Semaphore(2)

async def generate_single(item):
    item_id = item["id"]
    text = item["text"]
    cfg = get_config(item_id)
    out_path = os.path.join(OUTPUT_DIR, f"{item_id}.wav")

    async with sem:
        for attempt in range(4):
            try:
                communicate = edge_tts.Communicate(
                    text=text,
                    voice=cfg["voice"],
                    rate=cfg["rate"],
                    pitch=cfg["pitch"]
                )
                await communicate.save(out_path)
                print(f"✅ [{item_id}] Generated ({cfg['voice']})")
                await asyncio.sleep(0.2)
                return
            except Exception as e:
                if attempt == 3:
                    print(f"❌ [{item_id}] Failed after 4 attempts: {e}")
                    raise
                await asyncio.sleep(1.0 * (attempt + 1))

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)
    
    print(f"🚀 Generating {len(items)} audio files using Edge-TTS Neural (Semaphore=2)...")
    tasks = [generate_single(item) for item in items]
    await asyncio.gather(*tasks)
    print("🎉 All mascot audio files successfully generated with unified Neural Voices!")

if __name__ == "__main__":
    asyncio.run(main())
