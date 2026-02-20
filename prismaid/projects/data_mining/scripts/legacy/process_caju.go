package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// === Configuration & Structs ===

type Config struct {
	Filters struct {
		LLM []map[string]interface{} `toml:"llm"`
	} `toml:"filters"`
}

type Article struct {
	RepoID        string   `json:"repo_id"`
	RepoName      string   `json:"repo_name"`
	Title         string   `json:"title"`
	URL           string   `json:"url"`
	DOI           *string  `json:"doi"`
	PDFURL        *string  `json:"pdf_url"`
	PublishedDate string   `json:"published_date"`
	Type          string   `json:"type"`
	Creators      []string `json:"creators"`
}

type ArticleCollection struct {
	Results []Article `json:"results"`
}

// === Logic ===

func main() {
	// 1. Setup & Paths
	baseDir := "."
	jsonPath := filepath.Join(baseDir, "projects/buscas/caju.json")
	downloadDir := filepath.Join(baseDir, "projects/data_mining/downloads/caju")
	reportPath := filepath.Join(downloadDir, "download_report.md")

	if err := os.MkdirAll(downloadDir, 0755); err != nil {
		log.Fatal(err)
	}

	// 2. Load Config (Deleted)
	// var config Config
	// ... code removed ...

	// 3. Load JSON
	data, err := os.ReadFile(jsonPath)
	if err != nil {
		log.Fatalf("Failed to read JSON: %v", err)
	}
	var collection ArticleCollection
	if err := json.Unmarshal(data, &collection); err != nil {
		log.Fatalf("Failed to parse JSON: %v", err)
	}

	fmt.Printf("Loaded %d articles. Starting processing...\n", len(collection.Results))

	// 4. Processing Loop
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 5) // Concurrency limit

	downloadedCount := 0
	failedCount := 0
	filteredDateCount := 0
	filteredTopicCount := 0

	// Thread-safe reporting
	var mu sync.Mutex
	failures := []string{}

	yearRegex := regexp.MustCompile(`\d{4}`)

	for _, article := range collection.Results {
		wg.Add(1)
		go func(a Article) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Step 1: Date Filter (2015-2025)
			year := extractYear(a.PublishedDate, yearRegex)
			// Allow year 0 (unknown) to avoid dropping data due to missing metadata
			if year != 0 && (year < 2015 || year > 2025) {
				mu.Lock()
				filteredDateCount++
				mu.Unlock()
				return
			}

			// Step 2: Topic Filter (Heuristic)
			isRelevant := screenTitle(a.Title)
			if !isRelevant {
				mu.Lock()
				filteredTopicCount++
				mu.Unlock()
				return
			}

			// Step 3: Download
			fileName := sanitizeFilename(a.Title) + ".pdf"
			filePath := filepath.Join(downloadDir, fileName)

			// Skip if exists
			if _, err := os.Stat(filePath); err == nil {
				fmt.Printf("Exists: %s\n", fileName)
				mu.Lock()
				downloadedCount++
				mu.Unlock()
				return
			}

			success := tryDownload(a, filePath)
			mu.Lock()
			if success {
				downloadedCount++
				fmt.Printf("Downloaded: %s\n", fileName)
			} else {
				failedCount++
				link := a.URL
				if a.PDFURL != nil {
					link = *a.PDFURL
				}
				failures = append(failures, fmt.Sprintf("| %s | %s | %s |", a.Title, a.RepoName, link))
				fmt.Printf("Failed: %s\n", fileName)
			}
			mu.Unlock()
		}(article)
	}

	wg.Wait()

	// 5. Generate Report
	reportContent := fmt.Sprintf("# Relatório de Download: Caju (2015-2025)\n\n")
	reportContent += fmt.Sprintf("**Total Processado:** %d\n", len(collection.Results))
	reportContent += fmt.Sprintf("**Filtrado por Data (<2015 ou >2025):** %d\n", filteredDateCount)
	reportContent += fmt.Sprintf("**Filtrado por Tema (Não é planta/fruto):** %d\n", filteredTopicCount)
	reportContent += fmt.Sprintf("**Baixados com Sucesso:** %d\n", downloadedCount)
	reportContent += fmt.Sprintf("**Falha no Download:** %d\n\n", failedCount)

	reportContent += "## Falhas de Download\n\n"
	reportContent += "| Título | Repositório | Link Tentado |\n"
	reportContent += "|---|---|---|\n"
	for _, f := range failures {
		reportContent += f + "\n"
	}

	if err := os.WriteFile(reportPath, []byte(reportContent), 0644); err != nil {
		log.Printf("Failed to write report: %v", err)
	}
	fmt.Printf("\nProcessing complete. Report saved to %s\n", reportPath)
}

