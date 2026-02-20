package main

import (
	"crypto/tls"
	"encoding/csv"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// Search terms for Sprint X
var searchTerms = []string{
	"bebida",
	"bebida alcoolica",
	"bebida fermentada",
	"etnoalcoologia",
	"etnobotanica",
	"antropologia da alimentacao",
	"sociobiologia da alimentacao",
}

type Repository struct {
	ID   string
	Name string
	URL  string
}

type Result struct {
	RepoID      string
	RepoName    string
	Query       string
	Title       string
	Link        string
	CollectedAt string
}

func main() {
	startIdx := flag.Int("start", 0, "Start index in the CSV (0-based)")
	limit := flag.Int("limit", 2, "Number of repositories to process")
	inputFile := flag.String("input", "projects/data_mining/master_register/repositorios_brasileiros.csv", "Path to input CSV")
	outputFile := flag.String("output", "projects/data_mining/sprint_x_candidates_direct_new_terms.csv", "Path to output CSV")
	flag.Parse()

	// 1. Read Repositories
	repos, err := readRepositories(*inputFile)
	if err != nil {
		log.Fatalf("Error reading CSV: %v", err)
	}

	// 2. Filter Batch
	endIdx := *startIdx + *limit
	if endIdx > len(repos) {
		endIdx = len(repos)
	}
	if *startIdx >= len(repos) {
		log.Fatalf("Start index %d out of bounds (Total: %d)", *startIdx, len(repos))
	}

	batch := repos[*startIdx:endIdx]
	fmt.Printf("Processing %d repositories (Index %d to %d)...\n", len(batch), *startIdx, endIdx)

	var results []Result

	// 3. Process Batch
	for _, repo := range batch {
		fmt.Printf("Scanning Repo: %s (%s)\n", repo.Name, repo.URL)

		for _, term := range searchTerms {
			fmt.Printf("  Querying: %s... ", term)

			// Try variants of DSpace search URLs
			hits, err := searchDSpace(repo, term, "/discover")
			if err != nil || len(hits) == 0 {
				hits, err = searchDSpace(repo, term, "/simple-search")
			}
			// Some use /jspui/simple-search or /xmlui/simple-search if the base is root
			if err != nil || len(hits) == 0 {
				hits, err = searchDSpace(repo, term, "/jspui/simple-search")
			}
			if err != nil || len(hits) == 0 {
				hits, err = searchDSpace(repo, term, "/xmlui/simple-search")
			}

			if err != nil {
				fmt.Printf("Failed: %v\n", err)
				continue
			}

			fmt.Printf("Found: %d\n", len(hits))
			results = append(results, hits...)

			time.Sleep(1 * time.Second) // Polite delay
		}
	}

	// 4. Write Results
	if err := writeResults(*outputFile, results); err != nil {
		log.Fatalf("Error writing output: %v", err)
	}

	fmt.Println("Done. Results saved to", *outputFile)
}

func readRepositories(path string) ([]Repository, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	var repos []Repository
	for i := 1; i < len(records); i++ {
		row := records[i]
		if len(row) < 10 {
			continue
		}
		u := strings.TrimSpace(row[9])
		if u == "" {
			continue
		}
		// Ensure URL ends with / if not present, to append paths correctly
		if !strings.HasSuffix(u, "/") {
			u += "/"
		}

		// Fix for UFF and others that might have double slashes if concatenated blindly,
		// but Go's URL parser handles it mostly.
		// Actually, let's keep it simple.

		repos = append(repos, Repository{
			ID:   row[0],
			Name: row[8],
			URL:  u,
		})
	}
	return repos, nil
}

func searchDSpace(repo Repository, term string, endpoint string) ([]Result, error) {
	// Construct URL
	// If repo.URL already has a path (e.g. /riuff/), ensure we don't double slash if endpoint adds one,
	// but simple concatenation usually works if strict.
	// But let's be careful.
	targetURL := strings.TrimRight(repo.URL, "/") + endpoint

	params := url.Values{}
	params.Add("query", term)
	params.Add("rpp", "20")
	// Add scope if necessary? usually not for simple search.

	fullURL := fmt.Sprintf("%s?%s", targetURL, params.Encode())

	// HTTP Client with Insecure Skip and User Agent
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr, Timeout: 30 * time.Second}

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}

	var results []Result
	seenLinks := make(map[string]bool)

	// Heuristic: Find specific Item Links (containing /handle/)
	// This works for DSpace.
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}

		// Must contain /handle/
		if !strings.Contains(href, "/handle/") {
			return
		}

		// Filter out functional links (facets, sorting, exports)
		if strings.Contains(href, "?") || strings.Contains(href, "sort_by") || strings.Contains(href, "filtername") {
			return
		}

		// Filter out "collection" or "community" handles if possible?
		// Usually /handle/123/456 is an item.
		// Sometimes /handle/123/0 (community).
		// Let's accept all handles for now, title will tell.

		title := strings.TrimSpace(s.Text())
		if title == "" {
			return
		}

		// Resolve relative URL
		finalLink := href
		if strings.HasPrefix(href, "/") {
			// Extract scheme/host from repo.URL
			u, _ := url.Parse(repo.URL)
			finalLink = fmt.Sprintf("%s://%s%s", u.Scheme, u.Host, href)
		} else if !strings.HasPrefix(href, "http") {
			// Relative to current path? rare in DSpace, usually absolute or root-relative
			finalLink = repo.URL + href
		}

		// Deduplicate
		if seenLinks[finalLink] {
			return
		}
		seenLinks[finalLink] = true

		results = append(results, Result{
			RepoID:      repo.ID,
			RepoName:    repo.Name,
			Query:       term,
			Title:       title,
			Link:        finalLink,
			CollectedAt: time.Now().Format(time.RFC3339),
		})
	})

	return results, nil
}

func writeResults(path string, results []Result) error {
	var f *os.File
	var err error

	// Append if exists
	_, statErr := os.Stat(path)
	if statErr == nil {
		f, err = os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0644)
	} else {
		f, err = os.Create(path)
	}

	if err != nil {
		return err
	}
	defer f.Close()

	w := csv.NewWriter(f)
	defer w.Flush()

	// Write header only if new file
	stat, _ := f.Stat()
	if stat.Size() == 0 {
		w.Write([]string{"repo_id", "repo_name", "query", "title", "link", "collected_at"})
	}

	for _, r := range results {
		w.Write([]string{r.RepoID, r.RepoName, r.Query, r.Title, r.Link, r.CollectedAt})
	}

	return nil
}
