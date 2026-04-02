<!-- src/pages/LedgerMaster.vue -->
<template>
  <v-card>
    <v-tabs v-model="tab" bg-color="primary" dark grow>
      <v-tab value="add">Add Entry</v-tab>
      <v-tab value="clientEntries">Client Entries</v-tab>
      <v-tab value="clientSummary">Client Summary</v-tab>
      <v-tab value="typeFilter">Filter By Type</v-tab>
      <v-tab value="allEntries">All Entries</v-tab>
      <v-tab value="globalSummary">Global Summary</v-tab>
      <v-tab value="series">Series (Charts)</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="add">
        <add-entry-form @notify="notify" @created="onCreated" class="pa-3" />
      </v-window-item>

      <v-window-item value="clientEntries">
        <client-entries-table @notify="notify" class="pa-3" />
      </v-window-item>

      <v-window-item value="clientSummary">
        <client-summary-card @notify="notify" class="pa-3" />
      </v-window-item>

      <v-window-item value="typeFilter">
        <filter-by-type-table @notify="notify" class="pa-3" />
      </v-window-item>

      <v-window-item value="allEntries">
        <all-entries-table @notify="notify" class="pa-3" />
      </v-window-item>

      <v-window-item value="globalSummary">
        <global-summary-card @notify="notify" class="pa-3" />
      </v-window-item>

      <v-window-item value="series">
        <series-chart @notify="notify" class="pa-3" />
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
import AddEntryForm from './AddEntryForm.vue'
import ClientEntriesTable from './ClientEntriesTable.vue'
import ClientSummaryCard from './ClientSummaryCard.vue'
import FilterByTypeTable from './FilterByTypeTable.vue'
import AllEntriesTable from './AllEntriesTable.vue'
import GlobalSummaryCard from './GlobalSummaryCard.vue'
import SeriesChart from './SeriesChart.vue'

export default {
  name: 'LedgerMaster',
  components: {
    AddEntryForm,
    ClientEntriesTable,
    ClientSummaryCard,
    FilterByTypeTable,
    AllEntriesTable,
    GlobalSummaryCard,
    SeriesChart
  },
  data: () => ({ tab: 'add', snack:{show:false,text:'',color:'success'} }),
  methods:{
    notify({text,color}){ this.snack={show:true,text,color:color||'success'} },
    onCreated(entry){ console.log('Created ledger entry:', entry) }
  }
}
</script>
