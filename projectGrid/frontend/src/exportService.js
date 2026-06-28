import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require("docx");
applyPlugin(jsPDF);

// ── Grid API endpoints ──────────────────────────────────────────
const APIS = {
  assumptions: { url: "http://localhost:5004/api/assumptions", label: "Assumptions" },
  dependencies: { url: "http://localhost:5005/api/dependencies", label: "Dependencies" },
  features: { url: "http://localhost:5006/api/features", label: "Features Grid" },
  streams: { url: "http://localhost:5007/api/streams", label: "Streams Grid" },
  resources: { url: "http://localhost:5003/api/resources", label: "Resource Grid" },
  techStack: { url: "http://localhost:5000/api/grids", label: "Technical Stack" },
  queries: { url: "http://localhost:5002/api/grids", label: "Queries & Responses" },
};

/**
 * Fetch data from all 7 grids for a given project name and version.
 */
async function fetchAllGridData(projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";

  // Fetch simple grids in parallel
  const [assumptionsRes, dependenciesRes, featuresRes, resourcesRes] = await Promise.all([
    axios.get(APIS.assumptions.url, { params: { projectName: pName, version: ver } }).catch(() => ({ data: [] })),
    axios.get(APIS.dependencies.url, { params: { projectName: pName, version: ver } }).catch(() => ({ data: [] })),
    axios.get(APIS.features.url, { params: { projectName: pName, version: ver } }).catch(() => ({ data: [] })),
    axios.get(APIS.resources.url, { params: { projectName: pName, version: ver } }).catch(() => ({ data: [] })),
  ]);

  // Streams Grid — seed then fetch
  let streamsRows = [];
  try {
    await axios.post(`${APIS.streams.url}/seed`, { projectName: pName, version: ver }).catch(() => {});
    const streamsRes = await axios.get(APIS.streams.url, { params: { projectName: pName, version: ver } });
    streamsRows = Array.isArray(streamsRes.data) ? streamsRes.data : [];
  } catch { /* empty */ }

  // Compute total feature hours for streams value calculation
  const featuresData = featuresRes.data || [];
  let totalFeatureHours = 0;
  for (const f of featuresData) {
    const h = parseFloat(f.effortsHours);
    if (!isNaN(h)) totalFeatureHours += h;
  }

  // Technical Stack — uses gridName-based routing
  const techStackGridName = `Technical Stack - ${pName}/${ver}`;
  let techStackRows = [];
  try {
    const tsRes = await axios.get(`${APIS.techStack.url}/${encodeURIComponent(techStackGridName)}/rows`);
    techStackRows = Array.isArray(tsRes.data) ? tsRes.data : [];
  } catch { /* empty */ }

  // Queries & Responses — seed then fetch rows
  let queriesRows = [];
  try {
    const seedRes = await axios.post(`${APIS.queries.url}/seed`, {
      name: `Queries and Responses - ${pName}/${ver}`,
    });
    const gridId = seedRes.data?.data?._id;
    if (gridId) {
      const qRes = await axios.get(`${APIS.queries.url}/${gridId}/rows`);
      const qData = qRes.data?.data;
      queriesRows = qData?.rows || [];
    }
  } catch { /* empty */ }

  return {
    assumptions: assumptionsRes.data || [],
    dependencies: dependenciesRes.data || [],
    features: featuresData,
    streams: streamsRows,
    totalFeatureHours,
    resources: resourcesRes.data || [],
    techStack: techStackRows,
    queries: queriesRows,
  };
}

