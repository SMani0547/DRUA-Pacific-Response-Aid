import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { aiSummary, type PriorityReport } from "./mock-data";

export function exportPriorityPdf(
  reports: PriorityReport[],
  opts?: { issueFilter?: string; severityFilter?: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const now = new Date();

  // Header
  doc.setFillColor(29, 60, 120);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Pacific Response Intelligence", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Priority Response Report", margin, 50);
  doc.text(now.toLocaleString(), pageWidth - margin, 50, { align: "right" });

  let y = 100;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Priority Response List", margin, y);
  y += 6;

  if (opts?.issueFilter && opts.issueFilter !== "all") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    y += 12;
    doc.text(`Issue filter: ${opts.issueFilter}`, margin, y);
  }
  if (opts?.severityFilter && opts.severityFilter !== "all") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    y += 12;
    doc.text(`Severity filter: ${opts.severityFilter}`, margin, y);
  }

  autoTable(doc, {
    startY: y + 10,
    margin: { left: margin, right: margin },
    head: [["Area", "Issue", "Severity", "People", "Resources", "AI Score", "Action"]],
    body: reports.map((r) => [
      r.area,
      r.issue,
      r.severity,
      r.peopleAffected.toLocaleString(),
      r.resources,
      String(r.riskScore),
      r.action,
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 30, 30] },
    headStyles: { fillColor: [29, 60, 120], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const sev = String(data.cell.raw);
        const color: [number, number, number] =
          sev === "Critical" ? [200, 40, 50] :
          sev === "High" ? [220, 110, 30] :
          sev === "Medium" ? [200, 150, 30] :
          [40, 140, 90];
        data.cell.styles.textColor = color;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterTableY = (doc as any).lastAutoTable.finalY + 30;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (afterTableY > pageHeight - 200) {
    doc.addPage();
    afterTableY = 60;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Gemini AI Response Summary", margin, afterTableY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const paragraphs = aiSummary.split("\n\n");
  let cy = afterTableY + 18;
  const maxWidth = pageWidth - margin * 2;
  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, maxWidth) as string[];
    for (const line of lines) {
      if (cy > pageHeight - 50) {
        doc.addPage();
        cy = 60;
      }
      doc.text(line, margin, cy);
      cy += 14;
    }
    cy += 6;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Built for smarter, safer, and more resilient Pacific communities.",
      margin,
      pageHeight - 20,
    );
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  }

  const stamp = now.toISOString().slice(0, 10);
  doc.save(`pacific-response-priority-${stamp}.pdf`);
}
