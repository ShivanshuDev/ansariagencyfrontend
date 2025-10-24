<template>
  <div class="tableData">
    <v-card>
      <v-card-title>Employee Details</v-card-title>

      <!-- Search and Filter Row -->
      <v-row class="mx-2 mb-4" align="center">
        <v-col cols="2" class="pa-0">
          <v-text-field
            v-model="search"
            label="Search"
            dense
            outlined
            clearable
            hide-details
            placeholder="Search by name, email, etc."
          />
        </v-col>
        <v-col cols="6" class="pa-0" style="text-align: right;">
          <v-select
            v-model="selectedDepartment"
            :items="departments"
            label="Filter by Department"
            dense
            outlined
            clearable
            hide-details
            style="max-width: 200px; display: inline-block;"
          />
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="filteredEmployees"
        class="elevation-1"
        :items-per-page="itemsPerPage"
        :page.sync="page"                   
        :loading="loading"
        :hide-default-footer="true" 
      >
        <!-- Serial number (continuous across pages) -->
        <template v-slot:item.sn="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>

        <!-- Data cells -->
        <template v-slot:item.employeeRole="{ item }">{{ item.employeeRole || '-' }}</template>
        <template v-slot:item.employeeName="{ item }">{{ item.employeeName || '-' }}</template>
        <template v-slot:item.phone="{ item }">{{ item.phone || '-' }}</template>
        <template v-slot:item.userName="{ item }">{{ item.userName || '-' }}</template>

        <!-- Details action (icon/button at end) -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            style="margin-right:20px;"
            icon
            color="primary"
            @click.stop="showDetails(item)"
            :title="`Show details for ${item.employeeName || 'employee'}`"
          >
            <span>Show</span>
            <v-icon small>mdi-eye-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <!-- Custom Pagination -->
      <div class="pa-3 d-flex justify-end">
        <v-pagination
          v-model="page"
          :length="pageCount"
          :total-visible="7"
          :disabled="pageCount <= 1"
        />
      </div>

      <!-- Loader overlay -->
      <v-overlay :value="loading" absolute>
        <v-progress-circular indeterminate size="64" />
      </v-overlay>
    </v-card>

    <!-- Single dialog for employee details -->
    <v-dialog v-model="detailDialog" max-width="1420px">
      <v-card>
        <v-card-text>
          <employee-detail
            v-if="selectedEmployee"
            :employee="selectedEmployee"
            @close="closeDetail"
          />
          <div v-else>No employee selected.</div>
        </v-card-text>

        <v-card-actions v-if="selectedEmployee">
          <v-spacer />
          <v-btn color="primary" @click="openEdit">Edit</v-btn>
          <v-btn text @click="closeDetail">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit dialog (opens when user clicks Edit) -->
    <v-dialog persistent v-model="editDialog" max-width="920px">
      <v-card>
        <v-card-title>
          Edit Employee
          <v-spacer />
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <edit-employee
            v-if="selectedEmployee"
            :employee="selectedEmployee"
            :pk="selectedEmployee.pk"
            @saved="onEmployeeSaved"
            @cancel="closeEdit"
          />
          <div v-else>No employee selected for editing.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import EmployeeDetail from './employeedetails.vue';
import EditEmployee from './editemployee.vue';

