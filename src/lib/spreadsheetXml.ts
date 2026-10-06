export type CollectionKind = "movies" | "books" | "series";

export interface CollectionSheet {
  name: string;
  headers: string[];
  items: Array<Record<string, string>>;
}

const purchaseHeaders = ["Purchase place", "Price", "Purchase date"];
const digitalizeHeader = "Digitalize";

const categoryMatchers: Record<CollectionKind, RegExp> = {
  movies: /movie|film/i,
  books: /book/i,
  series: /tv|television|series|show/i,
};

export const collectionLabels: Record<CollectionKind, string> = {
  movies: "Movies",
  books: "Books",
  series: "TV Series",
};

export function parseSpreadsheetXml(xmlText: string): CollectionSheet[] {
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error(
      "This file is not valid XML. Check the file and try again.",
    );
  }

  const worksheets = Array.from(document.getElementsByTagName("*")).filter(
    (element) => element.localName === "Worksheet",
  );

  if (worksheets.length === 0) {
    throw new Error(
      "No worksheets found. Use an Excel XML workbook with named sheets.",
    );
  }

  return worksheets.map((worksheet, index) => {
    const name =
      Array.from(worksheet.attributes).find(
        (attribute) => attribute.localName === "Name",
      )?.value ?? `Sheet ${index + 1}`;
    const rows = Array.from(worksheet.getElementsByTagName("*"))
      .filter((element) => element.localName === "Row")
      .map(readRow)
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
    const supportsDigitalize =
      categoryMatchers.movies.test(name) || categoryMatchers.series.test(name);
    const expectedHeaders = supportsDigitalize
      ? [...purchaseHeaders, digitalizeHeader]
      : purchaseHeaders;
    const missingHeaders = expectedHeaders.filter(
      (expectedHeader) =>
        !headers.some(
          (header) =>
            header.toLocaleLowerCase() === expectedHeader.toLocaleLowerCase(),
        ),
    );
    const allHeaders = [...headers, ...missingHeaders];
    const digitalizeColumn = allHeaders.find(
      (header) =>
        header.toLocaleLowerCase() === digitalizeHeader.toLocaleLowerCase(),
    );
    const completeItems = items.map((item) => {
      const completeItem = {
        ...Object.fromEntries(missingHeaders.map((header) => [header, ""])),
        ...item,
      };
      if (supportsDigitalize && digitalizeColumn) {
        completeItem[digitalizeColumn] = /^(x|true|1)$/i.test(
          completeItem[digitalizeColumn].trim(),
        )
          ? "X"
          : "";
      }
      return completeItem;
    });

    return { name, headers: allHeaders, items: completeItems };
  });
}

export function serializeSpreadsheetXml(sheets: CollectionSheet[]): string {
  const namespace = "urn:schemas-microsoft-com:office:spreadsheet";
  const xmlDocument = document.implementation.createDocument(
    namespace,
    "Workbook",
  );
  const workbook = xmlDocument.documentElement;
  workbook.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:ss",
    namespace,
  );

  for (const sheet of sheets) {
    const worksheet = xmlDocument.createElementNS(namespace, "Worksheet");
    worksheet.setAttributeNS(namespace, "ss:Name", sheet.name);
    const table = xmlDocument.createElementNS(namespace, "Table");
    worksheet.appendChild(table);
    table.appendChild(createXmlRow(xmlDocument, sheet.headers, namespace));

    for (const item of sheet.items) {
      table.appendChild(
        createXmlRow(
          xmlDocument,
          sheet.headers.map((header) => item[header] ?? ""),
          namespace,
        ),
      );
    }

    workbook.appendChild(worksheet);
  }

  return `<?xml version="1.0"?>\n${new XMLSerializer().serializeToString(xmlDocument)}`;
}

export function getSheetForCollection(
  sheets: CollectionSheet[],
  kind: CollectionKind,
): CollectionSheet | undefined {
  return sheets.find((sheet) => categoryMatchers[kind].test(sheet.name));
}

function readRow(row: Element): string[] {
  const values: string[] = [];
  let nextColumn = 0;

  for (const cell of Array.from(row.children).filter(
    (element) => element.localName === "Cell",
  )) {
    const index = Array.from(cell.attributes).find(
      (attribute) => attribute.localName === "Index",
    )?.value;
    if (index) nextColumn = Number(index) - 1;
    const data = Array.from(cell.children).find(
      (element) => element.localName === "Data",
    );
    values[nextColumn] = data?.textContent?.trim() ?? "";
    nextColumn += 1;
  }

  return values;
}

function createXmlRow(
  xmlDocument: XMLDocument,
  values: string[],
  namespace: string,
): Element {
  const row = xmlDocument.createElementNS(namespace, "Row");

  for (const value of values) {
    const cell = xmlDocument.createElementNS(namespace, "Cell");
    const data = xmlDocument.createElementNS(namespace, "Data");
    data.setAttributeNS(namespace, "ss:Type", "String");
    data.textContent = value;
    cell.appendChild(data);
    row.appendChild(cell);
  }

  return row;
}

function makeUniqueHeaders(
  sourceHeaders: string[],
  columnCount: number,
): string[] {
  const used = new Set<string>();

  return Array.from({ length: columnCount }, (_, index) => {
    const base = sourceHeaders[index]?.trim() || `Column ${index + 1}`;
    let header = base;
    let suffix = 2;
    while (used.has(header)) {
      header = `${base} ${suffix}`;
      suffix += 1;
    }
    used.add(header);
    return header;
  });
}
