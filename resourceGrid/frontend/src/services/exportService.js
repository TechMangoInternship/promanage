import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);

// ── Helpers ────────────────────────────────────────────────────
const COLS = Array.from({ length: 12 }, (_, i) => String(i + 1));

function getCellValue(row, col) {
  if (!row.columns || typeof row.columns !== "object") return "";
  return row.columns[col] ?? "";
}

function getTotalHours(row) {
  let total = 0;
  for (let c = 1; c <= 12; c++) {
    const val = parseFloat(getCellValue(row, String(c)));
    if (!isNaN(val)) total += val;
  }
  return total;
}

function getRate(row) {
  return parseFloat(row.rate) || 0;
}

function getCost(row) {
  return getTotalHours(row) * getRate(row);
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

// ── Word (existing style — matches the projectGrid export) ─────
export async function exportToWordExisting(rows, projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";

  const headers = ["#", "Resource Name", ...COLS, "Total Hours", "Rate", "Cost"];
  const COL_WIDTHS = [600, 1800, ...COLS.map(() => 600), 900, 800, 1000];
  const COL_TOTAL = COL_WIDTHS.reduce((a, b) => a + b, 0);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: COL_WIDTHS[i] || 600, type: WidthType.DXA },
        shading: { fill: "2b2b5e", color: "auto" },
        verticalAlign: "center",
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, color: "ffffff", size: 16, font: "Calibri" })],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map((row, ri) => {
    const cols = COLS.map((c) => getCellValue(row, c));
    const totalHrs = getTotalHours(row);
    const rate = row.rate || "";
    const cost = getCost(row);

    const values = [String(ri + 1), row.resourceName || "", ...cols, totalHrs > 0 ? String(totalHrs) : "", rate, cost > 0 ? cost.toFixed(2) : ""];

    return new TableRow({
      children: values.map((val, ci) =>
        new TableCell({
          width: { size: COL_WIDTHS[ci] || 600, type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "f2f2f7" : "ffffff", color: "auto" },
          children: [
            new Paragraph({
              spacing: { before: 30, after: 30 },
              children: [new TextRun({ text: String(val || ""), size: 16, font: "Calibri", color: "1d1d1f" })],
            }),
          ],
        })
      ),
    });
  });

  const table = new Table({
    width: { size: COL_TOTAL, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: pName, bold: true, size: 48, font: "Calibri", color: "1d1d1f" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: `Version: ${ver}`, size: 28, font: "Calibri", color: "5b5aff" })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: "Resource Grid", bold: true, size: 28, font: "Calibri", color: "2b2b5e" })],
    }),
    table,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          size: 16, font: "Calibri", color: "888888", italics: true,
        }),
      ],
    }),
  ];

  const doc = new Document({
    title: `${pName} - ${ver} - Resource Grid`,
    creator: "Resource Grid Export",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: "1d1d1f" },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_Resources.docx`;
  saveAs(blob, fileName);
  return true;
}

// ── Word (new style — cleaner, lighter) ────────────────────────
export async function exportToWordNew(rows, projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";

  const children = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: pName, bold: true, size: 44, font: "Calibri", color: "1d1d1f" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `Version: ${ver}`, size: 24, font: "Calibri", color: "5b5aff" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "7870ff" } },
      children: [
        new TextRun({ text: "Resource Grid Report", bold: true, size: 30, font: "Calibri", color: "2b2b5e" }),
      ],
    })
  );

  // Summary stats
  const totalResources = rows.length;
  const totalHours = rows.reduce((sum, r) => sum + getTotalHours(r), 0);
  const totalCost = rows.reduce((sum, r) => sum + getCost(r), 0);

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: "Summary", bold: true, size: 24, font: "Calibri", color: "2b2b5e" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `Total Resources: `, size: 20, font: "Calibri", color: "666666" }),
        new TextRun({ text: String(totalResources), bold: true, size: 20, font: "Calibri", color: "1d1d1f" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `Total Hours: `, size: 20, font: "Calibri", color: "666666" }),
        new TextRun({ text: totalHours.toFixed(1), bold: true, size: 20, font: "Calibri", color: "1d1d1f" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Total Cost: `, size: 20, font: "Calibri", color: "666666" }),
        new TextRun({ text: `$${totalCost.toFixed(2)}`, bold: true, size: 20, font: "Calibri", color: "1d1d1f" }),
      ],
    })
  );

  // Per-resource details
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({ text: "Resource Details", bold: true, size: 24, font: "Calibri", color: "2b2b5e" }),
      ],
    })
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const totalHrs = getTotalHours(row);
    const cost = getCost(row);

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${i + 1}. ${row.resourceName || "Unnamed"}`, bold: true, size: 22, font: "Calibri", color: "1d1d1f" }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: `   Rate: `, size: 18, font: "Calibri", color: "666666" }),
          new TextRun({ text: row.rate ? `$${row.rate}` : "—", size: 18, font: "Calibri", color: "1d1d1f" }),
          new TextRun({ text: `   |   Total Hours: `, size: 18, font: "Calibri", color: "666666" }),
          new TextRun({ text: totalHrs > 0 ? String(totalHrs) : "—", size: 18, font: "Calibri", color: "1d1d1f" }),
          new TextRun({ text: `   |   Cost: `, size: 18, font: "Calibri", color: "666666" }),
          new TextRun({ text: cost > 0 ? `$${cost.toFixed(2)}` : "—", bold: true, size: 18, font: "Calibri", color: "2b2b5e" }),
        ],
      })
    );

    // Monthly breakdown as a mini table
    const miniHeaders = ["Month", "Hours"];
    const miniData = [];
    for (let c = 1; c <= 12; c++) {
      const val = getCellValue(row, String(c));
      if (val && val.trim() !== "") {
        miniData.push([`Month ${c}`, val]);
      }
    }

    if (miniData.length > 0) {
      const miniHeaderRow = new TableRow({
        children: ["Month", "Hours"].map((h, idx) =>
          new TableCell({
            width: { size: idx === 0 ? 3000 : 2000, type: WidthType.DXA },
            shading: { fill: "e8e6ff" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, bold: true, size: 16, font: "Calibri", color: "2b2b5e" })],
              }),
            ],
          })
        ),
      });

      const miniDataRows = miniData.map(([m, h]) =>
        new TableRow({
          children: [m, h].map((v, idx) =>
            new TableCell({
              width: { size: idx === 0 ? 3000 : 2000, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(v), size: 16, font: "Calibri", color: "1d1d1f" })],
                }),
              ],
            })
          ),
        })
      );

      children.push(
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          rows: [miniHeaderRow, ...miniDataRows],
        })
      );
    }
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 500 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          size: 16, font: "Calibri", color: "888888", italics: true,
        }),
      ],
    })
  );

  const doc = new Document({
    title: `${pName} - ${ver} - Resource Grid (Detailed)`,
    creator: "Resource Grid Export",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: "1d1d1f" },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_Resources_Detailed.docx`;
  saveAs(blob, fileName);
  return true;
}

