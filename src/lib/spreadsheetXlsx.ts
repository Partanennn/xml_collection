import readXlsxFile from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import {
  makeUniqueHeaders,
  normalizeCollectionSheets,
  type CollectionSheet,
} from "./spreadsheetXml";

export async function parseSpreadsheetXlsx(
  file: File,
): Promise<CollectionSheet[]> {
  const workbookSheets = await readXlsxFile(file);
  if (workbookSheets.length === 0) {
    throw new Error("No worksheets found in this XLSX workbook.");
  }

  const sheets = workbookSheets.map(({ sheet, data }) => {
    const rows = data
      .map((row) => row.map(stringifyCell))
      .filter((row) => row.some((value) => value.length > 0));
    const sourceHeaders = rows.shift() ?? [];
    const columnCount = Math.max(
      sourceHeaders.length,
      ...rows.map((row) => row.length),
    );
    const headers = makeUniqueHeaders(sourceHeaders, columnCount);
    const items = rows.map((row) =>
      Object.fromEntries(
        headers.map((header, column) => [header, row[column] ?? ""]),
      ),
    );

    return { name: sheet, headers, items };
  });

  return normalizeCollectionSheets(sheets);
}

export async function serializeSpreadsheetXlsx(
  sheets: CollectionSheet[],
): Promise<Blob> {
  const workbookSheets = sheets.map((sheet) => ({
    sheet: sheet.name,
    data: [
      sheet.headers,
      ...sheet.items.map((item) =>
        sheet.headers.map((header) => item[header] || null),
      ),
    ],
  }));

  return writeXlsxFile(workbookSheets).toBlob();
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}
