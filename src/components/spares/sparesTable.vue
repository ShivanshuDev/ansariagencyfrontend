<template>
  <v-card>
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
          @input="getByPartNumber"
          @click:clear="fetchSparesParts"
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
          @input="getByInvoiceNumber"
          @click:clear="fetchSparesParts"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-menu
          ref="menuFrom"
          v-model="menuFrom"
          :close-on-content-click="false"
          :nudge-right="40"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="invoiceDateFrom"
              label="Invoice Date From"
              prepend-icon="mdi-calendar"
              readonly
              dense
              hide-details
              outlined
              v-bind="attrs"
              v-on="on"
              clearable
              @click:clear="clearDateFrom"
            />
          </template>
          <v-date-picker
            v-model="invoiceDateFrom"
            @input="menuFrom = false;"
            no-title
            scrollable
          />
        </v-menu>
        
      </v-col>

      <v-col cols="12" md="2">
        <v-menu
          ref="menuTo"
          v-model="menuTo"
          :close-on-content-click="false"
          :nudge-right="40"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="invoiceDateTo"
              label="Invoice Date To"
              prepend-icon="mdi-calendar"
              readonly
              dense
              outlined
              hide-details
              v-bind="attrs"
              v-on="on"
              clearable
              @click:clear="clearDateTo"
            />
          </template>
          <v-date-picker
            v-model="invoiceDateTo"
            @input="menuTo = false;"
            no-title
            scrollable
          />
        </v-menu>
      </v-col>

      <v-col cols="12" md="1" style="display:flex; flex-direction:row;">
        <v-btn color="black" style="color:white; margin-right:20px;" @click="filterByDate">Filter</v-btn>
        <v-btn color="red" @click="fetchSparesParts">Reset</v-btn>
        <div style="margin-left:20px;">
          <DownloadPdf :items="selectedItems" :headers="headers" />
        </div>
      </v-col>
    </v-row>

    <br />

    <!-- Inventory Data Table -->
    <v-data-table
      :headers="headers"
      :items="sparesParts"
      :search="search"
      item-key="partNumber"
      class="elevation-1"
      dense
      :items-per-page="options.itemsPerPage"
      show-select
      v-model="selectedItems"
      :options.sync="options"
      @click:row="onRowClick"
    >
      <!-- Serial number column cells (after checkbox) -->
      <template v-slot:item.sno="{ index }">
        {{ (options.page - 1) * options.itemsPerPage + index + 1 }}
      </template>

      <template v-slot:item.quantity="{ item }">{{ item.quantity || '-' }}</template>
      <template v-slot:item.invoiceNumber="{ item }">{{ item.invoiceNumber || '-' }}</template>
      <template v-slot:item.invoiceDate="{ item }">{{ item.invoiceDate || '-' }}</template>
      <template v-slot:item.partNumber="{ item }">{{ item.partNumber || '-' }}</template>
      <template v-slot:item.partName="{ item }">{{ item.partName || '-' }}</template>
      <template v-slot:item.price="{ item }">{{ item.price != null ? item.price : '-' }}</template>
      <template v-slot:item.rakNumber="{ item }">{{ item.rakNumber || '-' }}</template>
      <template v-slot:item.addedBy="{ item }">{{ item.addedBy || '-' }}</template>

      <!-- Actions column with Show button -->
      <template v-slot:item.actions="{ item }">
        <v-btn small text @click.stop="showDetails(item)">Show</v-btn>
      </template>
    </v-data-table>

    <!-- Dialog fallback -->
    <v-dialog v-model="showDialog" max-width="900px">
      <template v-slot:activator="{ on }"></template>
      <v-card>
        <v-card-title>
          Details
          <v-spacer />
          <v-btn icon @click="showDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <SparesDetailspage :item="detailItem" @close="showDialog = false" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from 'axios';
import DownloadPdf from '../../views/DownloadPdf.vue';
import SparesDetailspage from './sparesDetailspage.vue';

