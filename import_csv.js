const fs = require('fs');

const supabaseUrl = 'https://uelocqsryuvhcwmjjbho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbG9jcXNyeXV2aGN3bWpqYmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ5MjMsImV4cCI6MjA5NzkxMDkyM30.uinZ-RlDIuQ7ZQlknhCmLef7Rzcb1DCWuxvwywkEFuw';

function parseCSV(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split('\n');
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Nombre Completo') || lines[i].includes('"Nombre Completo"')) {
            startIndex = i + 1;
            break;
        }
    }
    const records = [];
    for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 3) {
            records.push({ name: cols[0], email: cols[1], date: cols[2] });
        }
    }
    return records;
}

function parseDate(dateStr) {
    // DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // Return YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`;
    }
    return new Date().toISOString();
}

async function insertRecords(records, isPaid) {
    for (const r of records) {
        try {
            const body = {
                amount: isPaid ? 1000 : 0, // Placeholder amount if paid
                status: isPaid ? 'approved' : 'free_download',
                product_name: 'Importado de Google Sheets',
                client_name: r.name,
                client_email: r.email,
                created_at: parseDate(r.date)
            };
            const response = await fetch(`${supabaseUrl}/rest/v1/payment_records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': 'Bearer ' + supabaseKey
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const err = await response.text();
                console.error('Error inserting', r.email, err);
            } else {
                console.log('Inserted', r.email);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

async function main() {
    const freeRecords = parseCSV('C:\\Users\\fsastreheer\\.gemini\\antigravity-ide\\brain\\ca320a24-ef72-40f6-9472-a9626b5ff1df\\.system_generated\\steps\\245\\content.md');
    const paidRecords = parseCSV('C:\\Users\\fsastreheer\\.gemini\\antigravity-ide\\brain\\ca320a24-ef72-40f6-9472-a9626b5ff1df\\.system_generated\\steps\\251\\content.md');

    console.log(`Found ${freeRecords.length} free records and ${paidRecords.length} paid records`);
    await insertRecords(freeRecords, false);
    await insertRecords(paidRecords, true);
}

main();
