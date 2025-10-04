<template>
  <v-app>
    <!-- <v-main> -->
      <div>
        <!-- If not authenticated show Login, otherwise show Body -->
        <LoginpageVue v-if="!isAuthenticated" @login="onLogin" />
        <Body v-else @logout="onLogout" />
      </div>
    <!-- </v-main> -->
  </v-app>
</template>

<script>
import Body from './components/body.vue';
import LoginpageVue from './components/loginpage.vue';

export default {
  name: 'App',
  components: { LoginpageVue, Body },
  data() {
    return {
      // restore auth state from localStorage so refresh keeps you logged in
      isAuthenticated: !!localStorage.getItem('auth_token')
    };
  },
  methods: {
    // called when Login.vue emits successful login
    onLogin({ token, user }) {
      // store token (or minimal flag). replace with secure handling in production
      localStorage.setItem('auth_token', token || 'demo-token');
      localStorage.setItem('auth_user', JSON.stringify(user || {}));
      this.isAuthenticated = true;
    },
    onLogout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      this.isAuthenticated = false;
    }
  }
};
</script>

<style>
/* optional global styles */
</style>
