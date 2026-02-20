import sys
import json
from Bio import Entrez

# Configure email (required by NCBI)
Entrez.email = "prismaid_user@example.com"  # TODO: Make configurable via env var if needed

def search_pubmed(query, max_results=10):
    """
    Searches PubMed for the given query and returns a list of dictionaries.
    """
    try:
        # 1. Search for IDs
        handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
        record = Entrez.read(handle)
        handle.close()
        
        id_list = record["IdList"]
        
        if not id_list:
            return []

        # 2. Fetch details for these IDs
        handle = Entrez.efetch(db="pubmed", id=id_list, retmode="xml")
        records = Entrez.read(handle)
        handle.close()
        
        results = []
        if 'PubmedArticle' in records:
            for article in records['PubmedArticle']:
                medline = article['MedlineCitation']
                article_data = medline['Article']
                
                # Extract basic fields
                pmid = str(medline['PMID'])
                title = article_data.get('ArticleTitle', '')
                
                # Extract Abstract
                abstract_text = ""
                if 'Abstract' in article_data and 'AbstractText' in article_data['Abstract']:
                    # AbstractText can be a list or string
                    abst_parts = article_data['Abstract']['AbstractText']
                    if isinstance(abst_parts, list):
                        abstract_text = " ".join([str(p) for p in abst_parts])
                    else:
                        abstract_text = str(abst_parts)
                
                # Extract Authors
                creators = []
                if 'AuthorList' in article_data:
                    for author in article_data['AuthorList']:
                        if 'LastName' in author and 'ForeName' in author:
                            creators.append(f"{author['LastName']}, {author['ForeName']}")
                        elif 'LastName' in author:
                            creators.append(author['LastName'])
                            
                # Extract Date (Year)
                date = ""
                if 'Journal' in article_data and 'JournalIssue' in article_data['Journal'] and 'PubDate' in article_data['Journal']['JournalIssue']:
                    pub_date = article_data['Journal']['JournalIssue']['PubDate']
                    if 'Year' in pub_date:
                        date = pub_date['Year']
                    elif 'MedlineDate' in pub_date:
                        date = pub_date['MedlineDate']

                # Build DOI URL if available
                doi = ""
                pdf_url = ""
                if 'ELocationID' in article_data:
                    for eloc in article_data['ELocationID']:
                        if eloc.attributes.get('EIdType') == 'doi':
                            doi = str(eloc)
                            pdf_url = f"https://doi.org/{doi}"
                            break

                results.append({
                    "repositoryId": "pubmed",
                    "repositoryName": "PubMed (via Biopython)",
                    "identifier": pmid,
                    "title": title,
                    "creators": creators,
                    "description": abstract_text,
                    "date": date,
                    "type": "article",
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    "doi": doi,
                    "pdfUrl": pdf_url,
                    "accessMethod": "api"
                })
                
        return results

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Expect JSON input from stdin: {"query": "...", "maxResults": 10}
    try:
        input_data = sys.stdin.read()
        if not input_data:
            # Fallback for manual testing if no input provided
            print(json.dumps({"error": "No input provided provided to stdin"}))
            sys.exit(1)
            
        params = json.loads(input_data)
        query = params.get("query", "")
        max_results = params.get("maxResults", 10)
        
        if not query:
             print(json.dumps([]))
        else:
            results = search_pubmed(query, max_results)
            print(json.dumps(results, indent=2))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
