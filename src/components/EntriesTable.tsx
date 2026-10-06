import { useState } from "react";

function isDigitalizeField(header: string) {
  return header.toLocaleLowerCase() === "digitalize";
}

const newPurchasePlaceOption = "__add_new_purchase_place__";

interface EntriesTableProps {
  headers: string[];
  items: Array<Record<string, string>>;
  titleHeader: string;
  entryLabel: string;
  sortEnabled: boolean;
  purchasePlaces: string[];
  onDelete: (entry: Record<string, string>) => void;
  onUpdate: (
    original: Record<string, string>,
    updated: Record<string, string>,
  ) => void;
  onEditingChange: (isEditing: boolean) => void;
}

export default function EntriesTable({
  headers,
  items,
  titleHeader,
  entryLabel,
  sortEnabled,
  purchasePlaces,
  onDelete,
  onUpdate,
  onEditingChange,
}: EntriesTableProps) {
  const [editingEntry, setEditingEntry] = useState<Record<
    string,
    string
  > | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isEnteringNewPurchasePlace, setIsEnteringNewPurchasePlace] =
    useState(false);
  const [newPurchasePlace, setNewPurchasePlace] = useState("");
  const [sort, setSort] = useState<{
    header: string;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortedItems = sort
    ? [...items].sort((left, right) => {
        const leftValue = left[sort.header] ?? "";
        const rightValue = right[sort.header] ?? "";
        const leftYear = Number(leftValue);
        const rightYear = Number(rightValue);
        const comparison =
          /year/i.test(sort.header) &&
          Number.isFinite(leftYear) &&
          Number.isFinite(rightYear)
            ? leftYear - rightYear
            : leftValue.localeCompare(rightValue, undefined, {
                numeric: true,
                sensitivity: "base",
              });
        return sort.direction === "ascending" ? comparison : -comparison;
      })
    : items;

  function toggleSort(header: string) {
    setSort((current) => {
      if (current?.header !== header) {
        return { header, direction: "ascending" };
      }
      if (current.direction === "ascending") {
        return { header, direction: "descending" };
      }
      return null;
    });
  }

  function startEditing(entry: Record<string, string>) {
    setEditingEntry(entry);
    const purchasePlaceHeader = headers.find(
      (header) => header.trim().toLocaleLowerCase() === "purchase place",
    );
    setDraft({
      ...entry,
      ...(purchasePlaceHeader && {
        [purchasePlaceHeader]: entry[purchasePlaceHeader]?.trim() ?? "",
      }),
    });
    setIsEnteringNewPurchasePlace(false);
    setNewPurchasePlace("");
    setError("");
    onEditingChange(true);
  }

  function cancelEditing() {
    setEditingEntry(null);
    setIsEnteringNewPurchasePlace(false);
    setNewPurchasePlace("");
    setError("");
    onEditingChange(false);
  }

  function saveEditing() {
    if (!editingEntry) return;
    const purchasePlaceHeader = headers.find(
      (header) => header.trim().toLocaleLowerCase() === "purchase place",
    );
    if (isEnteringNewPurchasePlace && !newPurchasePlace.trim()) {
      setError("Enter a purchase place.");
      return;
    }
    const updated = Object.fromEntries(
      headers.map((header) => [
        header,
        header === purchasePlaceHeader && isEnteringNewPurchasePlace
          ? newPurchasePlace.trim()
          : (draft[header]?.trim() ?? ""),
      ]),
    );
    if (!updated[titleHeader]) {
      setError(`${titleHeader} is required.`);
      return;
    }

    onUpdate(editingEntry, updated);
    setEditingEntry(null);
    setIsEnteringNewPurchasePlace(false);
    setNewPurchasePlace("");
    setError("");
    onEditingChange(false);
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th className="row-number">NO.</th>
            {headers.map((header) => {
              const isSortable =
                sortEnabled && (header === titleHeader || /year/i.test(header));
              const direction = sort?.header === header ? sort.direction : null;
              return (
                <th
                  key={header}
                  aria-sort={direction ?? "none"}
                  className={isSortable ? "sortable-heading" : undefined}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className="sort-button"
                      aria-label={`Sort by ${header}${direction ? `, ${direction === "ascending" ? "descending" : "ascending"} next` : ", ascending"}`}
                      onClick={() => toggleSort(header)}
                    >
                      {header}
                      <span aria-hidden="true">
                        {direction === "ascending"
                          ? "↑"
                          : direction === "descending"
                            ? "↓"
                            : "↕"}
                      </span>
                    </button>
                  ) : (
                    header
                  )}
                </th>
              );
            })}
            <th className="actions-heading">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => {
            const isEditing = editingEntry === item;
            return (
              <tr key={`${item[titleHeader]}-${index}`}>
                <td className="row-number">
                  {String(index + 1).padStart(2, "0")}
                </td>
                {headers.map((header) => (
                  <td key={header}>
                    {isEditing ? (
                      isDigitalizeField(header) ? (
                        <input
                          type="checkbox"
                          className="row-edit-input digitalize-checkbox"
                          aria-label={`Update ${header}`}
                          checked={draft[header] === "X"}
                          onChange={(event) => {
                            setDraft((current) => ({
                              ...current,
                              [header]: event.target.checked ? "X" : "",
                            }));
                            setError("");
                          }}
                        />
                      ) : header.trim().toLocaleLowerCase() ===
                        "purchase place" ? (
                        <div className="purchase-place-editor">
                          <select
                            className="row-edit-select"
                            aria-label={`Update ${header}`}
                            value={
                              isEnteringNewPurchasePlace
                                ? newPurchasePlaceOption
                                : (draft[header] ?? "")
                            }
                            onChange={(event) => {
                              const value = event.target.value;
                              setIsEnteringNewPurchasePlace(
                                value === newPurchasePlaceOption,
                              );
                              setNewPurchasePlace("");
                              setDraft((current) => ({
                                ...current,
                                [header]:
                                  value === newPurchasePlaceOption ? "" : value,
                              }));
                              setError("");
                            }}
                          >
                            <option value="">Select a purchase place</option>
                            {purchasePlaces.map((place) => (
                              <option key={place} value={place}>
                                {place}
                              </option>
                            ))}
                            <option value={newPurchasePlaceOption}>
                              Add a new place…
                            </option>
                          </select>
                          {isEnteringNewPurchasePlace && (
                            <input
                              className="row-edit-input new-purchase-place-input"
                              aria-label="New purchase place"
                              placeholder="Enter a new place"
                              value={newPurchasePlace}
                              onChange={(event) => {
                                setNewPurchasePlace(event.target.value);
                                setError("");
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          className="row-edit-input"
                          aria-label={`Update ${header}`}
                          autoFocus={header === titleHeader}
                          value={draft[header] ?? ""}
                          onChange={(event) => {
                            setDraft((current) => ({
                              ...current,
                              [header]: event.target.value,
                            }));
                            setError("");
                          }}
                        />
                      )
                    ) : (
                      item[header] || <span className="empty-cell">—</span>
                    )}
                  </td>
                ))}
                <td className="actions-cell">
                  {isEditing ? (
                    <div className="row-edit-actions">
                      <button
                        className="row-action-button save-row-button"
                        aria-label={`Save update to ${draft[titleHeader] || entryLabel}`}
                        onClick={saveEditing}
                      >
                        Save
                      </button>
                      <button
                        className="row-action-button cancel-row-button"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="row-edit-actions">
                      <button
                        className="row-action-button"
                        aria-label={`Update ${item[titleHeader] || entryLabel}`}
                        onClick={() => startEditing(item)}
                      >
                        Update
                      </button>
                      <button
                        className="delete-button"
                        aria-label={`Delete ${item[titleHeader] || entryLabel}`}
                        onClick={() => onDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {isEditing && error && (
                    <span className="update-error" role="alert">
                      {error}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
