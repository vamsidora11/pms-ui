import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
interface DataGridProps<T> {
  columns: ColDef<T>[];
  data: T[];
}

export default function DataGrid<T>({
  columns,
  data,
}: DataGridProps<T>) {
  return (
    <div className="ag-theme-alpine w-full">
      <AgGridReact<T>
        rowData={data}
        columnDefs={columns}

        /* ✅ PAGINATION */
        pagination={true}
        paginationPageSize={5}

        /* ✅ HIDE PAGE SIZE SELECTOR (THIS IS THE KEY) */
        paginationPageSizeSelector={false}

        domLayout="autoHeight"
        headerHeight={44}
        rowHeight={56}

        suppressCellFocus
        suppressRowClickSelection

        defaultColDef={{
          sortable: true,
          filter: true,
          floatingFilter: false,
          resizable: false,
        }}
      />
    </div>
  );
}
