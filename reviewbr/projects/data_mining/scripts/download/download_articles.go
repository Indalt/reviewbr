package main

import (
	"crypto/tls"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

type Article struct {
	RepoID   string
	RepoName string
	Query    string
	Title    string
	Link     string
}

func main() {
	// Input files
	files := []string{
		"projects/data_mining/sprint_x_candidates_direct.csv",
		"projects/data_mining/sprint_x_candidates_direct_new_terms.csv",
	}

	downloadDir := "projects/data_mining/downloads"
	if err := os.MkdirAll(downloadDir, 0755); err != nil {
		log.Fatalf("Failed to create download dir: %v", err)
	}

	logFile, err := os.Create(filepath.Join(downloadDir, "download_log.csv"))
	if err != nil {
		log.Fatalf("Failed to create log file: %v", err)
	}
	defer logFile.Close()
	logger := csv.NewWriter(logFile)
	logger.Write([]string{"repo_id", "title", "link", "status", "filename", "error"})
	defer logger.Flush()

	client := &http.Client{
		Timeout: 60 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Allow self-signed certs
		},
	}

	processedLinks := make(map[string]bool)

	for _, file := range files {
		fmt.Printf("Processing file: %s\n", file)
		records, err := readCSV(file)
		if err != nil {
			fmt.Printf("Skipping %s: %v\n", file, err)
			continue
		}

		for _, record := range records {
			if processedLinks[record.Link] {
				continue
			}
			processedLinks[record.Link] = true

			fmt.Printf("Checking: %s\n", record.Title)

			// Try to download
			filename, err := downloadPDF(client, record, downloadDir)
			status := "Success"
			errMsg := ""
			if err != nil {
				status = "Failed"
				errMsg = err.Error()
				fmt.Printf("  -> Failed: %v\n", err)
			} else {
				fmt.Printf("  -> Downloaded: %s\n", filename)
			}

			logger.Write([]string{record.RepoID, record.Title, record.Link, status, filename, errMsg})
			logger.Flush()

			time.Sleep(1 * time.Second) // Polite delay
		}
	}
}

func readCSV(path string) ([]Article, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	// Skip header if present (heuristic: check first row)
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	var articles []Article
	for i, row := range rows {
		if i == 0 && strings.ToLower(row[0]) == "repo_id" {
			continue
		}
		if len(row) < 5 {
			continue
		}
		articles = append(articles, Article{
			RepoID:   row[0],
			RepoName: row[1],
			Query:    row[2],
			Title:    row[3],
			Link:     row[4],
		})
	}
	return articles, nil
}

func downloadPDF(client *http.Client, article Article, dir string) (string, error) {
	// 1. Visit the Article Page (Handle URL)
	req, _ := http.NewRequest("GET", article.Link, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}

	// 2. Parse HTML to find PDF link
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", err
	}

	var pdfURL string

	// Strategy A: Citation Meta Tag (High confidence)
	doc.Find("meta[name='citation_pdf_url']").Each(func(i int, s *goquery.Selection) {
		if pdfURL == "" {
			pdfURL, _ = s.Attr("content")
		}
	})

	// Strategy B: Link with .pdf extension or 'bitstream' path
	if pdfURL == "" {
		doc.Find("a").Each(func(i int, s *goquery.Selection) {
			href, exists := s.Attr("href")
			if !exists {
				return
			}
			// Priority to links containing "bitstream" and ending in ".pdf"
			lowerHref := strings.ToLower(href)
			if strings.Contains(lowerHref, "bitstream") && strings.HasSuffix(lowerHref, ".pdf") {
				pdfURL = href
			}
		})
	}

	if pdfURL == "" {
		return "", fmt.Errorf("no PDF link found")
	}

	// Resolve Relative URL
	u, err := url.Parse(pdfURL)
	if err != nil {
		return "", err
	}
	if !u.IsAbs() {
		// Resolve against base URL (article.Link)
		base, _ := url.Parse(article.Link)
		pdfURL = base.ResolveReference(u).String()
	}

	// 3. Download the PDF
	// Sanitize filename
	safeTitle := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, article.Title)
	if len(safeTitle) > 50 {
		safeTitle = safeTitle[:50]
	}

	filename := fmt.Sprintf("%s_%s.pdf", article.RepoID, safeTitle)
	filePath := filepath.Join(dir, filename)

	// Check if already exists
	if _, err := os.Stat(filePath); err == nil {
		return filename, nil // Already downloaded
	}

	pdfReq, _ := http.NewRequest("GET", pdfURL, nil)
	pdfReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

	pdfResp, err := client.Do(pdfReq)
	if err != nil {
		return "", err
	}
	defer pdfResp.Body.Close()

	if pdfResp.StatusCode != 200 {
		return "", fmt.Errorf("pdf status %d", pdfResp.StatusCode)
	}

	out, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	_, err = io.Copy(out, pdfResp.Body)
	if err != nil {
		return "", err
	}

	return filename, nil
}
