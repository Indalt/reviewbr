package main

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	downloadDir := "projects/data_mining/downloads"
	outputFile := "projects/data_mining/screening_input.csv"

	// Open existing log to get metadata
	logFile, err := os.Open(filepath.Join(downloadDir, "download_log.csv"))
	if err != nil {
		fmt.Printf("Error opening log: %v\n", err)
		return
	}
	defer logFile.Close()

	reader := csv.NewReader(logFile)
	records, err := reader.ReadAll()
	if err != nil {
		fmt.Printf("Error reading log: %v\n", err)
		return
	}

	// Create output file
	out, err := os.Create(outputFile)
	if err != nil {
		fmt.Printf("Error creating output: %v\n", err)
		return
	}
	defer out.Close()

	writer := csv.NewWriter(out)
	defer writer.Flush()

	// Header: repo_id,title,file_path
	writer.Write([]string{"id", "title", "file_path"})

	cwd, _ := os.Getwd()

	// Skip header of input log
	for i, row := range records {
		if i == 0 {
			continue
		}

		status := row[3]
		filename := row[4]

		if status == "Success" && filename != "" {
			absPath := filepath.Join(cwd, downloadDir, filename)
			writer.Write([]string{row[0], row[1], absPath})
		}
	}

	fmt.Println("Screening input created at:", outputFile)
}
