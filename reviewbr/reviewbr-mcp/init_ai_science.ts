import { ProjectInitService } from './src/services/project_init.js';
import { DatabaseService } from './src/services/database.js';

async function run() {
    const initService = new ProjectInitService();
    const dbService = new DatabaseService();

    // 1. Register in DB
    const projectId = await initService.register({
        name: "ai_in_science",
        userId: "vicente",
        researchType: "systematic_review",
        topic: "Artificial Intelligence in Science",
        pico: {
            population: "Scientific Research, Academics, Researchers, Universities",
            intervention: "Artificial Intelligence, Machine Learning, Deep Learning, Generative AI, LLMs",
            comparison: "Traditional research methods, No AI assistance",
            outcome: "Efficiency, Accuracy, Scientific Discovery, Publication Rates, Methodological changes"
        },
        dateRestriction: {
            minDate: "2015-01-01",
            maxDate: "2026-12-31"
        },
        languages: ["en", "pt", "es"],
        registrationRequired: false,
        blinding: "single_blind",
        hasMetaAnalysis: false,
        screeningMethod: "llm_generative"
    }, dbService);

    console.log(`Registered with ID: ${projectId}`);

    // 2. Build directories and Protocol
    const result = await initService.initializeWorkspace(projectId, "projects", dbService);
    console.log(result);
}

run().catch(console.error);
