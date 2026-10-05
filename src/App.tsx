import { useMemo, useRef, useState } from "react";
import sampleWorkbook from "./data/sample.xml?raw";
import {
  collectionLabels,
  getSheetForCollection,
  parseSpreadsheetXml,
  type CollectionKind,
  type CollectionSheet,
} from "./lib/spreadsheetXml";

const collections: CollectionKind[] = ["movies", "books", "series"];

export default function App() {
  const [sheets, setSheets] = useState<CollectionSheet[]>(() =>
    parseSpreadsheetXml(sampleWorkbook),
  );
  const [activeCollection, setActiveCollection] =
    useState<CollectionKind>("movies");
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("sample-collection.xml");
  const [error, setError] = useState("");
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

  async function loadFile(file?: File) {
    if (!file) return;
    try {
      const parsedSheets = parseSpreadsheetXml(await file.text());
      setSheets(parsedSheets);
      setFileName(file.name);
      setSearch("");
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not read this XML file.",
      );
    }
  }

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
          <span aria-hidden="true">↑</span> Open XML
        </button>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept=".xml,text/xml,application/xml"
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
        <div className="collection-heading">
          <div className="tabs" role="tablist" aria-label="Collection type">
            {collections.map((kind, index) => {
              const sheet = getSheetForCollection(sheets, kind);
              const selected = activeCollection === kind;
              return (
                <button
                  key={kind}
                  className={`tab${selected ? " active" : ""}`}
                  id={`tab-${kind}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls="collection-panel"
                  onClick={() => {
                    setActiveCollection(kind);
                    setSearch("");
                  }}
                >
                  <span className="tab-index">0{index + 1}</span>
                  {collectionLabels[kind]}
                  <span className="tab-count">{sheet?.items.length ?? 0}</span>
                </button>
              );
            })}
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder={`Search ${collectionLabels[activeCollection].toLowerCase()}…`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label={`Search ${collectionLabels[activeCollection]}`}
            />
            <kbd>/</kbd>
          </label>
        </div>

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
              <div className="result-line">
                <span>{activeSheet.name}</span>
                <span>
                  {visibleItems.length}{" "}
                  {visibleItems.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              {visibleItems.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="row-number">NO.</th>
                        {activeSheet.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map((item, index) => (
                        <tr key={`${activeSheet.name}-${index}`}>
                          <td className="row-number">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          {activeSheet.headers.map((header) => (
                            <td key={header}>
                              {item[header] || (
                                <span className="empty-cell">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-mark" aria-hidden="true">
                    ⌕
                  </span>
                  <h2>No matching entries</h2>
                  <p>
                    Try another search, or clear the field to see everything.
                  </p>
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
                Use an Excel XML workbook with a named{" "}
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
