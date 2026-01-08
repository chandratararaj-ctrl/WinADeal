export class ExportService {
    /**
     * Export data to CSV format
     */
    static exportToCSV(data: any[], filename: string, headers?: string[]) {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

        const csv = this.convertToCSV(data, headers);
        this.downloadFile(csv, `${filename}.csv`, 'text/csv');
    }

    /**
     * Export data to JSON format
     */
    static exportToJSON(data: any[], filename: string) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, `${filename}.json`, 'application/json');
    }

    /**
     * Convert array of objects to CSV string
     */
    private static convertToCSV(data: any[], customHeaders?: string[]): string {
        const headers = customHeaders || Object.keys(data[0]);

        // Create header row
        const headerRow = headers.join(',');

        // Create data rows
        const dataRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                // Handle values with commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',');
        });

        return [headerRow, ...dataRows].join('\n');
    }

    /**
     * Download file to user's computer
     */
    private static downloadFile(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export table data from HTML table element
     */
    static exportTableToCSV(tableId: string, filename: string) {
        const table = document.getElementById(tableId) as HTMLTableElement;
        if (!table) {
            throw new Error(`Table with id "${tableId}" not found`);
        }

        const rows: string[][] = [];

        // Get headers
        const headerCells = table.querySelectorAll('thead th');
        const headers = Array.from(headerCells).map(cell => cell.textContent || '');
        rows.push(headers);

        // Get data rows
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.textContent || '');
            rows.push(rowData);
        });

        const csv = rows.map(row => row.join(',')).join('\n');
        this.downloadFile(csv, `${filename}.csv`, 'text/csv');
    }

    /**
     * Format data for export with custom formatting
     */
    static formatForExport(data: any[], formatters?: Record<string, (value: any) => string>): any[] {
        if (!formatters) return data;

        return data.map(row => {
            const formatted: any = {};
            Object.keys(row).forEach(key => {
                formatted[key] = formatters[key] ? formatters[key](row[key]) : row[key];
            });
            return formatted;
        });
    }

    /**
     * Generate filename with timestamp
     */
    static generateFilename(prefix: string): string {
        const date = new Date();
        const timestamp = date.toISOString().split('T')[0];
        return `${prefix}_${timestamp}`;
    }
}

// Example usage:
/*
// Export users to CSV
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'VENDOR' }
];

ExportService.exportToCSV(users, 'users_export');

// Export with custom headers
ExportService.exportToCSV(users, 'users', ['ID', 'Name', 'Email', 'Role']);

// Export with formatting
const formatted = ExportService.formatForExport(users, {
  role: (value) => value.toLowerCase(),
  email: (value) => value.toUpperCase()
});
ExportService.exportToCSV(formatted, 'formatted_users');

// Export table
ExportService.exportTableToCSV('users-table', 'users_table_export');

// Generate filename with timestamp
const filename = ExportService.generateFilename('daily_report');
// Returns: daily_report_2025-12-28
*/
