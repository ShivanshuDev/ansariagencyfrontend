\<template>
  <v-card style="margin:10px;">
    <v-card-title>
      <div class="d-flex align-center" style="width:100%;">

        <div v-if="!showAddNewBlock" style="flex:1;">
          <div class="headline">Vendor Accounts</div>
          <div class="text-caption">All vendor accounts (metadata) — quick view & search</div>
        </div>
        <div v-else style="flex:1;">
          <v-icon
            left
            style="width:40px; height:40px; border:1px solid black; border-radius:50%;"
            @click="showAddNewBlock = !showAddNewBlock"
          >
            mdi-arrow-left
          </v-icon>
        </div>

        <!-- New Vendor Buttton -->
        <v-btn
          small
          color=""
          class="mr-2"
          @click="createNewVendor()"
          title="Add new vendor"
        >
          <v-icon left>mdi-account-plus</v-icon>
          Add New Vendor
        </v-btn>

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

        <!-- 🔹 Open Account button (new) -->
        <v-btn
          small
          color="success"
          class="mr-2"
          @click="openAccountDialog = true"
          title="Open a new vendor account"
        >
          <v-icon left>mdi-account-plus</v-icon>
          Open Account
        </v-btn>

        <!-- Existing refresh button (unchanged) -->
        <v-btn icon :loading="loading" @click="fetchAccounts" title="Refresh list">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <div v-if="!showAddNewBlock">
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

          <!-- Global search over merged data -->
          <v-col cols="12" sm="12" md="4">
            <v-text-field
              outlined
              v-model="search"
              append-icon="mdi-magnify"
              placeholder="Search id, name, email, phone, GSTIN, status"
              dense
              hide-details
              clearable
            />
            <div v-if="clientsError" class="red--text text-caption mt-1">
              {{ clientsError }}
            </div>
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
            :items="finalItems"
            :items-per-page="itemsPerPage"
            :loading="loading"
            class="elevation-1"
            dense
            :mobile-breakpoint="0"
            item-key="vendorId"
            :page.sync="page"
            :footer-props="vendorFooterProps"
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

            <template #item.gstin="{ item }">
              {{ item.gstin || '—' }}
            </template>

            <!-- 👁️ Actions column -->
            <template #item.actions="{ item }">
              <!-- Existing Account Details / Ledger -->
              <v-btn small
                outlined
                color="primary"
                title="Show vendor Ledger"
                class="mr-1" @click="onRowClick(item)">
                Ledger
              </v-btn>

              <!-- New Vendor Info dialog (ClientDetail) -->
              <v-btn
                small
                outlined
                color="primary"
                class="mr-1"
                @click.stop="showDetails(item)"
                title="Show vendor details"
              >
                <v-icon left small>mdi-eye</v-icon>
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
      </div>

      <div v-if="showAddNewBlock">
        <CreateNewVendor @vendor-created="onVendorCreated" />
      </div>

    </v-card-text>

    <!-- details dialog (unchanged: Account ledger) -->
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

            <v-row dense class="mb-2">
              <v-col cols="12" sm="3">
                <v-menu
                  ref="menuFrom"
                  v-model="menuFrom"
                  :close-on-content-click="false"
                  transition="slide-y-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template #activator="{ on, attrs }">
                    <v-text-field
                      v-model="dateFromDisplay"
                      label="From Date"
                      placeholder="dd/mm/yyyy"
                      dense
                      outlined
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      clearable
                      hide-details
                    />
                  </template>

                  <v-date-picker
                    v-model="dateFrom"
                    :max="todayISO"
                    @input="onFromDateSelected"
                  />
                </v-menu>
              </v-col>

              <v-col cols="12" sm="3">
                <v-menu
                  ref="menuTo"
                  v-model="menuTo"
                  :close-on-content-click="false"
                  transition="slide-y-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template #activator="{ on, attrs }">
                    <v-text-field
                      v-model="dateToDisplay"
                      label="To Date"
                      placeholder="dd/mm/yyyy"
                      dense
                      outlined
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      clearable
                      hide-details
                    />
                  </template>

                  <v-date-picker
                    v-model="dateTo"
                    :min="dateFrom || null"
                    :max="todayISO"
                    @input="menuTo = false"
                  />
                </v-menu>
              </v-col>

              <v-col cols="12" sm="6" class="d-flex align-end justify-end">
                <v-btn color="success" small outlined class="mr-2" text @click="clearDateFilter">RESET</v-btn>
                <v-btn style="background-color:black; color:white;" small class="mr-2" outlined @click="downloadPdf">
                  <v-icon left>mdi-file-pdf-box</v-icon> PDF
                </v-btn>
                <v-btn style="background-color:blue; color:white;" small outlined @click="downloadExcel"> Excel</v-btn>
              </v-col>
            </v-row>

            <div class="subtitle-2 mb-2">Ledger / Transactions</div>

            <v-data-table
              :headers="ledgerHeaders"
              :items="filteredLedgerRows"
              dense
              class="elevation-1"
              :items-per-page="ledgerItemsPerPage"
              :mobile-breakpoint="0"
              :page.sync="ledgerPage"
              :footer-props="ledgerFooterProps"
            >
              <!-- #️⃣ Ledger Serial number -->
              <template #item.sn="{ index }">
                {{ (ledgerPage - 1) * ledgerItemsPerPage + index + 1 }}
              </template>

              <template #item.date="{ item }">
                <span>{{ item.date }}</span>
              </template>

              <template #item.time="{ item }">
                <span>{{ item.time }}</span>
              </template>

              <template #item.narration="{ item }">
                <span class="text-truncate" style="max-width: 700px; display:inline-block;">
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
    <v-dialog v-model="depositDialog" max-width="1200px" persistent>
      <v-card>
        <v-card-title>
          <div class="d-flex align-center" style="width:100%;">
            <div style="flex:1;">
              <span class="headline">Deposit to Vendor</span>
              <div class="text-caption">Create a new deposit entry</div>
            </div>
            <v-btn icon @click="depositDialog = false" title="Close dialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text style="padding-top: 0;">
          <vendor-deposit-form
            @notify="$emit('notify', $event)"
            @created="onDepositCreated"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 🔹 Open Account dialog (new) -->
    <v-dialog v-model="openAccountDialog" max-width="1200px" persistent>
      <v-card>
        <v-card-title>
          <div class="d-flex align-center" style="width:100%;">
            <div style="flex:1;">
              <span class="headline">Open Vendor Account</span>
              <div class="text-caption">Create a new vendor account</div>
            </div>
            <v-btn icon @click="openAccountDialog = false" title="Close dialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text style="padding-top: 0;">
          <create-vendor-account
            @notify="$emit('notify', $event)"
            @created="onAccountCreated"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 🔹 Vendor details dialog (from ClientDataTableSimple) -->
    <v-dialog v-model="dialog" max-width="1400px" persistent>
      <v-card>
        <v-card-title>
          Vendor Information
          <v-spacer></v-spacer>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <!-- 🔹 includes sold items section -->
        <v-card-text style="height:700px; overflow-y:auto;">
          <div v-if="selectedPk">
            <!-- existing client details component -->
            <client-detail :pk="selectedPk" />

            <!-- NEW: items sold to this vendor -->
            <v-divider class="my-4" />

            <div>
              <div class="subtitle-2 font-weight-medium mb-2">
                Items Sold to this Vendor
              </div>

              <!-- loading state -->
              <v-skeleton-loader
                v-if="soldItemsLoading"
                type="table-heading, table-tbody"
                class="elevation-1"
              />

              <!-- error state -->
              <v-alert
                v-else-if="soldItemsError"
                type="error"
                dense
                text
                class="mb-2"
              >
                {{ soldItemsError }}
              </v-alert>

              <!-- no data -->
              <v-alert
                v-else-if="!soldItems.length"
                type="info"
                dense
                text
                class="mb-2"
              >
                No sold items found for this vendor.
              </v-alert>

              <!-- data table -->
              <v-data-table
                v-else
                :headers="soldItemHeaders"
                :items="soldItems"
                dense
                class="elevation-1"
                :items-per-page="5"
                :mobile-breakpoint="0"
              >
                <template #item.invoiceDate="{ item }">
                  <span>{{ formatInvoiceDate(item.invoiceDate) }}</span>
                </template>

                <template #item.price="{ item }">
                  <span>₹ {{ formatAmount(item.price) }}</span>
                </template>
              </v-data-table>
            </div>
          </div>

          <div v-else>
            No client selected
          </div>
        </v-card-text>

        <v-card-actions>
          <div style="width:100%; display:flex; flex-direction:row-reverse">
            <v-btn color="primary dark" @click="onEditClick"> EDIT</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Edit vendor dialog (from ClientDataTableSimple) -->
    <v-dialog v-model="editDialog" max-width="1420px">
      <v-card>
        <v-card-title>
          Edit Vendor
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text style="min-height:400px;">
          <edit-client
            v-if="editPk"
            :pk="editPk"
            @saved="onClientSaved"
            @cancel="closeEdit"
          />
          <div v-else> No client selected for edit </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script>
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import logoSrc from "@/assets/newLogoTVS.png"; // still imported, but not required for layout

