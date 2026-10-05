# Commonplace

A React + TypeScript app for browsing a personal collection stored in an Excel SpreadsheetML XML workbook.

## Run locally

```sh
npm install
npm run dev
```

Use **Open XML** to load a workbook. The app looks for worksheets named Movies (or Films), Books, and TV Series (or Shows). The first row in each sheet is used as the table header. The included `src/data/sample.xml` demonstrates the expected Excel 2003 XML format.

Build for production with `npm run build`.
