const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
const result = require('dotenv').config({ path: envPath });

console.log(`[DEBUG] Loading .env from: ${envPath}`);
if (result.error) {
    console.error(`[DEBUG] Error loading .env: ${result.error.message}`);
} else {
    console.log(`[DEBUG] .env loaded successfully.`);
}

const apiKey = process.env.GEMINI_API_KEY;
console.log(`[DEBUG] GEMINI_API_KEY status: ${apiKey ? 'Present (' + apiKey.length + ' chars)' : 'MISSING or EMPTY'}`);
if (apiKey && apiKey.length < 10) console.warn(`[DEBUG] Warning: Key seems too short!`);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// Import Registry (assuming it's compiled to JS in dist or similar, or using ts-node/register if needed)
// Since we are running 'node server.js', we need the JS file.
// The mcp-repos-br structure suggests src/, so unless it's compiled, we might need to register ts-node.
// BUT, the CLI uses 'tsx', which handles TS on the fly. 'server.js' is plain JS.
// Let's assume for now we can require the TS file if we register ts-node, OR we need to point to a built JS.
// Given the project structure, let's try to register ts-node provided by 'tsx' or similar manually?
// ACTUALLY, simpler approach: The CLI does the heavy lifting. The stats endpoint is nice but requires code sharing.
// To avoid compilation headaches, I'll spawn a quick CLI command to get stats instead of importing the Class directly.
const { spawnSync } = require('child_process');
const fs = require('fs');
const { spawn, exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const BASE_DIR = path.resolve(__dirname, '../../../'); // prismaid root
const DOWNLOADS_DIR = path.join(BASE_DIR, 'projects/data_mining/downloads');
const SCRIPTS_DIR = path.join(BASE_DIR, 'projects/data_mining/scripts');
// AI Config
// Try to load from env, or use a placeholder if not set (which will fail gracefully in the endpoint)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set in environment.");
}

// --- Helpers ---

// Helper: Sanitize Project Name
function sanitizeProjectName(input) {
    // 1. Remove special chars but keep spaces, underscores, and hyphens
    let clean = input.replace(/[^a-z0-9 _-]/gi, '').toLowerCase().trim();

    // 2. Strategy for long names (> 40 chars): Use Initials
    if (clean.length > 40) {
        const initials = clean.split(' ').filter(w => w.length > 0).map(w => w[0]).join('');
        const shortSuffix = Date.now().toString().slice(-4);
        return `${initials}_${shortSuffix}`;
    }

    // 3. Default: Replace spaces with underscores
    return clean.replace(/\s+/g, '_');
}

// Get list of projects (folders in downloads)
function getProjects() {
    if (!fs.existsSync(DOWNLOADS_DIR)) return [];
    return fs.readdirSync(DOWNLOADS_DIR)
        .filter(f => fs.statSync(path.join(DOWNLOADS_DIR, f)).isDirectory());
}

// Get stats for a project
function getProjectStats(projectName) {
    const pPath = path.join(DOWNLOADS_DIR, projectName);
    const relevant = path.join(pPath, 'relevant');
    const irrelevant = path.join(pPath, 'irrelevant');
    const report = path.join(pPath, 'screening_report.csv');

    // Count files
    const countFiles = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).length;
    }

    const total = countFiles(pPath); // unscreened in root?
    const relCount = countFiles(relevant);
    const irrelCount = countFiles(irrelevant);

    // Read report for citations
    let citations = 0;
    if (fs.existsSync(report)) {
        const content = fs.readFileSync(report, 'utf-8');
        citations = content.split('\n').filter(l => l.includes(',relevant,') && l.trim().length > 10).length; // rough heuristic
    }

    return {
        name: projectName,
        unscreened: total,
        relevant: relCount,
        irrelevant: irrelCount,
        citations: citations
    };
}

