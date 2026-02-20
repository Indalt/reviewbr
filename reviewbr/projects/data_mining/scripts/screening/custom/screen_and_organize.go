package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/ledongthuc/pdf"
	"github.com/open-and-sustainable/alembica/definitions"
	"github.com/open-and-sustainable/alembica/extraction"
)

// Config matches the structure of screening_gemini.toml
type Config struct {
	Filters struct {
		LLM []map[string]interface{} `toml:"llm"`
	} `toml:"filters"`
}

func main() {
	// 1. Load Configuration to get Provider/Model details
	configPath := "projects/data_mining/configs/screening_gemini.toml"
	var config Config
	if _, err := toml.DecodeFile(configPath, &config); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if len(config.Filters.LLM) == 0 {
		log.Fatal("No LLM configuration found in " + configPath)
	}
	llmConfig := config.Filters.LLM[0]

	// 2. Setup Directories
	downloadDir := "projects/data_mining/downloads"
	alcoholDir := filepath.Join(downloadDir, "alcohol")
	noAlcoholDir := filepath.Join(downloadDir, "no_alcohol")
	os.MkdirAll(alcoholDir, 0755)
	os.MkdirAll(noAlcoholDir, 0755)

	// 3. Setup Logging
	logFile, err := os.OpenFile(filepath.Join(downloadDir, "screening_actions.csv"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Failed to create log: %v", err)
	}
	defer logFile.Close()
	logger := csv.NewWriter(logFile)
	stat, _ := logFile.Stat()
	if stat.Size() == 0 {
		logger.Write([]string{"filename", "decision", "reason", "moved_to"})
	}
	defer logger.Flush()

	// 4. Process Files
	files, err := os.ReadDir(downloadDir)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Starting screening using Alembica/PrismAId structure...")

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(strings.ToLower(file.Name()), ".pdf") {
			continue
		}

		fmt.Printf("Processing: %s\n", file.Name())

		// Extract text
		content, err := readPDF(filepath.Join(downloadDir, file.Name()))
		if err != nil {
			fmt.Printf("  -> Error reading PDF: %v\n", err)
			continue
		}
		if len(content) > 3000 {
			content = content[:3000]
		}

		// Prepare Prompt
		promptContent := fmt.Sprintf(`Analise o texto abaixo. Responda APENAS com "SIM" ou "NAO".
Este artigo é focado em bebidas alcoólicas (produção, consumo, cultura, mercado)?
Artigos que apenas citam álcool em contextos negativos (acidentes, toxicidade celular, doenças) ou combustíveis (etanol combustível) devem ser "NAO".

TEXTO:
%s`, content)

		// Prepare Alembica Input
		// Map generic map[string]interface{} to definitions.Model logic or manual struct
		// Since we have the map, we can manually build definitions.Model or try to rely on exact keys.
		// Let's build definitions.Model manually from the map to be safe.
		modelDef := definitions.Model{
			Provider: getString(llmConfig, "provider"),
			APIKey:   getString(llmConfig, "api_key"),
			Model:    getString(llmConfig, "model"),
			// Add other fields if necessary
		}

		input := definitions.Input{
			Metadata: definitions.InputMetadata{Version: "1.0", SchemaVersion: "1.0"},
			Models:   []definitions.Model{modelDef},
			Prompts: []definitions.Prompt{
				{
					SequenceID:     "1",
					SequenceNumber: 1,
					PromptContent:  promptContent,
				},
			},
		}

		jsonInput, _ := json.Marshal(input)
		fmt.Printf("DEBUG: Sending JSON to Alembica: %s\n", string(jsonInput))

		// Call Alembica
		resultStr, err := extraction.Extract(string(jsonInput))
		if err != nil {
			fmt.Printf("  -> Alembica Error: %v\n", err)
			time.Sleep(1 * time.Second)
			continue
		}
		fmt.Printf("DEBUG: Received JSON from Alembica: %s\n", resultStr)

		// Parse Output
		var output definitions.Output
		if err := json.Unmarshal([]byte(resultStr), &output); err != nil {
			fmt.Printf("  -> JSON Parse Error: %v\n", err)
			continue
		}

		if len(output.Responses) == 0 || len(output.Responses[0].ModelResponses) == 0 {
			fmt.Println("  -> No response from AI (Empty Responses array)")
			continue
		}

		answer := output.Responses[0].ModelResponses[0]
		answer = strings.TrimSpace(strings.ToUpper(answer))

		// Heuristic to clean up potential extra text (should be just SIM/NAO based on prompt, but safe to check)
		// Usually LLMs might chat a bit.
		decision := "NAO"
		if strings.Contains(answer, "SIM") {
			decision = "SIM"
		}

		fmt.Printf("  -> Result: %s\n", decision)

		// Move File
		targetDir := noAlcoholDir
		if decision == "SIM" {
			targetDir = alcoholDir
		}

		oldPath := filepath.Join(downloadDir, file.Name())
		newPath := filepath.Join(targetDir, file.Name())

		if err := renameWithRetry(oldPath, newPath); err != nil {
			fmt.Printf("  -> Move Error: %v\n", err)
		} else {
			logger.Write([]string{file.Name(), decision, "", targetDir})
			logger.Flush()
		}
	}
}

func readPDF(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	var textBuilder strings.Builder
	pages := r.NumPage()
	if pages > 2 {
		pages = 2
	}
	for i := 1; i <= pages; i++ {
		p := r.Page(i)
		if p.V.IsNull() {
			continue
		}
		text, err := p.GetPlainText(nil)
		if err == nil {
			textBuilder.WriteString(text)
		}
	}
	return textBuilder.String(), nil
}

func renameWithRetry(oldPath, newPath string) error {
	var err error
	for i := 0; i < 3; i++ {
		err = os.Rename(oldPath, newPath)
		if err == nil {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	return err
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
