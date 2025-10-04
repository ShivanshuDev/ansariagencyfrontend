<template>
  <div>
    <h3>{{ role }} List</h3>
    <ul>
      <li v-for="user in users" :key="user.userId">
        {{ user.name }} - {{ user.email }}
        <button @click="$emit('edit-user', user)">Edit</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'UserList',
  props: {
    role: { type: String, required: true },
    department: { type: String, default: null }
  },
  data() {
    return {
      users: []
    }
  },
  mounted() {
    this.fetchUsers()
  },
  watch: {
    department() {
      this.fetchUsers()
    }
  },
  methods: {
    fetchUsers() {
      // In real app, replace below with API call or DynamoDB fetch
      // Filter users by role + optionally department (mock here)
      this.users = this.mockUsers().filter(u => {
        if (u.role !== this.role) return false
        if (this.department && u.department !== this.department) return false
        return true
      })
    },
    mockUsers() {
      return [
        {
          userId: 'admin012',
          name: 'Salma Singh',
          email: 'salma@company.com',
          role: 'ADMIN',
          department: null
        },
        {
          userId: 'emp1001',
          name: 'Ankit Mehta',
          email: 'ankit.sales@company.com',
          role: 'EMPLOYEE',
          department: 'Sales'
        }
      ]
    }
  }
}
</script>
