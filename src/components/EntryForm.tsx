import { type FormEvent, useState } from "react";
import { isPriceField, normalizeFieldValue } from "../lib/fieldValues";

function isDigitalizeField(header: string) {
  return header.toLocaleLowerCase() === "digitalize";
}

const newPurchasePlaceOption = "__add_new_purchase_place__";

interface EntryFormProps {
  headers: string[];
  titleHeader: string;
  entryLabel: string;
  purchasePlaces: string[];
  onCancel: () => void;
  onSubmit: (entry: Record<string, string>) => void;
}

export default function EntryForm({
  headers,
  titleHeader,
  entryLabel,
  purchasePlaces,
  onCancel,
  onSubmit,
}: EntryFormProps) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(headers.map((header) => [header, ""])),
  );
  const [isEnteringNewPurchasePlace, setIsEnteringNewPurchasePlace] =
    useState(false);
  const [newPurchasePlace, setNewPurchasePlace] = useState("");

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(
      Object.fromEntries(
        headers.map((header) => [
          header,
          header.trim().toLocaleLowerCase() === "purchase place" &&
          isEnteringNewPurchasePlace
            ? newPurchasePlace.trim()
            : normalizeFieldValue(header, draft[header] ?? ""),
        ]),
      ),
    );
  }

  return (
    <form className="entry-form" onSubmit={submitEntry}>
      <div className="entry-form-heading">
        <h2>New {entryLabel}</h2>
        <button type="button" className="form-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="entry-fields">
        {headers.map((header) => (
          <label key={header}>
            <span>{header}</span>
            {isDigitalizeField(header) ? (
              <input
                type="checkbox"
                checked={draft[header] === "X"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [header]: event.target.checked ? "X" : "",
                  }))
                }
              />
            ) : header.trim().toLocaleLowerCase() === "purchase place" ? (
              <>
                <select
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
                      [header]: value === newPurchasePlaceOption ? "" : value,
                    }));
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
                    autoFocus
                    required
                    aria-label="New purchase place"
                    placeholder="Enter a new place"
                    value={newPurchasePlace}
                    onChange={(event) =>
                      setNewPurchasePlace(event.target.value)
                    }
                  />
                )}
              </>
            ) : isPriceField(header) ? (
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={draft[header] ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [header]: event.target.value,
                  }))
                }
                onBlur={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [header]: normalizeFieldValue(header, event.target.value),
                  }))
                }
              />
            ) : (
              <input
                autoFocus={header === titleHeader}
                required={header === titleHeader}
                value={draft[header] ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [header]: event.target.value,
                  }))
                }
              />
            )}
          </label>
        ))}
      </div>
      <button className="upload-button" type="submit">
        Add to collection
      </button>
    </form>
  );
}
