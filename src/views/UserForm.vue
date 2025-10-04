<template>
  <div class="user-form">
    <h3>{{ user ? 'Edit' : 'Add' }} {{ role }}</h3>
    <form @submit.prevent="saveUser">
      <div>
        <label>Name</label>
        <input type="text" v-model="form.name" required />
      </div>

      <div>
        <label>Email</label>
        <input type="email" v-model="form.email" required />
      </div>

      <div v-if="!user">
        <label>Password</label>
        <input type="password" v-model="form.password" required />
      </div>

      <div>
        <label>Phone Number</label>
        <input type="text" v-model="form.phoneNumber" />
      </div>

      <div>
        <label>Alternate Phone</label>
        <input type="text" v-model="form.alternatePhone" />
      </div>

      <div v-if="department">
        <label>Department</label>
        <input type="text" :value="department" disabled />
      </div>

      <div>
        <h4>Permissions</h4>
        <div v-for="(value, key) in form.permissions" :key="key" class="permission-item">
          <label>
            <input type="checkbox" v-model="form.permissions[key]" />
            {{ key }}
          </label>
        </div>
      </div>

      <div class="buttons">
        <button type="submit" class="btn-primary">{{ user ? 'Update' : 'Save' }}</button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'UserForm',
  props: {
    role: { type: String, required: true },
    user: { type: Object, default: null },
    permissions: { type: Object, default: () => ({}) },
    department: { type: String, default: null }
  },
  data() {
    return {
      form: {
        name: this.user?.name || '',
        email: this.user?.email || '',
        password: '',
        phoneNumber: this.user?.phoneNumber || '',
        alternatePhone: this.user?.alternatePhone || '',
        permissions: { ...this.permissions }
      }
    }
  },
  methods: {
    saveUser() {
      // Emit the filled form data
      const userData = {
        ...this.form,
        role: this.role,
        department: this.department,
        userId: this.user?.userId || this.generateUserId(),
        password: this.form.password || (this.user ? this.user.password : ''),
        status: this.user ? this.user.status : 'pending',
        createdAt: this.user ? this.user.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityType: this.role === 'EMPLOYEE' ? 'EMPLOYEE' : this.role
      }
      this.$emit('saved', userData)
    },
    generateUserId() {
      return `${this.role.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }
}
</script>

<style scoped>
.user-form {
  background: #f7f7f7;
  padding: 20px;
  border-radius: 4px;
  max-width: 400px;
}
.user-form label {
  display: block;
  margin-top: 10px;
  font-weight: 600;
}
.user-form input[type="text"],
.user-form input[type="email"],
.user-form input[type="password"] {
  width: 100%;
  padding: 6px;
  margin-top: 5px;
  box-sizing: border-box;
}
.permission-item {
  margin-top: 6px;
}
.buttons {
  margin-top: 20px;
}
.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  margin-right: 10px;
}
</style>