// ── Helper: create a styled table from row data ─────────────────
function createTable(headers, rows, getCellValues) {
  const COL_WIDTHS = rows.length > 0
    ? headers.map(() => Math.floor(9000 / headers.length))
    : [];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: COL_WIDTHS[i] || 1000, type: WidthType.DXA },
        shading: { fill: "2b2b5e", color: "auto" },
        verticalAlign: "center",
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: h, bold: true, color: "ffffff", size: 18, font: "Calibri" }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map((row, ri) => {
    const values = getCellValues(row);
    return new TableRow({
      children: values.map((val, ci) =>
        new TableCell({
          width: { size: COL_WIDTHS[ci] || 1000, type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "f2f2f7" : "ffffff", color: "auto" },
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: String(val || ""), size: 18, font: "Calibri", color: "1d1d1f" }),
              ],
            }),
          ],
        })
      ),
    });
  });

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// ── Build the Word document ─────────────────────────────────────
async function generateWordDoc(projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";
  const data = await fetchAllGridData(pName, ver);

  const children = [];

  // ── Document title ──────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: pName, bold: true, size: 48, font: "Calibri", color: "1d1d1f" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `Version: ${ver}`, size: 28, font: "Calibri", color: "5b5aff" }),
      ],
    })
  );

  // ── Grid sections ───────────────────────────────────────────
  const tfh = data.totalFeatureHours || 0;
  const sections = [
    {
      key: "features", label: "1. Features Grid",
      headers: ["#", "Platform", "Module", "Sub Module", "Question", "Answer", "Efforts/Hours"],
      getValues: (r, i) => [String(i + 1), r.platform, r.module, r.subModule, r.question, r.answer, r.effortsHours],
    },
    {
      key: "streams", label: "2. Streams Grid",
      headers: ["#", "Stream", "Percentage", "Value"],
      getValues: (r, i) => [String(i + 1), r.streamName || "", String(r.percentage ?? 0) + "%", ((parseFloat(r.percentage) || 0) / 100 * tfh).toFixed(2)],
    },
    {
      key: "resources", label: "3. Resource Grid",
      headers: ["#", "Resource Name", ...Array.from({ length: 12 }, (_, c) => String(c + 1))],
      getValues: (r, i) => {
        const cols = [];
        for (let c = 1; c <= 12; c++) cols.push(r.columns?.[String(c)] || "");
        return [String(i + 1), r.resourceName || "", ...cols];
      },
    },
    {
      key: "techStack", label: "4. Technical Stack",
      headers: ["#", "Technical Stack", "Version", "Description", "Proficiency"],
      getValues: (r, i) => [String(i + 1), r.data?.["Technical Stack"] || "", r.data?.["Version"] || "", r.data?.["Description"] || "", r.data?.["Proficiency"] || ""],
    },
    { key: "assumptions", label: "5. Assumptions Grid", headers: ["#", "Assumption"], getValues: (r, i) => [String(i + 1), r.text] },
    { key: "dependencies", label: "6. Dependencies Grid", headers: ["#", "Dependency"], getValues: (r, i) => [String(i + 1), r.text] },
    {
      key: "queries", label: "7. Queries & Responses",
      headers: ["#", "Query", "Response"],
      getValues: (r, i) => [String(i + 1), r.data?.query || "", r.data?.response || ""],
    },
  ];

  for (const section of sections) {
    const rows = data[section.key] || [];

    // Section heading
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 120 },
        children: [
          new TextRun({ text: section.label, bold: true, size: 28, font: "Calibri", color: "2b2b5e" }),
        ],
      })
    );

    if (rows.length === 0) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 200 },
          children: [
            new TextRun({ text: "(No data)", italics: true, size: 20, font: "Calibri", color: "888888" }),
          ],
        })
      );
    } else {
      const table = createTable(section.headers, rows, (r, i) => section.getValues(r, i));
      children.push(table);
      children.push(new Paragraph({ spacing: { after: 120 } })); // spacing after table
    }
  }

  // Footer with generation info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
      children: [
        new TextRun({ text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, size: 16, font: "Calibri", color: "888888", italics: true }),
      ],
    })
  );

  const doc = new Document({
    title: `${pName} - ${ver}`,
    description: `Export of all grid data for ${pName} version ${ver}`,
    creator: "Project Grid Export",
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

  return doc;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Main export function: fetches all data, generates Word doc, triggers download.
 */
export async function exportToWord(projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";
  const doc = await generateWordDoc(pName, ver);
  const blob = await Packer.toBlob(doc);
  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_export.docx`;
  saveAs(blob, fileName);
  return true;
}

// ── Excel Export ────────────────────────────────────────────────
export async function exportToExcel(projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";
  const data = await fetchAllGridData(pName, ver);

  const wb = XLSX.utils.book_new();

  // Define each grid's data as a separate sheet
  const xlTfh = data.totalFeatureHours || 0;
  const sheets = [
    {
      name: "Features Grid",
      headers: ["#", "Platform", "Module", "Sub Module", "Question", "Answer", "Efforts/Hours"],
      rows: data.features.map((r, i) => [i + 1, r.platform, r.module, r.subModule, r.question, r.answer, r.effortsHours]),
    },
    {
      name: "Streams Grid",
      headers: ["#", "Stream", "Percentage", "Value"],
      rows: data.streams.map((r, i) => [i + 1, r.streamName || "", (r.percentage ?? 0) + "%", ((parseFloat(r.percentage) || 0) / 100 * xlTfh).toFixed(2)]),
    },
    {
      name: "Resource Grid",
      headers: ["#", "Resource Name", ...Array.from({ length: 12 }, (_, c) => String(c + 1))],
      rows: data.resources.map((r, i) => {
        const cols = [];
        for (let c = 1; c <= 12; c++) cols.push(r.columns?.[String(c)] || "");
        return [i + 1, r.resourceName || "", ...cols];
      }),
    },
    {
      name: "Technical Stack",
      headers: ["#", "Technical Stack", "Version", "Description", "Proficiency"],
      rows: data.techStack.map((r, i) => [i + 1, r.data?.["Technical Stack"] || "", r.data?.["Version"] || "", r.data?.["Description"] || "", r.data?.["Proficiency"] || ""]),
    },
    {
      name: "Assumptions",
      headers: ["#", "Assumption"],
      rows: data.assumptions.map((r, i) => [i + 1, r.text]),
    },
    {
      name: "Dependencies",
      headers: ["#", "Dependency"],
      rows: data.dependencies.map((r, i) => [i + 1, r.text]),
    },
    {
      name: "Queries & Responses",
      headers: ["#", "Query", "Response"],
      rows: data.queries.map((r, i) => [i + 1, r.data?.query || "", r.data?.response || ""]),
    },
  ];

  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    ws["!cols"] = sheet.headers.map((_, i) => ({ wch: i === 0 ? 5 : 25 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_export.xlsx`;
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  return true;
}

// ── PDF Export ──────────────────────────────────────────────────
export async function exportToPDF(projectName, version) {
  const pName = projectName || "Untitled";
  const ver = version || "Unnamed";
  const data = await fetchAllGridData(pName, ver);

  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(29, 29, 31);
  doc.text(pName, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(91, 90, 255);
  doc.text(`Version: ${ver}`, doc.internal.pageSize.getWidth() / 2, 26, { align: "center" });

  let startY = 36;

  // Define each grid section for PDF
  const pdfTfh = data.totalFeatureHours || 0;
  const sections = [
    {
      label: "1. Features Grid",
      headers: [["#", "Platform", "Module", "Sub Module", "Question", "Answer", "Efforts/Hours"]],
      rows: data.features.map((r, i) => [String(i + 1), r.platform || "", r.module || "", r.subModule || "", r.question || "", r.answer || "", r.effortsHours || ""]),
    },
    {
      label: "2. Streams Grid",
      headers: [["#", "Stream", "Percentage", "Value"]],
      rows: data.streams.map((r, i) => [String(i + 1), r.streamName || "", (r.percentage ?? 0) + "%", ((parseFloat(r.percentage) || 0) / 100 * pdfTfh).toFixed(2)]),
    },
    {
      label: "3. Resource Grid",
      headers: [["#", "Resource Name", ...Array.from({ length: 12 }, (_, c) => String(c + 1))]],
      rows: data.resources.map((r, i) => {
        const cols = [];
        for (let c = 1; c <= 12; c++) cols.push(r.columns?.[String(c)] || "");
        return [String(i + 1), r.resourceName || "", ...cols];
      }),
    },
    {
      label: "4. Technical Stack",
      headers: [["#", "Technical Stack", "Version", "Description", "Proficiency"]],
      rows: data.techStack.map((r, i) => [String(i + 1), r.data?.["Technical Stack"] || "", r.data?.["Version"] || "", r.data?.["Description"] || "", r.data?.["Proficiency"] || ""]),
    },
    {
      label: "5. Assumptions Grid",
      headers: [["#", "Assumption"]],
      rows: data.assumptions.map((r, i) => [String(i + 1), r.text || ""]),
    },
    {
      label: "6. Dependencies Grid",
      headers: [["#", "Dependency"]],
      rows: data.dependencies.map((r, i) => [String(i + 1), r.text || ""]),
    },
    {
      label: "7. Queries & Responses",
      headers: [["#", "Query", "Response"]],
      rows: data.queries.map((r, i) => [String(i + 1), r.data?.query || "", r.data?.response || ""]),
    },
  ];

  for (const section of sections) {
    // Check if we need a new page
    if (startY > 160) {
      doc.addPage();
      startY = 20;
    }

    // Section label
    doc.setFontSize(12);
    doc.setTextColor(43, 43, 94);
    doc.text(section.label, 14, startY);
    startY += 6;

    if (section.rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(136, 136, 136);
      doc.text("(No data)", 14, startY + 4);
      startY += 10;
    } else {
      doc.autoTable({
        head: section.headers,
        body: section.rows,
        startY: startY,
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
        margin: { left: 8, right: 8 },
      });
      startY = doc.lastAutoTable.finalY + 8;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  const fileName = `${sanitizeFileName(pName)}_${sanitizeFileName(ver)}_export.pdf`;
  doc.save(fileName);
  return true;
}
