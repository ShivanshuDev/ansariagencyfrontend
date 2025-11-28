<template>
  <v-btn color="black" :disabled="!items.length" @click="downloadPdf">
    <v-icon style="color:white;" left>mdi-file-pdf-box</v-icon>
    <span style="color:white;"> Invoice PDF</span>
  </v-btn>
</template>

<script>
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
    downloadPdf() {
      if (!this.items || !this.items.length) return;

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

      // +2px updated global font
      doc.setFont('courier', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const margin = 12;
      const pageWidth = doc.internal.pageSize.getWidth();

      const totalPagesExp = '{total_pages_count_string}';

      const titleBlockY = margin;
      const headerInfoY = titleBlockY + 12;
      const headerLineY = headerInfoY;
      const tableTop = headerLineY + 6;

      const renderInvoice = (itemsForInvoice) => {
        const first = itemsForInvoice[0] || {};
        const invoiceNumber = first.invoiceNumber || '-';
        const invoiceDate = first.invoiceDate || '-';
        const totalCount = itemsForInvoice.length;

        const grouped = itemsForInvoice.reduce((acc, it) => {
          const cat = it.categoryName || 'Uncategorized';
          const model = it.modelName || 'Unknown Model';
          if (!acc[cat]) acc[cat] = {};
          if (!acc[cat][model]) acc[cat][model] = [];
          acc[cat][model].push(it);
          return acc;
        }, {});

        const body = [];

        Object.keys(grouped).forEach((cat) => {
          const models = grouped[cat];
          const catItemsCount = Object.values(models).reduce(
            (sum, arr) => sum + arr.length,
            0
          );

          body.push({
            type: 'category',
            label: `${cat} (${catItemsCount})`,
          });

          let serial = 1;

          Object.keys(models).forEach((modelName) => {
            const modelItems = models[modelName];

            body.push({
              type: 'model',
              label: modelName,
            });

            modelItems.forEach((it) => {
              body.push({
                type: 'item',
                sn: String(serial++),
                chassis: it.chassisNumber || '-',
                engine: it.engineNumber || it.engine || '-',
                color: it.color || '-',
                warehouse: it.warehouse || '-',
                source: it.source || '-',
              });
            });
          });
        });

        autoTable(doc, {
          startY: tableTop,
          margin: { top: tableTop, left: margin, right: margin },
          theme: 'plain',
          styles: {
            font: 'courier',
            fontSize: 9,   // +2px from 7
            overflow: 'ellipsize',
            textColor: [0, 0, 0],
            lineWidth: 0,
          },
          headStyles: {
            font: 'courier',
            fontStyle: 'bold',
            fontSize: 10,  // +2px from 8
            textColor: [0, 0, 0],
            lineWidth: 0,
          },
          bodyStyles: {
            lineWidth: 0,
          },
          tableLineWidth: 0,
          columns: [
            { header: 'S.N', dataKey: 'sn' },
            { header: 'CHASSIS', dataKey: 'chassis' },
            { header: 'ENGINE', dataKey: 'engine' },
            { header: 'COLOUR', dataKey: 'color' },
            { header: 'WAREHOUSE', dataKey: 'warehouse' },
            { header: 'SOURCE', dataKey: 'source' },
          ],
          body,
          didParseCell: (data) => {
            const raw = data.row.raw || {};

            if (raw.type === 'category') {
              if (data.column.dataKey === 'sn') {
                data.cell.colSpan = 6;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 11;  // +2px from 9
                data.cell.text = [raw.label];
              } else {
                data.cell.text = [''];
              }
            }

            if (raw.type === 'model') {
              if (data.column.dataKey === 'sn') {
                data.cell.colSpan = 6;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 10; // +2px from 8
                data.cell.text = [raw.label];
              } else {
                data.cell.text = [''];
              }
            }
          },

          didDrawPage: () => {
            // Report Header
            doc.setFont('courier', 'bold');
            doc.setFontSize(13); // +2px from 11
            doc.text('ANSARI AUTOMOBILES,', pageWidth / 2, titleBlockY, {
              align: 'center',
            });

            doc.setFont('courier', 'normal');
            doc.setFontSize(11); // +2px from 9
            doc.text(
              'BADI KAMHARIYA BY PASS ROAD, MAU, UTTAR PRADESH',
              pageWidth / 2,
              titleBlockY + 5,
              { align: 'center' }
            );

            doc.setFont('courier', 'bold');
            doc.setFontSize(11);
            doc.text(
              'Stock – All Records',
              pageWidth / 2,
              titleBlockY + 10,
              { align: 'center' }
            );

            // Invoice Header
            doc.setFont('courier', 'bold');
            doc.setFontSize(11);

            doc.text(`ALL - ${totalCount}`, margin, headerInfoY);

            const inv1 = `INVOICE NO - ${invoiceNumber}`;
            const inv2 = `INVOICE DATE - ${invoiceDate}`;
            doc.text(inv1, pageWidth - margin - doc.getTextWidth(inv1), headerInfoY);
            doc.text(inv2, pageWidth - margin - doc.getTextWidth(inv2), headerInfoY + 5);

            // Page Number
            const pageStr = `Page ${doc.internal.getNumberOfPages()} of ${totalPagesExp}`;
            doc.setFont('courier', 'normal');
            doc.setFontSize(10);   // +2px from 8
            doc.text(
              pageStr,
              pageWidth - margin - doc.getTextWidth(pageStr),
              titleBlockY - 4
            );
          },
        });
      };

      invoiceNumbers.forEach((inv, i) => {
        if (i > 0) doc.addPage();
        renderInvoice(byInvoice[inv]);
      });

      if (doc.putTotalPages) doc.putTotalPages(totalPagesExp);

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('courier', 'normal');
      doc.setFontSize(9); // +2px from 7
      doc.text(
        `Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
        margin,
        pageHeight - 8
      );

      try {
        window.open(doc.output('bloburl'), '_blank');
      } catch (e) {
        const file =
          invoiceNumbers.length === 1 ? invoiceNumbers[0] : 'MULTI_INVOICE';
        doc.save(`Inventory_${file}.pdf`);
      }
    },
  },
};
</script>
