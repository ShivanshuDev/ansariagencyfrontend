<template>
  <v-card style="margin:10px;">
    <v-card-title>
      Spares Details
      <v-spacer />
    </v-card-title>

    <!-- Search & Filter Inputs -->
    <v-row class="px-4 py-2" align="center">
      <v-col cols="12" md="2">
        <v-text-field
          v-model="searchPartNumber"
          label="Search by Part Number"
          clearable
          dense
          outlined
          hide-details
          @input="debouncedSearch"
          @click:clear="clearPartNumberSearch"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field
          v-model="searchPartName"
          label="Search by Part Name"
          clearable
          dense
          outlined
          hide-details
          @input="debouncedSearch"
          @click:clear="clearPartNameSearch"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field
          v-model="searchInvoiceNumber"
          label="Search by Invoice Number"
          clearable
          dense
          outlined
          hide-details
          @input="debouncedSearch"
          @click:clear="clearInvoiceSearch"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field
          v-model="searchRackNumber"
          label="Search by Rack Number"
          clearable
          dense
          outlined
          hide-details
          @input="debouncedSearch"
          @click:clear="clearRackSearch"
        />
      </v-col>

      <v-col cols="12" md="3" style="display:flex; flex-direction:row; gap:10px;">
        <v-btn color="black" style="color:white;" @click="performSearch">Search</v-btn>
        <v-btn color="red" @click="resetAllFilters">Reset All</v-btn>
        <div>
          <DownloadPdf :items="selectedItems" :headers="headers" />
        </div>
      </v-col>
    </v-row>

    <!-- Inventory Data Table with Pagination -->
    <v-data-table
      :headers="headers"
      :items="filteredParts"
      item-key="partNumber"
      class="elevation-1"
      dense
      :items-per-page="itemsPerPage"
      :page.sync="page"
      :loading="isLoading"
      loading-text="Loading parts data..."
      show-select
      v-model="selectedItems"
      hide-default-footer
      @page-count="pageCount = $event"
    >
      <!-- Serial number column with continuous numbering -->
      <template v-slot:item.sno="{ index }">
        {{ (page - 1) * itemsPerPage + index + 1 }}
      </template>

      <template v-slot:item.quantity="{ item }">
        <v-chip :color="getQuantityColor(item.quantity)" small>
          {{ item.quantity || 0 }}
        </v-chip>
      </template>
      
      <template v-slot:item.invoiceNumber="{ item }">
        <v-chip color="primary" small @click.stop="showInvoiceDetails(item.invoiceNumber)">
          {{ item.invoiceNumber || '-' }}
        </v-chip>
      </template>
      
      <template v-slot:item.invoiceDate="{ item }">
        {{ formatDate(item.invoiceDate) || '-' }}
      </template>
      
      <template v-slot:item.partNumber="{ item }">
        <strong>{{ item.partNumber || '-' }}</strong>
      </template>
      
      <template v-slot:item.partName="{ item }">{{ item.partName || '-' }}</template>
      
      <template v-slot:item.price="{ item }">
        {{ item.price != null ? formatCurrency(item.price) : '-' }}
      </template>
      
      <template v-slot:item.rakNumber="{ item }">
        <v-chip color="secondary" small>{{ item.rakNumber || '-' }}</v-chip>
      </template>
      
      <template v-slot:item.addedBy="{ item }">{{ item.addedBy || '-' }}</template>
      
      <template v-slot:item.updatedAt="{ item }">
        {{ formatDate(item.updatedAt) || '-' }}
      </template>

      <!-- Actions column -->
      <template v-slot:item.actions="{ item }">
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn small icon v-bind="attrs" v-on="on">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item @click="showDetails(item)">
              <v-list-item-icon>
                <v-icon small>mdi-eye</v-icon>
              </v-list-item-icon>
              <v-list-item-title>View Details</v-list-item-title>
            </v-list-item>
            <v-list-item @click="checkPartExistence(item.partNumber)">
              <v-list-item-icon>
                <v-icon small>mdi-check-circle</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Check Status</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <!-- Pagination Controls -->
    <div class="text-center pt-2" v-if="filteredParts.length > 0">
      <v-pagination
        v-model="page"
        :length="pageCount"
        :total-visible="7"
        circle
      ></v-pagination>
      <div class="text-caption mt-2">
        Showing {{ Math.min((page - 1) * itemsPerPage + 1, totalItems) }} to 
        {{ Math.min(page * itemsPerPage, totalItems) }} of {{ totalItems }} entries
      </div>
    </div>

    <!-- Part Details Dialog -->
    <v-dialog v-model="showPartDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Part Details</span>
          <v-spacer />
          <v-btn icon @click="showPartDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <SparesDetailspage v-if="detailItem" :item="detailItem" @close="showPartDialog = false" @refresh-data="handleRefreshData" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Check Part Existence Snackbar -->
    <v-snackbar v-model="showCheckSnackbar" :timeout="3000" :color="checkResultColor">
      {{ checkResultMessage }}
    </v-snackbar>

  </v-card>
