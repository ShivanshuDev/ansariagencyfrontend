<template>
  <v-card style="margin:10px;">
    <v-card-title>
      <div class="d-flex align-center" style="width:100%;">
        <div style="flex:1;">
          <div class="headline">Vendor Accounts</div>
          <div class="text-caption">All vendor accounts (metadata) — quick view & search</div>
        </div>

        <!-- 🔹 New Deposit button -->
        <v-btn
          small
          color="primary"
          class="mr-2"
          @click="depositDialog = true"
          title="Deposit to vendor account"
        >
          <v-icon left>mdi-bank-transfer</v-icon>
          Deposit
        </v-btn>

        <!-- Existing refresh button (unchanged) -->
        <v-btn icon :loading="loading" @click="fetchAccounts" title="Refresh list">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-row dense class="mb-4">
        <!-- 🔽 Search by name using dropdown -->
        <v-col cols="12" sm="6" md="4">
          <v-autocomplete
            v-model="selectedName"
            :items="nameOptions"
            label="Search by Vendor Name"
            clearable
            dense
            outlined
            @change="applyNameFilter"
          />
        </v-col>

        <!-- dedicated server-side search by clientId -->
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="searchClientId"
            label="Search by Client ID"
            placeholder="Enter clientId"
            dense
            outlined
            clearable
            @keyup.enter="searchByClientId"
          >
          </v-text-field>
        </v-col>

        <v-col cols="12" sm="12" md="4" class="d-flex align-center">
          <div v-if="clientsError" class="red--text text-caption">{{ clientsError }}</div>
          <v-spacer></v-spacer>
        </v-col>
      </v-row>

      <!-- 🔹 Skeleton loader for main accounts table -->
      <template v-if="loading">
        <v-skeleton-loader
          type="table-heading, table-tbody"
          class="elevation-1"
        />
      </template>

      <!-- 🔹 Actual accounts table once data is loaded -->
      <template v-else>
        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :items-per-page="itemsPerPage"
          :loading="loading"
          class="elevation-1"
          dense
          :mobile-breakpoint="0"
          item-key="vendorId"
          :page.sync="page"
        >
          <!-- #️⃣ Serial number -->
          <template #item.sn="{ index }">
            {{ (page - 1) * itemsPerPage + index + 1 }}
          </template>

          <!-- ☑️ Header checkbox (Select All) -->
          <template #header.selected>
            <v-checkbox
              v-model="allSelected"
              :indeterminate="isIndeterminate"
              hide-details
              @change="toggleSelectAll"
            />
          </template>

          <!-- ☑️ Row checkbox -->
          <template #item.selected="{ item }">
            <v-checkbox
              :input-value="isRowSelected(item)"
              hide-details
              @change="() => toggleRowSelection(item)"
            />
          </template>

          <!-- Name column -->
          <template #item.name="{ item }">
            <div class="font-weight-medium">{{ item.name || '—' }}</div>
          </template>

          <!-- 👁️ Actions column (Details button) -->
          <template #item.actions="{ item }">
            <v-btn small text @click="onRowClick(item)">
              Details
            </v-btn>
          </template>

          <template #no-data>
            <v-alert type="info" dense text>
              No accounts found.
            </v-alert>
          </template>
        </v-data-table>
      </template>
    </v-card-text>

    <!-- details dialog -->
    <v-dialog persistent v-model="detailsDialog" max-width="1700px">
      <v-card>
        <v-card-title>
          <span class="headline">Account Details</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- 🔹 Skeleton loader for details & ledger while loading -->
          <div v-if="detailsLoading" class="pa-4">
            <v-skeleton-loader
              type="article"
              class="mb-4"
            />
            <v-skeleton-loader
              type="heading"
              class="mb-2"
            />
            <v-skeleton-loader
              type="table-heading, table-tbody"
              class="elevation-1"
            />
          </div>

          <!-- 🔹 Actual content once details are loaded -->
          <div v-else-if="selectedDetails">
            <v-row dense>
              <v-col cols="12" sm="4">
                <strong>Vendor ID</strong>
                <div>{{ selectedDetails.vendor?.vendorId || selectedDetails.vendor?.pk || '—' }}</div>
              </v-col>

              <v-col cols="12" sm="4">
                <strong>Name</strong>
                <div>{{ selectedDetails.vendor?.name || '—' }}</div>
              </v-col>

              <v-col cols="12" sm="4">
                <strong>Phone</strong>
                <div>{{ selectedDetails.vendor?.phone || '—' }}</div>
              </v-col>

              <v-col cols="12" sm="4">
                <strong>Email</strong>
                <div>{{ selectedDetails.vendor?.email || '—' }}</div>
              </v-col>

              <v-col cols="12" sm="4">
                <strong>Current Balance</strong>
                <div>₹ {{ selectedDetails.account?.balance != null ? selectedDetails.account.balance : '—' }}</div>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- 🔹 Range filter + download buttons -->
            <v-row dense class="mb-2">
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="dateFrom"
                  label="From Date"
                  type="date"
                  dense
                  outlined
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="dateTo"
                  label="To Date"
                  type="date"
                  dense
                  outlined
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" sm="6" class="d-flex align-end justify-end">
                <v-btn small class="mr-2" text @click="clearDateFilter">Clear Range</v-btn>
                <v-btn small class="mr-2" outlined @click="downloadPdf">Download PDF</v-btn>
                <v-btn small outlined @click="downloadExcel">Download Excel</v-btn>
              </v-col>
            </v-row>

            <div class="subtitle-2 mb-2">Ledger / Transactions</div>

            <!-- 🔹 Ledger table with running balance -->
            <v-data-table
              :headers="ledgerHeaders"
              :items="filteredLedgerRows"
              dense
              class="elevation-1"
              :items-per-page="50"
              :mobile-breakpoint="0"
            >
              <template #item.date="{ item }">
                <span>{{ item.date }}</span>
              </template>

              <template #item.time="{ item }">
                <span>{{ item.time }}</span>
              </template>

              <template #item.narration="{ item }">
                <span class="text-truncate" style="max-width: 200px; display:inline-block;">
                  {{ item.narration || '—' }}
                </span>
              </template>

              <template #item.debit="{ item }">
                <span v-if="item.debit" class="red--text font-weight-medium">
                  - ₹ {{ item.debit }}
                </span>
                <span v-else>—</span>
              </template>

              <template #item.credit="{ item }">
                <span v-if="item.credit" class="green--text font-weight-medium">
                  + ₹ {{ item.credit }}
                </span>
                <span v-else>—</span>
              </template>

              <template #item.runningBalance="{ item }">
                <span class="font-weight-bold">
                  ₹ {{ item.runningBalance }}
                </span>
              </template>

              <template #footer.prepend>
                <div class="pa-3">
                  <div class="font-weight-medium">
                    Total Debit: <span class="red--text">₹ {{ totalDebit }}</span>
                  </div>
                  <div class="font-weight-medium">
                    Total Credit: <span class="green--text">₹ {{ totalCredit }}</span>
                  </div>
                </div>
              </template>
            </v-data-table>
          </div>

          <div v-else>
            <v-alert type="warning">No details available</v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 New Deposit dialog with existing VendorDepositForm -->
    <v-dialog v-model="depositDialog" max-width="900px" persistent>
      <vendor-deposit-form
        @notify="$emit('notify', $event)"
        @created="onDepositCreated"
      />
    </v-dialog>
  </v-card>
