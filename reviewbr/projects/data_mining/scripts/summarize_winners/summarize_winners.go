package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/ledongthuc/pdf"
)

// Reuse Config struct loosely or just hardcode for this specific task to be fast
type Config struct {
	Filters struct {
		LLM []map[string]interface{} `toml:"llm"`
	} `toml:"filters"`
}

type LLMResponse struct {
	Summary string `json:"summary"`
}

func main() {
	// Paths
	relevantDir := "projects/data_mining/downloads/stage_2_fulltext/relevant"
	outputFile := "projects/data_mining/summaries_relevant.md"
	configFile := "projects/data_mining/configs/screening_generic.toml"

	// 1. Load Config for API Key
	var config Config
	if _, err := toml.DecodeFile(configFile, &config); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	var llmConfig map[string]interface{}
	if len(config.Filters.LLM) > 0 {
		llmConfig = config.Filters.LLM[0]
	} else {
		log.Fatal("No LLM config found")
	}

	// 2. Open Output File
	fOut, err := os.Create(outputFile)
	if err != nil {
		log.Fatal(err)
	}
	defer fOut.Close()

	fOut.WriteString("# Resumos dos Artigos Relevantes (Anacardium occidentale)\n\n")
	fOut.WriteString(fmt.Sprintf("**Total de Artigos:** 42\n"))
	fOut.WriteString(fmt.Sprintf("**Data:** %s\n\n---\n\n", time.Now().Format("2006-01-02")))

	// 3. Iterate Files
	files, err := os.ReadDir(relevantDir)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Processing %d files from %s...\n", len(files), relevantDir)

	for i, file := range files {
		if file.IsDir() || !strings.HasSuffix(strings.ToLower(file.Name()), ".pdf") {
			continue
		}

		fmt.Printf("[%d/%d] Summarizing: %s... ", i+1, len(files), file.Name())

		// Read PDF
		content, err := readPDF(filepath.Join(relevantDir, file.Name()))
		if err != nil {
			fmt.Printf("Error reading PDF: %v\n", err)
			fOut.WriteString(fmt.Sprintf("## %s\n\n> **Erro de Leitura**: %v\n\n---\n\n", file.Name(), err))
			continue
		}

		// Truncate
		if len(content) > 6000 {
			content = content[:6000]
		}

		// Call LLM
		summary, err := generateSummary(llmConfig, content)
		if err != nil {
			fmt.Printf("AI Error: %v\n", err)
			fOut.WriteString(fmt.Sprintf("## %s\n\n> **Erro da IA**: %v\n\n---\n\n", file.Name(), err))
			continue
		}

		// Write to Markdown
		fOut.WriteString(fmt.Sprintf("## %s\n\n%s\n\n---\n\n", file.Name(), summary))
		fmt.Println("Done.")
	}
	fmt.Println("Summarization Complete.")
}

func generateSummary(config map[string]interface{}, text string) (string, error) {
	prompt := fmt.Sprintf(`
Resuma o seguinte texto acadêmico em Português.
O resumo deve ter NO MÁXIMO 5 linhas.
Foque em: Objetivo, Metodologia Principal e Resultado Chave.
Não use introduções como "Este artigo...", vá direto ao ponto.

Texto:
%s
	`, text)

	apiKey := getString(config, "api_key")
	model := getString(config, "model")
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{"parts": []map[string]interface{}{{"text": prompt}}},
		},
	}
	jsonBody, _ := json.Marshal(requestBody)

	client := &http.Client{Timeout: 60 * time.Second}
	req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonBody)))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("API Status: %s", resp.Status)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	// Parse
	candidates, _ := result["candidates"].([]interface{})
	if len(candidates) > 0 {
		candidate := candidates[0].(map[string]interface{})
		content := candidate["content"].(map[string]interface{})
		parts := content["parts"].([]interface{})
		if len(parts) > 0 {
			return parts[0].(map[string]interface{})["text"].(string), nil
		}
	}
	return "", fmt.Errorf("no content")
}

func readPDF(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	var b strings.Builder
	total := r.NumPage()
	// Read first 2 pages (Abstract + Intro) and last page (Conclusion)
	pagesToRead := []int{1, 2, total}
	for _, pNum := range pagesToRead {
		if pNum > 0 && pNum <= total {
			p := r.Page(pNum)
			if !p.V.IsNull() {
				t, _ := p.GetPlainText(nil)
				b.WriteString(t)
			}
		}
	}
	return b.String(), nil
}

func getString(m map[string]interface{}, k string) string {
	if v, ok := m[k].(string); ok {
		return v
	}
	return ""
}
