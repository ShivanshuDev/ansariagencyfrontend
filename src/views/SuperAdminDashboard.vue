<template>
  <div class="super-admin-dashboard">
    <h1>Super Admin Dashboard</h1>
    <button @click="showAddAdmin = true" class="btn-primary">Add New Admin</button>

    <!-- Add Admin Modal -->
    <UserForm
      v-if="showAddAdmin"
      :role="'ADMIN'"
      :permissions="superAdminPermissions"
      @close="showAddAdmin = false"
      @saved="onAdminSaved"
    />

    <!-- Admin Listing -->
    <UserList
      :role="'ADMIN'"
      @edit-user="openEditAdmin"
    />

    <!-- Edit Admin Modal -->
    <UserForm
      v-if="editingAdmin"
      :role="'ADMIN'"
      :user="editingAdmin"
      @close="editingAdmin = null"
      @saved="onAdminSaved"
    />
  </div>
</template>

<script>
import UserForm from './UserForm.vue'
import UserList from './UserList.vue'

export default {
  name: 'SuperAdminDashboard',
  components: { UserForm, UserList },
  data() {
    return {
      showAddAdmin: false,
      editingAdmin: null,
      superAdminPermissions: {
        manageAdmins: true,
        approveEmployees: true,
        assignAdminPermissions: true
      }
    }
  },
  methods: {
    onAdminSaved() {
      this.showAddAdmin = false
      this.editingAdmin = null
      this.$refs.adminList.fetchUsers() // Refresh list method
    },
    openEditAdmin(admin) {
      this.editingAdmin = admin
    }
  }
}
</script>

<style scoped>
.super-admin-dashboard {
  padding: 20px;
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