export default {
  components: { DownloadPdf, SparesDetailspage },
  data() {
    return {
      sparesParts: [],
      selectedItems: [],
      search: '',
      searchPartNumber: '',
      searchInvoiceNumber: '',
      filters: {
        partNumber: '',
        invoiceNumber: '',
      },
      invoiceDateFrom: null,
      invoiceDateTo: null,
      menuFrom: false,
      menuTo: false,
      showDialog: false,
      detailItem: null,

      // Keep pagination in one place (used for S.No calculation)
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: [],
        sortDesc: [],
        groupBy: [],
        groupDesc: [],
        multiSort: false,
        mustSort: false,
      },

      headers: [
        // Selection checkboxes are injected as the very first column.
        // This S.No column will therefore appear right after the checkbox.
        { text: 'S.No', value: 'sno', sortable: false, width: 80 },
        { text: 'Part Number', value: 'partNumber' },
        { text: 'Part Name', value: 'partName' },
        { text: 'Quantity', value: 'quantity' },
        { text: 'Price', value: 'price' },
        { text: 'Rack Number', value: 'rakNumber' },
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Invoice Date', value: 'invoiceDate' },
        { text: 'Added By', value: 'addedBy' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    };
  },
  methods: {
    async filterByDate() {
      this.searchPartNumber = '';
      try {
        let url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}partsRangeFilter/${this.invoiceDateFrom}/${this.invoiceDateTo}`;
        const res = await axios.get(url);
        this.sparesParts = Array.isArray(res.data.items) ? res.data.items : [res.data.items];
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        this.sparesParts = [];
      }
    },

    async getByPartNumber() {
      this.searchInvoiceNumber = '';
      try {
        if (!this.searchPartNumber) {
          this.fetchSparesPart();
        } else {
          let url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}parts/${this.searchPartNumber}`;
          const res = await axios.get(url);
          this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        this.sparesParts = [];
      }
    },

    async getByInvoiceNumber() {
      this.searchPartNumber = '';
      try {
        if (!this.searchInvoiceNumber) {
          this.fetchSparesPart();
        } else {
          let url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}invoice/${this.searchInvoiceNumber}`;
          const res = await axios.get(url);
          this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        this.sparesParts = [];
      }
    },

    async fetchSparesPart() {
      this.searchPartNumber = '';
      this.searchInvoiceNumber = '';
      this.invoiceDateFrom = null;
      this.invoiceDateTo = null;
      try {
        const params = {};
        if (this.filters.partNumber) params.partNumber = this.filters.partNumber;
        if (this.filters.invoiceNumber) params.invoiceNumber = this.filters.invoiceNumber;
        if (this.filters.invoiceDateFrom) params.invoiceDateFrom = this.filters.invoiceDateFrom;
        if (this.filters.invoiceDateTo) params.invoiceDateTo = this.filters.invoiceDateTo;

        const queryString = new URLSearchParams(params).toString();
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}Spares${queryString ? '?' + queryString : ''}`;

        const res = await axios.get(url);
        this.sparesParts = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    },

    async fetchSparesParts() {
      try {
        let url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}Spares`;
        const res = await axios.get(url);
        this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        this.sparesParts = [];
      }
    },

    onRowClick(item) {
      console.log('Row clicked:', item);
    },

    clearDateFrom() {
      this.filters.invoiceDateFrom = null;
      this.fetchSparesPart();
    },
    clearDateTo() {
      this.filters.invoiceDateTo = null;
      this.fetchSparesPart();
    },

    showDetails(item) {
      this.detailItem = item || null;

      if (this.$router && this.$router.options && this.$router.options.routes) {
        const routeExists = this.$router.options.routes.some(r => r.name === 'SparesDetails');
        if (routeExists) {
          this.$router.push({ name: 'SparesDetails', params: { partNumber: item.partNumber }});
          return;
        }
      }
      this.showDialog = true;
    },
  },
  watch: {
    'filters.partNumber': 'fetchSparesPart',
    'filters.invoiceNumber': 'fetchSparesPart',
  },
  mounted() {
    this.fetchSparesPart();
  },
};
</script>

<style scoped>
.v-data-table {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 14px;
  color: #222;
}

/* Header background + text color + header height */
.v-data-table-header th {
  background: #dff3f79c !important;
  color: #000 !important;
  height: 50px !important;
  font-weight: 600;
}

/* Row height */
.v-data-table .v-data-table__wrapper tr > td {
  height: 50px !important;
  vertical-align: middle;
}

/* Optional: slightly larger checkbox for better alignment */
.v-data-table .v-simple-checkbox {
  transform: scale(1.05);
}
</style>
