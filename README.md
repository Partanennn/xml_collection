# Commonplace

A React + TypeScript app for browsing a personal collection stored in an Excel SpreadsheetML XML workbook.

## Run locally

```sh
npm install
npm run dev
```

Use **Open XML** to load a workbook. The app looks for worksheets named Movies (or Films), Books, and TV Series (or Shows). The first row in each sheet is used as the table header. The included `src/data/sample.xml` demonstrates the expected Excel 2003 XML format.

Each sheet includes **Purchase place**, **Price**, and **Purchase date** fields. Movies and TV Series also include **Digitalize**, checked as `X`. On any collection tab, use **Add**, **Update**, or a row's **Delete** action to edit that sheet. **Download updated XML** exports all sheets to a new `*-updated.xml` file; browsers do not allow the app to overwrite the selected source file directly.

On the Movies and Books tabs, select the **Title** or **Year** column heading to sort ascending or descending.

Build for production with `npm run build`.
