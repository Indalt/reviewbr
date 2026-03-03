import sys
import argparse
import os
import requests
from bs4 import BeautifulSoup
import urllib.parse
import urllib3

# Disable SSL warnings if we need to hit sketchy mirrors
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_scihub_pdf(doi: str, output_dir: str):
    print(f"==================================================")
    print(f"[Local Plugin: Sci-Hub] Iniciando extração oculta...")
    print(f"DOI: {doi}")
    print(f"Destino: {output_dir}")
    print(f"==================================================")
    
    # Active Sci-Hub mirrors
    mirrors = ["https://sci-hub.se", "https://sci-hub.st", "https://sci-hub.ru"]
    pdf_url = None
    
    for mirror in mirrors:
        url = f"{mirror}/{doi}"
        print(f"-> Tentando espelho: {url}")
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            }
            resp = requests.get(url, headers=headers, timeout=15, verify=False)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                
                # Try finding the <embed type="application/pdf">
                embed = soup.find('embed', type='application/pdf')
                if embed and embed.has_attr('src'):
                    pdf_url = embed['src']
                else:
                    # Sometimes it's inside an iframe
                    iframe = soup.find('iframe', id='pdf')
                    if iframe and iframe.has_attr('src'):
                        pdf_url = iframe['src']
                
                if pdf_url:
                    if pdf_url.startswith('//'):
                        pdf_url = 'https:' + pdf_url
                    elif pdf_url.startswith('/'):
                        pdf_url = mirror + pdf_url
                    print(f"   [+] Link do PDF localizado: {pdf_url}")
                    break
                     
        except Exception as e:
            print(f"   [-] Erro no espelho {mirror}: {e}")
            
    if not pdf_url:
        print("❌ Falha crítica: Não foi possível localizar o PDF na rede Sci-Hub para este DOI.")
        sys.exit(1)
        
    print(f"-> Efetuando o download stealth do PDF...")
    try:
        # Stream the download to handle large PDFs without spiking RAM
        pdf_resp = requests.get(pdf_url, headers=headers, stream=True, timeout=30, verify=False)
        if pdf_resp.status_code == 200:
            safe_doi = doi.replace('/', '_').replace(':', '_')
            out_path = os.path.join(output_dir, f"{safe_doi}.pdf")
            with open(out_path, 'wb') as f:
                for chunk in pdf_resp.iter_content(chunk_size=4096):
                    if chunk:
                        f.write(chunk)
            print(f"✅ Sucesso Absoluto: PDF resgatado com sucesso em {out_path}")
        else:
            print(f"❌ Falha no donwload do arquivo. Status Code: {pdf_resp.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Erro processando a conexão do arquivo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plugin Privado de Extração do Sci-Hub (BYOS)")
    parser.add_argument("--doi", required=True, help="O DOI estruturado do artigo alvo")
    parser.add_argument("--out", default=".", help="Pasta de destino local para salvar o PDF contornando o paywall")
    args = parser.parse_args()
    
    os.makedirs(args.out, exist_ok=True)
    fetch_scihub_pdf(args.doi, args.out)
