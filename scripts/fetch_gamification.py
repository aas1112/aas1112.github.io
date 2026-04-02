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

def get_gamification_data():
    if not DATABASE_ID:
        print("Warning: NOTION_GAMIFICATION_ID is not set.")
        return []

    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    
    # We can sort by created_time descending so the newest is first
    payload = {
        "sorts": [
            {
                "timestamp": "created_time",
                "direction": "descending"
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.text}")

    data = response.json()
    daily_records = []

    for item in data.get("results", []):
        props = item["properties"]
        
        # Get page creation time as fallback date
        created_time = item.get("created_time", "")
        formatted_date = created_time.split("T")[0] if created_time else ""
        
        record_name = "Bilinmeyen Gün"
        habits = {}
        
        for prop_name, prop_data in props.items():
            prop_type = prop_data.get("type", "")
            
            if prop_type == "title":
                try: 
                    if prop_data["title"]:
                        record_name = prop_data["title"][0]["plain_text"]
                    else:
                        record_name = "İsimsiz"
                except: pass
                
            elif prop_type == "date":
                # If they explicitly used a Date property
                try:
                    if prop_data["date"] and "start" in prop_data["date"]:
                        formatted_date = prop_data["date"]["start"].split("T")[0]
                except: pass
                
            elif prop_type == "created_time":
                # If they added a created_time column
                try:
                    formatted_date = prop_data["created_time"].split("T")[0]
                except: pass
                
            elif prop_type == "checkbox":
                # Dynamically capture every checkbox!
                try:
                    habits[prop_name] = prop_data["checkbox"]
                except: pass

        daily_records.append({
            "id": item["id"],
            "name": record_name,
            "date": formatted_date,
            "habits": habits
        })

    return daily_records

if __name__ == "__main__":
    records = get_gamification_data()
    # Save slightly pretty JSON
    with open("gamification.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"gamification.json başarıyla güncellendi! Toplam {len(records)} kayıt çekildi.")
