# Commonplace

A React + TypeScript app for browsing a personal collection stored in an Excel SpreadsheetML XML or `.xlsx` workbook.

## Run locally

```sh
npm install
npm run dev
```

Use **Open workbook** to load an Excel SpreadsheetML XML or `.xlsx` workbook. The app looks for worksheets named Movies (or Films), Books, and TV Series (or Shows). The first row in each sheet is used as the table header. The included `src/data/sample.xml` demonstrates the XML format.

Each sheet includes **Purchase place**, **Price**, and **Purchase date** fields. Movies and TV Series also include **Digitalize**, checked as `X`. On any collection tab, use **Add**, **Update**, or a row's **Delete** action to edit that sheet. Download exports all sheets as a new `*-updated.xml` or `*-updated.xlsx` file; browsers do not allow the app to overwrite the selected source file directly. XLSX import/export preserves sheet names and cell values, but not workbook formatting, formulas, or other Excel-specific features.

On the Movies and Books tabs, select the **Title** or **Year** column heading to sort ascending or descending.

Build for production with `npm run build`.