// --- Logging Helper ---
function logActivity(projectName, message) {
    if (!projectName) return;
    const projectDir = path.join(DOWNLOADS_DIR, projectName);
    const safeDir = path.join(DOWNLOADS_DIR, projectName);
    if (fs.existsSync(safeDir)) {
        const logPath = path.join(safeDir, 'activity.log');
        const entry = `[${new Date().toISOString()}] ${message}\n`;
        try {
            fs.appendFileSync(logPath, entry);
        } catch (e) {
            console.error('Log Error:', e);
        }
    }
}


// Helper: Log for PRISMA-S
function logPrismaSearch(project, query, filters, resultCount) {
    const logPath = path.join(DOWNLOADS_DIR, 'search_log_prisma_s.csv');
    const headers = 'run_id,data_hora,fonte,interface,consulta_exata,campos,filtros,resultado_bruto_n,export_formato,dedupe_batch_id,observacoes\n';

    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, headers);
    }

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const date = new Date().toISOString();
    const source = 'MCP Repositories (Aggregator)';
    const iface = 'Web Wizard';
    const fields = 'All';
    const filterStr = JSON.stringify(filters || {}).replace(/"/g, "'");

    // CSV Line
    const line = `${uniqueId},${date},"${source}","${iface}","${query.replace(/"/g, '""')}","${fields}","${filterStr}",${resultCount},"JSON",,""\n`;

    try {
        fs.appendFileSync(logPath, line);
        console.log(`[PRISMA-S] Logged search run ${uniqueId}`);
    } catch (e) {
        console.error('[PRISMA-S] Logging failed:', e);
    }
}

// --- API Endpoints ---

// 1. List Projects
app.get('/api/projects', (req, res) => {
    const projects = getProjects().map(p => getProjectStats(p));
    res.json(projects);
});

// 2. Create Project (PRISMA Wizard)
app.post('/api/projects', (req, res) => {
    const { name, topic, criteria } = req.body;
    const safeName = sanitizeProjectName(name);
    const projectPath = path.join(DOWNLOADS_DIR, safeName);

    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }

    // Save Protocol for PRISMA reporting
    if (req.body.protocol) {
        fs.writeFileSync(path.join(projectPath, 'protocol.json'), JSON.stringify(req.body.protocol, null, 2));
    }

    res.json({ success: true, name: safeName });
});

