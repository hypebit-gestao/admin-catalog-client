import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import React from "react";

export default function ExportToExcel({
  excelData,
  fileName,
  styleButton,
  className,
  icon,
  label,
  title,
  currencyColumns,
}: any) {
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

  const exportToExcel = (csvData: any, fileName: any) => {
    const ws = XLSX.utils.json_to_sheet(csvData) as any;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
      for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
        var cell_address = { c: colNum, r: rowNum };
        var cell_ref = XLSX.utils.encode_cell(cell_address);
        if (currencyColumns) {
          if ((currencyColumns + 1).includes(colNum + 1)) {
            if (ws[cell_ref] && typeof ws[cell_ref].v === "number") {
              if (!ws[cell_ref].z) {
                ws[cell_ref].z = "R$ 0.00";
              }
              if (ws[cell_ref].v === 0) {
                ws[cell_ref].z = "R$    -";
              }
              if (!ws[cell_ref].s) {
                ws[cell_ref].s = { alignment: { horizontal: "left" } };
              } else if (ws[cell_ref].v === 0) {
                ws[cell_ref].s = { alignment: { horizontal: "right" } };
              } else {
                ws[cell_ref].s.alignment = { horizontal: "left" };
              }
            }
          }
        }
      }
    }

    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, fileName + fileExtension);
  };

  return (
    <button
      style={styleButton}
      className={className}
      onClick={(e) => exportToExcel(excelData, fileName)}
    >
      {icon}
      {label ? (
        "Exportar para Excel"
      ) : title ? (
        <p style={{ margin: 0, marginLeft: 5 }}>{title}</p>
      ) : null}
    </button>
  );
}