// === Helpers ===

func extractYear(dateStr string, re *regexp.Regexp) int {
	matches := re.FindString(dateStr)
	if matches == "" {
		return 0 // Unknown date, maybe keep? User said 2015-2025. If unknown, skip or keep? Let's skip to be safe.
	}
	y, _ := strconv.Atoi(matches)
	return y
}

func screenTitle(title string) bool {
	titleLower := strings.ToLower(title)

	// 1. Blocklist (Explicit irrelevance)
	blocklist := []string{
		"tv caju", "rua caju", "bairro caju", "beco do caju",
		"sobrenome", "apelido", "caju e castanha", // music duo
		"travessa caju",
	}
	for _, block := range blocklist {
		if strings.Contains(titleLower, block) {
			return false
		}
	}

	// 2. Allowlist (Explicit relevance to plant/product)
	allowlist := []string{
		"anacardium", "occidentale", "cajueiro", "pedúnculo",
		"pseudofruto", "castanha", "amêndoa", "suco", "polpa",
		"cajucultura", "agronegócio", "agroindústria", "colheita",
		"plantio", "clones", "genótipo", "fenótipo", "nutricional",
		"físico-química", "antioxidante", "óleo", "resíduo", "biomassa",
		"LCC", "líquido da casca", "doenças", "pragas", "fungo",
		"adubação", "produção", "safra",
	}

	// If title contains "caju" (which is the query, so mostly yes), check context
	// If generic "caju", check if it implies the fruit.
	// Actually, since search query was "caju", most results ARE about caju.
	// We just need to filter the obvious noise.

	// If it hits the allowlist, it's definitely IN.
	for _, allow := range allowlist {
		if strings.Contains(titleLower, allow) {
			return true
		}
	}

	// 3. Fallback: If it contains "caju" and NOT in blocklist, assume relevance
	// (unless it's too ambiguous, but for now strict blocklist is safer to avoid false negatives)
	if strings.Contains(titleLower, "caju") {
		return true
	}

	return false
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func tryDownload(a Article, destPath string) bool {
	url := a.URL
	if a.PDFURL != nil && *a.PDFURL != "" {
		url = *a.PDFURL
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	// Helper to fetch and save
	doFetch := func(targetUrl string) bool {
		resp, err := client.Get(targetUrl)
		if err != nil {
			return false
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return false
		}

		// Check Content-Type
		ct := resp.Header.Get("Content-Type")
		if strings.Contains(ct, "application/pdf") {
			out, err := os.Create(destPath)
			if err != nil {
				return false
			}
			defer out.Close()
			_, err = io.Copy(out, resp.Body)
			return err == nil
		}

		// If HTML, try to finding meta citation_pdf_url
		if strings.Contains(ct, "text/html") {
			doc, err := goquery.NewDocumentFromReader(resp.Body)
			if err != nil {
				return false
			}
			pdfLink, exists := doc.Find(`meta[name="citation_pdf_url"]`).Attr("content")
			if exists && pdfLink != "" && pdfLink != targetUrl {
				return tryDownloadDirect(pdfLink, destPath, client)
			}
		}

		return false
	}

	return doFetch(url)
}

func tryDownloadDirect(url string, destPath string, client *http.Client) bool {
	resp, err := client.Get(url)
	if err != nil || resp.StatusCode != 200 {
		return false
	}
	defer resp.Body.Close()

	out, err := os.Create(destPath)
	if err != nil {
		return false
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	return err == nil
}

func sanitizeFilename(name string) string {
	reg, _ := regexp.Compile("[^a-zA-Z0-9]+")
	return reg.ReplaceAllString(name, "_")
}
