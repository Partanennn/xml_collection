import { useMemo, useRef, useState } from "react";
import CollectionNavigation from "./components/CollectionNavigation";
import EntriesTable from "./components/EntriesTable";
import EntryForm from "./components/EntryForm";
import sampleWorkbook from "./data/sample.xml?raw";
import {
  collectionLabels,
  getSheetForCollection,
  parseSpreadsheetXml,
  serializeSpreadsheetXml,
  type CollectionKind,
  type CollectionSheet,
} from "./lib/spreadsheetXml";
import {
  parseSpreadsheetXlsx,
  serializeSpreadsheetXlsx,
} from "./lib/spreadsheetXlsx";

const entryLabels: Record<CollectionKind, string> = {
  movies: "movie",
  books: "book",
  series: "TV series",
};

export default function App() {
  const [sheets, setSheets] = useState<CollectionSheet[]>(() =>
    parseSpreadsheetXml(sampleWorkbook),
  );
  const [activeCollection, setActiveCollection] =
    useState<CollectionKind>("movies");
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("sample-collection.xml");
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const activeSheet = getSheetForCollection(sheets, activeCollection);
  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!activeSheet || !query) return activeSheet?.items ?? [];
    return activeSheet.items.filter((item) =>
      Object.values(item).some((value) =>
        value.toLocaleLowerCase().includes(query),
      ),
    );
  }, [activeSheet, search]);
  const purchasePlaces = useMemo(() => {
    const places = sheets.flatMap((sheet) => {
      const purchasePlaceHeader = sheet.headers.find(
        (header) => header.trim().toLocaleLowerCase() === "purchase place",
      );
      if (!purchasePlaceHeader) return [];
      return sheet.items
        .map((item) => item[purchasePlaceHeader]?.trim() ?? "")
        .filter(Boolean);
    });
    return [...new Set(places)].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    );
  }, [sheets]);

  async function loadFile(file?: File) {
    if (!file) return;
    try {
      const parsedSheets = /\.xlsx$/i.test(file.name)
        ? await parseSpreadsheetXlsx(file)
        : parseSpreadsheetXml(await file.text());
      setSheets(parsedSheets);
      setFileName(file.name);
      setSearch("");
      setError("");
      setIsDirty(false);
      setIsAddingEntry(false);
      setIsEditingEntry(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not read this XML file.",
      );
    }
  }

  function addEntry(entry: Record<string, string>) {
    if (!activeSheet) return;

    setSheets((current) =>
      current.map((sheet) =>
        sheet === activeSheet
          ? { ...sheet, items: [...sheet.items, entry] }
          : sheet,
      ),
    );
    setSearch("");
    setIsDirty(true);
    setIsAddingEntry(false);
  }

  function updateEntry(
    original: Record<string, string>,
    updated: Record<string, string>,
  ) {
    if (!activeSheet) return;
    setSheets((current) =>
      current.map((sheet) =>
        sheet === activeSheet
          ? {
              ...sheet,
              items: sheet.items.map((item) =>
                item === original ? updated : item,
              ),
            }
          : sheet,
      ),
    );
    setIsDirty(true);
  }

  function deleteEntry(entry: Record<string, string>) {
    if (!activeSheet) return;
    setSheets((current) =>
      current.map((sheet) =>
        sheet === activeSheet
          ? { ...sheet, items: sheet.items.filter((item) => item !== entry) }
          : sheet,
      ),
    );
    setIsDirty(true);
  }

  async function downloadWorkbook() {
    try {
      const isXlsx = /\.xlsx$/i.test(fileName);
      const blob = isXlsx
        ? await serializeSpreadsheetXlsx(sheets)
        : new Blob([serializeSpreadsheetXml(sheets)], {
            type: "application/xml",
          });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName.replace(/\.(xml|xlsx)$/i, "")}-updated.${isXlsx ? "xlsx" : "xml"}`;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setIsDirty(false);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the updated workbook.",
      );
    }
  }

  const titleHeader =
    activeSheet?.headers.find((header) => /title/i.test(header)) ??
    activeSheet?.headers[0] ??
    "Entry";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Commonplace home">
          <span className="wordmark-icon" aria-hidden="true">
            c.
          </span>
          <span>commonplace</span>
        </a>
        <div className="file-status">
          <span className="status-dot" />
          <span title={fileName}>{fileName}</span>
        </div>
        <button
          className="upload-button"
          onClick={() => fileInput.current?.click()}
        >
          <span aria-hidden="true">↑</span> Open workbook
        </button>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept=".xml,.xlsx,text/xml,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => void loadFile(event.target.files?.[0])}
        />
      </header>

      <section className="intro" id="home">
        <div>
          <p className="eyebrow">YOUR PERSONAL ARCHIVE</p>
          <h1>
            A life in <em>stories.</em>
          </h1>
        </div>
        <p className="intro-note">
          A considered little index of what you’ve watched, read, and loved.
        </p>
      </section>

      <section className="collection" aria-label="Your collection">
        <CollectionNavigation
          sheets={sheets}
          activeCollection={activeCollection}
          entryLabel={entryLabels[activeCollection]}
          canEdit={!!activeSheet && !isAddingEntry && !isEditingEntry}
          isDirty={isDirty}
          downloadLabel={`Download updated ${/\.xlsx$/i.test(fileName) ? "XLSX" : "XML"}`}
          search={search}
          onSelectCollection={(kind) => {
            setActiveCollection(kind);
            setSearch("");
            setIsAddingEntry(false);
            setIsEditingEntry(false);
          }}
          onAddEntry={() => setIsAddingEntry(true)}
          onDownload={downloadWorkbook}
          onSearchChange={setSearch}
        />

        <div
          className="table-wrap"
          id="collection-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeCollection}`}
        >
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {activeSheet && activeSheet.headers.length > 0 ? (
            <>
              {isAddingEntry && (
                <EntryForm
                  headers={activeSheet.headers}
                  titleHeader={titleHeader}
                  entryLabel={entryLabels[activeCollection]}
                  purchasePlaces={purchasePlaces}
                  onCancel={() => setIsAddingEntry(false)}
                  onSubmit={addEntry}
                />
              )}
              <div className="result-line">
                <span>{activeSheet.name}</span>
                <span>
                  {visibleItems.length}{" "}
                  {visibleItems.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              {visibleItems.length > 0 ? (
                <EntriesTable
                  key={activeCollection}
                  headers={activeSheet.headers}
                  items={visibleItems}
                  titleHeader={titleHeader}
                  entryLabel={entryLabels[activeCollection]}
                  sortEnabled={activeCollection !== "series"}
                  purchasePlaces={purchasePlaces}
                  onDelete={deleteEntry}
                  onUpdate={updateEntry}
                  onEditingChange={setIsEditingEntry}
                />
              ) : (
                <div className="empty-state">
                  <span className="empty-mark" aria-hidden="true">
                    ⌕
                  </span>
                  <h2>
                    {activeSheet.items.length === 0
                      ? "No entries yet"
                      : "No matching entries"}
                  </h2>
                  <p>
                    {activeSheet.items.length === 0
                      ? `Add a ${entryLabels[activeCollection]} to start this collection.`
                      : "Try another search, or clear the field to see everything."}
                  </p>
                  {activeSheet.items.length === 0 && (
                    <button
                      className="text-button"
                      onClick={() => setIsAddingEntry(true)}
                    >
                      Add a {entryLabels[activeCollection]}{" "}
                      <span aria-hidden="true">＋</span>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">
                ＋
              </span>
              <h2>
                {activeSheet
                  ? "This sheet is empty"
                  : `No ${collectionLabels[activeCollection].toLowerCase()} sheet found`}
              </h2>
              <p>
                Use an Excel XML or .xlsx workbook with a named{" "}
                {collectionLabels[activeCollection].toLowerCase()} sheet and a
                header row.
              </p>
              <button
                className="text-button"
                onClick={() => fileInput.current?.click()}
              >
                Choose an XML file <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>READ, WATCH, REMEMBER.</span>
        <span>
          XML COLLECTION INDEX <i /> {sheets.length} SHEETS
        </span>
      </footer>
    </main>
  );
}
