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
  Edit,
  Toolbar,
} from '@syncfusion/ej2-react-grids';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { CheckBoxComponent } from '@syncfusion/ej2-react-buttons';

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

const USER_POOL = ['usuario1', 'usuario2', 'usuario3', 'admin1', 'admin2'];
const FREQUENCY_OPTIONS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomList(pool, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array.from({ length: count }, () => randomFrom(pool));
}

function randomDate(startYear = 2022) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = Date.now();
  return new Date(start + Math.random() * (end - start));
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
      // Mirrors the real "Companies" column block: ModifiedUser (visible)
      // -> CreatedUser (visible:false) -> ModifiedDate (visible)
      // -> CreatedDate (visible:false) -> FieldAudit (visible)
      // -> AuditComplianceRH (visible). The two hidden columns sit
      // between visible ones, which is the exact neighborhood where the
      // report shows a hidden column's value leaking into a visible
      // column's cell under virtualization.
      modifiedUser: `sistema\\${randomFrom(USER_POOL)}`,
      createdUser: `sistema\\${randomFrom(USER_POOL)}`, // hidden column
      modifiedDate: randomDate(2024),
      createdDate: randomDate(2022), // hidden column
      fieldAudit: randomFrom(FREQUENCY_OPTIONS),
      auditComplianceRH: randomFrom(FREQUENCY_OPTIONS),
    };
  });
}

// Simplified stand-in for the app's real dialog-mode edit template
// (a custom form component passed to `editSettings.template`, instead
// of the grid's auto-generated edit fields). The real one is a
// multi-tab form wired to app-specific contexts/permissions; this
// keeps just the shape that matters for the grid config: Dialog mode
// + a custom template component.
function CompanyEditTemplate(props) {
  return (
    <div className="edit-template">
      <div className="edit-title">
        {props.id ? `Editar contratista #${props.id}` : 'Nuevo contratista'}
      </div>
      <div className="edit-row">
        <TextBoxComponent
          id="legalName"
          name="legalName"
          value={props.legalName}
          placeholder="Razon social"
          floatLabelType="Auto"
        />
      </div>
      <div className="edit-row">
        <DropDownListComponent
          id="subContractorCompany"
          name="subContractorCompany"
          dataSource={SUBCONTRATO_OPTIONS}
          value={props.subContractorCompany}
          placeholder="Subcontrato"
          floatLabelType="Auto"
        />
      </div>
      <div className="edit-row two-col">
        <TextBoxComponent
          id="vendorId"
          name="vendorId"
          value={props.vendorId}
          placeholder="Número SAP"
          floatLabelType="Auto"
        />
        <TextBoxComponent
          id="taxCode"
          name="taxCode"
          value={props.taxCode}
          placeholder="RUT"
          floatLabelType="Auto"
        />
      </div>
      <div className="edit-row">
        <CheckBoxComponent
          id="documentsOk"
          name="documentsOk"
          label="Acceso permitido"
          checked={props.documentsOk}
        />
      </div>
    </div>
  );
}

export default function App() {
  const gridRef = useRef(null);
  const data = useMemo(() => buildData(), []);

  // Same filterSettings the production grid passes to GridComponent.
  const filterSettings = {
    enableInfiniteScrolling: true,
    type: 'Excel',
    ignoreAccent: true,
    columns: [],
  };

  const editSettings = {
    mode: 'Dialog',
    allowAdding: true,
    allowDeleting: true,
    allowEditing: true,
    allowEditOnDblClick: true,
    showDeleteConfirmDialog: true,
    template: (props) => <CompanyEditTemplate {...props} />,
  };

  const onDataBound = () => {
    // Same call the production `dataBound` handler makes after every
    // bind, right after virtualization has rendered its row batch.
    if (gridRef.current) {
      gridRef.current.autoFitColumns();
    }
  };

  return (
    <div className="app">
      <h2>EJ2 React Grid — hidden column leaks into a visible column's cell</h2>
      <div className="notice">
        <b>Repro:</b> two <code>visible: false</code> columns (
        <code>createdUser</code>, <code>createdDate</code>) sit between
        visible ones — same layout as our production "Companies" grid:
        ModifiedUser → <i>CreatedUser (hidden)</i> → ModifiedDate →{' '}
        <i>CreatedDate (hidden)</i> → FieldAudit → AuditComplianceRH — under{' '}
        <code>enableVirtualization</code> + <code>autoFitColumns()</code>{' '}
        called on every <code>dataBound</code>. Scroll up/down repeatedly,
        sort, and use the search box a lot to force many virtualized
        row-batch swaps. Watch the "Auditoría de campo" / "Auditoría
        fiscalización de RH" columns: expected is always a frequency value
        (Mensual/Trimestral/Semestral/Anual) under each header. The bug is a
        date value (from the hidden CreatedDate column) appearing under
        "Auditoría de campo" instead, with every value after it shifted one
        column to the right relative to the header row.
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
        filterSettings={filterSettings}
        editSettings={editSettings}
        toolbar={['Edit', 'Delete', 'Search']}
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
            filter={{ type: 'CheckBox' }}
            allowSorting={false}
            allowGrouping={false}
          />
          <ColumnDirective field="subContractorCompany" headerText="Subcontrato" />
          <ColumnDirective
            field="contractingCompanies"
            headerText="Empresas contratantes habilitadas"
            template={multiValueTemplate('contractingCompanies')}
            filter={{ type: 'CheckBox' }}
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
            filter={{ type: 'CheckBox' }}
            width="150"
            allowSorting={false}
            allowGrouping={false}
          />
          <ColumnDirective field="modifiedUser" headerText="Modificado por" width="150" />
          <ColumnDirective
            field="createdUser"
            headerText="Creado por"
            width="150"
            visible={false}
          />
          <ColumnDirective
            field="modifiedDate"
            headerText="Fecha modificado"
            type="dateTime"
            format="dd/MM/yyyy"
            width="150"
          />
          <ColumnDirective
            field="createdDate"
            headerText="Fecha creado"
            type="dateTime"
            format="dd/MM/yyyy"
            width="150"
            visible={false}
          />
          <ColumnDirective field="fieldAudit" headerText="Auditoría de campo" width="150" />
          <ColumnDirective
            field="auditComplianceRH"
            headerText="Auditoría fiscalización de RH"
            width="150"
          />
        </ColumnsDirective>
        <Inject
          services={[VirtualScroll, Resize, Reorder, Sort, Filter, Edit, Toolbar]}
        />
      </GridComponent>
    </div>
  );
}