</template>

<script>
import axios from 'axios';
import _ from 'lodash';
import DownloadPdf from '../../views/DownloadPdf.vue';
import SparesDetailspage from './sparesDetailspage.vue';

export default {
  components: { DownloadPdf, SparesDetailspage },
  data() {
    return {
      sparesParts: [], // All parts data
      selectedItems: [],
      searchPartNumber: '',
      searchPartName: '',
      searchInvoiceNumber: '',
      searchRackNumber: '',
      invoiceDateFrom: null,
      invoiceDateTo: null,
      
      // Pagination
      page: 1,
      pageCount: 0,
      itemsPerPage: 15,
      totalItems: 0,
      
      // Dialog states
      showPartDialog: false,
      
      // Data states
      detailItem: null,
      
      // Loading states
      isLoading: false,
      
      // Check result states
      showCheckSnackbar: false,
      checkResultMessage: '',
      checkResultColor: 'info',
      
      // Summary stats
      summaryStats: {
        totalParts: 0,
        totalQuantity: 0,
        totalValue: 0,
        averagePrice: 0
      },

      headers: [
        { text: 'S.No', value: 'sno', sortable: false, width: 70 },
        { text: 'Part Number', value: 'partNumber', width: 150 },
        { text: 'Part Name', value: 'partName', width: 200 },
        { text: 'Quantity', value: 'quantity', width: 120 },
        { text: 'Price', value: 'price', width: 120 },
        { text: 'Rack Number', value: 'rakNumber', width: 130 },
        { text: 'Invoice Number', value: 'invoiceNumber', width: 150 },
        { text: 'Invoice Date', value: 'invoiceDate', width: 130 },
        { text: 'Added By', value: 'addedBy', width: 130 },
        { text: 'Last Updated', value: 'updatedAt', width: 130 },
        { text: 'Actions', value: 'actions', sortable: false, width: 100 },
      ],
    };
  },
  computed: {
    // Filter parts based on search criteria
    filteredParts() {
      if (!this.hasAnySearchCriteria() || !this.sparesParts.length) {
        return this.sparesParts;
      }

      return this.sparesParts.filter(part => {
        // Check each search field
        const matchesPartNumber = !this.searchPartNumber || 
          (part.partNumber && part.partNumber.toLowerCase().includes(this.searchPartNumber.toLowerCase()));
        
        const matchesPartName = !this.searchPartName || 
          (part.partName && part.partName.toLowerCase().includes(this.searchPartName.toLowerCase()));
        
        const matchesInvoiceNumber = !this.searchInvoiceNumber || 
          (part.invoiceNumber && part.invoiceNumber.toLowerCase().includes(this.searchInvoiceNumber.toLowerCase()));
        
        const matchesRackNumber = !this.searchRackNumber || 
          (part.rakNumber && part.rakNumber.toLowerCase().includes(this.searchRackNumber.toLowerCase()));
        
        // Date filtering (if you enable it later)
        const matchesDate = true; // Add date filtering logic here if needed
        
        return matchesPartNumber && matchesPartName && 
               matchesInvoiceNumber && matchesRackNumber && matchesDate;
      });
    }
  },
  watch: {
    filteredParts() {
      this.totalItems = this.filteredParts.length;
      this.page = 1; // Reset to page 1 when filters change
      this.calculateSummaryStats();
    }
  },
  created() {
    // Create debounced function for search
    this.debouncedSearch = _.debounce(this.performSearch, 500);
  },
  methods: {
    handleRefreshData() {
      this.fetchSparesParts(); // Refresh the table data
      this.showPartDialog = false; // Close the dialog
    },

    // ========== UNIFIED SEARCH METHOD ==========
    async performSearch() {
      this.isLoading = true;

      // Check if there are any search criteria
      if (!this.hasAnySearchCriteria()) {
        // No search criteria, fetch all parts
        await this.fetchSparesParts();
        this.isLoading = false;
        return;
      }
      
      // Build query parameters for the new search endpoint
      const params = {
        partNumber: this.searchPartNumber?.trim() || undefined,
        partName: this.searchPartName?.trim() || undefined,
        invoiceNumber: this.searchInvoiceNumber?.trim() || undefined,
        rakNumber: this.searchRackNumber?.trim() || undefined,
        fromDate: this.invoiceDateFrom || undefined,
        toDate: this.invoiceDateTo || undefined,
        // Remove page and limit for client-side filtering
      };

      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      try {
        // Use the new unified search endpoint
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}spares/search`;
        const response = await axios.get(url, { params });

        // Handle response - store ALL results
        if (response.data.results) {
          this.sparesParts = response.data.results;
        } else {
          this.sparesParts = [];
        }

        this.calculateSummaryStats();
        
      } catch (error) {
        console.error('Search failed:', error);
        
        // Fallback to fetching all parts if search fails
        if (!this.hasAnySearchCriteria()) {
          await this.fetchSparesParts();
        } else {
          this.showToast('Search failed. Please try again.', 'error');
          this.sparesParts = [];
        }
      } finally {
        this.isLoading = false;
      }
    },

    hasAnySearchCriteria() {
      return !!(
        this.searchPartNumber ||
        this.searchPartName ||
        this.searchInvoiceNumber ||
        this.searchRackNumber ||
        this.invoiceDateFrom ||
        this.invoiceDateTo
      );
    },

    // ========== FETCH METHODS ==========
    async fetchSparesParts() {
      this.isLoading = true;
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}Spares`;
        const res = await axios.get(url);
        // Extract parts array from response
        const parts = res.data.parts || [];
        this.sparesParts = parts;
        this.totalItems = parts.length;
        this.page = 1; // Reset to first page on fetch
        this.calculateSummaryStats();
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        this.sparesParts = [];
        this.totalItems = 0;
        this.showToast('Failed to load parts data', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    // ========== DETAIL VIEW METHODS ==========
    showDetails(item) {
      this.detailItem = item;
      if (this.$router && this.$router.options.routes?.some(r => r.name === 'SparesDetails')) {
        this.$router.push({ name: 'SparesDetails', params: { partNumber: item.partNumber } });
      } else {
        this.showPartDialog = true;
      }
    },

    // ========== CHECK PART EXISTENCE ==========
    async checkPartExistence(partNumber) {
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}checkPartNumber/${partNumber}`;
        const res = await axios.get(url);
        
        if (res.data.exists) {
          this.checkResultMessage = `Part ${partNumber} exists with ${res.data.part.quantity} units in stock`;
          this.checkResultColor = 'success';
        } else {
          this.checkResultMessage = `Part ${partNumber} not found in database`;
          this.checkResultColor = 'warning';
        }
        
        this.showCheckSnackbar = true;
      } catch (error) {
        console.error('Failed to check part:', error);
        this.checkResultMessage = 'Error checking part status';
        this.checkResultColor = 'error';
        this.showCheckSnackbar = true;
      }
    },

    // ========== INVOICE DETAILS METHOD ==========
    async showInvoiceDetails(invoiceNumber) {
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}invoice/${invoiceNumber}`;
        const res = await axios.get(url);
        
        // Show invoice details in an alert or dialog
        if (res.data.items) {
          const message = `Invoice: ${invoiceNumber}\n` +
                         `Date: ${res.data.invoiceDate}\n` +
                         `Total Items: ${res.data.items.length}\n` +
                         `Added By: ${res.data.addedBy || 'N/A'}`;
          alert(message);
        } else {
          alert(`Invoice ${invoiceNumber} details not available`);
        }
      } catch (error) {
        console.error('Failed to fetch invoice details:', error);
        alert('Failed to load invoice details');
      }
    },

    // ========== UTILITY METHODS ==========
    calculateSummaryStats() {
      const partsToCalculate = this.filteredParts.length > 0 ? this.filteredParts : this.sparesParts;
      
      const stats = {
        totalParts: partsToCalculate.length,
        totalQuantity: 0,
        totalValue: 0,
        averagePrice: 0
      };

      partsToCalculate.forEach(part => {
        const quantity = Number(part.quantity) || 0;
        const price = Number(part.price) || 0;
        
        stats.totalQuantity += quantity;
        stats.totalValue += quantity * price;
      });

      stats.averagePrice = stats.totalParts > 0 ? stats.totalValue / stats.totalParts : 0;
      
      this.summaryStats = stats;
    },

    getQuantityColor(quantity) {
      const qty = Number(quantity) || 0;
      if (qty === 0) return 'red';
      if (qty < 10) return 'orange';
      return 'green';
    },

    formatCurrency(amount) {
      if (!amount && amount !== 0) return '0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    showToast(message, type = 'info') {
      // Use Vuetify toast or console
      if (this.$toast) {
        this.$toast[type](message);
      } else {
        console.log(`${type}: ${message}`);
      }
    },

    // ========== CLEAR METHODS ==========
    clearPartNumberSearch() {
      this.searchPartNumber = '';
      this.performSearch();
    },

    clearPartNameSearch() {
      this.searchPartName = '';
      this.performSearch();
    },

    clearInvoiceSearch() {
      this.searchInvoiceNumber = '';
      this.performSearch();
    },

    clearRackSearch() {
      this.searchRackNumber = '';
      this.performSearch();
    },

    clearAllSearches() {
      this.searchPartNumber = '';
      this.searchPartName = '';
      this.searchInvoiceNumber = '';
      this.searchRackNumber = '';
    },

    clearDateFrom() {
      this.invoiceDateFrom = null;
      this.performSearch();
    },

    clearDateTo() {
      this.invoiceDateTo = null;
      this.performSearch();
    },

    resetAllFilters() {
      this.clearAllSearches();
      this.invoiceDateFrom = null;
      this.invoiceDateTo = null;
      this.page = 1;
      this.performSearch();
    },

    onRowClick(item) {
      this.showDetails(item);
    },
  },
  mounted() {
    this.fetchSparesParts();
  },
};
</script>

<style scoped>
.v-data-table {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 14px;
  color: #222;
}

.v-data-table-header th {
  background: #dff3f79c !important;
  color: #000 !important;
  height: 50px !important;
  font-weight: 600;
}

.v-data-table .v-data-table__wrapper tr > td {
  height: 50px !important;
  vertical-align: middle;
}

.v-data-table .v-simple-checkbox {
  transform: scale(1.05);
}

/* Chip styling */
.v-chip {
  cursor: pointer;
  font-weight: 500;
}

.v-chip:hover {
  opacity: 0.8;
}

/* Card stats styling */
.v-card {
  border-radius: 8px;
}

.text-caption {
  font-size: 12px;
  opacity: 0.8;
}

.text-h5 {
  font-size: 1.5rem;
}

/* Action menu styling */
.v-list-item {
  min-height: 36px;
}

.v-list-item-icon {
  margin-right: 8px;
  margin-top: 0;
  margin-bottom: 0;
}

/* Pagination styling */
.v-pagination {
  margin: 0;
}

.v-pagination__item {
  margin: 0 2px;
}

.v-pagination__navigation {
  margin: 0 2px;
}

/* Showing entries text */
.text-caption {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}
</style>