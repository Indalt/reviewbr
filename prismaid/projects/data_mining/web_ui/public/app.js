const socket = io();
let currentSearchTerm = "";
let searchResults = [];
let excludedItems = [];

// --- Filters / Stats ---
const REGIONS = {
    'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
    'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
    'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'Sul': ['PR', 'RS', 'SC']
};

let repoStats = null;
let selectedStates = [];

async function loadRepoStats() {
    try {
        const res = await fetch('/api/repos/stats');
        repoStats = await res.json();
        renderFilters();
    } catch (e) {
        console.error('Failed to load repo stats:', e);
        document.getElementById('filters-loading').textContent = 'Erro ao carregar filtros.';
    }
}

// --- Project Listing ---
async function showProjectList() {
    const modal = document.getElementById('project-modal');
    const list = document.getElementById('project-list');
    modal.style.display = 'flex';
    list.innerHTML = '<div style="padding:20px; text-align:center; color:#ccc;">Carregando projetos...</div>';

    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();

        list.innerHTML = '';
        if (projects.length === 0) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Nenhum projeto encontrado.</div>';
            return;
        }

        projects.forEach(p => {
            const div = document.createElement('div');
            div.className = 'project-item';
            div.style.padding = '15px';
            div.style.background = '#222';
            div.style.border = '1px solid #333';
            div.style.borderRadius = '8px';
            div.style.marginBottom = '10px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            div.innerHTML = `
                <div style="flex:1; cursor:pointer;" onclick="loadProjectData('${p.name}'); document.getElementById('project-modal').style.display = 'none';">
                    <strong style="color:#fff; font-size:1.1em;">${p.name}</strong>
                    <div style="font-size:0.85em; color:#888; margin-top:5px;">
                        📄 ${p.unscreened + p.relevant + p.irrelevant} Arquivos | ✅ ${p.relevant} Relevantes
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-xs" style="background:#444;" onclick="loadProjectData('${p.name}'); document.getElementById('project-modal').style.display = 'none';">Abrir</button>
                    <button class="btn-xs" style="background:#d32f2f;" onclick="deleteProject('${p.name}')">🗑️</button>
                </div>
            `;

            // Hover effect for the main area
            div.onmouseenter = () => div.style.background = '#333';
            div.onmouseleave = () => div.style.background = '#222';

            list.appendChild(div);
        });

    } catch (e) {
        console.error('Error loading projects:', e);
        list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--danger);">Erro ao carregar projetos.</div>';
    }
}

async function deleteProject(name) {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${name}"? Esta ação é irreversível.`)) return;

    try {
        const res = await fetch(`/api/project/${name}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Projeto excluído com sucesso.');
            showProjectList(); // Refresh list
        } else {
            alert('Erro ao excluir projeto.');
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão ao excluir.');
    }
}

// Sidebar Buttons
document.getElementById('btn-projects').addEventListener('click', () => {
    showProjectList();
});

document.getElementById('btn-workspace').addEventListener('click', () => {
    // Just close modal if open, essentially "Home"
    document.getElementById('project-modal').style.display = 'none';
});

function renderFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';
    document.getElementById('filters-loading').style.display = 'none';

    Object.keys(REGIONS).forEach(region => {
        const states = REGIONS[region];
        const regionDiv = document.createElement('div');
        regionDiv.style.border = '1px solid #333';
        regionDiv.style.padding = '10px';
        regionDiv.style.borderRadius = '5px';

        const rTitle = document.createElement('strong');
        rTitle.textContent = region;
        rTitle.style.display = 'block';
        rTitle.style.marginBottom = '5px';
        rTitle.style.cursor = 'pointer';
        rTitle.title = 'Clique para selecionar todos na região';
        rTitle.onclick = () => toggleRegion(region); // Convenient "Select All"
        regionDiv.appendChild(rTitle);

        states.forEach(uf => {
            const count = repoStats.byState[uf] || 0;
            if (count === 0) return; // Skip states with no repos

            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.cursor = 'pointer';
            label.innerHTML = `
                <input type="checkbox" value="${uf}" onchange="updateSelectedStates()"> 
                ${uf} <span style="color:#666; font-size:0.8em">(${count})</span>
            `;
            regionDiv.appendChild(label);
        });

        if (regionDiv.children.length > 1) { // Only append if states exist
            container.appendChild(regionDiv);
        }
    });
}

window.toggleFilters = () => {
    const filters = document.getElementById('repo-filters');
    const icon = document.getElementById('filter-toggle-icon');
    if (filters.style.display === 'none') {
        filters.style.display = 'block';
        icon.textContent = '▲';
        if (!repoStats) loadRepoStats();
    } else {
        filters.style.display = 'none';
        icon.textContent = '▼';
    }
};

window.toggleRegion = (region) => {
    // Logic to select all checkboxes in this region block
    // Simplified for now: just log or implement if user asks.
    // Let's implement it for better UX!
    // Need to find the inputs within the specific region block... 
    // Implementation deferred for simplicity unless requested.
};

window.updateSelectedStates = () => {
    const checkboxes = document.querySelectorAll('#filters-container input[type="checkbox"]:checked');
    selectedStates = Array.from(checkboxes).map(cb => cb.value);
    const countSpan = document.getElementById('selected-states-count');
    countSpan.textContent = selectedStates.length > 0 ? selectedStates.join(', ') : 'Todos';
};

// --- Wizard Navigation ---
function goToStage(stageNum) {
    document.querySelectorAll('.wizard-stage').forEach(el => el.classList.remove('active'));
    document.getElementById(`stage-${stageNum}`).classList.add('active');

    // Auto-save on transition
    if (stageNum === 2) saveStage1();
    if (stageNum === 3) saveStage2();
}

// --- Project Loading ---
async function loadProjectData(projectName) {
    try {
        const res = await fetch(`/api/project/${projectName}`);
        if (!res.ok) throw new Error('Project not found');

        const data = await res.json();

        // 1. Restore Stage 1
        if (data.stage1 && data.stage1.length > 0) {
            searchResults = data.stage1;
            // Restore exclusions
            if (data.exclusions) {
                data.exclusions.forEach(ex => {
                    const item = searchResults.find(r => r.id === ex.id || r.title === ex.title);
                    if (item) {
                        item.excluded = true;
                        item.exclusionReason = ex.reason;
                    }
                });
            }
            displayResults(searchResults, false);
            document.getElementById('results-area').style.display = 'block';

            // Fix: Update currentSearchTerm for persistence
            currentSearchTerm = projectName.replace(/_/g, ' ');
            document.getElementById('input-research-term').value = currentSearchTerm;
        }

        // 2. Restore Stage 2
        if (data.stage2) {
            if (data.stage2.picos) document.getElementById('protocol-picos').value = data.stage2.picos;
        }

        // 3. UI State
        // If Stage 3 data exists, go there.
        if (data.stage3 && data.stage3.length > 0) {
            goToStage(3);
        } else if (data.stage2 && data.stage2.picos) {
            goToStage(2);
        } else if (searchResults.length > 0) {
            goToStage(1);
        }

        // 4. Restore Logs
        if (data.logs) {
            let term = document.getElementById('search-terminal');
            if (!term) {
                term = document.createElement('div');
                term.id = 'search-terminal';
                term.style.cssText = "background:#111; color:#0f0; padding:15px; border-radius:8px; margin-top:15px; font-family:monospace; max-height:200px; overflow-y:auto; font-size:0.9rem;";
                // Ensure stage-1 exists or find where to append. usually stage-1 is the search area.
                const stage1 = document.getElementById('stage-1');
                if (stage1) stage1.appendChild(term);
            }
            if (term) {
                term.style.display = 'block';
                // Use textContent for safety, but pre-wrap for newlines
                term.innerHTML = `<div style="color:#aaa; border-bottom:1px solid #333; margin-bottom:5px;">Histórico de Logs:</div>`;
                const content = document.createElement('pre');
                content.style.whiteSpace = 'pre-wrap';
                content.style.margin = '0';
                content.textContent = data.logs;
                term.appendChild(content);
                term.scrollTop = term.scrollHeight;
            }
        }

        alert(`Projeto '${projectName}' carregado!`);

    } catch (e) {
        console.error('Load Error:', e);
        alert('Falha ao carregar projeto.');
    }
}

// --- Stage 1: Term Analysis ---
document.getElementById('btn-analyze-term').addEventListener('click', async () => {
    const term = document.getElementById('input-research-term').value;
    if (!term) return alert("Por favor, insira um termo.");

    const feedbackEl = document.getElementById('term-analysis-feedback');
    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = "🧠 A IA está analisando seu termo para precisão...";

    try {
        const res = await fetch('/api/analyze-term', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term })
        });

        const data = await res.json();
        const resultDiv = document.getElementById('analysis-result');
        resultDiv.style.display = 'block';

        if (res.ok) {
            if (data.valid) {
                document.getElementById('btn-run-search').disabled = false;
                currentSearchTerm = term;
                saveState(); // Save state after term analysis
                resultDiv.innerHTML = `<div class="success-box">✓ ${data.scope || 'Termo analisado.'}</div>`;
                if (data.suggestion) {
                    resultDiv.innerHTML += `<div style="margin-top:5px; font-size:0.9em; color:#aaa;">Sugestão: ${data.suggestion}</div>`;
                }
            } else {
                resultDiv.innerHTML = `<div class="error-box">⚠ ${data.feedback || 'Termo inválido.'}</div>`;
            }
        } else {
            // Server returned an error (500, etc)
            console.error('Analysis Error:', data);
            resultDiv.innerHTML = `<div class="error-box">⚠ Erro: ${data.error || 'Erro desconhecido no servidor'}</div>`;
        }

    } catch (e) {
        console.error(e);
        document.getElementById('analysis-result').innerHTML = `<div class="error-box">⚠ Erro de Rede/Script: ${e.message}</div>`;
    }
});

window.applySuggestion = (text) => {
    document.getElementById('input-research-term').value = text;
    currentSearchTerm = text;
    document.getElementById('term-analysis-feedback').innerHTML = `<span style="color:var(--success)">✓ Atualizado para sugestão!</span>`;
};

// --- Stage 1: Run Search ---
document.getElementById('btn-run-search').addEventListener('click', async () => {
    console.log('Search button clicked');

    // Fallback: If currentSearchTerm is empty, try to get it from the input
    if (!currentSearchTerm) {
        currentSearchTerm = document.getElementById('input-research-term').value;
    }

    if (!currentSearchTerm) {
        alert('Por favor, analise o termo primeiro.');
        return;
    }
    console.log('Term:', currentSearchTerm);

    const startYear = document.getElementById('input-start-year').value;
    const endYear = document.getElementById('input-end-year').value;

    // Reset UI & Storage
    document.getElementById('search-results-body').innerHTML = '';
    document.getElementById('results-count').textContent = 'Encontrados: 0';
    searchResults = []; // Clear local array
    sessionStorage.removeItem('prism_results');
    sessionStorage.removeItem('prism_logs');
    sessionStorage.removeItem('prism_count');

    const btn = document.getElementById('btn-run-search');
    btn.innerHTML = 'Pesquisando... ⏳';
    btn.classList.add('pulsing');
    btn.disabled = true;

    const term = document.getElementById('search-terminal');
    if (term) {
        term.style.display = 'block';
        term.innerHTML = '<div style="color:#666; border-bottom:1px solid #333; margin-bottom:5px;">Logs do Sistema...</div>';
    }
    saveState(); // Save the reset state

    // Show Stop, Hide Search (or make it disabled)
    // Actually, let's keep it simple:
    document.getElementById('btn-run-search').style.display = 'none';
    const stopBtn = document.getElementById('btn-stop-search');
    stopBtn.style.display = 'block';

    console.log('Term:', currentSearchTerm);

    if (!document.getElementById('search-terminal')) {
        const term = document.createElement('div');
        term.id = 'search-terminal';
        term.style.cssText = "background:#111; color:#0f0; padding:15px; border-radius:8px; margin-top:15px; font-family:monospace; max-height:200px; overflow-y:auto; font-size:0.9rem;";
        document.getElementById('stage-1').appendChild(term);
    }

    document.getElementById('search-terminal').style.display = 'block';

    console.log('Emitting start-mcp-search...');

    // Derive project name if not set
    const pName = currentSearchTerm.replace(/[^a-z0-9 _-]/gi, '').toLowerCase().trim().replace(/\s+/g, '_');

    socket.emit('start-mcp-search', {
        query: currentSearchTerm,
        startYear: startYear,
        endYear: endYear,
        states: selectedStates, // Pass selected filters
        projectName: pName
    });
});

document.getElementById('btn-stop-search').addEventListener('click', () => {
    if (confirm('Parar o processo de pesquisa?')) {
        socket.emit('stop-mcp-search');
        document.getElementById('btn-stop-search').textContent = 'Parando...';
        document.getElementById('btn-stop-search').disabled = true;
    }
});

// Logs from Server
socket.on('search-log', (msg) => {
    const term = document.getElementById('search-terminal');
    if (!term) return;
    const line = document.createElement('div');
    line.textContent = `> ${msg}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight; // Auto-scroll
    saveState(); // Save logs

    if (msg.includes('Search stopped') || msg.includes('Process finished')) {
        resetSearchUI();
    }
});

