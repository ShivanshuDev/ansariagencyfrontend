<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="title">Welcome Back</h2>
      <p class="subtitle">Please log in to continue</p>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            v-model.trim="username"
            placeholder="Enter your username"
            :disabled="loading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Enter your password"
            :disabled="loading"
            required
          />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else>Logging in...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "Login",
  data() {
    return {
      username: "",
      password: "",
      loading: false,
      error: ""
    };
  },
  methods: {
    async handleLogin() {
      this.error = "";

      if (!this.username || !this.password) {
        this.error = "Please enter username and password.";
        return;
      }

      this.loading = true;

      try {
        // NOTE: you're sending credentials via query params as requested.
        // Prefer POST / HTTPS in production.
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL+'/employeeLogin', {
          params: {
            userId: this.username,
            password: this.password
          },
          timeout: 8000
        });

        // Normalize response and decide success
        const data = (res && res.data) ? res.data : {};
        console.log('data', JSON.stringify(data, null, 2))
        // Possible success indicators (defensive):
        // - token in data (data.token)
        // - data.success === true
        // - data.auth === true
        // - HTTP 200 and data contains user or message that indicates success
        const success = !!(
          data.token ||
          data.auth === true ||
          data.success === true ||
          (res.status === 200 && (data.user || data.username || data.message === 'OK'))
        );

        if (!success) {
          // If API returns message explaining reason, show it; else generic
          this.error = (data && (data.message || data.error)) ? (data.message || data.error) : 'Invalid credentials or server rejected the login.';
          return;
        }

        // Obtain a token and user object in the most-likely keys
        const token = data.token || data.authToken || `token-${Date.now()}`; // fallback token
        const user = data.user || { username: data.username || this.username };

        // Persist to localStorage (simple approach)
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));

        // emit login so parent (App.vue) can show Body
        this.$emit('login', { token, user });

      } catch (err) {
        // handle network / server errors
        if (err.response && err.response.data && err.response.data.message) {
          this.error = err.response.data.message;
        } else if (err.code === 'ECONNABORTED') {
          this.error = 'Request timed out. Try again.';
        } else {
          this.error = 'Failed to contact server. Check console for details.';
          console.error('Login error:', err);
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Light background */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f7fa;
  font-family: "Roboto", sans-serif;
}

/* Center card */
.login-card {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  width: 350px;
  text-align: center;
}

/* Title & subtitle */
.title {
  margin-bottom: 0.3rem;
  color: #333;
}
.subtitle {
  margin-bottom: 1rem;
  font-size: 14px;
  color: #666;
}

/* Form inputs */
.form-group {
  margin-bottom: 1.1rem;
  text-align: left;
}
label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #444;
}
input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: 0.15s;
  box-sizing: border-box;
}
input:focus {
  border-color: #42a5f5;
  box-shadow: 0 4px 10px rgba(66, 165, 245, 0.08);
}

/* Error message */
.error {
  color: #b00020;
  margin-bottom: 10px;
  text-align: left;
  font-size: 13px;
}

/* Login button */
.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(90deg,#42a5f5,#1e88e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: transform .08s ease;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
</style>
