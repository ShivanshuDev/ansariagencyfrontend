<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- LEFT SECTION -->
      <div class="left-panel">
        <h1>Welcome to website</h1>

        <div class="shapes">
          <span class="shape one"></span>
          <span class="shape two"></span>
          <span class="shape three"></span>
        </div>
      </div>

      <!-- RIGHT SECTION -->
      <div class="right-panel">
        <h3 class="login-title">USER LOGIN</h3>

        <!-- USERNAME -->
        <div class="input-group">
          <span class="icon">👤</span>
          <input
            type="text"
            placeholder="Username"
            v-model.trim="username"
            :disabled="loading"
          />
        </div>

        <!-- PASSWORD -->
        <div class="input-group">
          <span class="icon">🔒</span>
          <input
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            v-model="password"
            :disabled="loading"
          />
          <span class="eye" @click="togglePassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </span>
        </div>

        <!-- ERROR -->
        <div v-if="error" class="error">{{ error }}</div>

        <!-- LOGIN -->
        <button
          class="login-btn"
          @click="handleLogin"
          :disabled="loading"
        >
          {{ loading ? "Logging in..." : "LOGIN" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LoginSplit",
  data() {
    return {
      username: "",
      password: "",
      showPassword: false,
      loading: false,
      error: ""
    };
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    async handleLogin() {
      this.error = "";

      if (!this.username || !this.password) {
        this.error = "Username and password are required";
        return;
      }

      this.loading = true;

      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "employeeLogin",
          {
            params: {
              userId: this.username,
              password: this.password
            },
            timeout: 8000
          }
        );

        const data = res?.data || {};

        const success =
          data.token ||
          data.success === true ||
          data.auth === true ||
          res.status === 200;

        if (!success) {
          this.error = data.message || "Invalid credentials";
          return;
        }

        const token = data.token || `token-${Date.now()}`;
        const user = data.user || { username: this.username };

        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));

        // 🔥 notify parent / redirect
        this.$emit("login", { token, user });
        // OR use router
        // this.$router.push("/dashboard");

      } catch (err) {
        if (err.response?.data?.message) {
          this.error = err.response.data.message;
        } else {
          this.error = "Server error. Try again.";
        }
        console.error(err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* ERROR */
.error {
  color: #b00020;
  font-size: 13px;
  text-align: center;
  margin-bottom: 12px;
}

/* PAGE BACKGROUND */
.auth-wrapper {
  height: 100vh;
  background: linear-gradient(135deg, #6a5af9, #9b5de5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Poppins", sans-serif;
}

/* CARD */
.auth-card {
  width: 900px;
  height: 480px;
  background: #fff;
  border-radius: 14px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

/* LEFT PANEL */
.left-panel {
  width: 55%;
  padding: 50px;
  color: #fff;
  position: relative;
  background: linear-gradient(135deg, #6a5af9, #f15bb5);
}

.left-panel h1 {
  font-size: 32px;
}

/* Decorative shapes */
.shapes .shape {
  position: absolute;
  border-radius: 30px;
  opacity: 0.7;
}
.shape.one {
  width: 140px;
  height: 18px;
  background: #ffbe0b;
  bottom: 70px;
  left: 60px;
}
.shape.two {
  width: 180px;
  height: 22px;
  background: #ff758f;
  bottom: 30px;
  left: 140px;
}
.shape.three {
  width: 120px;
  height: 18px;
  background: #ffd166;
  bottom: 110px;
  left: 200px;
}

/* RIGHT PANEL */
.right-panel {
  width: 45%;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-title {
  text-align: center;
  margin-bottom: 28px;
  color: #7b5cff;
}

/* INPUTS */
.input-group {
  position: relative;
  margin-bottom: 18px;
}

.input-group input {
  width: 100%;
  padding: 12px 44px;
  border-radius: 30px;
  border: none;
  background: #f1f0ff;
  outline: none;
}

.icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.eye {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

/* BUTTON */
.login-btn {
  width: 120px;
  align-self: center;
  padding: 10px;
  border-radius: 30px;
  border: none;
  background: linear-gradient(135deg, #9b5de5, #f15bb5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
