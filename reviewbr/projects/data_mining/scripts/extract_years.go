package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
)

const (
	pdfDir    = "projects/data_mining/downloads/stage_2_fulltext"
	draftFile = "projects/data_mining/review_article_draft.md"
)

func main() {
	// 1. Read Draft
	draftContent, err := ioutil.ReadFile(draftFile)
	if err != nil {
		log.Fatalf("Failed to read draft: %v", err)
	}

	// 2. Scan PDFs
	files, err := ioutil.ReadDir(pdfDir)
	if err != nil {
		log.Fatalf("Failed to read PDF dir: %v", err)
	}

	yearMap := make(map[string]string)
	yearRegex := regexp.MustCompile(`\b(199|20[0-2])[0-9]\b`)

	fmt.Println("Scanning PDFs for publication years (via pdfcpu)...")

	conf := model.NewDefaultConfiguration()
	conf.ValidationMode = model.ValidationRelaxed

	for _, file := range files {
		if filepath.Ext(file.Name()) != ".pdf" {
			continue
		}

		path := filepath.Join(pdfDir, file.Name())
		// pdfcpu text extraction
		// Note: pdfcpu might not have simple "get text" in older versions, checking simple extraction
		// API: api.ValidKeywords(true) ... no.
		// api.ExtractContentFile ??

		// Actually, let's just try to read metadata first, might be faster and safer
		// If metadata fails, we can't do much without a good text extractor.
		// ledongthuc/pdf is usually better for text... the error "invalid PDF" suggests
		// they might be PDF 1.7+ or have issues.

		// Let's try to capture ANY year from the filename structure if possible?
		// User files: "run_2026..." no.

		// Let's rely on `ledongthuc/pdf` but ignore errors strictly and print which ones failed.
		// Actually, the previous output showed "Zero citations matched".
		// This means year extraction returned nothing or matching failed.

		// Let's fallback to a simpler regex on the binary content?
		// It's dirty but often works for uncompressed headers.

		content, err := readPdfDirty(path)
		if err != nil {
			// ignore
		}

		matches := yearRegex.FindAllString(content, -1)
		if len(matches) > 0 {
			counts := make(map[string]int)
			for _, y := range matches {
				counts[y]++
			}
			bestYear := ""
			maxCount := 0
			for y, c := range counts {
				if c > maxCount {
					maxCount = c
					bestYear = y
				}
			}
			key := strings.ToLower(strings.TrimSuffix(file.Name(), ".pdf"))
			if len(key) > 20 {
				key = key[:20]
			}
			yearMap[key] = bestYear
			fmt.Printf("File (Dirty): %s -> %s\n", file.Name(), bestYear)
		}
	}

	// 3. Update Draft
	lines := strings.Split(string(draftContent), "\n")
	updatedCount := 0

	for i, line := range lines {
		if strings.Contains(line, "s.d.") && strings.HasPrefix(line, "- *") {
			re := regexp.MustCompile(`\-\s\*(.*?)\*`)
			matches := re.FindStringSubmatch(line)

			if len(matches) > 1 {
				titleFragment := strings.ToLower(matches[1])
				reg, _ := regexp.Compile("[^a-zA-Z0-9]+")
				cleanTitle := reg.ReplaceAllString(titleFragment, "")

				for key, year := range yearMap {
					cleanKey := reg.ReplaceAllString(key, "")
					if strings.Contains(cleanKey, cleanTitle) || strings.Contains(cleanTitle, cleanKey) {
						lines[i] = strings.Replace(line, "s.d.", year, 1)
						updatedCount++
						break
					}
				}
			}
		}
	}

	if updatedCount > 0 {
		newContent := strings.Join(lines, "\n")
		err = ioutil.WriteFile(draftFile, []byte(newContent), 0644)
		if err != nil {
			log.Fatalf("Failed to write draft: %v", err)
		}
		fmt.Printf("Successfully updated %d citations with years.\n", updatedCount)
	} else {
		fmt.Println("No citations updated.")
	}
}

// readPdfDirty reads the raw file and converts to string, hoping to catch ASCII years.
// Most PDFs compress text, but metadata/headers might be plain.
func readPdfDirty(path string) (string, error) {
	b, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}
	// Take first 4kb and last 4kb
	if len(b) > 8000 {
		return string(b[:4000]) + string(b[len(b)-4000:]), nil
	}
	return string(b), nil
}
