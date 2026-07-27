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
        raw_habits = {}     # prop_name → bool
        raw_numbers = {}    # prop_name → number

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
                    raw_habits[prop_name] = bool(prop_data.get("checkbox", False))
                except Exception:
                    pass

            elif prop_type == "number":
                try:
                    val = prop_data.get("number")
                    raw_numbers[prop_name] = val if val is not None else 0
                except Exception:
                    pass

        # ── Build per-category EXP for this day ──────────────────────────────
        category_data = {}

        # 1. Career (Kariyer & Mühendislik)
        career_mins = 0
        for k, v in raw_numbers.items():
            if any(term in k.lower() for term in ["kariyer", "mühendislik", "career"]):
                career_mins += v
        # Fallback to legacy habits if no number column found
        if career_mins == 0:
            for task_name, mins in CATEGORY_CONFIG["Career"].items():
                if raw_habits.get(task_name, False):
                    career_mins += mins

        career_target = 540  # 9 saat standart iş günü hedefi
        career_exp = round((career_mins / career_target) * 100) if career_target > 0 else 0
        category_data["Career"] = {
            "completedMinutes": career_mins,
            "maxMinutes": career_target,
            "exp": min(100, career_exp)
        }

        # 2. Mental (Zihin & Gelişim)
        mental_mins = 0
        for k, v in raw_numbers.items():
            if any(term in k.lower() for term in ["zihin", "gelişim", "mental", "okuma"]):
                mental_mins += v
        if mental_mins == 0:
            for task_name, mins in CATEGORY_CONFIG["Mental"].items():
                if raw_habits.get(task_name, False):
                    mental_mins += mins

        mental_target = 60  # 60 dk günlük okuma/gelişim hedefi
        mental_exp = round((mental_mins / mental_target) * 100) if mental_target > 0 else 0
        category_data["Mental"] = {
            "completedMinutes": mental_mins,
            "maxMinutes": mental_target,
            "exp": min(100, mental_exp)
        }

        # 3. Stamina (Fiziksel & Efor)
        stamina_mins = 0
        for k, v in raw_numbers.items():
            if any(term in k.lower() for term in ["fiziksel", "efor", "spor", "stamina"]):
                stamina_mins += v
        if stamina_mins == 0:
            for task_name, mins in CATEGORY_CONFIG["Stamina"].items():
                if raw_habits.get(task_name, False):
                    stamina_mins += mins

        stamina_target = 45  # 45 dk spor/yürüyüş hedefi
        stamina_exp = round((stamina_mins / stamina_target) * 100) if stamina_target > 0 else 0
        category_data["Stamina"] = {
            "completedMinutes": stamina_mins,
            "maxMinutes": stamina_target,
            "exp": min(100, stamina_exp)
        }

        # 4. Willpower (İrade: Sigara, Soul, Bakım)
        willpower_exp = 0
        willpower_mins = 0

        # Checkbox points allocation (Sigara = 40, Soul = 30, Bakım = 30 → Total 100)
        for h_name, is_checked in raw_habits.items():
            if is_checked:
                h_lower = h_name.lower()
                if "sigara" in h_lower:
                    willpower_exp += 40
                    willpower_mins += 30
                elif "soul" in h_lower or "ruh" in h_lower:
                    willpower_exp += 30
                    willpower_mins += 30
                elif "bakım" in h_lower or "bakim" in h_lower:
                    willpower_exp += 30
                    willpower_mins += 30

        # Legacy fallback for willpower
        if willpower_exp == 0 and willpower_mins == 0:
            for task_name, mins in CATEGORY_CONFIG["Willpower"].items():
                if raw_habits.get(task_name, False):
                    willpower_mins += mins
            willpower_exp = round((willpower_mins / 150) * 100)

        category_data["Willpower"] = {
            "completedMinutes": willpower_mins,
            "maxMinutes": 90,
            "exp": min(100, willpower_exp)
        }

        daily_records.append({
            "id": item["id"],
            "name": record_name,
            "date": formatted_date,
            "habits": raw_habits,
            "numbers": raw_numbers,
            "categories": category_data
        })

    return daily_records


if __name__ == "__main__":
    records = get_gamification_data()
    with open("gamification.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"gamification.json başarıyla güncellendi! Toplam {len(records)} kayıt çekildi.")