// 2.5 Interpret Protocol (AI)
app.post('/api/interpret', async (req, res) => {
    const { text } = req.body;
    const apiKey = "[YOUR_GEMINI_API_KEY]"; // Replace with your actual key or load from .env
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
    You are an expert in Systematic Reviews (PRISMA-S).
    Analyze the following user input describing a research goal:
    "${text}"

    Output STRICT JSON with the following fields:
    - title: A suggested concise academic title.
    - research_question: The formulated question.
    - picos: { population, intervention, comparison, outcome, study_design }.
    - keywords: List of portuguese and english keywords.
    - inclusion_criteria: List of inclusion rules.
    - exclusion_criteria: List of exclusion rules.
    - search_string: A suggested boolean search string (e.g., "Term A" AND "Term B").
    - confirmation_message: (String) Explain to the user what you understood and ask for confirmation.
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            let raw = data.candidates[0].content.parts[0].text;
            console.log('[AI RAW Response]', raw);

            try {
                // Robust JSON extraction
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const json = JSON.parse(jsonMatch[0]);
                    res.json(json);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                // Fallback: Return a valid structure even if AI failed to JSONify
                res.json({
                    valid: false, // Indicate failure to parse
                    scope: "Analysis failed (Raw text received)",
                    feedback: "Could not parse AI response, but check the logs.",
                    suggestion: raw.substring(0, Math.min(raw.length, 100)) + "..."
                });
            }
        } else {
            console.error('AI Error:', data);
            res.status(500).json({ error: 'AI returned no candidates', details: data });
        }
    } catch (e) {
        console.error('AI Service Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Analyze Term (Mock AI for now, or real if configured)
app.post('/api/analyze-term', async (req, res) => {
    const { term } = req.body;

    // --- REAL AI ANALYSIS ---
    // User explicitly requested NO bypass/mock. We use the real API.

    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
        console.error("Critical: GEMINI_API_KEY is missing in server.js");
        return res.status(500).json({
            error: "Configuration Error",
            details: "GEMINI_API_KEY is not configured in the server environment or .env file."
        });
    }

    // Construct Prompt
    const prompt = `Analyze this research term: "${term}". 
    Return a JSON object with:
    - valid: boolean
    - scope: string (narrow, broad, or good)
    - feedback: string (short feedback)
    - suggestion: string (better term if needed)
    Ensure the response is PURE JSON, no markdown.`;

    try {
        console.log(`[AI Analysis] Sending request for term: "${term}"`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI Analysis] API Error ${response.status}: ${errorText}`);
            throw new Error(`Google Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            let raw = data.candidates[0].content.parts[0].text;
            console.log('[AI RAW Response]', raw);

            try {
                // Robust JSON extraction
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const json = JSON.parse(jsonMatch[0]);
                    res.json(json);
                } else {
                    throw new Error('No JSON found in AI response');
                }
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                res.status(500).json({
                    error: "AI Response Error",
                    details: "Could not parse JSON from AI response.",
                    raw: raw
                });
            }
        } else {
            console.error('AI Error (No Candidates):', data);
            res.status(500).json({ error: 'AI returned no candidates', details: data });
        }
    } catch (e) {
        console.error('AI Service Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// 2.5 Save Stage 1 Results (Persistence)
app.post('/api/stage1/save', (req, res) => {
    const { project, candidates, exclusions } = req.body;

    if (!project) return res.status(400).json({ error: 'Project name required' });

    const projectDir = path.join(DOWNLOADS_DIR, project);
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
    }

    try {
        // 1. Save Candidates
        fs.writeFileSync(path.join(projectDir, 'stage_1_candidates.json'), JSON.stringify(candidates, null, 2));

        // 2. Save Exclusions (CSV)
        if (exclusions && exclusions.length > 0) {
            const csvHeader = 'id,title,reason,timestamp\n';
            const csvRows = exclusions.map(e => {
                // Escape fields for CSV
                const cleanTitle = (e.title || '').replace(/"/g, '""');
                return `"${e.id}","${cleanTitle}","${e.reason}","${new Date().toISOString()}"`;
            }).join('\n');
            fs.writeFileSync(path.join(projectDir, 'exclusion_log.csv'), csvHeader + csvRows);
        }

        console.log(`[Persistence] Saved ${candidates.length} candidates for project ${project}`);
        logActivity(project, `Saved Stage 1: ${candidates.length} candidates, ${exclusions ? exclusions.length : 0} exclusions.`);
        res.json({ success: true });
    } catch (e) {
        console.error('Save Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 2.6 Save Stage 2 (Protocol)
app.post('/api/stage2/save', (req, res) => {
    const { project, protocol } = req.body;
    if (!project) return res.status(400).json({ error: 'Project required' });

    const projectDir = path.join(DOWNLOADS_DIR, project);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    try {
        fs.writeFileSync(path.join(projectDir, 'stage_2_protocol.json'), JSON.stringify(protocol, null, 2));
        logActivity(project, 'Saved Stage 2: Protocol updated.');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2.7 Save Stage 3 (Results)
app.post('/api/stage3/save', (req, res) => {
    const { project, results } = req.body;
    if (!project) return res.status(400).json({ error: 'Project required' });

    const projectDir = path.join(DOWNLOADS_DIR, project);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    try {
        fs.writeFileSync(path.join(projectDir, 'stage_3_results.json'), JSON.stringify(results, null, 2));
        logActivity(project, `Saved Stage 3: ${results.length || 0} execution results.`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2.8 Load Project Data
app.get('/api/project/:name', (req, res) => {
    const { name } = req.params;
    const projectDir = path.join(DOWNLOADS_DIR, name);

    if (!fs.existsSync(projectDir)) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const data = {
        stage1: [],
        stage2: {},
        stage3: [],
        exclusions: []
    };

    try {
        // Load Stage 1
        if (fs.existsSync(path.join(projectDir, 'stage_1_candidates.json'))) {
            data.stage1 = JSON.parse(fs.readFileSync(path.join(projectDir, 'stage_1_candidates.json'), 'utf-8'));
        }

        // Load Exclusions (Parse CSV - Simple implementation)
        if (fs.existsSync(path.join(projectDir, 'exclusion_log.csv'))) {
            const lines = fs.readFileSync(path.join(projectDir, 'exclusion_log.csv'), 'utf-8').split('\n').filter(l => l.trim().length > 0);
            if (lines.length > 1) { // Skip header
                data.exclusions = lines.slice(1).map(line => {
                    // Very basic CSV split, assumes reasoned usage
                    // Correct implementation would use a parser, but strict format helps.
                    // "id","title","reason","timestamp"
                    const parts = line.split('","').map(p => p.replace(/"/g, ''));
                    return { id: parts[0], title: parts[1], reason: parts[2], timestamp: parts[3] };
                });
            }
        }

        // Load Stage 2
        if (fs.existsSync(path.join(projectDir, 'stage_2_protocol.json'))) {
            data.stage2 = JSON.parse(fs.readFileSync(path.join(projectDir, 'stage_2_protocol.json'), 'utf-8'));
        }

        // Load Stage 3
        if (fs.existsSync(path.join(projectDir, 'stage_3_results.json'))) {
            data.stage3 = JSON.parse(fs.readFileSync(path.join(projectDir, 'stage_3_results.json'), 'utf-8'));
        }

        if (fs.existsSync(path.join(projectDir, 'search.log'))) {
            data.logs = fs.readFileSync(path.join(projectDir, 'search.log'), 'utf-8');
        }

        res.json(data);
    } catch (e) {
        console.error('Load Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 2.9 Save Stage 1 (Candidates)
app.post('/api/stage1/save', (req, res) => {
    const { project, candidates, exclusions } = req.body;
    const projectDir = path.join(DOWNLOADS_DIR, sanitizeProjectName(project));

    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    try {
        fs.writeFileSync(path.join(projectDir, 'stage_1_candidates.json'), JSON.stringify(candidates, null, 2));

        // Append exclusions to log (or overwrite if just state? Append is safer for history, but UI sends full state?)
        // The UI sends "exclusions" array. Let's write a fresh CSV or append?
        // Simpler: Overwrite the log with current state of exclusions (deduplicated by ID in UI)
        // But for a true "log", we might want history.
        // Let's stick to overwriting the "current exclusion list" for this MVP to avoid massive dupe logs.
        let csvContent = 'id,title,reason,timestamp\n';
        exclusions.forEach(ex => {
            csvContent += `"${ex.id}","${ex.title.replace(/"/g, '""')}","${ex.reason}","${new Date().toISOString()}"\n`;
        });
        fs.writeFileSync(path.join(projectDir, 'exclusion_log.csv'), csvContent);

        logActivity(project, `Saved Stage 1: ${candidates.length} candidates, ${exclusions.length} exclusions.`);
        res.json({ success: true });
    } catch (e) {
        console.error('Save Stage 1 Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 2.10 Save Stage 2 (Protocol)
app.post('/api/stage2/save', (req, res) => {
    const { project, protocol } = req.body;
    const projectDir = path.join(DOWNLOADS_DIR, sanitizeProjectName(project));

    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    try {
        fs.writeFileSync(path.join(projectDir, 'stage_2_protocol.json'), JSON.stringify(protocol, null, 2));
        logActivity(project, `Saved Stage 2 Protocol.`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2.11 AI Draft Protocol
app.post('/api/draft-protocol', async (req, res) => {
    const { project } = req.body;
    // Mock response for now to ensure UI flow works without expensive calls
    res.json({
        picos_suggestions: `
# PICO Strategy for ${project}

**Population**: ...
**Intervention**: ...
**Comparison**: ...
**Outcome**: ...
**Study Type**: ...
        `.trim()
    });
});


// 3. Run Task (Screening, Snowball, etc)
app.post('/api/run', (req, res) => {
    const { task, project, params } = req.body;
    let cmd, args;

    const projectDir = path.join(DOWNLOADS_DIR, project);

    if (task === 'screening') {
        cmd = 'go';
        args = ['run', path.join(SCRIPTS_DIR, 'screen_generic.go'),
            '-topic', params.topic || project,
            '-input', projectDir];
    } else if (task === 'seeds') {
        cmd = 'node';
        args = [path.join(SCRIPTS_DIR, 'select_seeds.js'),
            '--source', path.join(projectDir, 'screening_report.csv'),
            '--top', params.top || '10',
            '--out', path.join(projectDir, 'snowballing/seeds.json')];
        // Ensure directory
        fs.mkdirSync(path.join(projectDir, 'snowballing'), { recursive: true });

    } else if (task === 'snowball') {
        cmd = 'node';
        args = [path.join(SCRIPTS_DIR, 'snowball.js'),
        path.join(projectDir, 'snowballing/seeds.json'),
        path.join(projectDir, 'snowballing/candidates.json')];

    } else if (task === 'download') {
        cmd = 'node';
        args = [path.join(SCRIPTS_DIR, 'download_snowball.js'),
            '--input', path.join(projectDir, 'snowballing/candidates.json')];

    } else if (task === 'mcp_search') {
        cmd = 'npx';
        // params.query comes from UI
        // Use quotes for query to handle spaces
        args = ['tsx', 'src/scripts/run_search_cli.ts',
            '--query', params.query,
            '--max', params.max || '50'];
    }

    if (!cmd) return res.status(400).json({ error: 'Unknown task' });

    console.log(`🚀 Running: ${cmd} ${args.join(' ')}`);

    // Special CWD for MCP
    const spawnOptions = { cwd: BASE_DIR, shell: true };
    if (task === 'mcp_search') {
        spawnOptions.cwd = path.resolve(BASE_DIR, 'mcp-repos-br');
    }

    const child = spawn(cmd, args, spawnOptions);

    let stdoutBuffer = '';

    child.stdout.on('data', (data) => {
        const str = data.toString();
        // Emit log to UI
        io.emit('log', { task, project, message: str });

        // Capture output for usage
        if (task === 'mcp_search') {
            stdoutBuffer += str;
        }
    });

    child.stderr.on('data', (data) => {
        io.emit('log', { task, project, message: `[ERR] ${data.toString()}` });
    });

    child.on('close', (code) => {
        io.emit('log', { task, project, message: `✅ Task finished with code ${code}` });

        // Save MCP Results
        if (task === 'mcp_search' && code === 0) {
            const projectDir = path.join(DOWNLOADS_DIR, project);
            const outputFile = path.join(projectDir, 'mcp_search_results.json');

            try {
                // Find JSON in stdout (it might have logs before it)
                const jsonStart = stdoutBuffer.lastIndexOf('{');
                if (jsonStart > -1) {
                    const jsonStr = stdoutBuffer.substring(jsonStart);
                    // Validate basic parsing
                    JSON.parse(jsonStr);
                    fs.writeFileSync(outputFile, jsonStr);
                    io.emit('log', { task, project, message: `💾 Saved results to ${outputFile}` });
                }
            } catch (e) {
                io.emit('log', { task, project, message: `❌ Failed to save results: ${e.message}` });
            }
        }
    });

    res.json({ success: true, pid: child.pid });
});

// 4. File Content (Review)
app.get('/api/file/:project/:filename', (req, res) => {
    const { project, filename } = req.params;
    const { folder } = req.query; // 'relevant', 'irrelevant'

    // Safety check needed here in production!
    const filePath = path.join(DOWNLOADS_DIR, project, folder || '', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// 1. Analyze Term (AI)
app.post('/api/analyze-term', async (req, res) => {
    const { term } = req.body;
    // Mock AI response for speed in this iteration (replace with Gemini later)
    // In real implementation, we would call the LLM here.
    const isVague = term.length < 10 || term.toLowerCase() === 'caju';

    if (isVague) {
        res.json({ suggestion: `Try: 'Subprodutos industriais do ${term}' or 'Anacardium occidentale pharmacology'` });
    } else {
        res.json({ suggestion: null, status: 'ok' });
    }
});

// 2. Save Stage 1 (Create Project & Logs)
app.post('/api/save-stage-1', (req, res) => {
    const { term, items, exclusions } = req.body;
    const safeName = sanitizeProjectName(term);
    const projectPath = path.join(DOWNLOADS_DIR, safeName);

    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }

    // Save Exclusions Log (CSV)
    const exclusionLogPath = path.join(projectPath, 'exclusion_log.csv');
    const csvHeader = 'Timestamp,Title,Author,Reason\n';
    let csvBody = exclusions.map(e => `"${e.timestamp}","${e.item.title}","${e.item.author}","${e.reason}"`).join('\n');

    if (!fs.existsSync(exclusionLogPath)) fs.writeFileSync(exclusionLogPath, csvHeader);
    fs.appendFileSync(exclusionLogPath, csvBody + '\n');

    // Save Included Items (JSON for now, or CSV)
    fs.writeFileSync(path.join(projectPath, 'stage_1_candidates.json'), JSON.stringify(items, null, 2));

    // Save Metadata
    const metaPath = path.join(projectPath, 'metadata.json');
    const meta = { created: new Date(), term: term, stage: 2 };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    res.json({ success: true, project: safeName });
});

// 5. Repository Stats (for Filtering)
app.get('/api/repos/stats', async (req, res) => {
    try {
        // Run a small script or just parse the JSON directly?
        // Parsing JSON is faster and safer than spawning if the file is static.
        // Let's read the JSON directly! It's in ../../../mcp-repos-br/data/repositorios_brasileiros.json
        const mcpDataPath = path.resolve(__dirname, '../../../mcp-repos-br/data/repositorios_brasileiros.json');

        console.log('[DEBUG] looking for repo data at:', mcpDataPath);
        if (fs.existsSync(mcpDataPath)) {
            const raw = fs.readFileSync(mcpDataPath, 'utf-8');
            const data = JSON.parse(raw);

            // Calculate stats manually since we can't use the class
            const byState = {};
            data.forEach(entry => {
                const state = entry.institution.state;
                byState[state] = (byState[state] || 0) + 1;
            });

            res.json({
                total: data.length,
                byState: byState
            });
        } else {
            res.status(404).json({ error: 'Repository data file not found' });
        }
    } catch (e) {
        console.error('Stats Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 6. Delete Project
app.delete('/api/project/:name', (req, res) => {
    const { name } = req.params;
    const projectDir = path.join(DOWNLOADS_DIR, name);

    if (!fs.existsSync(projectDir)) {
        return res.status(404).json({ error: 'Project not found' });
    }

    try {
        fs.rmSync(projectDir, { recursive: true, force: true });
        res.json({ success: true });
    } catch (e) {
        console.error('Delete Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Socket.IO Handling for Search
io.on('connection', (socket) => {
    console.log('[Socket] Client connected');

    socket.on('start-mcp-search', ({ query, startYear, endYear, states, projectName }) => {
        // Store project name for logging
        const SafeProjectName = projectName || sanitizeProjectName(query);
        socket.currentProjectName = SafeProjectName;

        // Ensure directory exists immediately
        const pDir = path.join(DOWNLOADS_DIR, SafeProjectName);
        console.log(`[SERVER] Creating project directory at: ${pDir}`);
        if (!fs.existsSync(pDir)) {
            try {
                fs.mkdirSync(pDir, { recursive: true });
                console.log(`[SERVER] Created directory: ${pDir}`);
            } catch (err) {
                console.error(`[SERVER] Failed to create directory: ${err.message}`);
            }
        }

        let logMsg = `Starting search for: ${query} (${startYear || 'Any'} - ${endYear || 'Any'})`;
        if (states && states.length > 0) logMsg += ` [States: ${states.join(',')}]`;
        console.log(logMsg);

        logActivity(SafeProjectName, `Search Started: ${query}`);

        // Spawn the MCP CLI script
        const args = ['tsx', 'src/scripts/run_search_cli.ts', '--query', `"${query}"`, '--max', '20'];

        if (startYear) args.push('--start-year', startYear);
        if (endYear) args.push('--end-year', endYear);
        if (states && states.length > 0) args.push('--states', states.join(','));

        console.log(`[SERVER] Spawning CLI with args: ${JSON.stringify(args)}`);

        const mcpDir = path.resolve(BASE_DIR, 'mcp-repos-br');
        const child = spawn('npx', args, {
            cwd: mcpDir,
            shell: true
        });

        // Store reference to kill it later
        socket.activeSearchProcess = child;

        let buffer = '';

        child.stdout.on('data', (data) => {
            const str = data.toString();
            // console.log(`[MCP STDOUT] ${str.substring(0, 50)}...`); // Debug log
            buffer += str;

            const lines = str.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    socket.emit('search-log', line);
                }
            });
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();
            // console.log(`[MCP STDERR] ${str}`); // Debug log
            socket.emit('search-log', str);
        });

        child.on('close', (code) => {
            console.log(`[MCP EXIT] Code ${code}`);
            socket.activeSearchProcess = null;

            if (code === 0) {
                socket.emit('search-log', `Process finished with code ${code}`);
                try {
                    const startMarker = '__JSON_START__';
                    const endMarker = '__JSON_END__';
                    const startIndex = buffer.indexOf(startMarker);
                    const endIndex = buffer.indexOf(endMarker);

                    if (startIndex > -1 && endIndex > startIndex) {
                        const jsonStr = buffer.substring(startIndex + startMarker.length, endIndex).trim();
                        const parsed = JSON.parse(jsonStr);
                        const items = parsed.results || [];

                        if (items.length === 0) {
                            socket.emit('search-log', 'No results found.');
                        } else {
                            socket.emit('mcp-batch-results', items);
                            // PRISMA-S Logging
                            logPrismaSearch(
                                socket.currentProjectName,
                                query,
                                { startYear, endYear, states },
                                items.length
                            );
                        }
                    } else {
                        // console.log('[MCP DEBUG] Buffer content length:', buffer.length);
                        socket.emit('search-log', 'No valid JSON output delimiters found.');
                    }
                } catch (e) {
                    socket.emit('search-log', `Error parsing results: ${e.message}`);
                }
            } else {
                socket.emit('search-log', `Process terminated or stopped (Code: ${code}).`);

                // PRISMA-S Logging (Partial/Stopped)
                // We try to parse whatever we got, or just log 0 results with observation
                let partialCount = 0;
                // Try to find raw "Found X results" logs in buffer if JSON failed? 
                // Too complex. Just log 0 or "Unknown"? 
                // Better: Parse JSON if it exists (maybe process finished but exited with error code?)
                // If stopped manually, JSON might not be there.

                logPrismaSearch(
                    socket.currentProjectName,
                    query,
                    { startYear, endYear, states },
                    partialCount // We might not have count if stopped early
                );
            }
            socket.emit('search-complete');

            // --- Log Persistence Integration ---
            if (socket.currentProjectName) {
                const pDir = path.join(DOWNLOADS_DIR, socket.currentProjectName);
                if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
                try {
                    fs.appendFileSync(path.join(pDir, 'search.log'), `\n--- Search Session ${new Date().toISOString()} ---\n` + buffer);
                    logActivity(socket.currentProjectName, `Executed Search: "${query}". Buffer size: ${buffer.length} chars.`);
                } catch (e) {
                    console.error("Log persistence failed", e);
                }
            }
        });
    });

    socket.on('stop-mcp-search', () => {
        if (socket.activeSearchProcess) {
            console.log('[SERVER] Stopping search process...');
            try {
                // Force kill tree
                const pid = socket.activeSearchProcess.pid;
                spawn('taskkill', ['/pid', pid, '/f', '/t']);
            } catch (e) {
                console.error('Kill Error:', e);
                socket.activeSearchProcess.kill();
            }
            socket.emit('search-log', '🛑 Search stopped by user.');
            socket.emit('search-complete'); // Force UI reset immediately
            socket.activeSearchProcess = null;
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
