
import * as XLSX from 'xlsx';

function parseDate(value: any): string | undefined {
    if (!value) return undefined;

    console.log(`Parsing value: "${value}" (type: ${typeof value})`);

    // Handle Excel serial number
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d).toISOString();
    }

    // Handle string formats
    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        // Check for DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY format
        // Also supports MM/DD/YYYY if the first part is > 12
        // Regex captures: 1=PartA, 2=PartB, 3=Year
        const dateMatch = trimmedValue.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (dateMatch) {
            let partA = parseInt(dateMatch[1]);
            let partB = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);

            let day, month;

            if (partB > 12 && partA <= 12) {
                // Clearly MM/DD/YYYY (e.g. 02/15/2026)
                month = partA - 1;
                day = partB;
            } else {
                // Default to DD/MM/YYYY (e.g. 15/02/2026)
                day = partA;
                month = partB - 1;
            }

            // Construct date
            const date = new Date(year, month, day);

            // Re-verify strictly
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                const mm = (month + 1).toString().padStart(2, '0');
                const dd = day.toString().padStart(2, '0');
                return `${year}-${mm}-${dd}T00:00:00.000Z`;
            }
        }

        // Try standard Date parse as fallback (handles YYYY-MM-DD, etc.)
        const date = new Date(trimmedValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }

    return undefined;
}

const testCases = [
    "15/02/2026",
    "15-02-2026",
    "2026-02-15",
    "2/15/2026", // MM/DD/YYYY - previously failed or parsed wrongly
    "15.02.2026", // Dot separator
    "2026/02/15",
    45337,
    "Invalid Date",
    "   15/02/2026   ", // Leading/trailing spaces
    "15/2/2026",
    "1/2/2026",
    "2024-03-15",
];

testCases.forEach(test => {
    const result = parseDate(test);
    console.log(`Result: ${result}\n`);
});
