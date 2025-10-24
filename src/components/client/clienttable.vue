<template>
  <div class="tableData">
    <v-card>
      <v-card-title class="d-flex align-center" style="gap:12px; flex-wrap:wrap;">
        <span class="title">Client Details</span>
        <v-spacer />
        <!-- Search input -->
        <v-text-field
          outlined
          v-model="search"
          append-icon="mdi-magnify"
          placeholder="Search clientId, name, email, phone or status"
          dense
          hide-details
          clearable
          style="max-width:360px"
        />

      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredRows"
        class="elevation-1"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page.sync="page"
      >
        <!-- Serial Number column -->
        <template v-slot:item.sn="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>

        <template v-slot:item.clientId="{ item }">
          {{ item.clientId || '-' }}
        </template>

        <template v-slot:item.name="{ item }">
          {{ item.name || '-' }}
        </template>

        <template v-slot:item.email="{ item }">
          {{ item.email || '-' }}
        </template>

        <template v-slot:item.phone="{ item }">
          {{ item.phone || '-' }}
        </template>

        <!-- <template v-slot:item.status="{ item }">
          {{ item.status || '-' }}
        </template> -->

        <!-- Actions column: Show button -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            small
            outlined
            color="primary"
            @click.stop="showDetails(item)"
            title="Show details"
          >
            <v-icon left small>mdi-eye</v-icon>
            Show
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- View dialog showing ClientDetail -->
    <v-dialog v-model="dialog" max-width="920px" persistent>
      <v-card>
        <v-card-title>
          Vendor Information
          <v-spacer></v-spacer>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text style="height:700px;">
          <client-detail v-if="selectedPk" :pk="selectedPk" />
          <div v-else> No client selected </div>
        </v-card-text>

        <v-card-actions>
          <div style="width:100%; display:flex; flex-direction:row-reverse">
            <v-btn color="primary dark" @click="onEditClick"> EDIT</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" max-width="1420px">
      <v-card>
        <v-card-title>
          Edit Vendor
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text style="min-height:400px;">
          <edit-client
            v-if="editPk"
            :pk="editPk"
            @saved="onClientSaved"
            @cancel="closeEdit"
          />
          <div v-else> No client selected for edit </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import ClientDetail from './clientdetails.vue';
import EditClient from './editclient.vue';

export default {
  name: 'ClientDataTableSimple',
  components: { ClientDetail, EditClient },
  data() {
    return {
      clients: [],
      loading: false,
      dialog: false,
      selectedPk: null,   // encoded pk used for viewing
      editDialog: false,
      editPk: null,        // decoded/UUID pk used for editing
      search: '',
      // NEW: pagination state
      page: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    clientRows() {
      if (!Array.isArray(this.clients) || this.clients.length === 0) return [];
      return this.clients.map(item => {
        const source = item.customer || item;
        return {
          pk: source.pk || source.id || source.clientId || null,
          name: source.name || source.customerName || '-',
          clientId: source.clientId || source.pk || '-',
          email: source.email || source.userEmail || '-',
          phone: source.phone || source.mobile || '-',
          gstin: source.gstin || source.gstin || '-',
          status: source.status || (source.active === true ? 'Active' : (source.active === false ? 'Inactive' : '-'))
        };
      });
    },

    // filteredRows uses `search` to filter clientRows based on several fields
    filteredRows() {
      const q = (this.search || '').toString().trim().toLowerCase();
      if (!q) return this.clientRows;

      return this.clientRows.filter(row => {
        const fields = [
          row.clientId,
          row.name,
          row.email,
          row.phone,
          row.status
        ];
        return fields.some(f => {
          if (f === undefined || f === null) return false;
          return f.toString().toLowerCase().includes(q);
        });
      });
    },

    headers() {
      return [
        { text: '#', value: 'sn', sortable: false, width: 70, align: 'start' }, // Serial No.
        { text: 'Vendor Id', value: 'clientId', sortable: false },
        { text: 'Name', value: 'name', sortable: false },
        { text: 'Email', value: 'email', sortable: false },
        { text: 'Phone', value: 'phone', sortable: false },
        { text: 'GSTIN', value: 'gstin', sortable: false },
        // { text: 'Status', value: 'status', sortable: false },
        { text: 'Actions', value: 'actions', sortable: false, align: 'end' }
      ];
    }
  },
  methods: {
    showDetails(item) {
      // reuse your existing view flow
      const rawPk = item && item.pk;
      if (!rawPk) return;
      this.selectedPk = encodeURIComponent(String(rawPk));
      this.dialog = true;
    },

    async fetchClients() {
      this.loading = true;
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllClient', { timeout: 10000 });
        const d = res && res.data ? res.data : null;

        if (Array.isArray(d)) this.clients = d;
        else if (d && Array.isArray(d.items)) this.clients = d.items;
        else if (d && Array.isArray(d.data)) this.clients = d.data;
        else if (d && typeof d === 'object') {
          const arr = Object.values(d).find(v => Array.isArray(v));
          this.clients = arr || [];
        } else this.clients = [];
      } catch (err) {
        console.error('Failed to fetch clients', err);
        this.clients = [];
      } finally {
        this.loading = false;
      }
    },

    // open the view dialog (kept for row click compatibility if you use it)
    goToClientDetails(item /*, event */) {
      const rawPk = item && (item.pk);
      console.log('click row ->', rawPk, item);

      if (!rawPk) {
        console.warn('No pk for clicked item', item);
        return;
      }

      this.selectedPk = encodeURIComponent(String(rawPk));
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.$nextTick(() => { this.selectedPk = null; });
    },

    // Edit flow: prepare editPk (decoded or UUID-only) and open edit dialog
    onEditClick() {
      if (!this.selectedPk) {
        console.warn('No selectedPk to edit');
        return;
      }
      const decoded = decodeURIComponent(this.selectedPk);
      const id = decoded.includes('#') ? decoded.split('#')[1] : decoded;
      this.editPk = id;
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
      this.$nextTick(() => { this.editPk = null; });
    },

    // Called when EditClient emits `saved`
    onClientSaved(payload) {
      console.log('client saved:', payload);
      this.closeEdit();
      this.closeDialog();
      this.fetchClients();
    }
  },
  mounted() {
    this.fetchClients();
  }
};
</script>

<style scoped>
.tableData{
  margin: 9px;
}
.v-data-table__wrapper {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 14px;
  color: #222;
}
.v-data-table tbody tr { cursor: pointer; }

/* ---- Table header background: BLUE ---- */
/* Vuetify v2 */
::v-deep .v-data-table-header th {
  background-color: #001f3f !important; /* primary blue */
  color: #fff !important;
  font-weight: 600;
}

/* Vuetify v3 */
::v-deep th.v-data-table__th {
  background-color: #001f3f !important;
  color: #fff !important;
  font-weight: 600;
}

/* Make sort icons / buttons white too */
::v-deep .v-data-table-header th .v-icon,
::v-deep th.v-data-table__th .v-icon,
::v-deep th.v-data-table__th .v-btn {
  color: #fff !important;
}

/* Optional: subtle bottom border for header */
::v-deep .v-data-table-header,
::v-deep thead {
  border-bottom: 1px solid #1565c0;
}

/* Increase table header font size */
::v-deep .v-data-table-header th,
::v-deep th.v-data-table__th {
  font-size: 16px !important;
  font-weight: 600;
  color: #fff !important;
  background-color: #001f3f !important;
  text-transform: capitalize;
}

/* Optional: tighten the SN column */
::v-deep td:nth-child(1) {
  width: 70px;
  white-space: nowrap;
  text-align: left;
}
</style>
