<template>
  <v-btn color="success" :disabled="!items.length" @click="downloadPdf">
    Download Invoice Inventry PDF
  </v-btn>
</template>

<script>
// npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  name: 'DownloadPdfInventoryGrouped',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
//     downloadPdf() {
//       if (!this.items || !this.items.length) return;

//       // Group items by invoiceNumber first, then category -> model -> items
//       const byInvoice = this.items.reduce((acc, it) => {
//         const invoice = it.invoiceNumber || 'NO-INVOICE';
//         if (!acc[invoice]) acc[invoice] = [];
//         acc[invoice].push(it);
//         return acc;
//       }, {});

//       const invoiceNumbers = Object.keys(byInvoice);

//       const doc = new jsPDF({
//         orientation: 'landscape',
//         unit: 'mm',
//         format: 'a4',
//       });

//       const pageWidth = doc.internal.pageSize.getWidth();
//       const pageHeight = doc.internal.pageSize.getHeight();
//       const margin = 12;
//       const usableWidth = pageWidth - margin * 2;

//       // helper to ensure vertical space
//       let y = margin;
//       const ensureSpace = (need) => {
//         if (y + need > pageHeight - margin) {
//           doc.addPage();
//           y = margin;
//         }
//       };

//     //   const renderInvoice = (itemsForInvoice) => {
//     //     // Create grouping for this invoice: category -> model -> items
//     //     const grouped = itemsForInvoice.reduce((acc, it) => {
//     //       const cat = it.categoryName || 'Uncategorized';
//     //       const model = it.modelName || 'Unknown Model';
//     //       if (!acc[cat]) acc[cat] = {};
//     //       if (!acc[cat][model]) acc[cat][model] = [];
//     //       acc[cat][model].push(it);
//     //       return acc;
//     //     }, {});

//     //     // Invoice header info (take from first item of this invoice)
//     //     const first = itemsForInvoice[0] || {};
//     //     const invoiceNumber = first.invoiceNumber || '-';
//     //     const invoiceDate = first.invoiceDate || '-';

//     //     // Top-left: ALL - total for this invoice
//     //     const totalCount = itemsForInvoice.length;
//     //     doc.setFontSize(11);
//     //     doc.setFont('helvetica', 'bold');
//     //     ensureSpace(12);
//     //     doc.text(`ALL - ${totalCount}`, margin, y);

//     //     // Top-right: invoice details (right-aligned)
//     //     doc.setFontSize(11);
//     //     doc.setFont('helvetica', 'bold');
//     //     const invText1 = `INVOICE NO - ${invoiceNumber}`;
//     //     const invText2 = `INVOICE DATE - ${invoiceDate}`;
//     //     const inv1Width = doc.getTextWidth(invText1);
//     //     doc.text(invText1, pageWidth - margin - inv1Width, y);
//     //     y += 6;
//     //     const inv2Width = doc.getTextWidth(invText2);
//     //     doc.text(invText2, pageWidth - margin - inv2Width, y);
//     //     y += 8;

//     //     // separator
//     //     doc.setLineWidth(0.3);
//     //     doc.line(margin, y, pageWidth - margin, y);
//     //     y += 8;

//     //     // Iterate categories
//     //     const categoryNames = Object.keys(grouped);
//     //     categoryNames.forEach((cat) => {
//     //       const models = grouped[cat];
//     //       const catItems = Object.values(models).flat();
//     //       const catCount = catItems.length;

//     //       // Category heading with count
//     //       ensureSpace(14);
//     //       doc.setFontSize(12);
//     //       doc.setFont('helvetica', 'bold');
//     //       doc.text(`${cat} - ${catCount}`, margin, y);
//     //       y += 8;

//     //       // Serial number should reset per category per invoice
//     //       let serial = 1;

//     //       // Iterate models in this category
//     //       Object.keys(models).forEach((modelName) => {
//     //         const modelItems = models[modelName];

//     //         // Estimate height needed for heading + table (to avoid overlap)
//     //         const estimatedModelHeading = 8;
//     //         const estimatedTableHeader = 7;
//     //         const perRow = 6.5;
//     //         const rowsCount = modelItems.length || 1;
//     //         const estimatedTableHeight = estimatedTableHeader + rowsCount * perRow;
//     //         const reserve = estimatedModelHeading + estimatedTableHeight + 12; // padding

//     //         // If remaining space can't fit the whole model block, force a new page
//     //         if (y + reserve > pageHeight - margin) {
//     //           doc.addPage();
//     //           y = margin;
//     //         }

