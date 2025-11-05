<template>
  <v-card>
    <v-card-title>
      Ledger Series (Charts)
      <v-spacer />
      <v-select v-model="granularity" :items="['daily','monthly']" label="Granularity" dense outlined style="max-width:160px" />
      <v-text-field v-model="clientId" label="Client ID (optional)" dense outlined style="max-width:220px" class="ml-2" />
      <v-text-field v-model="from" label="From (YYYY-MM-DD)" dense outlined style="max-width:200px" class="ml-2" />
      <v-text-field v-model="to" label="To (YYYY-MM-DD)" dense outlined style="max-width:200px" class="ml-2" />
      <v-btn color="primary" class="ml-2" :loading="loading" @click="load">Load</v-btn>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="4">
          <div class="text-subtitle-2 mb-2">Debit</div>
          <v-sparkline :value="vals('debit')" auto-draw />
        </v-col>
        <v-col cols="12" md="4">
          <div class="text-subtitle-2 mb-2">Credit</div>
          <v-sparkline :value="vals('credit')" auto-draw />
        </v-col>
        <v-col cols="12" md="4">
          <div class="text-subtitle-2 mb-2">Net</div>
          <v-sparkline :value="vals('net')" auto-draw />
        </v-col>
      </v-row>

      <v-data-table :headers="headers" :items="series" dense :items-per-page="10" class="mt-4" />
    </v-card-text>
  </v-card>
</template>

<script>
import { ledgerApi } from '@/services/ledgerApi';

export default {
  name: 'SeriesChart',
  data() {
    return {
      granularity: 'daily',
      clientId: '',
      from: '',
      to: '',
      loading: false,
      series: [],
      headers: [
        { text: 'Label', value: 'label' },
        { text: 'Debit', value: 'debit' },
        { text: 'Credit', value: 'credit' },
        { text: 'Net', value: 'net' }
      ]
    };
  },
  methods: {
    vals(k){ return this.series.map(s => Number(s[k]||0)); },
    async load() {
      this.loading = true;
      try {
        const res = await ledgerApi.getSeries({
          granularity: this.granularity,
          from: this.from || undefined,
          to: this.to || undefined,
          clientId: this.clientId || undefined
        });
        this.series = res.series || [];
      } catch (e) {
        this.$emit('notify', { text: e.message, color: 'error' });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
