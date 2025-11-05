<template>
  <v-card>
    <v-card-title>
      Client Filter (Type)
      <v-spacer />
      <v-text-field v-model="clientId" label="Client ID" dense outlined style="max-width:220px" />
      <v-select v-model="type" :items="['DEBIT','CREDIT','SOLD']" label="Type" dense outlined style="max-width:160px" class="ml-2" />
      <v-text-field v-model="from" label="From (YYYY-MM-DD)" dense outlined style="max-width:200px" class="ml-2" />
      <v-text-field v-model="to" label="To (YYYY-MM-DD)" dense outlined style="max-width:200px" class="ml-2" />
      <v-btn color="primary" class="ml-2" :loading="loading" @click="load">Load</v-btn>
    </v-card-title>

    <v-data-table :headers="headers" :items="rows" dense :items-per-page="10">
      <template #item.amount="{ item }">₹{{ Number(item.amount||0).toFixed(2) }}</template>
    </v-data-table>
  </v-card>
</template>

<script>
import { ledgerApi } from '@/services/ledgerApi';

export default {
  name: 'FilterByTypeTable',
  data() {
    return {
      clientId: '',
      type: 'DEBIT',
      from: '',
      to: '',
      rows: [],
      loading: false,
      headers: [
        { text: 'SK', value: 'sk' },
        { text: 'Type', value: 'entryType' },
        { text: 'Amount', value: 'amount' },
        { text: 'Narration', value: 'narration' },
        { text: 'Status', value: 'status' },
        { text: 'Created At', value: 'createdAt' }
      ]
    };
  },
  methods: {
    async load() {
      if (!this.clientId || !this.type) {
        this.$emit('notify', { text: 'Client ID and Type are required', color: 'warning' });
        return;
      }
      this.loading = true;
      try {
        const res = await ledgerApi.getClientEntriesByType({
          clientId: this.clientId, type: this.type,
          from: this.from || undefined, to: this.to || undefined
        });
        this.rows = res.items || [];
      } catch (e) {
        this.$emit('notify', { text: e.message, color: 'error' });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