//     //         // Model subheading (print only once)
//     //         doc.setFontSize(10);
//     //         doc.setFont('helvetica', 'bold');
//     //         doc.text(modelName, margin + 4, y);
//     //         y += 6;

//     //         // Prepare rows for autoTable: columns [S.N, Chassis, Engine, Color]
//     //         const rows = modelItems.map((it) => {
//     //           const chassis = (it.chassisNumber || '-').toString();
//     //           const engine = (it.engineNumber || it.engine || '-').toString();
//     //           const color = (it.color || '-').toString();
//     //           const warehouse = (it.warehouse || '-').toString();
//     //           const sn = serial++; // increment per category
//     //           return [String(sn), chassis, engine, color, warehouse];
//     //         });

//     //         // Column width distribution
//     //         const col0 = 12; // S.N
//     //         const remaining = usableWidth - (col0 + 20);
//     //         const col1 = Math.round(remaining * 0.48); // chassis
//     //         const col2 = Math.round(remaining * 0.30); // engine
//     //         const col3 = Math.round(remaining * 0.22); // color
//     //         const col3 = Math.round(remaining * 0.22); // color

//     //         // Draw table for this model
//     //         autoTable(doc, {
//     //           startY: y,
//     //           margin: { left: margin + 6, right: margin },
//     //           styles: { fontSize: 9, cellPadding: 2, overflow: 'ellipsize' },
//     //           theme: 'striped',
//     //           head: [['S.N', 'CHASSIS', 'ENGINE', 'COLOUR']],
//     //           body: rows,
//     //           columnStyles: {
//     //             0: { cellWidth: col0, halign: 'left' },
//     //             1: { cellWidth: col1, halign: 'left' },
//     //             2: { cellWidth: col2, halign: 'left' },
//     //             3: { cellWidth: col3, halign: 'left' },
//     //           },
//     //           headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], halign: 'left' },
//     //         });

//     //         // Move y to after the drawn table
//     //         const prev = doc.previousAutoTable;
//     //         if (prev && prev.finalY) {
//     //           y = prev.finalY + 8;
//     //         } else {
//     //           y += estimatedTableHeight + 8;
//     //         }
//     //       });

//     //       // small spacer after category
//     //       y += 4;
//     //     });

//     //     // Footer / small gap before next invoice (we'll start next invoice on a new page)
//     //   };

//       // Iterate invoices in order and render them one by one.
    
    
//     const renderInvoice = (itemsForInvoice) => {
//   // Grouping by category → model → items
//   const grouped = itemsForInvoice.reduce((acc, it) => {
//     const cat = it.categoryName || 'Uncategorized';
//     const model = it.modelName || 'Unknown Model';
//     if (!acc[cat]) acc[cat] = {};
//     if (!acc[cat][model]) acc[cat][model] = [];
//     acc[cat][model].push(it);
//     return acc;
//   }, {});

//   // Invoice details
//   const first = itemsForInvoice[0] || {};
//   const invoiceNumber = first.invoiceNumber || '-';
//   const invoiceDate = first.invoiceDate || '-';
//   const totalCount = itemsForInvoice.length;

//   // Header (left and right)
//   doc.setFontSize(11);
//   doc.setFont('helvetica', 'bold');
//   ensureSpace(12);
//   doc.text(`ALL - ${totalCount}`, margin, y);

//   const invText1 = `INVOICE NO - ${invoiceNumber}`;
//   const invText2 = `INVOICE DATE - ${invoiceDate}`;
//   const inv1Width = doc.getTextWidth(invText1);
//   doc.text(invText1, pageWidth - margin - inv1Width, y);
//   y += 6;
//   const inv2Width = doc.getTextWidth(invText2);
//   doc.text(invText2, pageWidth - margin - inv2Width, y);
//   y += 8;

//   // Separator line
//   doc.setLineWidth(0.3);
//   doc.line(margin, y, pageWidth - margin, y);
//   y += 8;

//   // Loop categories
//   const categoryNames = Object.keys(grouped);
//   categoryNames.forEach((cat) => {
//     const models = grouped[cat];
//     const catItems = Object.values(models).flat();
//     const catCount = catItems.length;

//     // Category heading
//     ensureSpace(14);
//     doc.setFontSize(12);
//     doc.setFont('helvetica', 'bold');
//     doc.text(`${cat} - ${catCount}`, margin, y);
//     y += 8;

//     let serial = 1; // Reset serial number per category

