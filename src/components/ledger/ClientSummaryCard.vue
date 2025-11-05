<template>
  <v-card>
    <v-card-title>
      Client Summary
      <v-spacer />
      <v-text-field v-model="clientId" label="Client ID" dense outlined style="max-width:220px" />
      <v-select v-model="period" :items="periods" label="Period" dense outlined style="max-width:160px" class="ml-2" />
      <v-btn color="primary" class="ml-2" :loading="loading" @click="load">Load</v-btn>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined rounded>Debit: <b>₹{{ fmt(summary.debit) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined rounded>Credit: <b>₹{{ fmt(summary.credit) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined rounded>Net: <b>₹{{ fmt(summary.net) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined rounded>Count: <b>{{ summary.count || 0 }}</b></v-sheet></v-col>
      </v-row>
      <div class="text-caption mt-2">From: {{ summary.from }} &nbsp; To: {{ summary.to }}</div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ledgerApi } from '@/services/ledgerApi';

export default {
  name: 'ClientSummaryCard',
  data() {
    return {
      clientId: '',
      period: 'monthly',
      periods: ['daily','weekly','monthly','yearly','all'],
      loading: false,
      summary: {}
    };
  },
  methods: {
    fmt(v){ return Number(v||0).toFixed(2) },
    async load() {
      if (!this.clientId) {
        this.$emit('notify', { text: 'Client ID is required', color: 'warning' });
        return;
      }
      this.loading = true;
      try {
        this.summary = await ledgerApi.getClientSummary({ clientId: this.clientId, period: this.period });
      } catch (e) {
        this.$emit('notify', { text: e.message, color: 'error' });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