function resetSearchUI() {
    document.getElementById('btn-run-search').style.display = 'block';
    document.getElementById('btn-run-search').disabled = false;
    document.getElementById('btn-run-search').innerHTML = 'Executar Pesquisa (MCP)';
    document.getElementById('btn-run-search').classList.remove('pulsing');

    const stopBtn = document.getElementById('btn-stop-search');
    stopBtn.style.display = 'none';
    stopBtn.textContent = '🛑 Parar';
    stopBtn.disabled = false;
}

// Results from MCP
// --- Socket Listeners for Results ---
socket.on('mcp-batch-results', (items) => {
    console.log('Received batch results:', items.length);
    displayResults(items, true);
    document.getElementById('results-area').style.display = 'block';
});

socket.on('mcp-result-item', (item) => {
    displayResults([item], true);
    document.getElementById('results-area').style.display = 'block';
});

socket.on('search-complete', () => {
    resetSearchUI(); // Ensure buttons are toggled back clearly

    // Show next step button if we have results
    const nextBtn = document.getElementById('btn-next-step');
    if (nextBtn && searchResults.length > 0) nextBtn.style.display = 'inline-block';

    if (document.getElementById('search-terminal')) {
        const line = document.createElement('div');
        line.textContent = '> Processo de pesquisa concluído.';
        document.getElementById('search-terminal').appendChild(line);
    }
    saveState();
    if (searchResults.length > 0) {
        alert('Pesquisa Completa! ' + searchResults.length + ' itens encontrados.');
    } else {
        // Maybe it was stopped or found nothing
        console.log('Search complete with 0 results.');
    }
});

