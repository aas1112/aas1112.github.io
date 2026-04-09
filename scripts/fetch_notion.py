"""
fetch_notion.py — Notion Kütüphane Sync Script

İki iş yapar:
  1. Notion veritabanındaki tüm kitap/makale kayıtlarını çeker → kitaplar.json
  2. Kategori = "Makale" olan sayfalar için Notion block içeriğini çeker
     → articles/<notion_page_id>.json (her makale için ayrı dosya)

Bu dosyalar GitHub Pages'de statik olarak sunulur ve library.js tarafından
okuma modalı açıldığında doğrudan fetch() ile yüklenir.

Kullanım:
    NOTION_TOKEN=secret_... NOTION_DATABASE_ID=... python scripts/fetch_notion.py
"""

import os
import json
import requests

NOTION_TOKEN  = os.getenv("NOTION_TOKEN")
DATABASE_ID   = os.getenv("NOTION_DATABASE_ID")

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

ARTICLE_DIR = "articles"

# ──────────────────────────────────────────────────────────────
# Helper: Fetch all pages (handles Notion pagination)
# ──────────────────────────────────────────────────────────────
def fetch_all_database_pages():
    url    = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
    pages  = []
    cursor = None

    while True:
        payload = {}
        if cursor:
            payload["start_cursor"] = cursor

        res = requests.post(url, headers=HEADERS, json=payload)
        if res.status_code != 200:
            raise Exception(f"Database query failed: {res.text}")

        data   = res.json()
        pages += data.get("results", [])

        if data.get("has_more") and data.get("next_cursor"):
            cursor = data["next_cursor"]
        else:
            break

    return pages


# ──────────────────────────────────────────────────────────────
# Helper: Fetch all blocks of a Notion page (handles pagination)
# ──────────────────────────────────────────────────────────────
def fetch_all_blocks(page_id):
    url    = f"https://api.notion.com/v1/blocks/{page_id}/children"
    blocks = []
    cursor = None

    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor

        res = requests.get(url, headers=HEADERS, params=params)
        if res.status_code == 404:
            print(f"  [WARN] Page {page_id} not found or no access.")
            return []
        if res.status_code != 200:
            print(f"  [WARN] Block fetch failed for {page_id}: {res.text}")
            return []

        data    = res.json()
        blocks += data.get("results", [])

        if data.get("has_more") and data.get("next_cursor"):
            cursor = data["next_cursor"]
        else:
            break

    # Recursively fetch children for blocks that have them (especially handling tables and list items)
    for b in blocks:
        if b.get("has_children"):
            b["children"] = fetch_all_blocks(b["id"])

    return blocks


# ──────────────────────────────────────────────────────────────
# Parse a single Notion page into our book/article dict
# ──────────────────────────────────────────────────────────────
def parse_page(item):
    props = item.get("properties", {})

    title     = "Bilinmeyen Başlık"
    author    = "Bilinmeyen Yazar"
    status    = "Okunacak"
    category  = "Okuma"
    date_val  = "-"
    cover     = "https://via.placeholder.com/300x450?text=Kapak+Yok"
    page_id   = item.get("id", "")

    # ── Cover image ──
    if item.get("cover"):
        ct = item["cover"].get("type")
        if ct == "external":
            cover = item["cover"]["external"]["url"]
        elif ct == "file":
            cover = item["cover"]["file"]["url"]

    # ── Properties ──
    rich_texts = []
    for prop_name, prop_data in props.items():
        prop_type  = prop_data.get("type", "")
        lower_name = prop_name.lower()

        if prop_type == "title":
            try: title = prop_data["title"][0]["plain_text"]
            except: pass

        elif prop_type == "rich_text":
            try:
                val = prop_data["rich_text"][0]["plain_text"]
                if val.strip():
                    rich_texts.append(val)
                    if "author" in lower_name or "yazar" in lower_name:
                        author = val
            except: pass

        elif prop_type == "status":
            try:
                val = prop_data["status"]["name"]
                if val in ("Done", "Okundu"):       status = "Okundu"
                elif val in ("In Progress", "Okunuyor"): status = "Okunuyor"
                else:                               status = "Okunacak"
            except: pass

        elif prop_type == "select":
            try:
                val = prop_data["select"]["name"]
                if any(k in lower_name for k in ("tür", "category", "kategori", "tycategory")):
                    category = val
                elif any(k in lower_name for k in ("durum", "status")):
                    if val in ("Done", "Okundu"):       status = "Okundu"
                    elif val in ("In Progress", "Okunuyor"): status = "Okunuyor"
                    else:                               status = "Okunacak"
                else:
                    category = val  # fallback: first unlabelled select = category
            except: pass

        elif prop_type == "date":
            try: date_val = prop_data["date"]["start"]
            except: pass

        elif prop_type == "files":
            try:
                f = prop_data["files"][0]
                if f.get("type") == "external":
                    cover = f["external"]["url"]
                elif f.get("type") == "file":
                    cover = f["file"]["url"]
            except: pass

        elif prop_type == "url":
            try:
                url_val = prop_data.get("url", "")
                if url_val and any(ext in url_val for ext in ("jpg", "png", "jpeg", "webp")):
                    cover = url_val
                elif url_val and any(k in lower_name for k in ("image", "resim", "kapak")):
                    cover = url_val
            except: pass

    # Fallback author
    if author == "Bilinmeyen Yazar":
        for rt in rich_texts:
            if len(rt) < 60:
                author = rt
                break

    return {
        "title":          title,
        "author":         author,
        "status":         status,
        "category":       category,
        "date":           date_val,
        "cover":          cover,
        "notion_page_id": page_id   # ← Makale okuma modalı için
    }


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
def main():
    if not NOTION_TOKEN or not DATABASE_ID:
        raise EnvironmentError("NOTION_TOKEN ve NOTION_DATABASE_ID env değişkenleri gerekli!")

    print("📚 Notion veritabanı sorgulanıyor…")
    pages = fetch_all_database_pages()
    print(f"   {len(pages)} kayıt bulundu.")

    books   = []
    articles = []

    for item in pages:
        entry = parse_page(item)
        books.append(entry)
        if entry["category"].lower() == "makale":
            articles.append(entry)

    # 1) kitaplar.json
    with open("kitaplar.json", "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=2)
    print("✅ kitaplar.json güncellendi.")

    # 2) articles/<page_id>.json for each article
    os.makedirs(ARTICLE_DIR, exist_ok=True)
    print(f"\n📄 {len(articles)} makale için blok içeriği çekiliyor…")

    for art in articles:
        pid = art["notion_page_id"]
        if not pid:
            continue

        print(f"   ↳ {art['title'][:50]!r} ({pid[:8]}…)")
        blocks = fetch_all_blocks(pid)

        def shrink_blocks(block_list):
            out = []
            for b in block_list:
                slim = {"type": b["type"], b["type"]: b.get(b["type"], {})}
                if "children" in b:
                    slim["children"] = shrink_blocks(b["children"])
                out.append(slim)
            return out

        slim_blocks = shrink_blocks(blocks)

        out_path = os.path.join(ARTICLE_DIR, f"{pid}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(slim_blocks, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Tamamlandı! {len(articles)} makale → {ARTICLE_DIR}/ klasörüne kaydedildi.")


if __name__ == "__main__":
    main()