import VendorDepositForm from "@/components/ledger/AddEntryForm.vue";
import CreateVendorAccount from "@/components/ledger/CreateVendorAccount.vue";
import CreateNewVendor from "@/components/client/addclient.vue";

// from details table
import ClientDetail from "@/components/client/clientdetails.vue";
import EditClient from "@/components/client/editclient.vue";

export default {
  name: "AccountsTable",
  components: {
    VendorDepositForm,
    CreateVendorAccount,
    CreateNewVendor,
    ClientDetail,
    EditClient
  },
  data() {
    return {
      loading: false,
      searchLoading: false,
      clientsError: "",
      items: [],      // merged (accounts + details)

      // for merging details
      clients: [],

      selectedName: "",
      nameFilterApplied: false,
      searchClientId: "",
      itemsPerPage: 12,
      page: 1,

      // ledger pagination
      ledgerItemsPerPage: 10,
      ledgerPage: 1,

      // global search over merged items
      search: "",

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

      // popups
      depositDialog: false,
      openAccountDialog: false,
      menuFrom: false,
      menuTo: false,
      showAddNewBlock: false,

      // dialogs from ClientDataTableSimple
      dialog: false,
      selectedPk: null,
      editDialog: false,
      editPk: null,

      // sold items section
      soldItems: [],
      soldItemsLoading: false,
      soldItemsError: ""
    };
  },
  computed: {
    todayISO() {
      return new Date().toISOString().slice(0, 10);
    },
    dateFromDisplay: {
      get() {
        return this.formatISOToDisplay(this.dateFrom);
      },
      set(val) {
        this.dateFrom = this.parseDisplayToISO(val);
      }
    },
    dateToDisplay: {
      get() {
        return this.formatISOToDisplay(this.dateTo);
      },
      set(val) {
        this.dateTo = this.parseDisplayToISO(val);
      }
    },
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
        { text: "GSTIN", value: "gstin", sortable: false },
        { text: "Status", value: "status", sortable: false },
        { text: "Actions", value: "actions", sortable: false }
      ];
    },

    ledgerHeaders() {
      return [
        { text: "S.No", value: "sn", sortable: false },
        { text: "Date", value: "date" },
        { text: "Time", value: "time" },
        { text: "Narration", value: "narration" },
        { text: "Debit (₹)", value: "debit" },
        { text: "Credit (₹)", value: "credit" },
        { text: "Running Balance (₹)", value: "runningBalance" }
      ];
    },

    // rows-per-page controls for Vendor Accounts table
    vendorFooterProps() {
      return {
        "items-per-page-options": [12, 25, 50, 100],
        "items-per-page-text": "Rows per page:"
      };
    },

    // rows-per-page controls for Ledger table
    ledgerFooterProps() {
      return {
        "items-per-page-options": [10, 25, 50, 100],
        "items-per-page-text": "Rows per page:"
      };
    },

    // headers for items sold section
    soldItemHeaders() {
      return [
        { text: "Invoice No", value: "invoiceNumber", sortable: false },
        { text: "Invoice Date", value: "invoiceDate", sortable: false },
        { text: "Model", value: "modelName", sortable: false },
        { text: "Chassis No", value: "chassisNumber", sortable: false },
        { text: "Engine No", value: "engineNumber", sortable: false },
        { text: "Color", value: "color", sortable: false },
        { text: "Category", value: "category", sortable: false },
        { text: "Qty", value: "quantity", sortable: false },
        { text: "Price (₹)", value: "price", sortable: false }
      ];
    },

    nameOptions() {
      const names = this.items
        .map(i => i.name)
        .filter(n => !!n);
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    },

    // 1. apply name filter (existing behavior)
    filteredItems() {
      if (this.nameFilterApplied && this.selectedName) {
        return this.items.filter(i => i.name === this.selectedName);
      }
      return this.items;
    },

    // 2. apply global search on top of filteredItems
    finalItems() {
      const q = (this.search || "").toString().trim().toLowerCase();
      if (!q) return this.filteredItems;

      return this.filteredItems.filter(row => {
        const fields = [
          row.vendorId,
          row.pk,
          row.name,
          row.email,
          row.phone,
          row.status,
          row.gstin
        ];
        return fields.some(f => {
          if (f === undefined || f === null) return false;
          return f.toString().toLowerCase().includes(q);
        });
      });
    },

    filteredLedgerRows() {
      let rows = this.ledgerRows || [];

      if (this.dateFrom) {
        rows = rows.filter(r => r.dateKey && r.dateKey >= this.dateFrom);
      }
      if (this.dateTo) {
        rows = rows.filter(r => r.dateKey && r.dateKey <= this.dateTo);
      }

      // latest first
      return rows.slice().sort((a, b) => {
        const aKey = a.dateKey || "";
        const bKey = b.dateKey || "";
        return bKey.localeCompare(aKey);
      });
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
      const allIds = this.finalItems.map(i => i.vendorId || i.pk);
      if (!allIds.length) return false;
      const selectedCount = allIds.filter(id =>
        this.selectedVendorIds.includes(id)
      ).length;
      return selectedCount > 0 && selectedCount < allIds.length;
    }
  },
  watch: {
    finalItems() {
      this.syncAllSelectedState();
    }
  },
  mounted() {
    this.fetchAccounts();
  },
  methods: {
    createNewVendor() {
      this.showAddNewBlock = true;
    },

    onVendorCreated(flag) {
      this.showAddNewBlock = false;
    },
    onFromDateSelected(value) {
      this.dateFrom = value;
      if (this.dateTo && this.dateTo < this.dateFrom) {
        this.dateTo = this.dateFrom;
      }
      this.menuFrom = false;
    },

    parseDisplayToISO(display) {
      if (!display) return "";
      const m = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(display);
      if (!m) return "";
      let [_, dd, mm, yyyy] = m;
      return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    },

    formatISOToDisplay(iso) {
      if (!iso) return "";
      const parts = iso.split("-");
      if (parts.length !== 3) return iso;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    },

    // format invoice date (full ISO) as dd/mm/yyyy
    formatInvoiceDate(value) {
      if (!value) return "";
      const iso = value.slice(0, 10);
      return this.formatISOToDisplay(iso);
    },

    formatAmount(value) {
      if (value === null || value === undefined || value === "") return "";
      const num = Number(value) || 0;
      return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    applyNameFilter() {
      if (this.selectedName) {
        this.nameFilterApplied = true;
        this.page = 1;
      } else {
        this.nameFilterApplied = false;
        this.page = 1;
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
        this.selectedVendorIds = this.finalItems.map(
          i => i.vendorId || i.pk
        );
      } else {
        this.selectedVendorIds = [];
      }
    },
    syncAllSelectedState() {
      const allIds = this.finalItems.map(i => i.vendorId || i.pk);
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
        this.ledgerPage = 1; // reset to first page when loading history
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
          journal: t.journal || t.type || "",
          account: t.accountId || vendorAccountId,
          sold:
            t.soldToType ||
            t.soldType ||
            t.partyRole ||
            t.soldTo ||
            "",
          type: t.type,
          leg: t.leg,
          refNo: t.refNo
        };
      });
    },

    normalizeAccountItem(i) {
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
        gstin: i.gstin || null,
        raw: i
      };
    },

    // from ClientDataTableSimple
    normalizeClientRow(source) {
      return {
        pk: source.pk || source.id || source.clientId || null,
        name: source.name || source.customerName || "-",
        clientId: source.clientId || source.pk || "-",
        email: source.email || source.userEmail || "-",
        phone: source.phone || source.mobile || "-",
        gstin: source.gstin || source.gstin || "-",
        status:
          source.status ||
          (source.active === true
            ? "Active"
            : source.active === false
            ? "Inactive"
            : "-")
      };
    },

    mergeAccountAndClient(accountItems, clientsArray) {
      const map = new Map();

      // 1) Seed with accounts
      accountItems.forEach(acc => {
        const key = acc.vendorId || acc.pk || acc.clientId;
        if (!key) return;
        map.set(key, {
          ...acc,
          vendorId: key,          // main id for account/ledger
          accountPk: acc.pk || null // keep account pk separately if needed
        });
      });

      // 2) Merge client/vendor details
      clientsArray.forEach(item => {
        const source = item.customer || item;
        const c = this.normalizeClientRow(source);
        const key = c.clientId || c.pk;
        if (!key) return;

        const existing = map.get(key) || {};

        map.set(key, {
          ...existing,

          // 🔹 client pk (this is what /getClientByPk expects)
          clientPk: c.pk || existing.clientPk || null,

          // 🔹 keep accountPk from existing (from accounts)
          accountPk: existing.accountPk || null,

          // 🔹 ensure vendorId is set
          vendorId: existing.vendorId || key,

          // 🔹 fields that may be missing on account side
          pk: existing.pk || c.pk,
          name: existing.name || c.name,
          email: existing.email || c.email,
          phone: existing.phone || c.phone,
          gstin: c.gstin || existing.gstin,
          status: existing.status || c.status,
          clientId: c.clientId
        });
      });

      return Array.from(map.values());
    },

    async fetchAccounts() {
      this.loading = true;
      this.clientsError = "";
      try {
        // 1) fetch accounts
        const urlAcc = `${this.BASE}/getAllAccountVendors`;
        const resAcc = await fetch(urlAcc);
        const dataAcc = await resAcc.json().catch(() => ({}));
        if (!resAcc.ok) throw new Error(dataAcc?.message || `HTTP ${resAcc.status}`);
        const accountItems = Array.isArray(dataAcc.items)
          ? dataAcc.items.map(i => this.normalizeAccountItem(i))
          : [];

        // 2) fetch clients/vendor details (best effort; don't break if fails)
        let clientsArray = [];
        try {
          const urlCli = `${this.BASE}/getAllClient`;
          const resCli = await fetch(urlCli);
          const d = await resCli.json().catch(() => ({}));
          if (resCli.ok) {
            if (Array.isArray(d)) clientsArray = d;
            else if (d && Array.isArray(d.items)) clientsArray = d.items;
            else if (d && Array.isArray(d.data)) clientsArray = d.data;
            else if (d && typeof d === "object") {
              const arr = Object.values(d).find(v => Array.isArray(v));
              clientsArray = arr || [];
            }
          } else {
            console.warn("getAllClient failed", d);
          }
        } catch (e) {
          console.warn("Failed to fetch clients", e);
        }

        this.clients = clientsArray;

        // 3) merge into union table
        this.items = this.mergeAccountAndClient(accountItems, clientsArray);
      } catch (err) {
        console.error("fetchAccounts error", err);
        this.clientsError = "Failed to load accounts";
        this.$emit("notify", {
          text: err?.message || "Failed to load accounts",
          color: "error"
        });
        this.items = [];
      } finally {
        this.loading = false;
      }
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
          const normalized = this.normalizeAccountItem(vendor);
          normalized.raw = vendor;

          // merge with any client data if exists
          const merged = this.mergeAccountAndClient(
            [normalized],
            this.clients
          )[0];

          const idx = this.items.findIndex(
            it => it.vendorId === vendorId || it.pk === vendor.pk
          );
          if (idx >= 0) {
            this.items.splice(idx, 1, { ...merged });
          } else {
            this.items.unshift(merged);
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
      this.ledgerPage = 1;

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

    async onDepositCreated(payload) {
      this.depositDialog = false;
      await this.fetchAccounts();

      const vendorId =
        this.selectedDetails?.vendor?.vendorId ||
        (this.selectedDetails?.vendor?.pk
          ? String(this.selectedDetails.vendor.pk).split("#")[1]
          : null);

      if (vendorId) {
        this.fetchHistory(vendorId);
      }
    },

    async onAccountCreated(payload) {
      this.openAccountDialog = false;

      this.$emit("notify", {
        text: (payload && payload.message) || "Vendor account created",
        color: "success"
      });

      await this.fetchAccounts();

      const newVendorId =
        (payload &&
          (payload.vendorId ||
            payload.clientId ||
            payload.vendor?.vendorId)) ||
        null;
      if (newVendorId) {
        const found = this.items.find(
          i => i.vendorId === newVendorId || i.pk === newVendorId
        );
        if (found) {
          this.onRowClick(found);
        }
      }
    },

    // ========== PDF / Excel functions (unchanged behavior) ==========
    downloadPdf() {
      if (!this.filteredLedgerRows.length) {
        this.$emit("notify", {
          text: "No ledger data to export",
          color: "warning"
        });
        return;
      }

      const doc = new jsPDF("l", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const vendorName = this.selectedDetails?.vendor?.name || "";
      const vendorId = this.selectedDetails?.vendor?.vendorId || "";

      // period
      const firstRow = this.filteredLedgerRows[0];
      const lastRow =
        this.filteredLedgerRows[this.filteredLedgerRows.length - 1];

      const periodFromISO = this.dateFrom || (firstRow && firstRow.dateKey) || "";
      const periodToISO = this.dateTo || (lastRow && lastRow.dateKey) || "";

      const periodFromDisplay = this.formatISOToDisplay(periodFromISO);
      const periodToDisplay = this.formatISOToDisplay(periodToISO);

      // ===== Header =====
      doc.setFont("courier", "bold");
      doc.setFontSize(14);
      doc.text("Ansari Automobiles", pageWidth / 2, 30, { align: "center" });

      doc.setFontSize(10);
      doc.text(
        "BADI KAMHARIYA BY PASS ROAD MAU",
        pageWidth / 2,
        44,
        { align: "center" }
      );
      doc.text(
        "GSTIN/UIN- 09AJBEA0437B1ZY",
        pageWidth / 2,
        58,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.text(
        "GENERAL LEDGER TRANSACTIONS",
        pageWidth / 2,
        74,
        { align: "center" }
      );

      const periodLine = `All transactions for (${periodFromDisplay || "-"} to ${periodToDisplay || "-"})`;
      doc.setFontSize(9);
      doc.text(periodLine, pageWidth / 2, 90, { align: "center" });

      // vendor info
      let infoY = 106;
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      if (vendorName) {
        doc.text(`Vendor : ${vendorName}`, 40, infoY);
        infoY += 12;
      }
      if (vendorId) {
        doc.text(`Account: ${vendorId}`, 40, infoY);
        infoY += 12;
      }

      const startTableY = infoY + 8;

      // ===== Table data =====
      const head = [[
        "DATE",
        "JOURNAL",
        "DESCRIPTION",
        "DEBIT",
        "CREDIT"
      ]];

      const body = this.filteredLedgerRows.map(r => {
        const debitStr = r.debit ? this.formatAmount(r.debit) : "";
        const creditStr = r.credit ? this.formatAmount(r.credit) : "";
        return [
          r.date || "",
          r.journal || "",
          r.narration || "",
          debitStr,
          creditStr
        ];
      });

      const closingDebit = this.totalDebit || 0;
      const closingCredit = this.totalCredit || 0;

      const foot = [[
        "",
        "",
        "Total",
        this.formatAmount(closingDebit),
        this.formatAmount(closingCredit)
      ]];

      autoTable(doc, {
        head,
        body,
        foot,
        startY: startTableY,
        styles: {
          font: "courier",
          fontSize: 9,
          halign: "left",
          textColor: [0, 0, 0],
          lineWidth: 0
        },
        headStyles: {
          fontStyle: "bold",
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255]
        },
        footStyles: {
          fontStyle: "bold",
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          halign: "right"
        },
        columnStyles: {
          0: { halign: "left" },   // DATE
          1: { halign: "left" },   // JOURNAL
          2: { halign: "left" },   // DESCRIPTION
          4: { halign: "left" },   // (unused index kept to avoid breaking)
          5: { halign: "right" },  // (unused)
          6: { halign: "right" }   // (unused)
        },
        margin: { left: 40, right: 40 }
      });

      // ===== Page numbers =====
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - 40,
          30,
          { align: "right" }
        );
      }

      const fileName = `Ledger_${vendorName || vendorId || "vendor"}.pdf`;

      // open in new tab
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60 * 1000);

      if (!win) {
        doc.save(fileName);
      }
    },

    downloadPdfWithoutLogo() {
      this.downloadPdf();
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
    },

    // ========== Vendor details / edit from ClientDataTableSimple ==========
    showDetails(item) {
      // Prefer clientPk from the merged row
      const pk = item && item.clientPk;

      if (!pk) {
        // Do NOT call backend if we don't have a client pk
        this.$emit("notify", {
          text: "No client details linked to this vendor.",
          color: "warning"
        });
        return;
      }

      this.selectedPk = encodeURIComponent(String(pk));
      this.dialog = true;

      // load sold items for this client
      this.fetchSoldItemsForClientPk(this.selectedPk);
    },

    closeDialog() {
      this.dialog = false;
      this.$nextTick(() => {
        this.selectedPk = null;
        this.soldItems = [];
        this.soldItemsError = "";
        this.soldItemsLoading = false;
      });
    },

    onEditClick() {
      if (!this.selectedPk) {
        console.warn("No selectedPk to edit");
        return;
      }
      const decoded = decodeURIComponent(this.selectedPk);
      const id = decoded.includes("#") ? decoded.split("#")[1] : decoded;
      this.editPk = id;
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
      this.$nextTick(() => { this.editPk = null; });
    },

    onClientSaved(payload) {
      console.log("client saved:", payload);
      this.closeEdit();
      this.closeDialog();
      this.fetchAccounts();
    },

    // fetch sold items for vendor using /getClientByPk/:pk
    async fetchSoldItemsForClientPk(selectedPk) {
      this.soldItemsLoading = true;
      this.soldItemsError = "";
      this.soldItems = [];

      try {
        if (!selectedPk) {
          this.soldItemsLoading = false;
          return;
        }

        const decoded = decodeURIComponent(String(selectedPk));
        // API expects only id part (without "client#")
        let id = decoded;
        if (decoded.includes("#")) {
          id = decoded.split("#")[1];
        }

        const url = `${this.BASE}/getClientByPk/${encodeURIComponent(id)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this.soldItemsError = data?.message || `Failed to fetch sold items (HTTP ${res.status})`;
          return;
        }

        const rawSold = Array.isArray(data.soldItems) ? data.soldItems : [];

        this.soldItems = rawSold.map(it => ({
          invoiceNumber: it.invoiceNumber,
          invoiceDate: it.invoiceDate,
          modelName: it.modelName || it.label,
          chassisNumber: it.chassisNumber,
          engineNumber: it.engineNumber,
          color: it.color,
          category: it.category || "",
          quantity: it.quantity || 1,
          price: it.price || it.totalWithTax || 0
        }));
      } catch (err) {
        console.error("fetchSoldItemsForClientPk error", err);
        this.soldItemsError = err?.message || "Failed to fetch sold items";
      } finally {
        this.soldItemsLoading = false;
      }
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