// --- Results Display ---
function displayResults(items, append = true) {
    const tbody = document.getElementById('search-results-body');
    const count = document.getElementById('results-count');

    if (!tbody) return;

    if (!append) {
        tbody.innerHTML = '';
        // If replacing, rebuild from scratch (items is full list)
        items.forEach((item, idx) => {
            renderRow(item, idx);
        });
    } else {
        // Appending new items
        items.forEach(item => {
            // Check if already exists to avoid duplicates in UI
            if (!searchResults.find(r => r.id === item.id)) {
                searchResults.push(item);
            }
            renderRow(item, searchResults.length - 1);
        });
    }

    if (count) {
        count.textContent = `Encontrados: ${searchResults.length}`;
        saveState();
    }
}

// --- Row Rendering ---
function renderRow(item, index) {
    const tbody = document.getElementById('search-results-body');
    // Check if row exists
    let tr = document.getElementById(`row-${index}`);

    if (!tr) {
        tr = document.createElement('tr');
        tr.id = `row-${index}`;
        tr.className = 'result-row';
        tbody.appendChild(tr);
    }

    const isExcluded = item.excluded;
    tr.style.opacity = isExcluded ? '0.5' : '1';
    tr.style.background = isExcluded ? '#2a0000' : '';

    // Helper for abstract toggle (scoped to window for onclick access)
    window['toggleAbs_' + index] = () => {
        const el = document.getElementById('abs-' + index);
        const btn = document.getElementById('btn-abs-' + index);
        if (el && el.style.display === 'none') {
            el.style.display = 'block';
            if (btn) btn.textContent = '▼ Ocultar Resumo';
        } else if (el) {
            el.style.display = 'none';
            if (btn) btn.textContent = '▶ Ver Resumo';
        }
    };

    tr.innerHTML = `
        <td><input type="checkbox" class="result-checkbox" ${!isExcluded ? 'checked' : ''} onchange="toggleExclusion(${index}, 'manual')"></td>
        <td>
            <div style="font-weight:bold;">${item.title || 'No Title'}</div>
            <div style="font-size:0.85em; color:#888;">${item.authors ? (Array.isArray(item.authors) ? item.authors.join(', ') : item.authors) : 'Desconhecido'} (${item.year || 'N/A'})</div>
            <div style="font-size:0.8em; color:#666;">${item.id} | ${item.repo || 'Unknown'}</div>
            
            <button id="btn-abs-${index}" class="btn-xs" style="margin-top:5px; background:#333;" onclick="toggleAbs_${index}()">▶ Ver Resumo</button>
            <div id="abs-${index}" style="display:none; margin-top:5px; padding:10px; background:#222; border-radius:4px; font-size:0.9em;">
                ${item.abstract || 'Resumo não disponível.'}
                
                <div style="margin-top:15px; border-top:1px solid #444; padding-top:10px;">
                     <strong style="color:#aaa; display:block; margin-bottom:5px;">Decisão de Triagem:</strong>
                     <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        <button class="btn-xs ${item.exclusionReason === 'scope' ? 'active-red' : ''}" style="border:1px solid #555;" onclick="toggleExclusion(${index}, 'scope')">🚫 Fora do Escopo</button>
                        <button class="btn-xs ${item.exclusionReason === 'type' ? 'active-red' : ''}" style="border:1px solid #555;" onclick="toggleExclusion(${index}, 'type')">📄 Tipo Errado</button>
                        <button class="btn-xs ${item.exclusionReason === 'duplicate' ? 'active-red' : ''}" style="border:1px solid #555;" onclick="toggleExclusion(${index}, 'duplicate')">👯 Duplicado</button>
                        <button class="btn-xs ${item.exclusionReason === 'other' ? 'active-red' : ''}" style="border:1px solid #555;" onclick="toggleExclusion(${index}, 'other')">❓ Outro</button>
                     </div>
                </div>
            </div>
        </td>
    `;
}