// ── Excel Export ────────────────────────────────────────────────
export async function exportToExcel(rows, projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";

  const headers = ["#", "Resource Name", ...COLS, "Total Hours", "Rate", "Cost"];

  const data = rows.map((row, i) => {
    const cols = COLS.map((c) => getCellValue(row, c));
    const totalHrs = getTotalHours(row);
    const rate = row.rate ? parseFloat(row.rate) : null;
    const cost = getCost(row);

    return [
      i + 1,
      row.resourceName || "",
      ...cols,
      totalHrs > 0 ? totalHrs : "",
      rate,
      cost > 0 ? cost : "",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Column widths
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // Resource Name
    ...COLS.map(() => ({ wch: 8 })),  // Month columns
    { wch: 10 },  // Total Hours
    { wch: 10 },  // Rate
    { wch: 12 },  // Cost
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resources");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_Resources.xlsx`;
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  return true;
}

// ── PDF Export ──────────────────────────────────────────────────
export async function exportToPDF(rows, projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";

  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(29, 29, 31);
  doc.text(pName, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(91, 90, 255);
  doc.text(`Version: ${ver}`, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(43, 43, 94);
  doc.text("Resource Grid", 14, 40);

  // Table
  const headers = [["#", "Resource Name", ...COLS, "Total Hours", "Rate", "Cost"]];

  const tableData = rows.map((row, i) => {
    const cols = COLS.map((c) => getCellValue(row, c));
    const totalHrs = getTotalHours(row);
    const rate = row.rate || "";
    const cost = getCost(row);

    return [
      String(i + 1),
      row.resourceName || "",
      ...cols,
      totalHrs > 0 ? String(totalHrs) : "",
      rate,
      cost > 0 ? cost.toFixed(2) : "",
    ];
  });

  doc.autoTable({
    head: headers,
    body: tableData,
    startY: 44,
    theme: "grid",
    headStyles: {
      fillColor: [43, 43, 94],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [29, 29, 31],
    },
    alternateRowStyles: {
      fillColor: [242, 242, 247],
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 50 },
      2: { cellWidth: 18 },
    },
    margin: { left: 8, right: 8 },
  });

  // Footer with summary
  const totalResources = rows.length;
  const totalHours = rows.reduce((sum, r) => sum + getTotalHours(r), 0);
  const totalCost = rows.reduce((sum, r) => sum + getCost(r), 0);

  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text(`Total Resources: ${totalResources}`, 14, finalY);
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 14, finalY + 6);
  doc.setFontSize(11);
  doc.setTextColor(43, 43, 94);
  doc.text(`Total Cost: $${totalCost.toFixed(2)}`, 14, finalY + 14);

  // Generation info
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_Resources.pdf`;
  doc.save(fileName);
  return true;
}

// ── Main export dispatcher ─────────────────────────────────────
export async function exportResources(format, rows, projectName, version) {
  switch (format) {
    case "word-existing":
      return exportToWordExisting(rows, projectName, version);
    case "word-new":
      return exportToWordNew(rows, projectName, version);
    case "excel":
      return exportToExcel(rows, projectName, version);
    case "pdf":
      return exportToPDF(rows, projectName, version);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}
