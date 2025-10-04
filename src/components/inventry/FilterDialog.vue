<template>
  <v-dialog persistent v-model="localOpen" max-width="600px">
    <v-card>
      <v-card-title>
        Filter Inventory
        <v-spacer />
        <v-btn icon @click="localOpen = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-form ref="filterForm" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" sm="12">
                <v-select v-model="localFilters.invoiceDate" :items="uniqueInvoiceDates" label="Invoice Date" multiple clearable outlined dense />
              </v-col>
              <v-col cols="12" sm="12">
                <v-select v-model="localFilters.addedBy" :items="uniqueAddedBy" label="Added By" multiple clearable outlined dense />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select v-model="localFilters.modelName" :items="uniqueModelNames" label="Model Name" multiple clearable outlined dense />
              </v-col>
              <v-col cols="12">
                <v-select v-model="localFilters.status" :items="uniqueStatus" label="Status" multiple clearable outlined dense />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select v-model="localFilters.color" :items="uniqueColors" label="Color" multiple clearable outlined dense />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="localFilters.createdAtFromDate" type="date" label="Created At (From)" dense outlined clearable />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="localFilters.createdAtToDate" type="date" label="Created At (To)" dense outlined clearable />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="apply">Apply Filter</v-btn>
        <v-btn text @click="reset">Reset</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'FilterDialog',
  props: {
    open: { type: Boolean, default: false },
    filters: { type: Object, default: () => ({}) },
    uniqueInvoiceDates: { type: Array, default: () => [] },
    uniqueAddedBy: { type: Array, default: () => [] },
    uniqueModelNames: { type: Array, default: () => [] },
    uniqueStatus: { type: Array, default: () => [] },
    uniqueColors: { type: Array, default: () => [] }
  },
  data() {
    return { localOpen: this.open, localFilters: JSON.parse(JSON.stringify(this.filters || {})) };
  },
  watch: {
    open(v) { this.localOpen = v; },
    localOpen(v) { if (!v) this.$emit('close'); }
  },
  methods: {
    apply() {
      this.$emit('apply', JSON.parse(JSON.stringify(this.localFilters)));
      this.localOpen = false;
    },
    reset() {
      this.localFilters = { invoiceDate: [], addedBy: [], modelName: [], status: [], color: [], createdAtFromDate: '', createdAtToDate: '' };
      this.$emit('reset');
    }
  }
};
</script>