//     // Loop models
//     Object.keys(models).forEach((modelName) => {
//       const modelItems = models[modelName];

//       // Estimate height to manage page breaks
//       const estimatedModelHeading = 8;
//       const estimatedTableHeader = 7;
//       const perRow = 6.5;
//       const rowsCount = modelItems.length || 1;
//       const estimatedTableHeight = estimatedTableHeader + rowsCount * perRow;
//       const reserve = estimatedModelHeading + estimatedTableHeight + 12;

//       if (y + reserve > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//       }

//       // Model subheading
//       doc.setFontSize(10);
//       doc.setFont('helvetica', 'bold');
//       doc.text(modelName, margin + 4, y);
//       y += 6;

//       // Prepare table rows [S.N, Chassis, Engine, Color, Warehouse]
//       const rows = modelItems.map((it) => {
//         const sn = serial++;
//         return [
//           String(sn),
//           it.chassisNumber || '-',
//           it.engineNumber || it.engine || '-',
//           it.color || '-',
//           it.warehouse || '-',
//         ];
//       });

//       // Column widths
//       const col0 = 10; // S.N
//       const col1 = 45; // Chassis
//       const col2 = 45; // Engine
//       const col3 = 25; // Color
//       const col4 = 35; // Warehouse
//       const tableCols = col0 + col1 + col2 + col3 + col4;

//       // Adjust width if it exceeds usable width
//       const scaleFactor = usableWidth / tableCols;
//       const scaledCols = [col0, col1, col2, col3, col4].map((c) => c * scaleFactor);

//       // Draw table
//       autoTable(doc, {
//         startY: y,
//         margin: { left: margin + 6, right: margin },
//         styles: { fontSize: 9, cellPadding: 2, overflow: 'ellipsize' },
//         theme: 'striped',
//         head: [['S.N', 'CHASSIS', 'ENGINE', 'COLOUR', 'WAREHOUSE']],
//         body: rows,
//         columnStyles: {
//           0: { cellWidth: scaledCols[0], halign: 'center' },
//           1: { cellWidth: scaledCols[1], halign: 'left' },
//           2: { cellWidth: scaledCols[2], halign: 'left' },
//           3: { cellWidth: scaledCols[3], halign: 'left' },
//           4: { cellWidth: scaledCols[4], halign: 'left' },
//         },
//         headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
//       });

//       const prev = doc.previousAutoTable;
//       y = prev?.finalY ? prev.finalY + 8 : y + estimatedTableHeight + 8;
//     });

//     y += 4; // spacer between categories
//   });
// };


      
//     invoiceNumbers.forEach((invNum, idx) => {
//         const itemsForInvoice = byInvoice[invNum];
//         // If not the first invoice, start on a fresh page
//         if (idx > 0) {
//           doc.addPage();
//           y = margin;
//         }
//         renderInvoice(itemsForInvoice);
//       });

//       // Final footer on last page
//       if (y + 12 > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//       }
//       const genDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
//       doc.setFontSize(9);
//       doc.setFont('helvetica', 'normal');
//       doc.text(`Generated: ${genDate}`, margin, pageHeight - 8);

