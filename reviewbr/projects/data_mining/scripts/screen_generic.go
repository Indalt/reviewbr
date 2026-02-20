package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/ledongthuc/pdf"
)

// --- Configuration Structs ---

type Config struct {
	Project struct {
		Name string `toml:"name"`
	} `toml:"project"`
	Filters struct {
		LLM []map[string]interface{} `toml:"llm"`
	} `toml:"filters"`
	Screening struct {
		Criteria       string `toml:"criteria"`
		PromptTemplate string `toml:"prompt_template"`
	} `toml:"screening"`
}

type LLMResponse struct {
	RelevanceScore int    `json:"relevance_score"`
	Decision       string `json:"decision"`
	Reasoning      string `json:"reasoning"`
	Citation       struct {
		Title  string `json:"title"`
		Author string `json:"author"`
	} `json:"most_relevant_citation"`
}

// --- Main ---

func main() {
	configPath := flag.String("config", "projects/data_mining/configs/screening_generic.toml", "Path to TOML config")
	inputDir := flag.String("input", "projects/data_mining/downloads", "Input directory containing PDFs")
	topic := flag.String("topic", "General Research", "Research Topic Description")
	exclusions := flag.String("exclude", "None", "Exclusion Criteria")
	flag.Parse()

	// 1. Load Config (Reduced for heuristic)
	var config Config
	if _, err := toml.DecodeFile(*configPath, &config); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Skip LLM config checks for heuristic mode

	// 2. Setup Directories & Log
	relevantDir := filepath.Join(*inputDir, "relevant")
	irrelevantDir := filepath.Join(*inputDir, "irrelevant")
	os.MkdirAll(relevantDir, 0755)
	os.MkdirAll(irrelevantDir, 0755)

	reportPath := filepath.Join(*inputDir, "screening_report.csv")
	// Open config to check if header is needed (rough check or just check file existence before open)
	fileExisted := false
	if _, err := os.Stat(reportPath); err == nil {
		fileExisted = true
	}

	csvFile, err := os.OpenFile(reportPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}
	defer csvFile.Close()
	writer := csv.NewWriter(csvFile)

	if !fileExisted {
		writer.Write([]string{"Filename", "Score", "Decision", "Reasoning", "MovedTo", "SuggestedCitation"})
	}
	defer writer.Flush()

	// 3. Prepare Template
	tmpl, err := template.New("prompt").Parse(config.Screening.PromptTemplate)
	if err != nil {
		log.Fatalf("Invalid prompt template: %v", err)
	}

	var llmConfig map[string]interface{}
	if len(config.Filters.LLM) > 0 {
		llmConfig = config.Filters.LLM[0]
	} else {
		log.Fatal("No LLM configuration found in valid config file")
	}

	// 4. Process Files
	files, err := os.ReadDir(*inputDir)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("📂 Found %d files in %s\n", len(files), *inputDir)

	fmt.Printf("🔍 Starting Screening for '%s'...\n", *topic)

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(strings.ToLower(file.Name()), ".pdf") {
			continue
		}

		fmt.Printf("📄 Processing: %s... ", file.Name())

		// Check file size (< 30MB)
		fileInfo, _ := file.Info()
		if fileInfo.Size() > 30*1024*1024 {
			fmt.Printf("⚠️ Skipped (Too Large >30MB): %s\n", file.Name())
			continue
		}

		// Extract Text
		content, err := readPDF(filepath.Join(*inputDir, file.Name()))
		if err != nil {
			fmt.Printf("Error reading PDF: %v\n", err)
			continue
		}
		if len(content) > 4000 { // Truncate for token limits
			content = content[:4000]
		}

		// Build Prompt
		var promptBuilder strings.Builder
		data := struct {
			Topic    string
			Criteria string
			Text     string
		}{
			Topic:    *topic,
			Criteria: *exclusions + "\n" + config.Screening.Criteria, // Combine cli args with config defaults
			Text:     content,
		}
		if err := tmpl.Execute(&promptBuilder, data); err != nil {
			fmt.Printf("Template error: %v\n", err)
			continue
		}

		// Call LLM
		response, err := callAlembica(llmConfig, promptBuilder.String())
		if err != nil {
			fmt.Printf("AI Error: %v\n", err)
			continue
		}

		// Decision Logic
		targetDir := irrelevantDir
		if response.Decision == "YES" || response.RelevanceScore >= 70 {
			targetDir = relevantDir
		}

		// Move & Log
		MoveFile(filepath.Join(*inputDir, file.Name()), filepath.Join(targetDir, file.Name()))
		writer.Write([]string{
			file.Name(),
			fmt.Sprintf("%d", response.RelevanceScore),
			response.Decision,
			response.Reasoning,
			filepath.Base(targetDir),
			response.Citation.Title,
		})
		writer.Flush()

		fmt.Printf("[%d] %s -> %s\n", response.RelevanceScore, response.Decision, filepath.Base(targetDir))
	}
	fmt.Println("✅ Screening Complete.")
}

// --- Helpers ---

func callAlembica(config map[string]interface{}, prompt string) (LLMResponse, error) {
	apiKey := getString(config, "api_key")
	model := getString(config, "model")
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	jsonBody, _ := json.Marshal(requestBody)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonBody)))
	if err != nil {
		return LLMResponse{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return LLMResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return LLMResponse{}, fmt.Errorf("API Error: %s", resp.Status)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return LLMResponse{}, err
	}

	// Parse valid response
	candidates, _ := result["candidates"].([]interface{})
	if len(candidates) > 0 {
		candidate := candidates[0].(map[string]interface{})
		content := candidate["content"].(map[string]interface{})
		parts := content["parts"].([]interface{})
		if len(parts) > 0 {
			text := parts[0].(map[string]interface{})["text"].(string)
			// Clean JSON from Markdown block
			text = cleanJSON(text)

			var llmResp LLMResponse
			if err := json.Unmarshal([]byte(text), &llmResp); err != nil {
				// Fallback
				return LLMResponse{Decision: "UNKNOWN", RelevanceScore: 0, Reasoning: text}, nil
			}
			return llmResp, nil
		}
	}

	return LLMResponse{}, fmt.Errorf("empty candidates from AI")
}

func readPDF(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	var b strings.Builder
	total := r.NumPage()

	// Read Page 1 (Abstract/Intro)
	if total >= 1 {
		p := r.Page(1)
		if !p.V.IsNull() {
			t, _ := p.GetPlainText(nil)
			b.WriteString(t)
			b.WriteString("\n...[Skipped Body]...\n")
		}
	}

	// Read Last 2 Pages (References)
	start := total - 1
	if start < 2 {
		start = 2
	}
	for i := start; i <= total; i++ {
		p := r.Page(i)
		if !p.V.IsNull() {
			t, _ := p.GetPlainText(nil)
			b.WriteString(t)
		}
	}

	return b.String(), nil
}

func MoveFile(src, dst string) error {
	// Retry logic
	for i := 0; i < 3; i++ {
		err := os.Rename(src, dst)
		if err == nil {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("failed to move file")
}

func getString(m map[string]interface{}, k string) string {
	if v, ok := m[k].(string); ok {
		return v
	}
	return ""
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
