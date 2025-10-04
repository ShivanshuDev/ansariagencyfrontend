<template>
    <div class="main_layout">
        <div class="left"> 
            <Sidebar  @tab-selected="selectedTab = $event"  />
        </div>
        <div class="right">
            <TabdetailsVue :selected-tab="selectedTab" />
        </div>
    </div>
</template>

<script>
import TabdetailsVue from '@/views/tabdetails.vue'
import Sidebar from '../views/sidebar.vue'


export default {
    components: {
        Sidebar,
        TabdetailsVue
    },
    data() {
        return {
            selectedTab: null
        };
    }
}
</script>

<style>
    .main_layout{
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    .left{
        width:350px;
        height: 100vh;
    }


    .right{
        width: calc(100% - 350px);
        height: 100vh;
    }
</style>
