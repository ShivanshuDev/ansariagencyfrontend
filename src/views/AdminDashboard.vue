<template>
  <div class="admin-dashboard">
    <h2>Admin Dashboard - Employees</h2>

    <select v-model="selectedDepartment" @change="fetchEmployees" class="department-select">
      <option value="" disabled>Select Department</option>
      <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
    </select>

    <button @click="showAddEmployee = true" class="btn-primary" :disabled="!selectedDepartment">Add Employee</button>

    <!-- Add Employee -->
    <UserForm
      v-if="showAddEmployee"
      :role="'EMPLOYEE'"
      :department="selectedDepartment"
      :permissions="defaultPermissionsByDept[selectedDepartment]"
      @close="showAddEmployee = false"
      @saved="onEmployeeSaved"
    />

    <!-- Employee List -->
    <UserList
      ref="employeeList"
      :role="'EMPLOYEE'"
      :department="selectedDepartment"
      @edit-user="openEditEmployee"
    />

    <!-- Edit Employee -->
    <UserForm
      v-if="editingEmployee"
      :role="'EMPLOYEE'"
      :user="editingEmployee"
      @close="editingEmployee = null"
      @saved="onEmployeeSaved"
    />
  </div>
</template>

<script>
import UserForm from './UserForm.vue'
import UserList from './UserList.vue'

export default {
  name: 'AdminDashboard',
  components: { UserForm, UserList },
  data() {
    return {
      departments: ['Sales', 'Insurance', 'RTO', 'StockKeeper'],
      selectedDepartment: '',
      showAddEmployee: false,
      editingEmployee: null,
      defaultPermissionsByDept: {
        Sales: {
          addRecord: true,
          editRecord: true,
          generateInvoice: true,
          generateBill: true,
          sellProduct: true
        },
        Insurance: {
          addPolicy: true,
          editPolicy: true,
          approveClaims: false,
          viewCustomerData: true
        },
        RTO: {
          viewRegistration: true,
          processTransfer: true,
          updateOwnerDetails: true
        },
        StockKeeper: {
          updateStock: true,
          addInventory: true,
          viewInventory: true
        }
      }
    }
  },
  methods: {
    fetchEmployees() {
      this.$refs.employeeList.fetchUsers()
    },
    onEmployeeSaved() {
      this.showAddEmployee = false
      this.editingEmployee = null
      this.fetchEmployees()
    },
    openEditEmployee(employee) {
      this.editingEmployee = employee
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}
.department-select {
  margin-bottom: 10px;
  padding: 6px;
  font-size: 16px;
}
.btn-primary {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  margin-bottom: 15px;
}
</style>
