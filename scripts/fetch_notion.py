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
        
        title = "Bilinmeyen Başlık"
        author = "Bilinmeyen Yazar"
        status = "Okunacak"
        category = "Genel Kitaplar"
        date_val = "-"
        cover = "https://via.placeholder.com/300x450?text=Kapak+Yok"

        # 1. Notion Sayfa Kapağına (Page Cover) bak:
        if item.get("cover"):
            if item["cover"].get("type") == "external":
                cover = item["cover"]["external"]["url"]
            elif item["cover"].get("type") == "file":
                cover = item["cover"]["file"]["url"]

        # 2. Bütün özellikleri otomatik tara:
        rich_texts = []
        for prop_name, prop_data in props.items():
            prop_type = prop_data.get("type", "")
            lower_name = prop_name.lower()

            # BAŞLIK
            if prop_type == "title":
                try:
                    title = prop_data["title"][0]["plain_text"]
                except: pass
                
            # ZENGİN METİN (Yazar adayı)
            elif prop_type == "rich_text":
                try:
                    val = prop_data["rich_text"][0]["plain_text"]
                    if val.strip():
                        rich_texts.append(val)
                        if "yazar" in lower_name or "author" in lower_name:
                            author = val
                except: pass
                
            # DURUM - STATUS PROPERTY
            elif prop_type == "status":
                try:
                    status = prop_data["status"]["name"]
                except: pass
                
            # SEÇENEKLER (Select) - Durum veya Kategori olabilir
            elif prop_type == "select":
                try:
                    val = prop_data["select"]["name"]
                    # Eğer kolon ismi durum ile ilgiliyse...
                    if "durum" in lower_name or "okuma" in lower_name or "status" in lower_name or val.lower() in ["okundu", "okunuyor", "okunacak", "done", "reading", "to do"]:
                        status = val
                    else:
                        # Durum değilse muhtemelen kategoridir
                        category = val
                except: pass

            # TARİH (Date)
            elif prop_type == "date":
                try:
                    date_val = prop_data["date"]["start"]
                except: pass
                
            # DOSYA VE MEDYA (Eğer kapak görseli property içindeyse)
            elif prop_type == "files":
                try:
                    if len(prop_data["files"]) > 0:
                        file_info = prop_data["files"][0]
                        if file_info.get("type") == "external":
                            cover = file_info["external"]["url"]
                        elif file_info.get("type") == "file":
                            cover = file_info["file"]["url"]
                except: pass
            
            # URL (Eğer görsel linki url property olarak verilmişse)
            elif prop_type == "url":
                 try:
                     url_val = prop_data.get("url", "")
                     if url_val and ("jpg" in url_val or "png" in url_val or "jpeg" in url_val or "image" in lower_name or "resim" in lower_name or "kapak" in lower_name):
                         cover = url_val
                 except: pass

        # Eğer hala yazar bulunamadıysa ve elimizde başlık dışı zengin metin varsa, ilk metni yazar olarak ata (Basit bir fallback)
        if author == "Bilinmeyen Yazar" and len(rich_texts) > 0:
            # Özet vs gibi çok uzun olmayan ilk text'i al
            for text in rich_texts:
                if len(text) < 50:
                    author = text
                    break

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