//       // Save file
//       const dateStr = new Date().toISOString().slice(0, 10);
//       // If only one invoice, name file with that invoice; otherwise generic
//       const filenameInvoice = invoiceNumbers.length === 1 ? invoiceNumbers[0] : 'MULTI_INVOICE';
//       doc.save(`Inventory_${filenameInvoice || 'NA'}_${dateStr}.pdf`);
//     },

        downloadPdf() {
  if (!this.items || !this.items.length) return;

  // Group items by invoiceNumber first, then category -> model -> items
  const byInvoice = this.items.reduce((acc, it) => {
    const invoice = it.invoiceNumber || 'NO-INVOICE';
    if (!acc[invoice]) acc[invoice] = [];
    acc[invoice].push(it);
    return acc;
  }, {});

  const invoiceNumbers = Object.keys(byInvoice);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;

  // helper to ensure vertical space
  let y = margin;
  const ensureSpace = (need) => {
    if (y + need > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Render one invoice block
  const renderInvoice = (itemsForInvoice) => {
    // Grouping by category -> model -> items
    const grouped = itemsForInvoice.reduce((acc, it) => {
      const cat = it.categoryName || 'Uncategorized';
      const model = it.modelName || 'Unknown Model';
      if (!acc[cat]) acc[cat] = {};
      if (!acc[cat][model]) acc[cat][model] = [];
      acc[cat][model].push(it);
      return acc;
    }, {});

    // Invoice details
    const first = itemsForInvoice[0] || {};
    const invoiceNumber = first.invoiceNumber || '-';
    const invoiceDate = first.invoiceDate || '-';
    const totalCount = itemsForInvoice.length;

    // Header (left and right)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    ensureSpace(12);
    doc.text(`ALL - ${totalCount}`, margin, y);

    const invText1 = `INVOICE NO - ${invoiceNumber}`;
    const invText2 = `INVOICE DATE - ${invoiceDate}`;
    const inv1Width = doc.getTextWidth(invText1);
    doc.text(invText1, pageWidth - margin - inv1Width, y);
    y += 6;
    const inv2Width = doc.getTextWidth(invText2);
    doc.text(invText2, pageWidth - margin - inv2Width, y);
    y += 8;

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Loop categories
    const categoryNames = Object.keys(grouped);
    categoryNames.forEach((cat) => {
      const models = grouped[cat];
      const catItems = Object.values(models).flat();
      const catCount = catItems.length;

      // Category heading
      ensureSpace(14);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${cat} - ${catCount}`, margin, y);
      y += 8;

      let serial = 1; // Reset serial number per category

      // Loop models
      Object.keys(models).forEach((modelName) => {
        const modelItems = models[modelName];

        // Estimate height to manage page breaks
        const estimatedModelHeading = 8;
        const estimatedTableHeader = 7;
        const perRow = 6.5;
        const rowsCount = modelItems.length || 1;
        const estimatedTableHeight = estimatedTableHeader + rowsCount * perRow;
        const reserve = estimatedModelHeading + estimatedTableHeight + 12;

        if (y + reserve > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Model subheading
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(modelName, margin + 4, y);
        y += 6;

        // Prepare table rows [S.N, Chassis, Engine, Color, Warehouse, Source]
        const rows = modelItems.map((it) => {
          const sn = serial++;
          return [
            String(sn),
            it.chassisNumber || '-',
            it.engineNumber || it.engine || '-',
            it.color || '-',
            it.warehouse || '-',
            it.source || '-',
          ];
        });

        // Column widths (base)
        const col0 = 10; // S.N
        const col1 = 42; // Chassis
        const col2 = 42; // Engine
        const col3 = 26; // Color
        const col4 = 34; // Warehouse
        const col5 = 34; // Source
        const tableCols = col0 + col1 + col2 + col3 + col4 + col5;

        // Scale columns to fit usableWidth
        const scaleFactor = usableWidth / tableCols;
        const scaledCols = [col0, col1, col2, col3, col4, col5].map((c) => Math.max(8, c * scaleFactor));

        // Draw table with SOURCE column
        autoTable(doc, {
          startY: y,
          margin: { left: margin + 6, right: margin },
          styles: { fontSize: 9, cellPadding: 2, overflow: 'ellipsize' },
          theme: 'striped',
          head: [['S.N', 'CHASSIS', 'ENGINE', 'COLOUR', 'WAREHOUSE', 'SOURCE']],
          body: rows,
          columnStyles: {
            0: { cellWidth: scaledCols[0], halign: 'center' },
            1: { cellWidth: scaledCols[1], halign: 'left' },
            2: { cellWidth: scaledCols[2], halign: 'left' },
            3: { cellWidth: scaledCols[3], halign: 'left' },
            4: { cellWidth: scaledCols[4], halign: 'left' },
            5: { cellWidth: scaledCols[5], halign: 'left' },
          },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        const prev = doc.previousAutoTable;
        y = prev && prev.finalY ? prev.finalY + 8 : y + estimatedTableHeight + 8;
      });

      y += 4; // spacer between categories
    });
  };

  // Iterate invoices in order and render them one by one.
  invoiceNumbers.forEach((invNum, idx) => {
    const itemsForInvoice = byInvoice[invNum];
    // If not the first invoice, start on a fresh page
    if (idx > 0) {
      doc.addPage();
      y = margin;
    }
    renderInvoice(itemsForInvoice);
  });

  // Final footer on last page
  if (y + 12 > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
  const genDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${genDate}`, margin, pageHeight - 8);

  // Save file
  const dateStr = new Date().toISOString().slice(0, 10);
  // If only one invoice, name file with that invoice; otherwise generic
  const filenameInvoice = invoiceNumbers.length === 1 ? invoiceNumbers[0] : 'MULTI_INVOICE';
  doc.save(`Inventory_${filenameInvoice || 'NA'}_${dateStr}.pdf`);
}

  },
};
</script>
