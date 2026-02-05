import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataGridProps<T> {
  columns: ColDef<T>[];
  data: T[];
  onRowClicked?: (data: T) => void;
}

export default function DataGrid<T>({
  columns,
  data,
  onRowClicked,
}: DataGridProps<T>) {
  return (
    <div className="ag-theme-quartz ag-modern-grid w-full h-full">
      <AgGridReact<T>
        rowData={data}
        columnDefs={columns}
        pagination
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
        suppressPaginationPanel={false}
        suppressCellFocus
        animateRows
        domLayout="normal"
        rowHeight={60}
        headerHeight={48}
        rowSelection="single"
        onRowClicked={(e) => e.data && onRowClicked?.(e.data)}
        defaultColDef={{
          sortable: true,
          resizable: false,
          filter: true,
          flex: 1,
          minWidth: 140,
        }}
      />
    </div>
  );
}