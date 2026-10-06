import { type FormEvent, useState } from "react";

function isDigitalizeField(header: string) {
  return header.toLocaleLowerCase() === "digitalize";
}

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

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(
      Object.fromEntries(
        headers.map((header) => [header, draft[header]?.trim() ?? ""]),
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
              <select
                value={draft[header] ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [header]: event.target.value,
                  }))
                }
              >
                <option value="">Select a purchase place</option>
                {purchasePlaces.map((place) => (
                  <option key={place} value={place}>
                    {place}
                  </option>
                ))}
              </select>
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
