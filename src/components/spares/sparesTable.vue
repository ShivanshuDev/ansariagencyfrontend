<template>
  <v-card>
    <v-card-title>
      Spares Details
      <v-spacer />
    </v-card-title>

    <!-- Search & Filter Inputs -->
    <v-row class="px-4 py-2" align="center">
      <v-col cols="12" md="3">
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

      <v-col cols="12" md="3">
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
       </v-col>
    </v-row>

    <div>
        <DownloadPdf :items="selectedItems" :headers="headers" />
    </div>

    <!-- Inventory Data Table -->
    <v-data-table
      :headers="headers"
      :items="sparesParts"
      :search="search"
      item-key="partNumber"
      class="elevation-1"
      dense
      :items-per-page="10"
      show-select
      v-model="selectedItems"
      @click:row="onRowClick"
    >
      <template v-slot:item.quantity="{ item }">{{ item.quantity || '-' }}</template>
      <template v-slot:item.invoiceNumber="{ item }">{{ item.invoiceNumber || '-' }}</template>
      <template v-slot:item.invoiceDate="{ item }">{{ item.invoiceDate || '-' }}</template>
      <template v-slot:item.partNumber="{ item }">{{ item.partNumber || '-' }}</template>
      <template v-slot:item.partName="{ item }">{{ item.partName || '-' }}</template>
      <template v-slot:item.price="{ item }">{{ item.price != null ? item.price : '-' }}</template>
      <template v-slot:item.rakNumber="{ item }">{{ item.rakNumber || '-' }}</template>
      <template v-slot:item.addedBy="{ item }">{{ item.addedBy || '-' }}</template>
    </v-data-table>

  </v-card>
</template>

<script>
import axios from 'axios';
import DownloadPdf from '../../views/DownloadPdf.vue';

export default {
    components: { DownloadPdf },
  data() {
    return {
      sparesParts: [],
      selectedItems: [],
      search: '',
      searchPartNumber:'',
      searchInvoiceNumber:'',
      filters: {
        partNumber: '',
        invoiceNumber: '',
      },
        invoiceDateFrom: null,
        invoiceDateTo: null,
      menuFrom: false,
      menuTo: false,
      headers: [
        { text: 'Part Number', value: 'partNumber' },
        { text: 'Part Name', value: 'partName' },
        { text: 'Quantity', value: 'quantity' },
        { text: 'Price', value: 'price' },
        { text: 'Rack Number', value: 'rakNumber' },
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Invoice Date', value: 'invoiceDate' },
        { text: 'Added By', value: 'addedBy' },
      ],
    };
  },
  methods: {

    async filterByDate(){
        this.searchPartNumber = '';
        try {
            
                let url = '';
                // Case 1: Search by partNumber (hit /parts/:partNumber)
                url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}partsRangeFilter/${this.invoiceDateFrom}/${this.invoiceDateTo}`;
                // Call API
                console.log('url', url)
                const res = await axios.get(url);
                // Normalize: backend /parts/:partNumber returns object, but /Spares returns array
                this.sparesParts = Array.isArray(res.data.items) ? res.data.items : [res.data.items];
                console.log('this.sparesParts', this.sparesParts);
            
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            this.sparesParts = [];
        }
    },
    async getByPartNumber() {
        this.searchInvoiceNumber = '';
        try {
            if(!this.searchPartNumber){
                this.fetchSparesPart()
            } else {
                let url = '';
                // Case 1: Search by partNumber (hit /parts/:partNumber)
                url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}parts/${this.searchPartNumber}`;
                // Call API
                const res = await axios.get(url);
                // Normalize: backend /parts/:partNumber returns object, but /Spares returns array
                this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
                console.log('this.sparesParts', this.sparesParts);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            this.sparesParts = [];
        }
    },

    async getByInvoiceNumber() {
        this.searchPartNumber = '';
        try {
             if(!this.searchInvoiceNumber){
                this.fetchSparesPart()
            } else {
                let url = '';
                // Case 1: Search by partNumber (hit /parts/:partNumber)
                url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}invoice/${this.searchInvoiceNumber}`;
                // Call API
                const res = await axios.get(url);
                // Normalize: backend /parts/:partNumber returns object, but /Spares returns array
                this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
                console.log('this.sparesParts', this.sparesParts);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            this.sparesParts = [];
        }
    },

    async fetchSparesPart() {
        this.searchPartNumber = '';
        this.searchInvoiceNumber = '';
        this.invoiceDateFrom = null,
        this.invoiceDateTo = null,
        console.log('getch ghjhkl')
      try {
          const params = {};
        if (this.filters.partNumber) params.partNumber = this.filters.partNumber;
        if (this.filters.invoiceNumber) params.invoiceNumber = this.filters.invoiceNumber;
        if (this.filters.invoiceDateFrom) params.invoiceDateFrom = this.filters.invoiceDateFrom;
        if (this.filters.invoiceDateTo) params.invoiceDateTo = this.filters.invoiceDateTo;

        // Backend should support query param filtering for these params
        const queryString = new URLSearchParams(params).toString();
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}Spares`;

          console.log('url', url)
        const res = await axios.get(url);

        this.sparesParts = Array.isArray(res.data) ? res.data : [];
        console.log('this.sparesParts', this.sparesParts)
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    },
    async fetchSparesParts(){
         try {
            let url = '';
            // Case 1: Search by partNumber (hit /parts/:partNumber)
            url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}Spares`;
            // Call API
            const res = await axios.get(url);
            // Normalize: backend /parts/:partNumber returns object, but /Spares returns array
            this.sparesParts = Array.isArray(res.data) ? res.data : [res.data];
            console.log('this.sparesParts', this.sparesParts);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            this.sparesParts = [];
        }
    },

    onRowClick(item) {
      // You can handle row clicks here
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
</style>

<style scoped>
.tableData {
  margin: 9px;
}
.v-data-table__wrapper {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 14px;
  color: #222;
}
</style>