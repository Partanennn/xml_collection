# Commonplace

A React + TypeScript app for browsing a personal collection stored in an Excel SpreadsheetML XML or `.xlsx` workbook.

## Run locally

```sh
npm install
npm run dev
```

Use **Open workbook** to load an Excel SpreadsheetML XML or `.xlsx` workbook. The app looks for worksheets named Movies (or Films), Books, and TV Series (or Shows). The first row in each sheet is used as the table header. The included `src/data/sample.xml` demonstrates the XML format.

Each sheet includes **Purchase place**, **Price**, **Purchase date**, and a **New** checkbox, stored as `X` when checked. Price accepts non-negative numbers in increments of `0.01` and is saved to two decimal places. Movies and TV Series also include **Digitalized** and **Bluray** checkboxes, stored as `X` when checked. Older **Digitalize** columns are migrated to **Digitalized** when loaded. On any collection tab, use **Add**, **Update**, or a row's **Delete** action to edit that sheet. Download exports all sheets as a new `*-updated.xml` or `*-updated.xlsx` file; browsers do not allow the app to overwrite the selected source file directly. XLSX import/export preserves sheet names and cell values, but not workbook formatting, formulas, or other Excel-specific features.

Entries with a **Rating** column use the choices **Awful**, **Weak**, **Decent**, **Great**, and **Exceptional**. Ratings appear as stars; hover over them to see the name.

On the Movies and Books tabs, select the **Title** or **Year** column heading to sort ascending or descending.

Build for production with `npm run build`.
