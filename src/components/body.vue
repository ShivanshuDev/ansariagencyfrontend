<template>
  <div class="main_layout">
    <transition name="slide">
      <div class="left" v-if="showSidebar">
        <Sidebar @tab-selected="selectedTab = $event" />
      </div>
    </transition>

    <div class="right" :class="{ 'full-width': !showSidebar }">
      <TabdetailsVue
        :selected-tab="selectedTab"
        @toggle-sidebar="toggleSidebar"
      />
    </div>
  </div>
</template>

<script>
import TabdetailsVue from '@/views/tabdetails.vue'
import Sidebar from '../views/sidebar.vue'

export default {
  components: { Sidebar, TabdetailsVue },
  data() {
    return {
      selectedTab: null,
      showSidebar: true
    };
  },
  methods: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    }
  }
};
</script>

<style>
.main_layout {
  width: 100%;
  display: flex;
  flex-direction: row;
}

.left {
  width: 350px;
  height: 100vh;
  transition: all 0.3s ease;
}

.right {
  width: calc(100% - 350px);
  height: 100vh;
  transition: all 0.3s ease;
}

.right.full-width {
  width: 100%;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter, .slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
