# EJ2 React Grid — filas/columnas se ven "corridas" (misalignment)

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
  dataBound={() => gridRef.current.autoFitColumns()}
>
```

Two columns (`Contralor`, `Empresas contratantes habilitadas`) render a
custom `template` that joins a variable number of related-entity names
(0–9 items) and have **no explicit `width`**, unlike the rest of the
columns which are all fixed at `width="150"`.

## Steps to reproduce

1. Open the grid (1200 generated rows, similar order of magnitude to our production dataset).
2. Scroll down and back up a few times using the mouse wheel / scrollbar.
3. Resize the "Razon social" column, or sort by "Id".
4. Observe rows near the viewport edges right after a virtual-scroll
   batch renders.

## Expected behavior

Rows stay aligned to their column headers and to each other regardless
of how many lines a wrapped template cell renders, and regardless of
scroll position / resizing / sorting.

## Actual behavior

Because `enableVirtualization` positions each row using the fixed
`rowHeight` (36px), but `allowTextWrap` + the multi-value template can
make a cell's real rendered height taller (2–3 lines) than 36px, row
offsets computed by the virtualization engine fall out of sync with
the actual DOM row heights. This shows up as:

- rows overlapping or leaving a gap right after they scroll into view,
- header cells drifting out of alignment with their body column,
  especially after `autoFitColumns()` runs post-bind on columns that
  have no explicit width.

## Suspected root cause

Virtualization's row-offset math assumes a uniform `rowHeight`, so it
does not account for cells whose content wraps to more than one line.
Combined with `autoFitColumns()` recalculating widths for columns that
were never given an explicit width, the header and body column tracks
can end up computed from different sets of measurements on the same
data-bound cycle.

## Workarounds considered

- Removing `enableVirtualization` fixes the misalignment but is not
  viable for us — the grid needs to handle 1000+ rows without paging.
- Removing `allowTextWrap` on the affected columns avoids the wrapped
  multi-line case but truncates data our users need to see.
