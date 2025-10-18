<template>
  <v-navigation-drawer app permanent class="app-drawer" style="width:350px;" clipped>
    <v-list dense class="drawer-list pa-3">
      <v-list-item class="brand-row">
        <v-list-item-title class="brand-title" style="font-size:1.2rem; color:white;">
          ANSARI AUTOMOBILES
        </v-list-item-title>
      </v-list-item>

      <v-divider style="color:white;" class="my-2"></v-divider>

      <!-- Super Admin (always visible) -->
      <v-expansion-panels v-model="activePanel" accordion class="exp-panels">
        <v-expansion-panel>
          <v-expansion-panel-header class="panel-header">
            <v-icon left class="header-icon">mdi-view-dashboard</v-icon>
            <span class="header-text">Super Admin</span>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <v-list dense>
              <!-- Inventory submenu -->
              <v-list-group prepend-icon="mdi-warehouse" no-action>
                <template v-slot:activator>
                  <v-list-item-title>Vendor Sell</v-list-item-title>
                </template>

                <v-list-item @click="$emit('tab-selected', 'SellToVendor')">
                  <v-list-item-content>
                    <v-list-item-title>Sell To Vendor</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <!-- <v-list-item @click="$emit('tab-selected', 'InventryTable')">
                  <v-list-item-content>
                    <v-list-item-title>Sales Details</v-list-item-title>
                  </v-list-item-content>
                </v-list-item> -->
              </v-list-group>

              <!-- Inventory submenu -->
              <v-list-group prepend-icon="mdi-warehouse" no-action>
                <template v-slot:activator>
                  <v-list-item-title>Inventory</v-list-item-title>
                </template>

                <v-list-item @click="$emit('tab-selected', 'AddInventryVue')">
                  <v-list-item-content>
                    <v-list-item-title>Add Inventory</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item @click="$emit('tab-selected', 'InventryTable')">
                  <v-list-item-content>
                    <v-list-item-title>Inventory Details</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item @click="$emit('tab-selected', 'MODELNAME')">
                  <v-list-item-content>
                    <v-list-item-title>Bike Model</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                  <!-- <v-list-item @click="$emit('tab-selected', 'BILL')">
                    <v-list-item-title>Bills</v-list-item-title>
                  </v-list-item> -->
              </v-list-group>

              <!-- spares parts submenu -->
              <v-list-group prepend-icon="mdi-account" no-action>
                <template v-slot:activator>
                  <v-list-item-title>Spares</v-list-item-title>
                </template>

                <v-list-item @click="$emit('tab-selected', 'ADDSPARES')">
                  <v-list-item-content>
                    <v-list-item-title>Add Spares</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item @click="$emit('tab-selected', 'sparesTable')">
                  <v-list-item-content>
                    <v-list-item-title>Spares Table</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-group>

            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider class="my-2"></v-divider>

      <div  v-if="permission && permission.admin">
        <!-- Admin: show only if permission.admin is true -->
        <v-expansion-panels
          v-model="panels.admin"
          accordion
          class="exp-panels"
        >
          <v-expansion-panel>
            <v-expansion-panel-header class="panel-header">
              <v-icon left class="header-icon">mdi-cube</v-icon>
              <span class="header-text">Admin</span>
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <v-list dense>
                <!-- Client submenu -->
                <v-list-group prepend-icon="mdi-account" no-action>
                  <template v-slot:activator>
                    <v-list-item-title>Client</v-list-item-title>
                  </template>

                  <v-list-item @click="$emit('tab-selected', 'Addclient')">
                    <v-list-item-content>
                      <v-list-item-title>Add Client</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item @click="$emit('tab-selected', 'ClientTable')">
                    <v-list-item-content>
                      <v-list-item-title>Client Table</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-group>

                <!-- Employee submenu -->
                <v-list-group prepend-icon="mdi-account-group" no-action>
                  <template v-slot:activator>
                    <v-list-item-title>Employee</v-list-item-title>
                  </template>

                  <v-list-item @click="$emit('tab-selected', 'Addemployee')">
                    <v-list-item-content>
                      <v-list-item-title>Add Employee</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item @click="$emit('tab-selected', 'EmployeeTable')">
                    <v-list-item-content>
                      <v-list-item-title>Employee Table</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-group>

                <!-- <v-list-group prepend-icon="mdi-warehouse" no-action>
                  <template v-slot:activator>
                    <v-list-item-title>Inventory</v-list-item-title>
                  </template>

                  <v-list-item @click="$emit('tab-selected', 'AddInventryVue')">
                    <v-list-item-content>
                      <v-list-item-title>Add Inventory</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item @click="$emit('tab-selected', 'InventryTable')">
                    <v-list-item-content>
                      <v-list-item-title>Inventory Table</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item @click="$emit('tab-selected', 'MODELNAME')">
                    <v-list-item-content>
                      <v-list-item-title>Model Name</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                </v-list-group> -->
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-divider class="my-2"></v-divider>
      </div>

      <div  v-if="permission && permission.sales">
      <!-- Sales: show only if permission.sales -->
      <v-expansion-panels
       
        v-model="panels.sales"
        accordion
        class="exp-panels"
      >
        <v-expansion-panel>
          <v-expansion-panel-header class="panel-header">
            <v-icon left class="header-icon">mdi-cart</v-icon>
            <span class="header-text">Sales</span>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>Sales</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Sales Orders</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Delivery Notes</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Sales Returns</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider class="my-2"></v-divider>
      </div>

      <div v-if="permission && permission.rto">
      <!-- RTO -->
      <v-expansion-panels
        v-if="permission && permission.rto"
        v-model="panels.rto"
        accordion
        class="exp-panels"
      >
        <v-expansion-panel>
          <v-expansion-panel-header class="panel-header">
            <v-icon left class="header-icon">mdi-truck</v-icon>
            <span class="header-text">RTO</span>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>Dashboard</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Detail</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider class="my-2"></v-divider>

      </div>

      <div  v-if="false">
      <!-- Insurance -->
      <v-expansion-panels
       
        v-model="panels.insurance"
        accordion
        class="exp-panels"
      >
        <v-expansion-panel>
          <v-expansion-panel-header class="panel-header">
            <v-icon left class="header-icon">mdi-settings-box</v-icon>
            <span class="header-text">Insurance</span>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>Dashboard</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Detail</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      </div>

    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: "SidebarDrawer",
  data() {
    return {
      activePanel: null,
      panels: {
        admin: null,
        sales: null,
        rto: null,
        insurance: null
      },
      // put these at root so template can access them directly
      userPermissions: null,
      permission: null
    };
  },
  computed: {
    // helper to show permission JSON in template for debugging
    permissionDisplay() {
      return this.permission ? JSON.stringify(this.permission) : "null";
    }
  },
  methods: {
    getLocalStorage() {
      try {
        const raw = localStorage.getItem("auth_user");
        if (!raw) {
          this.userPermissions = null;
          this.permission = null;
          return;
        }

        const parsed = JSON.parse(raw);
        this.userPermissions = parsed || null;

        // nested permission object often lives at parsed.userPermissions
        this.permission = (parsed && parsed.userPermissions) ? parsed.userPermissions : null;

        // log for debugging
        console.log("userPermissions", this.userPermissions);
        console.log("permission", this.permission);
      } catch (err) {
        console.error("Failed to parse auth_user from localStorage", err);
        this.userPermissions = null;
        this.permission = null;
      }
    }
  },
  mounted() {
    this.getLocalStorage();

    // optional: if auth_user may change during app lifecycle, listen to storage events
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_user") this.getLocalStorage();
    });
  }
};
</script>


