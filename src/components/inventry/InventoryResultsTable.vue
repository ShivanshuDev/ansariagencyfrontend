<template>
  <v-card class="elevation-1" flat>
    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="itemsPerPage"
      dense
      class="inventory-results-table"
      item-key="chassisNumber"
      :loading="loading"
      @click:row="$emit('row-click', $event)"
    >
      <template v-slot:item.chassisNumber="{ item }">{{ item.chassisNumber || '-' }}</template>
      <template v-slot:item.engineNumber="{ item }">{{ item.engineNumber || '-' }}</template>
      <template v-slot:item.modelName="{ item }">{{ item.modelName || '-' }}</template>
      <template v-slot:item.color="{ item }">{{ item.color || '-' }}</template>
      <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
      <template v-slot:item.status="{ item }">{{ item.status || '-' }}</template>
      <template v-slot:item.inventoryHoldDays="{ item }">{{ item.inventoryHoldDays || '-' }}</template>
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  name: 'InventoryResultsTable',
  props: {
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    itemsPerPage: { type: Number, default: 10 },
    loading: { type: Boolean, default: false }
  },
  methods: {
    formatDate(v) {
      try { return v ? new Date(v).toLocaleDateString('en-GB') : '-'; } catch(e) { return '-'; }
    }
  }
};
</script>
