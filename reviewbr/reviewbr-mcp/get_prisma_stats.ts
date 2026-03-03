import sqlite3 from 'sqlite3';

async function getStats() {
    const db = new sqlite3.Database('./data/system.db');
    const projectId = 1;

    const query = (sql: string) => new Promise<any>((resolve, reject) => {
        db.get(sql, [projectId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        const total = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ?');
        const dups = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND is_duplicate_of IS NOT NULL');
        const excluded = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND screening_decision = "NO"');
        const included = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND (screening_decision = "YES" OR screening_decision = "MAYBE")');
        const harvested_ok = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND (stage = "fulltext_acquired" OR stage = "extracted")');
        const harvested_fail = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND stage = "harvest_failed"');
        const extracted = await query('SELECT COUNT(*) as c FROM records WHERE project_id = ? AND stage = "extracted"');

        console.log(JSON.stringify({
            total: total.c,
            duplicates: dups.c,
            screened: total.c - dups.c,
            excluded: excluded.c,
            included_for_fulltext: included.c,
            harvested_success: harvested_ok.c,
            harvested_fail: harvested_fail.c,
            extracted_high_fidelity: extracted.c
        }, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        db.close();
    }
}

getStats();
