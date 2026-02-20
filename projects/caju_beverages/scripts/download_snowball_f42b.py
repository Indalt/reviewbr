import json
import os
import requests
from pathlib import Path
import time

proj_dir = Path(r"c:\Users\Vicente\prismaid\projects\caju_beverages")
in_file = proj_dir / "03_screening" / "snowball_included.json"
out_dir = proj_dir / "03_screening" / "pdfs"

def get_doi(url_or_doi):
    if not url_or_doi:
        return None
    if url_or_doi.startswith('http'):
        parts = url_or_doi.split('doi.org/')
        if len(parts) > 1:
            return parts[1]
    import re
    match = re.search(r'10\.\d{4,9}/[-._;()/:A-Z0-9]+', str(url_or_doi), re.IGNORECASE)
    if match:
        return match.group(0)
    return None

def download_via_unpaywall(doi, save_path):
    email = "vicente@example.com"
    url = f"https://api.unpaywall.org/v2/{doi}?email={email}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('best_oa_location') and data['best_oa_location'].get('url_for_pdf'):
                pdf_url = data['best_oa_location']['url_for_pdf']
                pdf_resp = requests.get(pdf_url, timeout=15)
                if pdf_resp.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(pdf_resp.content)
                    return True
    except Exception as e:
        print(f"Unpaywall error for {doi}: {e}")
    return False

def main():
    if not in_file.exists():
        print("Input file not found.")
        return

    with open(in_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    os.makedirs(out_dir, exist_ok=True)
    
    success = 0
    total = len(data)
    
    print(f"Attempting to download {total} PDFs...")

    for item in data:
        record = item.get('record', {})
        identifier = record.get('identifier', 'unknown').split('/')[-1]
        raw_url = record.get('url', '')
        doi = get_doi(raw_url)
        
        save_name = f"SNOWBALL_{identifier}.pdf"
        # Sanitize filename
        save_name = "".join([c for c in save_name if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
        save_path = out_dir / save_name

        if save_path.exists():
            print(f"Already exists: {save_name}")
            success += 1
            continue

        print(f"Processing: {record.get('title', 'Unknown')}...")
        if doi:
            print(f"  Attempting DOI: {doi} via Unpaywall...")
            if download_via_unpaywall(doi, save_path):
                print("  -> Downloaded successfully!")
                success += 1
            else:
                print("  -> Failed to find open access PDF.")
        else:
            print("  -> No DOI found.")
        
        time.sleep(1)

    print(f"\nDownload summary: {success}/{total} successful.")

if __name__ == "__main__":
    main()