export default {
  name: 'EmployeeTableWithDetailAndEdit',
  components: { EmployeeDetail, EditEmployee },
  data() {
    return {
      employees: [],
      search: '',
      selectedDepartment: null,
      departments: [],
      loading: false,
      detailDialog: false,
      selectedEmployee: null,
      editDialog: false,
      editingEmployeePk: null,

      // Pagination state
      page: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    filteredEmployees() {
      const q = (this.search || '').toString().trim().toLowerCase();

      const rows = (this.employees || [])
        .filter(emp => {
          if (!emp) return false;
          if (!q) return true;
          const fields = [
            emp.employeeRole || '',
            emp.employeeName || '',
            emp.email || '',
            emp.employeeId || '',
            emp.department || '',
            emp.phone || '',
            emp.userId || ''
          ];
          return fields.some(f => f.toString().toLowerCase().includes(q));
        })
        .filter(emp => {
          if (!this.selectedDepartment) return true;
          return emp.department === this.selectedDepartment;
        })
        .map(emp => ({
          employeeRole: emp.employeeRole,
          employeeName: emp.employeeName,
          email: emp.email,
          employeeId: emp.employeeId,
          department: emp.department,
          phone: emp.phone,
          userName: emp.userId
        }));

      return rows;
    },

    // total pages for custom pagination
    pageCount() {
      const total = this.filteredEmployees.length || 0;
      return Math.max(1, Math.ceil(total / this.itemsPerPage));
    },

    headers() {
      return [
        { text: 'S.No', value: 'sn', sortable: false, align: 'start', width: 72 },
        { text: 'Name', value: 'employeeName', sortable: false },
        { text: 'Role', value: 'employeeRole', sortable: false },
        { text: 'Phone', value: 'phone', sortable: false },
        { text: 'User Name', value: 'userName', sortable: false },
        { text: 'Details', value: 'actions', sortable: false, align: 'end', width: 110 }
      ];
    }
  },
  methods: {
    async fetchEmployees() {
      this.loading = true;
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'employeeDetail', { timeout: 10000 });
        const d = res && res.data ? res.data : null;
        this.employees = (d && Array.isArray(d.employees)) ? d.employees : (Array.isArray(d) ? d : []);
        const depts = new Set((this.employees || []).map(emp => emp.department || '').filter(Boolean));
        this.departments = Array.from(depts);
        // reset to first page after fetch/filter changes
        this.page = 1;
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        this.employees = [];
        this.departments = [];
      } finally {
        this.loading = false;
      }
    },

    // Show details ONLY when button is clicked
    showDetails(item) {
      if (!item) return;
      // find full record in this.employees by matching keys
      const found = (this.employees || []).find(e => {
        return (e.employeeId && e.employeeId === item.employeeId)
          || (e.userId && e.userId === item.userName)
          || (e.employeeName && e.employeeName === item.employeeName);
      });
      this.selectedEmployee = found || null;
      this.detailDialog = !!this.selectedEmployee;
    },

    // kept for compatibility; not used
    onRowClick() {},

    closeDetail() {
      this.detailDialog = false;
      this.selectedEmployee = null;
    },

    openEdit() {
      if (!this.selectedEmployee) {
        console.warn('No employee selected to edit');
        return;
      }
      this.editingEmployeePk = this.selectedEmployee.pk || this.selectedEmployee.userId;
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
      this.$nextTick(() => {
        this.editingEmployeePk = null;
      });
    },

    async onEmployeeSaved(serverResp) {
      console.log('Employee saved response:', serverResp);

      // Close edit dialog
      this.closeEdit();

      // Refresh employees list
      await this.fetchEmployees();

      // Try to update selectedEmployee with returned data if present
      let updated = null;
      if (serverResp && serverResp.item) updated = serverResp.item;
      else if (serverResp && serverResp.employee) updated = serverResp.employee;
      else if (serverResp && serverResp.data) updated = serverResp.data;
      else if (serverResp && serverResp.updated) updated = serverResp.updated;

      if (updated) {
        this.selectedEmployee = updated;
        this.detailDialog = true;
        return;
      }

      // fallback: re-fetch single employee by pk (if we have it)
      try {
        const pk = this.editingEmployeePk || (this.selectedEmployee && this.selectedEmployee.pk);
        if (pk) {
          const id = pk.startsWith('employee#') ? pk.split('#')[1] : pk;
          const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + `getEmployeeByPk/${id}`, { timeout: 10000 });
          const d = res && res.data ? res.data : null;
          const fresh = (d && d.item) ? d.item : d;
          if (fresh) this.selectedEmployee = fresh;
        }
      } catch (err) {
        console.warn('Could not reload single employee after save', err);
      } finally {
        this.detailDialog = true;
      }
    }
  },
  watch: {
    // keep page in range if filters shrink the list
    filteredEmployees() {
      this.$nextTick(() => {
        if (this.page > this.pageCount) this.page = this.pageCount;
      });
    }
  },
  mounted() {
    this.fetchEmployees();
  }
};
</script>

<style scoped>
.tableData {
  margin: 9px;
}
.v-data-table__wrapper {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-size: 14px;
  color: #222;
}
.v-data-table tbody tr { cursor: default; } /* row no longer clickable */

/* Blue table header (Vuetify 2) */
.tableData >>> .v-data-table-header th {
  background: #001f3f;          /* Material Blue 700 */
  color: #fff !important;
}

/* Make sort icon & header text white too */
.tableData >>> .v-data-table-header th .v-icon,
.tableData >>> .v-data-table-header th .v-data-table-header__icon {
  color: #fff !important;
}

/* Optional: sticky header if your table scrolls */
.tableData >>> .v-data-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
