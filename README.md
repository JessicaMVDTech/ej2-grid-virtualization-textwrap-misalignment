# EJ2 React Grid — hidden (`visible: false`) column leaks into a visible column's cell

## Environment

- `@syncfusion/ej2-react-grids`: 31.2.5
- `@syncfusion/ej2-base`: 31.2.18
- `@syncfusion/ej2-data`: 31.2.5
- React: 19.2.1
- Browser: any (reproduced on Chrome)

## Grid configuration used

```jsx
<GridComponent
  enableVirtualization={true}
  rowHeight={36}
  allowTextWrap={true}
  textWrapSettings={{ wrapMode: 'Content' }}
  allowResizing={true}
  allowReordering={true}
  allowSorting={true}
  allowFiltering={true}
  filterSettings={{ enableInfiniteScrolling: true, type: 'Excel', ignoreAccent: true, columns: [] }}
  dataBound={() => gridRef.current.autoFitColumns()}
>
```

Two columns are hidden with `visible: false` and sit between visible
ones, mirroring our production "Companies" grid column order exactly:

```
ModifiedUser (visible) -> CreatedUser (visible: false)
  -> ModifiedDate (visible) -> CreatedDate (visible: false)
  -> FieldAudit (visible) -> AuditComplianceRH (visible)
```

## Steps to reproduce

1. Open the grid (1200 generated rows).
2. Scroll down and back up repeatedly using the mouse wheel / scrollbar
   to force many virtualized row-batch swaps.
3. Sort by a column and use the search box a few times (each triggers a
   `dataBound` cycle, which also calls `autoFitColumns()`).
4. Watch the "Auditoría de campo" / "Auditoría fiscalización de RH"
   columns while scrolling.

## Expected behavior

"Auditoría de campo" and "Auditoría fiscalización de RH" always show a
frequency value (`Mensual` / `Trimestral` / `Semestral` / `Anual`) —
the two hidden columns (`CreatedUser`, `CreatedDate`) should never
occupy space or render a cell, since `visible: false`.

## Actual behavior (seen in production, on real data)

Intermittently, a row renders a `dd/MM/yyyy`-formatted date — the
hidden `CreatedDate` column's value — under the "Auditoría de campo"
header, and every column after it shifts one position to the right
relative to the header row (so "Auditoría fiscalización de RH" ends up
showing the value that belongs to "Auditoría de campo", and so on).
Screenshot from production:

- Header row: `Modificado por | Fecha modificado | Auditoría de campo | Auditoría fiscalización de RH`
- Data row: `L240SRV424\admin1 | 09/09/2026 | 04/12/2023 | Trimestral | Trimestral`

`FieldAudit.Name` and `AuditComplianceRH.Name` are string/lookup
fields — a `04/12/2023` value under "Auditoría de campo" cannot be a
legitimate value for that column; it is the hidden `CreatedDate`
column's data leaking into the row, which pushes the real
`FieldAudit`/`AuditComplianceRH` values one column to the right (the
second `Trimestral` beyond the last visible header confirms the shift,
not just a coincidental duplicate value).

## Suspected root cause

A hidden (`visible: false`) column occasionally still renders its cell
into a virtualized row — most likely because row virtualization
recycles/patches existing row DOM nodes rather than always fully
rebuilding them, and that patch cycle can fall out of sync with the
current column visibility state (particularly right after a
`dataBound`-triggered `autoFitColumns()` recalculation, or after a
scroll batch swaps in rows that were rendered/cached under a different
column-visibility pass). The header row is unaffected (it always
reflects the current visible-column list), so only the body drifts —
which is what produces the apparent "column shift" between header and
data.

## Workarounds considered

- Removing `enableVirtualization` avoids the issue but is not viable
  for us — the grid needs to handle 1000+ rows without paging.
- Removing the hidden columns entirely isn't viable — `CreatedUser` /
  `CreatedDate` are kept in the column list (hidden) so users can
  reveal them via the column chooser without losing their position.
