import {
  collectionLabels,
  getSheetForCollection,
  type CollectionKind,
  type CollectionSheet,
} from "../lib/spreadsheetXml";

const collections: CollectionKind[] = ["movies", "books", "series"];

interface CollectionNavigationProps {
  sheets: CollectionSheet[];
  activeCollection: CollectionKind;
  entryLabel: string;
  canEdit: boolean;
  isDirty: boolean;
  downloadLabel: string;
  search: string;
  onSelectCollection: (collection: CollectionKind) => void;
  onAddEntry: () => void;
  onDownload: () => void;
  onSearchChange: (value: string) => void;
}

export default function CollectionNavigation({
  sheets,
  activeCollection,
  entryLabel,
  canEdit,
  isDirty,
  downloadLabel,
  search,
  onSelectCollection,
  onAddEntry,
  onDownload,
  onSearchChange,
}: CollectionNavigationProps) {
  return (
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
              onClick={() => onSelectCollection(kind)}
            >
              <span className="tab-index">0{index + 1}</span>
              {collectionLabels[kind]}
              <span className="tab-count">{sheet?.items.length ?? 0}</span>
            </button>
          );
        })}
      </div>
      <div className="collection-tools">
        <button
          className="text-button add-entry-button"
          onClick={onAddEntry}
          disabled={!canEdit}
        >
          <span aria-hidden="true">＋</span> Add {entryLabel}
        </button>
        {isDirty && (
          <button className="text-button download-button" onClick={onDownload}>
            <span aria-hidden="true">↓</span> {downloadLabel}
          </button>
        )}
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder={`Search ${collectionLabels[activeCollection].toLowerCase()}…`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={`Search ${collectionLabels[activeCollection]}`}
            disabled={!canEdit}
          />
          <kbd>/</kbd>
        </label>
      </div>
    </div>
  );
}
