import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface DataGridProps<T> {
  columns: ColDef<T>[];
  data: T[];
}

export default function DataGrid<T>({ columns, data }: DataGridProps<T>) {
  return (
    <div className="ag-theme-alpine w-full rounded-xl overflow-hidden border border-gray-200">
      <AgGridReact<T>
        rowData={data}
        columnDefs={columns}

        /* PAGINATION (Community ✅) */
        pagination
        paginationPageSize={5}
        paginationPageSizeSelector={false}

        domLayout="autoHeight"
        headerHeight={44}
        rowHeight={56}

        suppressCellFocus
        rowSelection="single"

        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: false,
        }}
      />
    </div>
  );
}