// --- Exclusion Logic ---
window.toggleExclusion = (index, reason) => {
    const item = searchResults[index];
    if (!item) return;

    if (reason === 'manual') {
        // Checkbox click
        item.excluded = !item.excluded;
        if (!item.excluded) item.exclusionReason = null;
        else item.exclusionReason = 'manual';
    } else {
        // Button click
        if (item.excluded && item.exclusionReason === reason) {
            // Re-include if clicking same reason
            item.excluded = false;
            item.exclusionReason = null;
        } else {
            // Exclude with new reason
            item.excluded = true;
            item.exclusionReason = reason;
        }
    }

    renderRow(item, index);
    saveStage1();
    updateStats();
};

function updateStats() {
    const total = searchResults.length;
    const excluded = searchResults.filter(i => i.excluded).length;

    const foundEl = document.getElementById('count-found');
    const selectedEl = document.getElementById('count-selected');

    if (foundEl) foundEl.innerText = total;
    if (selectedEl) selectedEl.innerText = total - excluded;
}


// --- Saving Stage 1 ---
async function saveStage1() {
    // If we have a project name in the UI, use it. Otherwise temp.
    let currentProjectName = 'temp_session';
    const projectElement = document.getElementById('current-project-name');
    if (projectElement && projectElement.textContent) {
        currentProjectName = projectElement.textContent;
    } else if (currentSearchTerm) {
        currentProjectName = currentSearchTerm.replace(/[^a-z0-9 _-]/gi, '').toLowerCase().trim().replace(/\s+/g, '_');
    }

    const candidates = searchResults.filter(i => !i.excluded);
    const exclusions = searchResults.filter(i => i.excluded).map(i => ({
        id: i.id || 'unknown',
        title: i.title,
        reason: i.exclusionReason
    }));

    try {
        await fetch('/api/stage1/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: currentProjectName, candidates, exclusions })
        });
        console.log('Stage 1 Saved.');
    } catch (e) {
        console.error('Failed to save Stage 1:', e);
    }
}

