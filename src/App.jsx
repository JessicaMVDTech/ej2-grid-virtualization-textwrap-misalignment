import React, { useMemo, useRef } from 'react';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  VirtualScroll,
  Resize,
  Reorder,
  Sort,
  Filter,
} from '@syncfusion/ej2-react-grids';

import '@syncfusion/ej2-base/styles/bootstrap5.css';
import '@syncfusion/ej2-buttons/styles/bootstrap5.css';
import '@syncfusion/ej2-calendars/styles/bootstrap5.css';
import '@syncfusion/ej2-dropdowns/styles/bootstrap5.css';
import '@syncfusion/ej2-inputs/styles/bootstrap5.css';
import '@syncfusion/ej2-navigations/styles/bootstrap5.css';
import '@syncfusion/ej2-popups/styles/bootstrap5.css';
import '@syncfusion/ej2-grids/styles/bootstrap5.css';

// Same idea as the app's real `templateMultiLookup` cell renderer:
// joins a list of related-entity names with "; " and truncates after 4
// items with "...". Used on columns that are NOT given an explicit
// `width`, exactly like `Controllers`, `SubContractorCompany` and
// `ContractingCompanies` in the production column config.
function multiValueTemplate(field, max = 4) {
  return (row) => {
    const items = row[field] || [];
    if (!items.length) return <span>-</span>;
    const shown = items.slice(0, max).join('; ');
    const text = items.length > max ? `${shown}...` : shown;
    return <span title={items.join('; ')}>{text}</span>;
  };
}

// Fully made-up placeholder names — not tied to any real company.
const NAME_POOL = [
  'Comercial Aurora SA', 'Distribuidora Boreal SRL', 'Constructora Cedro SA',
  'Logistica Delta Ltda', 'Transportes Elipse SRL', 'Servicios Fenix SA',
  'Agroindustrial Girasol SA', 'Metalurgica Halcon SRL', 'Ingenieria Ibis SA',
  'Papelera Jazmin SA', 'Quimica Kairos SRL', 'Forestal Lirio SA',
  'Minera Meridian SA', 'Naviera Norte SRL', 'Energetica Orion SA',
];

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomList(pool, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array.from({ length: count }, () => randomFrom(pool));
}

const SUBCONTRATO_OPTIONS = ['No', 'Especifico', 'Multiple'];

// Large row count so virtualization has real scroll batches to churn through.
function buildData(count = 1200) {
  return Array.from({ length: count }, (_, i) => {
    const id = 100 + i;
    const subContractorCompany = randomFrom(SUBCONTRATO_OPTIONS);
    return {
      id,
      legalName: `${randomFrom(NAME_POOL)} #${id}`,
      // Variable-length arrays -> variable wrapped-row height while
      // rowHeight is fixed and virtualization is on.
      controllers: randomList(NAME_POOL, 0, 9),
      subContractorCompany,
      contractingCompanies:
        subContractorCompany === 'No' ? [] : randomList(NAME_POOL, 1, 8),
      documentsOk: Math.random() > 0.4,
      vendorId: subContractorCompany === 'No' ? '0' : String(200000000 + id),
      taxCode: String(110000000000 + id * 37),
      mainCompanies: randomList(NAME_POOL, 0, 5),
    };
  });
}

export default function App() {
  const gridRef = useRef(null);
  const data = useMemo(() => buildData(), []);

  const onDataBound = () => {
    // Same call the production `dataBound` handler makes after every
    // bind, right after virtualization has rendered its row batch.
    if (gridRef.current) {
      gridRef.current.autoFitColumns();
    }
  };

  return (
    <div className="app">
      <h2>EJ2 React Grid — rows appear shifted / misaligned</h2>
      <div className="notice">
        <b>Repro:</b> <code>enableVirtualization</code> + fixed{' '}
        <code>rowHeight=36</code> + <code>allowTextWrap</code> (
        <code>wrapMode: "Content"</code>) + template columns with variable-length
        content and <b>no explicit width</b> (Contralor / Empresas contratantes
        habilitadas), plus <code>autoFitColumns()</code> called from{' '}
        <code>dataBound</code>. Scroll the grid up/down a few times, then
        resize or sort a column — rows and header cells drift out of
        alignment with their column, and some rows overlap/clip their
        neighbor once a wrapped multi-line cell is virtualized back into
        view. Expected: rows always stay aligned to their column and to
        adjacent rows regardless of wrapped content or scroll position.
      </div>

      <GridComponent
        ref={gridRef}
        dataSource={data}
        height={550}
        allowFiltering={true}
        allowReordering={true}
        allowResizing={true}
        allowSorting={true}
        allowTextWrap={true}
        textWrapSettings={{ wrapMode: 'Content' }}
        enableVirtualization={true}
        enableStickyHeader={true}
        rowHeight={36}
        dataBound={onDataBound}
      >
        <ColumnsDirective>
          <ColumnDirective field="id" headerText="Id" width="150" isPrimaryKey={true} />
          <ColumnDirective field="legalName" headerText="Razon social" width="220" />
          <ColumnDirective
            field="controllers"
            headerText="Contralor"
            template={multiValueTemplate('controllers')}
            allowSorting={false}
            allowGrouping={false}
          />
          <ColumnDirective field="subContractorCompany" headerText="Subcontrato" />
          <ColumnDirective
            field="contractingCompanies"
            headerText="Empresas contratantes habilitadas"
            template={multiValueTemplate('contractingCompanies')}
            allowSorting={false}
            allowGrouping={false}
          />
          <ColumnDirective
            field="documentsOk"
            headerText="Acceso permitido"
            type="boolean"
            displayAsCheckBox={true}
            width="150"
          />
          <ColumnDirective field="vendorId" headerText="Número SAP" width="150" />
          <ColumnDirective field="taxCode" headerText="RUT" width="150" />
          <ColumnDirective
            field="mainCompanies"
            headerText="Código"
            template={multiValueTemplate('mainCompanies')}
            width="150"
            allowSorting={false}
            allowGrouping={false}
          />
        </ColumnsDirective>
        <Inject services={[VirtualScroll, Resize, Reorder, Sort, Filter]} />
      </GridComponent>
    </div>
  );
}