<style scoped>
/* Drawer styling */
.app-drawer {
  width: 100%; /* fixed width */
  background: linear-gradient(to bottom, #040891 0%, #02356f 100%);
  border-right: 1px solid rgba(0,0,0,0.06);
  color: #1f2d3d;
}

/* Brand */
.brand-row {
  align-items: center;  
  padding: 8px 0;
  border-bottom:1px solid white;
}
.brand-title {
  font-weight: 700;
  font-size: 2rem;
  color: #0d47a1;
}

/* Expansion panels wrapper */
.exp-panels {
  background: transparent;
  box-shadow: none;
}

/* Panel header */
.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px !important;
  border-radius: 8px;
  transition: background 0.18s ease, border-left 0.18s ease;
}

/* Icon in header */
.header-icon {
  color: #040891;
  margin-right: 8px;
}

/* Header text */
.header-text {
  font-weight: 600;
  color: #123a66;
}

/* Active expansion panel header highlight
   Vuetify adds .v-expansion-panel--active to the panel element; we style the header inside it.
*/
.v-expansion-panel--active > .v-expansion-panel__header {
  background: linear-gradient(90deg, rgba(6, 124, 241, 0.06), rgba(34, 141, 199, 0.03));
  border-left: 3px solid rgba(25,118,210,0.28);
}

/* List item titles */
.v-list-item-title {
  font-size: 15px;
  color: #123a66;
}

/* Submenu spacing and card-like feel */
.v-list-group__items {
  padding-left: 8px;
  margin-top: 6px;
  margin-bottom: 8px;
}

/* Make icons inside list-group slightly darker */
.v-list-item .v-icon {
  color: rgba(18,58,102,0.85);
}

/* small responsive tweak */
/* @media (max-width: 960px) {
  .app-drawer {
    width: 260px;
  }
} */

</style>

