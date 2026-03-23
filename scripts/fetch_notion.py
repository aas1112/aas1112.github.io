import os
import json
import requests

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def get_notion_data():
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    response = requests.post(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.text}")

    data = response.json()
    books = []

    for item in data.get("results", []):
        props = item["properties"]
        
        # Bu kısımlar Notion tablonuzdaki sütun adlarına göre değişmelidir.
        # Örnek olarak: Ad, Yazar, Kapak (Files & media stili), Durum (Select/Status alanı), Tarih vb.
        try:
            title = props.get("Ad", {}).get("title", [{}])[0].get("text", {}).get("content", "Bilinmeyen Başlık")
        except:
            title = "Bilinmeyen Başlık"

        try:
            author = props.get("Yazar", {}).get("rich_text", [{}])[0].get("plain_text", "Bilinmeyen Yazar")
        except:
            author = "Bilinmeyen Yazar"

        try:
            status = props.get("Durum", {}).get("status", {}).get("name", "Okunacak")
        except:
            status = "Okunacak"

        try:
            category = props.get("Kategori", {}).get("select", {}).get("name", "Genel Kitaplar")
        except:
            category = "Genel Kitaplar"

        try:
            date_val = props.get("Tarih", {}).get("date", {}).get("start", "-")
        except:
            date_val = "-"

        try:
            cover = props.get("Kapak", {}).get("files", [{}])[0].get("file", {}).get("url", "https://via.placeholder.com/300x450?text=Kapak+Yok")
        except:
            cover = "https://via.placeholder.com/300x450?text=Kapak+Yok"

        books.append({
            "title": title,
            "author": author,
            "status": status,
            "category": category,
            "date": date_val,
            "cover": cover
        })

    return books

if __name__ == "__main__":
    b = get_notion_data()
    with open("kitaplar.json", "w", encoding="utf-8") as f:
        json.dump(b, f, ensure_ascii=False, indent=2)
    print("kitaplar.json başarıyla güncellendi!")
