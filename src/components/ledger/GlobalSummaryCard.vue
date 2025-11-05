<template>
  <v-card>
    <v-card-title>
      Global Summary
      <v-spacer />
      <v-select v-model="period" :items="periods" label="Period" dense outlined style="max-width:160px" />
      <v-btn color="primary" class="ml-2" :loading="loading" @click="load">Load</v-btn>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined>Debit: <b>₹{{ fmt(summary.debit) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined>Credit: <b>₹{{ fmt(summary.credit) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined>Net: <b>₹{{ fmt(summary.net) }}</b></v-sheet></v-col>
        <v-col cols="12" sm="3"><v-sheet class="pa-3" outlined>Count: <b>{{ summary.count || 0 }}</b></v-sheet></v-col>
      </v-row>
      <div class="text-caption mt-2">From: {{ summary.from }} &nbsp; To: {{ summary.to }}</div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ledgerApi } from '@/services/ledgerApi';

export default {
  name: 'GlobalSummaryCard',
  data() {
    return {
      period: 'monthly',
      periods: ['daily','weekly','monthly','yearly','all'],
      loading: false,
      summary: {}
    };
  },
  methods: {
    fmt(v){ return Number(v||0).toFixed(2) },
    async load() {
      this.loading = true;
      try {
        this.summary = await ledgerApi.getAllSummary({ period: this.period });
      } catch (e) {
        this.$emit('notify', { text: e.message, color: 'error' });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
