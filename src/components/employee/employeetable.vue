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
        :items-per-page="10"
        hide-default-footer="false"
        @click:row="onRowClick"
      >
      <template v-slot:item.sn="{ index }">
        {{ index + 1 }}
      </template>
        <!-- Data rows -->
        <template v-slot:item.employeeId="{ item }">{{ item.employeeId || '-' }}</template>
        <template v-slot:item.employeeRole="{ item }">{{ item.employeeRole || '-' }}</template>
        <template v-slot:item.employeeName="{ item }">{{ item.employeeName || '-' }}</template>
        <template v-slot:item.email="{ item }">{{ item.email || '-' }}</template>
        <template v-slot:item.department="{ item }">{{ item.department || '-' }}</template>
        <template v-slot:item.phone="{ item }">{{ item.phone || '-' }}</template>
        <template v-slot:item.userName="{ item }">{{ item.userName || '-' }}</template>
      </v-data-table>

      <!-- Loader overlay -->
      <v-overlay :value="loading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </v-card>

    <!-- Single dialog for employee details -->
    <v-dialog v-model="detailDialog" max-width="720px">
      <v-card>
        <v-card-text>
          <employee-detail
            v-if="selectedEmployee"
            :employee="selectedEmployee"
            @close="closeDetail"
          />
          <div v-else>
            No employee selected.
          </div>
        </v-card-text>

        <v-card-actions v-if="selectedEmployee">
          <v-spacer />
          <v-btn color="primary" @click="openEdit">Edit</v-btn>
          <v-btn text @click="closeDetail">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit dialog (opens when user clicks Edit) -->
    <v-dialog v-model="editDialog" max-width="920px">
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
          <div v-else>
            No employee selected for editing.
          </div>
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
      editingEmployeePk: null
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
    headers() {
      return [
        { text: 'S.No', value: 'sn', sortable: false, align: 'start' },
        { text: 'Name', value: 'employeeName', sortable: false },
        { text: 'Employee ID', value: 'employeeId', sortable: false },
        { text: 'Role', value: 'employeeRole', sortable: false },
        { text: 'Email', value: 'email', sortable: false },
        { text: 'Department', value: 'department', sortable: false },
        { text: 'Phone', value: 'phone', sortable: false },
        { text: 'User Name', value: 'userName', sortable: false }
      ];
    }
  },
  methods: {
    async fetchEmployees() {
      this.loading = true;
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL+'employeeDetail', { timeout: 10000 });
        const d = res && res.data ? res.data : null;
        this.employees = (d && Array.isArray(d.employees)) ? d.employees : (Array.isArray(d) ? d : []);
        const depts = new Set((this.employees || []).map(emp => emp.department || '').filter(Boolean));
        this.departments = Array.from(depts);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        this.employees = [];
        this.departments = [];
      } finally {
        this.loading = false;
      }
    },

    onRowClick(item /*, event */) {
      if (!item) return;
      // find full record in this.employees by vendorId, userId or employeeName
      const found = (this.employees || []).find(e => {
        return (e.employeeId && e.employeeId === item.employeeId)
          || (e.userId && e.userId === item.userName)
          || (e.employeeName && e.employeeName === item.employeeName);
      });

      this.selectedEmployee = found || null;
      this.detailDialog = !!this.selectedEmployee;
    },

    closeDetail() {
      this.detailDialog = false;
      // keep selectedEmployee around while editDialog might open — clear only when explicit
      // But to match previous behavior, clear it:
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
      // serverResp expected to include updated item or message
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
          const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL+`getEmployeeByPk/${id}`, { timeout: 10000 });
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
.v-data-table tbody tr { cursor: pointer; }
</style>
