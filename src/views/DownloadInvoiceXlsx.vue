<template>
  <div>
    <v-btn :color="buttonColor" @click="download" :disabled="!hasRows">
      <v-icon left v-if="icon">{{ icon }}</v-icon>
      {{ label }}
    </v-btn>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default {
  name: "InvoiceDownloadButtonExcelFinal",
  props: {
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    filename: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: "Download All Invoices",
    },
    icon: {
      type: String,
      default: "mdi-download",
    },
    buttonColor: {
      type: String,
      default: "primary",
    },
  },
  computed: {
    hasRows() {
      return Array.isArray(this.items) && this.items.length > 0;
    },
  },
  methods: {
    nowTimestampForFilename() {
      const d = new Date();
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      return `${Y}-${M}-${D}_${h}-${m}-${s}`;
    },

    colorForKey(key) {
      if (!key) return "FFFFFFFF";
      let h = 0;
      for (let i = 0; i < key.length; i++)
        h = (h << 5) - h + key.charCodeAt(i);
      h = Math.abs(h);
      const hue = h % 360;
      const s = 60;
      const l = 90;
      const rgb = this.hslToRgb(hue, s / 100, l / 100);
      const hex = (
        (1 << 24) +
        (rgb[0] << 16) +
        (rgb[1] << 8) +
        rgb[2]
      )
        .toString(16)
        .slice(1)
        .toUpperCase();
      return "FF" + hex;
    },

    hslToRgb(h, s, l) {
      h = h / 360;
      let r, g, b;
      if (s === 0) r = g = b = l;
      else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    formatInvoiceDate(v) {
      if (!v) return "";
      const n = Number(v);
      if (!Number.isNaN(n)) {
        const ms = n < 1e12 ? n * 1000 : n;
        const d = new Date(ms);
        if (!isNaN(d.getTime()))
          return `${String(d.getDate()).padStart(2, "0")}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}-${d.getFullYear()}`;
      }
      const d2 = new Date(v);
      if (!isNaN(d2.getTime()))
        return `${String(d2.getDate()).padStart(2, "0")}-${String(
          d2.getMonth() + 1
        ).padStart(2, "0")}-${d2.getFullYear()}`;
      return String(v);
    },

    statusColor(status) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "APPROVED":
    case "ACTIVE":
    case "VALID":
      return "FFB7E1CD"; // ✅ Light Green

    case "DRAFT":
      return "FFFFFFCC"; // 🟡 Soft Yellow

    case "SOLD":
      return "FFFFDAB9"; // 🟠 Light Peach (distinct from Draft)

    case "REVIEW":
      return "FFFFB6C1"; // 💖 Light Pink (indicates needs attention)

    case "PENDING":
      return "FFADD8E6"; // 🟦 Light Blue (neutral waiting state)

    case "REJECTED":
    case "FAILED":
      return "FFFF9999"; // 🔴 Soft Red (clear rejection color)

    case "INACTIVE":
      return "FFD3D3D3"; // ⚪ Light Gray (for disabled/inactive)

    case "DISPATCHED":
      return "FFE6E6FA"; // 💜 Lavender (progressing)

    case "DELIVERED":
      return "FF98FB98"; // 🟢 Light Green (completed successfully)

    default:
      return "FFFFFFFF"; // default White
  }
},
    async download() {
      if (!this.hasRows) {
        this.$emit("no-data");
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Inventory", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      // Header row
      ws.columns = [
        { header: "S.NO", key: "sno", width: 6 },
        { header: "INVOICE NO", key: "invoiceNo", width: 14 },
        { header: "INVOICE DATE", key: "invoiceDate", width: 14 },
        { header: "Location", key: "location", width: 20 },
        { header: "Veh Category", key: "vehCategory", width: 18 },
        { header: "Veh Model", key: "vehModel", width: 36 },
        { header: "Veh Color", key: "vehColor", width: 14 },
        { header: "Frame No", key: "frameNo", width: 26 },
        { header: "Engine No", key: "engineNo", width: 24 },
        { header: "Source", key: "source", width: 18 },
        { header: "Status", key: "status", width: 14 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FF000000" } };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCE5FF" },
      };
      headerRow.height = 18;

      const byInvoice = this.items.reduce((acc, it) => {
        const inv = it.invoiceNumber || "NO-INVOICE";
        if (!acc[inv]) acc[inv] = [];
        acc[inv].push(it);
        return acc;
      }, {});
      const invoiceKeys = Object.keys(byInvoice).sort();

      let outRow = 2;
      let sno = 1;
      const categoryColorMap = {};
      const modelColorMap = {};

      for (const inv of invoiceKeys) {
        const list = byInvoice[inv];
        for (const it of list) {
          const row = ws.getRow(outRow);

          row.getCell("sno").value = sno++;
          row.getCell("invoiceNo").value = it.invoiceNumber || "";
          row.getCell("invoiceDate").value = this.formatInvoiceDate(
            it.invoiceDate
          );
          row.getCell("location").value = it.warehouse || "";
          row.getCell("vehCategory").value = it.categoryName || "";
          row.getCell("vehModel").value = it.modelName || "";
          row.getCell("vehColor").value = it.color || "";
          row.getCell("frameNo").value = it.chassisNumber || "";
          row.getCell("engineNo").value = it.engineNumber || "";
          row.getCell("source").value = it.source || "";
          row.getCell("status").value = it.status || "DRAFT";

          // Category & Model Pastel fill
          const catKey = it.categoryName || "Uncategorized";
          if (!categoryColorMap[catKey])
            categoryColorMap[catKey] = this.colorForKey(catKey);
          const modelKey = it.modelName || "Unknown Model";
          if (!modelColorMap[modelKey])
            modelColorMap[modelKey] = this.colorForKey(modelKey);

          row.getCell("vehCategory").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: categoryColorMap[catKey] },
          };
          row.getCell("vehModel").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: modelColorMap[modelKey] },
          };

          // Status-based color
          const statusColor = this.statusColor(it.status);
          row.getCell("status").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: statusColor },
          };

          // Alignment
          row.alignment = { vertical: "middle", wrapText: false };
          row.font = { name: "Calibri", size: 11 };

          outRow++;
        }
      }

      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: ws.columns.length },
      };

      const outName =
        this.filename ||
        `inventry_${this.nowTimestampForFilename()}.xlsx`;

      try {
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          outName
        );
        this.$emit("downloaded", { filename: outName });
      } catch (err) {
        console.error("Excel write error:", err);
      }
    },
  },
};
</script>