</template>

<script>
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import logoSrc from "@/assets/newLogoTVS.png";

// 🔹 Import your existing VendorDepositForm component
// Adjust the path as per your project structure
import VendorDepositForm from "@/components/ledger/AddEntryForm.vue";

export default {
  name: "AccountsTable",
  components: {
    VendorDepositForm
  },
  data() {
    return {
      loading: false,
      searchLoading: false,
      clientsError: "",
      items: [],

      selectedName: "",
      nameFilterApplied: false,
      searchClientId: "",
      itemsPerPage: 12,
      page: 1,

      detailsDialog: false,
      selectedRow: null,
      selectedDetails: null,
      detailsLoading: false,
      history: [],
      ledgerRows: [],

      selectedVendorIds: [],
      allSelected: false,

      // date range filter
      dateFrom: "",
      dateTo: "",

      // 🔹 controls the new Deposit popup
      depositDialog: false
    };
  },
  computed: {
    BASE() {
      return (process.env.VUE_APP_AGENCY_BACKEND_URL || "").replace(/\/$/, "");
    },

    headers() {
      return [
        { text: "S.No", value: "sn", sortable: false },
        { text: "Vendor ID", value: "vendorId", sortable: true },
        { text: "Name", value: "name", sortable: true },
        { text: "Phone", value: "phone", sortable: false },
        { text: "Email", value: "email", sortable: false },
        { text: "Status", value: "status", sortable: false },
        { text: "Actions", value: "actions", sortable: false }
      ];
    },

    ledgerHeaders() {
      return [
        { text: "Date", value: "date" },
        { text: "Time", value: "time" },
        { text: "Narration", value: "narration" },
        { text: "Debit (₹)", value: "debit" },
        { text: "Credit (₹)", value: "credit" },
        { text: "Running Balance (₹)", value: "runningBalance" }
      ];
    },

    nameOptions() {
      const names = this.items
        .map(i => i.name)
        .filter(n => !!n);
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    },

    filteredItems() {
      if (this.nameFilterApplied && this.selectedName) {
        return this.items.filter(i => i.name === this.selectedName);
      }
      return this.items;
    },

    filteredLedgerRows() {
      let rows = this.ledgerRows || [];
      if (this.dateFrom) {
        rows = rows.filter(r => r.dateKey && r.dateKey >= this.dateFrom);
      }
      if (this.dateTo) {
        rows = rows.filter(r => r.dateKey && r.dateKey <= this.dateTo);
      }
      return rows;
    },

    totalDebit() {
      return this.filteredLedgerRows.reduce(
        (sum, row) => sum + (row.debit || 0),
        0
      );
    },
    totalCredit() {
      return this.filteredLedgerRows.reduce(
        (sum, row) => sum + (row.credit || 0),
        0
      );
    },

    isIndeterminate() {
      const allIds = this.filteredItems.map(i => i.vendorId || i.pk);
      if (!allIds.length) return false;
      const selectedCount = allIds.filter(id =>
        this.selectedVendorIds.includes(id)
      ).length;
      return selectedCount > 0 && selectedCount < allIds.length;
    }
  },
  watch: {
    filteredItems() {
      this.syncAllSelectedState();
    }
  },
  mounted() {
    this.fetchAccounts();
  },
  methods: {
    applyNameFilter() {
      if (this.selectedName) {
        this.nameFilterApplied = true;
        this.page = 1;
      } else {
        this.nameFilterApplied = false;
      }
    },
    resetNameFilter() {
      this.selectedName = "";
      this.nameFilterApplied = false;
      this.page = 1;
    },

    isRowSelected(item) {
      const id = item.vendorId || item.pk;
      return this.selectedVendorIds.includes(id);
    },
    toggleRowSelection(item) {
      const id = item.vendorId || item.pk;
      const idx = this.selectedVendorIds.indexOf(id);
      if (idx === -1) {
        this.selectedVendorIds.push(id);
      } else {
        this.selectedVendorIds.splice(idx, 1);
      }
      this.syncAllSelectedState();
    },
    toggleSelectAll() {
      if (this.allSelected) {
        this.selectedVendorIds = this.filteredItems.map(
          i => i.vendorId || i.pk
        );
      } else {
        this.selectedVendorIds = [];
      }
    },
    syncAllSelectedState() {
      const allIds = this.filteredItems.map(i => i.vendorId || i.pk);
      if (!allIds.length) {
        this.allSelected = false;
        return;
      }
      const selectedCount = allIds.filter(id =>
        this.selectedVendorIds.includes(id)
      ).length;
      this.allSelected = selectedCount === allIds.length && selectedCount > 0;
    },

    clearDateFilter() {
      this.dateFrom = "";
      this.dateTo = "";
    },

    async fetchHistory(vendorId) {
      try {
        const res = await axios.get(
          `${this.BASE}/getVendorAccountHistory/${vendorId}`
        );
        const txns = res.data.transactions || [];
        this.history = txns;

        this.ledgerRows = this.buildLedgerRows(txns, vendorId);
        this.clearDateFilter();
      } catch (err) {
        console.error(err);
        this.$emit("notify", { text: "Failed to load history", color: "error" });
      }
    },

    buildLedgerRows(rawTxns, vendorId) {
      const vendorAccountId = `ACCOUNT#${vendorId}`;

      const legs = rawTxns.filter(
        t => t.leg && t.accountId === vendorAccountId
      );

      // oldest → newest
      legs.sort((a, b) => {
        const ca = a.createdAt || 0;
        const cb = b.createdAt || 0;
        if (ca !== cb) return ca - cb;
        return (a.gsi1sk || "").localeCompare(b.gsi1sk || "");
      });

      let running = 0;

      return legs.map(t => {
        const isCredit = t.leg === "CREDIT";
        const amount = Number(t.amount || 0);
        running += isCredit ? amount : -amount;

        const epochMs = t.createdAt ? t.createdAt * 1000 : null;
        const d = epochMs ? new Date(epochMs) : null;

        const dateKey = d
          ? d.toISOString().slice(0, 10)
          : (t.dateISO || "").slice(0, 10);

        let displayDate = "";
        if (dateKey) {
          const [year, month, day] = dateKey.split("-");
          displayDate = `${day}/${month}/${year}`;
        }

        const time = d ? d.toLocaleTimeString() : "";

        return {
          id: t.sk,
          date: displayDate,
          time,
          dateKey,
          narration: t.narration || "",
          debit: !isCredit ? amount : 0,
          credit: isCredit ? amount : 0,
          runningBalance: running,
          type: t.type,
          leg: t.leg,
          refNo: t.refNo
        };
      });
    },

    async fetchAccounts() {
      this.loading = true;
      this.clientsError = "";
      try {
        const url = `${this.BASE}/getAllAccount`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        this.items = Array.isArray(data.items)
          ? data.items.map(i => this.normalizeItem(i))
          : [];
      } catch (err) {
        console.error("fetchAccounts error", err);
        this.clientsError = "Failed to load accounts";
        this.$emit("notify", {
          text: err?.message || "Failed to load accounts",
          color: "error"
        });
      } finally {
        this.loading = false;
      }
    },

    normalizeItem(i) {
      return {
        pk: i.pk || null,
        vendorId: i.vendorId || (i.pk ? String(i.pk).split("#")[1] : null),
        name: i.name || i.clientName || null,
        phone: i.phone || i.altphone || null,
        email: i.email || null,
        balance:
          i.balance != null
            ? i.balance
            : i.accountBalance != null
            ? i.accountBalance
            : null,
        currency: i.currency || null,
        status: i.status || null,
        raw: i
      };
    },

    async searchByClientId() {
      const id = String(this.searchClientId || "").trim();
      if (!id) {
        this.$emit("notify", {
          text: "Please enter clientId to search",
          color: "warning"
        });
        return;
      }
      this.searchLoading = true;
      try {
        const url = `${this.BASE}/getAccountByClientId?clientId=${encodeURIComponent(
          id
        )}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.message || `HTTP ${res.status}`;
          this.$emit("notify", { text: msg, color: "error" });
          return;
        }
        const vendor = data.vendor || null;
        const account = data.account || null;

        this.selectedDetails = { vendor, account };
        this.detailsDialog = true;

        const vendorId =
          vendor?.vendorId ||
          (vendor?.pk ? String(vendor.pk).split("#")[1] : null);
        if (vendorId) {
          const idx = this.items.findIndex(
            it => it.vendorId === vendorId || it.pk === vendor.pk
          );
          const normalized = this.normalizeItem(vendor);
          normalized.raw = vendor;
          if (idx >= 0) {
            this.items.splice(idx, 1, { ...normalized });
          } else {
            this.items.unshift(normalized);
          }
        }
      } catch (err) {
        console.error("searchByClientId error", err);
        this.$emit("notify", {
          text: err?.message || "Failed to search by clientId",
          color: "error"
        });
      } finally {
        this.searchLoading = false;
      }
    },

    async onRowClick(item) {
      if (!item) return;
      const vendorId =
        item.vendorId || (item.pk ? String(item.pk).split("#")[1] : null);
      if (!vendorId) {
        this.$emit("notify", {
          text: "Vendor id not found for selected row",
          color: "warning"
        });
        return;
      }

      this.detailsDialog = true;
      this.detailsLoading = true;
      this.selectedDetails = null;
      this.ledgerRows = [];
      this.clearDateFilter();

      try {
        const url = `${this.BASE}/getAccountByClientId?clientId=${encodeURIComponent(
          vendorId
        )}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.message || `HTTP ${res.status}`;
          this.$emit("notify", { text: msg, color: "error" });
          this.detailsLoading = false;
          return;
        }

        this.selectedDetails = {
          vendor: data.vendor || null,
          account: data.account || null
        };

        await this.fetchHistory(this.selectedDetails.vendor.vendorId);
      } catch (err) {
        console.error("onRowClick error", err);
        this.$emit("notify", {
          text: err?.message || "Failed to fetch account details",
          color: "error"
        });
      } finally {
        this.detailsLoading = false;
      }
    },

    // 🔹 Called when deposit is successful inside VendorDepositForm
    async onDepositCreated(payload) {
      // Close deposit dialog
      this.depositDialog = false;

      // Refresh main accounts list
      await this.fetchAccounts();

      // If some vendor is already selected in details dialog, refresh its history too
      const vendorId =
        this.selectedDetails?.vendor?.vendorId ||
        (this.selectedDetails?.vendor?.pk
          ? String(this.selectedDetails.vendor.pk).split("#")[1]
          : null);

      if (vendorId) {
        this.fetchHistory(vendorId);
      }
    },

    // ========== PDF DOWNLOAD WITH LOGO & COLORS ==========
    downloadPdf() {
      if (!this.filteredLedgerRows.length) {
        this.$emit("notify", {
          text: "No ledger data to export",
          color: "warning"
        });
        return;
      }

      const img = new Image();
      img.src = logoSrc;

      img.onload = () => {
        const doc = new jsPDF("l", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        const vendorName = this.selectedDetails?.vendor?.name || "";
        const vendorId = this.selectedDetails?.vendor?.vendorId || "";
        const hasPeriod = this.dateFrom || this.dateTo;
        const periodFrom = this.dateFrom || "";
        const periodTo = this.dateTo || "";

        // Logo top-left
        doc.addImage(img, "PNG", 40, 25, 100, 50);

        // Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Ansari Automobile", pageWidth / 2, 40, { align: "center" });

        // Address block
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const addressLines = [
          "Ansari Automobile",
          "BADI KAMHARIYA BY PASS ROAD, MAU"
        ];
        let addrY = 30;
        addressLines.forEach(line => {
          doc.text(line, pageWidth - 40, addrY, { align: "right" });
          addrY += 12;
        });

        // Vendor details
        let infoY = 95;
        doc.text(`Vendor Name: ${vendorName}`, 40, infoY);
        infoY += 15;
        doc.text(`Vendor ID: ${vendorId}`, 40, infoY);
        infoY += 15;

        if (hasPeriod) {
          doc.text(
            `Time Period: ${periodFrom || "-"} to ${periodTo || "-"}`,
            40,
            infoY
          );
          infoY += 15;
        }

        const headers = [
          "Date",
          "Description",
          "Debit",
          "Credit",
          "Dr or Cr",
          "Closing Balance"
        ];

        const body = this.filteredLedgerRows.map(r => {
          const drCr = r.debit ? "Dr" : r.credit ? "Cr" : "";
          return [
            r.date || "",
            r.narration || "",
            r.debit || "",
            r.credit || "",
            drCr,
            r.runningBalance || ""
          ];
        });

        const closingBalance = this.filteredLedgerRows.length
          ? this.filteredLedgerRows[this.filteredLedgerRows.length - 1]
              .runningBalance
          : 0;

        const foot = [
          [
            "",
            "Total",
            this.totalDebit || 0,
            this.totalCredit || 0,
            "",
            closingBalance || 0
          ]
        ];

        autoTable(doc, {
          head: [headers],
          body,
          foot,
          startY: infoY + 10,
          styles: {
            fontSize: 9,
            halign: "center",
            valign: "middle",
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
            textColor: [0, 0, 0]
          },
          headStyles: {
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255]
          },
          footStyles: {
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255],
            fontStyle: "bold"
          },
          didParseCell: data => {
            if (data.section === "body") {
              const rowIndex = data.row.index;
              const row = this.filteredLedgerRows[rowIndex];
              if (!row) return;

              if (row.debit) {
                data.cell.styles.fillColor = [255, 230, 230];
              } else if (row.credit) {
                data.cell.styles.fillColor = [230, 255, 230];
              }
            }
          }
        });

        const watermarkText = "Ansari Automobile";
        const totalPages = doc.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          const pw = doc.internal.pageSize.getWidth();
          const ph = doc.internal.pageSize.getHeight();

          if (doc.GState) {
            const gs = doc.GState({ opacity: 0.08 });
            doc.setGState(gs);
          }

          doc.setFontSize(70);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 180, 180);
          doc.text(watermarkText, pw / 2, ph / 2, {
            align: "center",
            angle: 45
          });
        }

        const fileName = `Ledger_${vendorName || vendorId || "vendor"}.pdf`;
        doc.save(fileName);
      };

      img.onerror = () => {
        this.$emit("notify", {
          text: "Logo failed to load, exporting without logo",
          color: "warning"
        });
        this.downloadPdfWithoutLogo();
      };
    },

    downloadPdfWithoutLogo() {
      if (!this.filteredLedgerRows.length) return;

      const doc = new jsPDF("l", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const vendorName = this.selectedDetails?.vendor?.name || "";
      const vendorId = this.selectedDetails?.vendor?.vendorId || "";
      const hasPeriod = this.dateFrom || this.dateTo;
      const periodFrom = this.dateFrom || "";
      const periodTo = this.dateTo || "";

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Ansari Automobile", pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const addressLines = [
        "Ansari Automobile",
        "Full Address Line 1",
        "Full Address Line 2",
        "City, State, PIN"
      ];
      let addrY = 30;
      addressLines.forEach(line => {
        doc.text(line, pageWidth - 40, addrY, { align: "right" });
        addrY += 12;
      });

      let infoY = 90;
      doc.text(`Vendor Name: ${vendorName}`, 40, infoY);
      infoY += 15;
      doc.text(`Vendor ID: ${vendorId}`, 40, infoY);
      infoY += 15;

      if (hasPeriod) {
        doc.text(
          `Time Period: ${periodFrom || "-"} to ${periodTo || "-"}`,
          40,
          infoY
        );
        infoY += 15;
      }

      const headers = [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Dr or Cr",
        "Closing Balance"
      ];

      const body = this.filteredLedgerRows.map(r => {
        const drCr = r.debit ? "Dr" : r.credit ? "Cr" : "";
        return [
          r.date || "",
          r.narration || "",
          r.debit || "",
          r.credit || "",
          drCr,
          r.runningBalance || ""
        ];
      });

      const closingBalance = this.filteredLedgerRows.length
        ? this.filteredLedgerRows[this.filteredLedgerRows.length - 1]
            .runningBalance
        : 0;

      const foot = [
        [
          "",
          "Total",
          this.totalDebit || 0,
          this.totalCredit || 0,
          "",
          closingBalance || 0
        ]
      ];

      autoTable(doc, {
        head: [headers],
        body,
        foot,
        startY: infoY + 10,
        styles: {
          fontSize: 9,
          halign: "center",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          textColor: [0, 0, 0]
        },
        headStyles: {
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255]
        },
        footStyles: {
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          fontStyle: "bold"
        },
        didParseCell: data => {
          if (data.section === "body") {
            const rowIndex = data.row.index;
            const row = this.filteredLedgerRows[rowIndex];
            if (!row) return;

            if (row.debit) {
              data.cell.styles.fillColor = [255, 230, 230];
            } else if (row.credit) {
              data.cell.styles.fillColor = [230, 255, 230];
            }
          }
        }
      });

      const watermarkText = "Ansari Automobile";
      const totalPages = doc.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();

        if (doc.GState) {
          const gs = doc.GState({ opacity: 0.08 });
          doc.setGState(gs);
        }

        doc.setFontSize(70);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 180, 180);
        doc.text(watermarkText, pw / 2, ph / 2, {
          align: "center",
          angle: 45
        });
      }

      const fileName = `Ledger_${vendorName || vendorId || "vendor"}.pdf`;
      doc.save(fileName);
    },

    downloadExcel() {
      if (!this.filteredLedgerRows.length) {
        this.$emit("notify", {
          text: "No ledger data to export",
          color: "warning"
        });
        return;
      }

      const vendorName = this.selectedDetails?.vendor?.name || "";
      const vendorId = this.selectedDetails?.vendor?.vendorId || "";
      const closingBalance = this.filteredLedgerRows.length
        ? this.filteredLedgerRows[this.filteredLedgerRows.length - 1]
            .runningBalance
        : 0;

      const headerRow = [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Dr or Cr",
        "Closing Balance"
      ];

      const dataRows = this.filteredLedgerRows.map(r => {
        const drCr = r.debit ? "Dr" : r.credit ? "Cr" : "";
        return [
          r.date || "",
          r.narration || "",
          r.debit || "",
          r.credit || "",
          drCr,
          r.runningBalance || ""
        ];
      });

      const totalRow = [
        "",
        "Total",
        this.totalDebit || 0,
        this.totalCredit || 0,
        "",
        closingBalance || 0
      ];

      const aoa = [headerRow, ...dataRows, totalRow];

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      const range = XLSX.utils.decode_range(ws["!ref"]);
      const headerFill = { fgColor: { rgb: "C6E0B4" } };
      const debitFill = { fgColor: { rgb: "F8CBAD" } };
      const creditFill = { fgColor: { rgb: "C6E0B4" } };
      const totalFill = { fgColor: { rgb: "C6E0B4" } };

      const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;

          let fill = null;

          if (R === 0) {
            fill = headerFill;
          } else if (R === range.e.r) {
            fill = totalFill;
          } else {
            const rowIdx = R - 1;
            const row = this.filteredLedgerRows[rowIdx];
            if (row) {
              if (row.debit) fill = debitFill;
              else if (row.credit) fill = creditFill;
            }
          }

          ws[cellRef].s = {
            fill: fill || {},
            alignment: { horizontal: "center", vertical: "center" },
            border: borderStyle
          };
        }
      }

      const colWidths = headerRow.map((_, cIdx) => {
        let maxLen = 10;
        aoa.forEach(row => {
          const val = row[cIdx];
          if (val != null) {
            maxLen = Math.max(maxLen, String(val).length + 2);
          }
        });
        return { wch: maxLen };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");

      const fileName = `Ledger_${vendorName || vendorId || "vendor"}.xlsx`;
      XLSX.writeFile(wb, fileName);
    }
  }
};
</script>

<style scoped>
.headline {
  font-weight: 600;
}
.text-caption {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.85rem;
}
pre {
  font-size: 12px;
}
</style>
