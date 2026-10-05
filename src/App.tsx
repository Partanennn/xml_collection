import { type FormEvent, useMemo, useRef, useState } from "react";
import sampleWorkbook from "./data/sample.xml?raw";
import {
  collectionLabels,
  getSheetForCollection,
  parseSpreadsheetXml,
  serializeSpreadsheetXml,
  type CollectionKind,
  type CollectionSheet,
} from "./lib/spreadsheetXml";

const collections: CollectionKind[] = ["movies", "books", "series"];
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
  const [entryDraft, setEntryDraft] = useState<Record<string, string>>({});
  const [editingEntry, setEditingEntry] = useState<Record<
    string,
    string
  > | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
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
      setIsDirty(false);
      setIsAddingEntry(false);
      setEditingEntry(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not read this XML file.",
      );
    }
  }

  function startAddingEntry() {
    setEditingEntry(null);
    setEntryDraft(
      Object.fromEntries(
        (activeSheet?.headers ?? []).map((header) => [header, ""]),
      ),
    );
    setIsAddingEntry(true);
  }

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSheet) return;

    const entry = Object.fromEntries(
      activeSheet.headers.map((header) => [
        header,
        entryDraft[header]?.trim() ?? "",
      ]),
    );
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

  function startUpdatingEntry(entry: Record<string, string>) {
    setIsAddingEntry(false);
    setEditingEntry(entry);
    setEditDraft({ ...entry });
    setError("");
  }

  function saveUpdatedEntry() {
    if (!activeSheet || !editingEntry) return;
    const updatedEntry = Object.fromEntries(
      activeSheet.headers.map((header) => [
        header,
        editDraft[header]?.trim() ?? "",
      ]),
    );
    if (!updatedEntry[titleHeader]) {
      setError(`${titleHeader} is required.`);
      return;
    }

    setSheets((current) =>
      current.map((sheet) =>
        sheet === activeSheet
          ? {
              ...sheet,
              items: sheet.items.map((item) =>
                item === editingEntry ? updatedEntry : item,
              ),
            }
          : sheet,
      ),
    );
    setEditingEntry(null);
    setIsDirty(true);
    setError("");
  }

  function cancelUpdatingEntry() {
    setEditingEntry(null);
    setError("");
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

  function downloadWorkbook() {
    const blob = new Blob([serializeSpreadsheetXml(sheets)], {
      type: "application/xml",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.xml$/i, "")}-updated.xml`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setIsDirty(false);
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
                    setIsAddingEntry(false);
                    setEditingEntry(null);
                  }}
                >
                  <span className="tab-index">0{index + 1}</span>
                  {collectionLabels[kind]}
                  <span className="tab-count">{sheet?.items.length ?? 0}</span>
                </button>
              );
            })}
          </div>
          <div className="collection-tools">
            {activeSheet && (
              <button
                className="text-button add-entry-button"
                onClick={startAddingEntry}
                disabled={isAddingEntry || editingEntry !== null}
              >
                <span aria-hidden="true">＋</span> Add{" "}
                {entryLabels[activeCollection]}
              </button>
            )}
            {isDirty && (
              <button
                className="text-button download-button"
                onClick={downloadWorkbook}
              >
                <span aria-hidden="true">↓</span> Download updated XML
              </button>
            )}
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
              {isAddingEntry && (
                <form className="entry-form" onSubmit={addEntry}>
                  <div className="entry-form-heading">
                    <h2>New {entryLabels[activeCollection]}</h2>
                    <button
                      type="button"
                      className="form-cancel"
                      onClick={() => setIsAddingEntry(false)}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="entry-fields">
                    {activeSheet.headers.map((header) => (
                      <label key={header}>
                        <span>{header}</span>
                        <input
                          autoFocus={header === titleHeader}
                          required={header === titleHeader}
                          value={entryDraft[header] ?? ""}
                          onChange={(event) =>
                            setEntryDraft((current) => ({
                              ...current,
                              [header]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button className="upload-button" type="submit">
                    Add to collection
                  </button>
                </form>
              )}
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
                        <th className="actions-heading">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map((item, index) => {
                        const isEditing = editingEntry === item;
                        return (
                          <tr key={`${activeSheet.name}-${index}`}>
                            <td className="row-number">
                              {String(index + 1).padStart(2, "0")}
                            </td>
                            {activeSheet.headers.map((header) => (
                              <td key={header}>
                                {isEditing ? (
                                  <input
                                    className="row-edit-input"
                                    aria-label={`Update ${header}`}
                                    autoFocus={header === titleHeader}
                                    value={editDraft[header] ?? ""}
                                    onChange={(event) =>
                                      setEditDraft((current) => ({
                                        ...current,
                                        [header]: event.target.value,
                                      }))
                                    }
                                  />
                                ) : (
                                  item[header] || (
                                    <span className="empty-cell">—</span>
                                  )
                                )}
                              </td>
                            ))}
                            <td className="actions-cell">
                              {isEditing ? (
                                <div className="row-edit-actions">
                                  <button
                                    className="row-action-button save-row-button"
                                    aria-label={`Save update to ${editDraft[titleHeader] || entryLabels[activeCollection]}`}
                                    onClick={saveUpdatedEntry}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="row-action-button cancel-row-button"
                                    onClick={cancelUpdatingEntry}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="row-edit-actions">
                                  <button
                                    className="row-action-button"
                                    aria-label={`Update ${item[titleHeader] || entryLabels[activeCollection]}`}
                                    onClick={() => startUpdatingEntry(item)}
                                  >
                                    Update
                                  </button>
                                  <button
                                    className="delete-button"
                                    aria-label={`Delete ${item[titleHeader] || entryLabels[activeCollection]}`}
                                    onClick={() => deleteEntry(item)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                    <button className="text-button" onClick={startAddingEntry}>
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
