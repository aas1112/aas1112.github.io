import os
import json
import requests

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_GAMIFICATION_ID")

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# ─────────────────────────────────────────────────────────────────────────────
# Category → {task_name: duration_minutes} mapping
# Task names MUST match Notion column names exactly (case-sensitive)
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_CONFIG = {
    "Mental": {
        "Ders-120":                  120,
        "Makale-30":                 30,
        "Felsefe-60":                60,
    },
    "Career": {
        "Kişisel Proje-90": 90,
        "İş Arama-30":      30,
        "Proje Fikri-30":   30,            # Notion'dan gelen gerçek isim
        "Mühendislik Haberleri-30":  30,
        "Yabancı Dil-30":            30,
    },
    "Stamina": {
        "Spor-120":      120,
        "Soğuk Duş-15":   15,
        "Bakım-15":        15,
    },
    "Willpower": {
        "Sosyal-75":    75,
        "Gün Planı-15": 15,
        "Okuma-60":     60,
    },
}

# Pre-compute max minutes per category (sum of all task durations)
CATEGORY_MAX = {cat: sum(tasks.values()) for cat, tasks in CATEGORY_CONFIG.items()}

# Flat lookup: task_name → (category, minutes)
TASK_LOOKUP = {}
for cat, tasks in CATEGORY_CONFIG.items():
    for task_name, minutes in tasks.items():
        TASK_LOOKUP[task_name] = (cat, minutes)


def get_gamification_data():
    if not DATABASE_ID:
        print("Warning: NOTION_GAMIFICATION_ID is not set.")
        return []

    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    payload = {
        "sorts": [{"timestamp": "created_time", "direction": "descending"}],
        "page_size": 100
    }

    all_results = []
    has_more = True
    next_cursor = None

    while has_more:
        if next_cursor:
            payload["start_cursor"] = next_cursor
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch data: {response.text}")
        data = response.json()
        all_results.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        next_cursor = data.get("next_cursor")

    daily_records = []

    for item in all_results:
        props = item["properties"]

        created_time = item.get("created_time", "")
        formatted_date = created_time.split("T")[0] if created_time else ""

        record_name = "Bilinmeyen Gün"
        raw_habits = {}   # prop_name → bool

        for prop_name, prop_data in props.items():
            prop_type = prop_data.get("type", "")

            if prop_type == "title":
                try:
                    if prop_data["title"]:
                        record_name = prop_data["title"][0]["plain_text"]
                    else:
                        record_name = "İsimsiz"
                except Exception:
                    pass

            elif prop_type == "date":
                try:
                    if prop_data["date"] and "start" in prop_data["date"]:
                        formatted_date = prop_data["date"]["start"].split("T")[0]
                except Exception:
                    pass

            elif prop_type == "created_time":
                try:
                    formatted_date = prop_data["created_time"].split("T")[0]
                except Exception:
                    pass

            elif prop_type == "checkbox":
                try:
                    raw_habits[prop_name] = prop_data["checkbox"]
                except Exception:
                    pass

        # ── Build per-category EXP for this day ──────────────────────────────
        category_data = {}
        for cat in CATEGORY_CONFIG:
            completed_minutes = 0
            for task_name, minutes in CATEGORY_CONFIG[cat].items():
                if raw_habits.get(task_name, False):
                    completed_minutes += minutes
            max_minutes = CATEGORY_MAX[cat]
            exp = round((completed_minutes / max_minutes) * 100) if max_minutes > 0 else 0
            category_data[cat] = {
                "completedMinutes": completed_minutes,
                "maxMinutes": max_minutes,
                "exp": exp          # 0-100, normalised EXP for the day
            }

        daily_records.append({
            "id": item["id"],
            "name": record_name,
            "date": formatted_date,
            "habits": raw_habits,           # raw booleans (kept for backward compat)
            "categories": category_data     # NEW: per-category EXP breakdown
        })

    return daily_records


if __name__ == "__main__":
    records = get_gamification_data()
    with open("gamification.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"gamification.json başarıyla güncellendi! Toplam {len(records)} kayıt çekildi.")