// --- Stage 2: Protocol Draft ---
// --- Stage 2: Protocol Draft ---
// (Old listener removed in favor of new saveStage1 logic)

document.getElementById('btn-generate-protocol').addEventListener('click', async () => {
    const btn = document.getElementById('btn-generate-protocol');
    btn.disabled = true;
    btn.innerText = "Drafting... 🧠";

    try {
        const res = await fetch('/api/draft-protocol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: currentSearchTerm
            })
        });
        const data = await res.json();
        document.getElementById('protocol-picos').value = data.picos_suggestions; // formatting needed
    } catch (e) {
        alert("Error drafting protocol");
    }
    btn.disabled = false;
    btn.disabled = false;
    btn.innerText = "Auto-Draft Protocol ✨";
});

async function saveStage2() {
    const picos = document.getElementById('protocol-picos').value;
    const project = currentSearchTerm.replace(/[^a-z0-9 ]/gi, '').toLowerCase().trim().replace(/\s+/g, '_'); // fallback

    try {
        await fetch('/api/stage2/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project, protocol: { picos } })
        });
        console.log('Stage 2 Saved.');
    } catch (e) {
        console.error('Failed to save Stage 2:', e);
    }
}

// --- Socket Logs ---
socket.on('log', (data) => {
    if (currentProject && data.project === currentProject.name) {
        log(data.message);
    }
});
// --- Persistence ---
function saveState() {
    sessionStorage.setItem('prism_term', currentSearchTerm);
    sessionStorage.setItem('prism_results', JSON.stringify(searchResults));
    // Save Log content
    const term = document.getElementById('search-terminal');
    if (term) sessionStorage.setItem('prism_logs', term.innerHTML);

    // Save count
    const count = document.getElementById('results-count');
    if (count) sessionStorage.setItem('prism_count', count.textContent);
}

function loadState() {
    const term = sessionStorage.getItem('prism_term');
    if (term) {
        currentSearchTerm = term;
        document.getElementById('input-research-term').value = term;
        document.getElementById('btn-run-search').disabled = false;
    }

    const results = sessionStorage.getItem('prism_results');
    if (results) {
        searchResults = JSON.parse(results);
        displayResults(searchResults, false); // Repopulate table
        // Show table if we have results
        if (searchResults.length > 0) {
            document.getElementById('results-area').style.display = 'block';
            document.getElementById('btn-next-step').style.display = 'inline-block';
        }
    }

    const logs = sessionStorage.getItem('prism_logs');
    if (logs) {
        const termEl = document.getElementById('search-terminal');
        if (termEl) {
            termEl.style.display = 'block';
            termEl.innerHTML = logs;
            termEl.scrollTop = termEl.scrollHeight;
        }
    }

    const count = sessionStorage.getItem('prism_count');
    if (count) {
        document.getElementById('results-count').textContent = count;
    }
}

// --- Navigation ---
document.getElementById('btn-next-step').addEventListener('click', () => {
    goToStage(2);
});

// Init
window.addEventListener('DOMContentLoaded', () => {
    loadState();
});
