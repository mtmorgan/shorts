import * as fs from 'fs';
import * as path from 'path';
import { google, sheets_v4 } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Helper function to format dates ---
function formatDateYYYYMMDD(date: Date): string {
	if (!(date instanceof Date) || isNaN(date.getTime())) {
		return 'Invalid Date'; // Or throw an error
	}
	const year = date.getUTCFullYear();
	const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
	const day = date.getUTCDate().toString().padStart(2, '0'); // Fixed day calculation
	return `${year}-${month}-${day}`;
}

// Define the structure of your spreadsheet data (optional but good practice)
interface Birds {
	[key: string]: string[];
}

/**
 * Fetches data from a specified range in a Google Sheet and returns it as a JSON array.
 *
 * @param spreadsheetId The ID of the Google Sheet.
 * @param range The A1 notation of the range to fetch (e.g., 'Sheet1!A1:C10').
 * @returns A Promise that resolves to an array of JSON objects representing the sheet data.
 */
export async function getCafeData(
	spreadsheetId: string,
	range: string
): Promise<Birds> {
	try {
		// Path to your service account credentials JSON file
		const credentialsPath = path.join(
			__dirname,
			'../../config/google-sheets-credentials.json'
		);

		// Authenticate using the service account
		const auth = new google.auth.GoogleAuth({
			keyFile: credentialsPath,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});

		const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth });
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range
		});

		const rows = response.data.values;
		if (!rows || rows.length === 0) {
			console.log('No data found in the specified range.');
			return {} as Birds;
		}
		const numRows = rows.length;
		const numCols = rows[0].length;

		const birds = new Map<string, string[]>();
		const startDate = new Date('2026-01-01');

		for (let j = 2; j < numCols; j++) {
			const birdsToday: string[] = [];
			for (let i = 0; i < numRows; i++) {
				if (rows[i][j] === 'TRUE') {
					birdsToday.push(rows[i][0].trim());
				}
			}
			if (birdsToday.length > 0) {
				const date = new Date(startDate);
				date.setDate(startDate.getDate() + (j - 1));
				const dateString = formatDateYYYYMMDD(date);
				birds.set(dateString, birdsToday);
			}
		}
		return Object.fromEntries(birds);
	} catch (error: any) {
		console.error('Error fetching data from Google Sheets:', error.message);
		throw error; // Re-throw the error for calling function to handle
	}
}

// --- Example Usage ---

async function main() {
	const SPREADSHEET_ID = '1Yq0bFkUxQCs7xic4lfLfZ_WsZqObXPmQu_Q-htU6pJU'; // Replace with your actual spreadsheet ID
	const SHEET_RANGE = 'Cafe!A5:GA100'; // Replace with your desired sheet name and range

	try {
		const jsonData = await getCafeData(SPREADSHEET_ID, SHEET_RANGE);
		const jsonString = JSON.stringify(jsonData, null, 2);
		const filePath = path.join(
			__dirname,
			'..',
			'..',
			'src',
			'routes',
			'birdcafe',
			'birds.json'
		);
		fs.writeFileSync(filePath, jsonString, 'utf-8');
		console.log(`Output to '${filePath}'`);
	} catch (error) {
		console.error('Failed to retrieve data.');
	}
}

main();
