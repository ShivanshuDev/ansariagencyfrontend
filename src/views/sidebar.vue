<template>
  <v-navigation-drawer 
    app 
    permanent 
    class="app-drawer" 
    style="width: 300px;"
    clipped
  >
    <!-- Brand Header -->
    <div class="brand-container">
      <div class="brand-logo">
        <v-icon class="logo-icon" color="white">mdi-car</v-icon>
      </div>
      <div class="brand-text">
        <div class="brand-title">ANSARI AUTOMOBILES</div>
        <div class="brand-subtitle">Vehicle Solutions</div>
      </div>
    </div>

    <v-divider class="divider-primary"></v-divider>

    <!-- Navigation Sections -->
    <v-list dense class="drawer-list">
      <!-- Super Admin Section -->
      <v-list-group
        v-model="superAdminOpen"
        prepend-icon="mdi-shield-account"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">Super Admin</v-list-item-title>
          </v-list-item-content>
        </template>

        <!-- Vendor Submenu -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Vendor</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'Addclient')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Vendor</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ClientTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Vendor Details</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Employee Submenu -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Employee</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'Addemployee')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Employee</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'EmployeeTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Employee Table</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list-group>

      <!-- Admin Section (permission based) -->
      <v-list-group
        v-if="permission && permission.admin"
        v-model="adminOpen"
        prepend-icon="mdi-cog"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">Admin</v-list-item-title>
          </v-list-item-content>
        </template>

        <!-- Invoice Process -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Invoice Process</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'SellToVendor')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-cash-register</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Vendor Billing</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Inventory -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Inventory</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'InventryTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Inventory Details</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'AddInventryVue')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Inventory</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'MODELNAME')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-motorbike</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Bike Model</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Vendor -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Vendor</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'Addclient')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Vendor</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ClientTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Vendor Details</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Employee -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Employee</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'Addemployee')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Employee</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'EmployeeTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Employee Table</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list-group>

      <!-- Workshop Section (permission based) -->
      <v-list-group
        v-if="permission && permission.admin"
        v-model="workshopOpen"
        prepend-icon="mdi-wrench"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">Workshop</v-list-item-title>
          </v-list-item-content>
        </template>

        <!-- Spares -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Spares</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ADDSPARES')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Add Spares</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'sparesTable')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Spares Table</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Services -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Services</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ServiceRequests')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-clipboard-list</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Service Requests</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ServiceHistory')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-history</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Service History</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list-group>

      <!-- Sales Section (permission based) -->
      <v-list-group
        v-if="permission && permission.sales"
        v-model="salesOpen"
        prepend-icon="mdi-cart"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">Sales</v-list-item-title>
          </v-list-item-content>
        </template>

        <v-list-item link class="nav-item">
          <v-list-item-icon class="nav-icon">
            <v-icon small>mdi-sale</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="item-title">Sales</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item link class="nav-item">
          <v-list-item-icon class="nav-icon">
            <v-icon small>mdi-format-list-bulleted</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="item-title">Sales Orders</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item link class="nav-item">
          <v-list-item-icon class="nav-icon">
            <v-icon small>mdi-truck-delivery</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="item-title">Delivery Notes</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item link class="nav-item">
          <v-list-item-icon class="nav-icon">
            <v-icon small>mdi-arrow-u-left-top</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="item-title">Sales Returns</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-group>

      <!-- Accounts Section -->
      <v-list-group
        v-model="accountsOpen"
        prepend-icon="mdi-calculator"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">Accounts</v-list-item-title>
          </v-list-item-content>
        </template>

        <!-- LEDGER -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">LEDGER</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'LEDGERENTRY')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-eye</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">View Ledger Entries</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'ADDENTRY')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-plus-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Vendor Deposit Amount</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'CLIENTSUMMERY')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-chart-bar</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Client Summary</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'DAYBOOK')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-book-open-page-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">DAY Book</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'PaymentReceipt')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-receipt</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Payment Receipt</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list-group>

      <!-- SALES (RTO etc.) Section -->
      <v-list-group
        v-model="rtoOpen"
        prepend-icon="mdi-file-document-multiple"
        color="white"
        class="nav-section"
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title class="section-title">SALES</v-list-item-title>
          </v-list-item-content>
        </template>

        <!-- RTO & INS Details -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">RTO & INS Details</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'RTODetails')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-card-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">RTO & INS Detail Updation</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Invoices -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Invoices</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'AllCustomerInvoices')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">All Customer Invoices Details</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'QUICKINVOICE')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-receipt</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Quick Invoice</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Payments -->
        <v-list-group
          value="true"
          sub-group
          class="submenu"
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="submenu-title">Payments</v-list-item-title>
            </v-list-item-content>
          </template>
          
          <v-list-item 
            link 
            @click="$emit('tab-selected', 'PaymentReceipt')"
            class="nav-item"
          >
            <v-list-item-icon class="nav-icon">
              <v-icon small>mdi-receipt</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="item-title">Payment Receipt</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: "SidebarDrawer",
  data() {
    return {
      // Track open/closed state for each section
      superAdminOpen: false,
      adminOpen: false,
      workshopOpen: false,
      salesOpen: false,
      accountsOpen: false,
      rtoOpen: false,
      
      // permissions
      userPermissions: null,
      permission: null
    };
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
        this.permission = (parsed && parsed.userPermissions) ? parsed.userPermissions : null;
      } catch (err) {
        console.error("Failed to parse auth_user from localStorage", err);
        this.userPermissions = null;
        this.permission = null;
      }
    }
  },

  mounted() {
    this.getLocalStorage();
    // If auth changes elsewhere (new tab), sync
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_user") this.getLocalStorage();
    });
  }
};
</script>

<style scoped>
/* Main Container */
.app-drawer {
  background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #303f9f 100%);
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.15);
}

/* Brand Section */
.brand-container {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-right: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo-icon {
  font-size: 28px;
}

.brand-text {
  flex: 1;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

/* Dividers */
.divider-primary {
  border-color: rgba(255, 255, 255, 0.15) !important;
  margin: 0;
}

/* Navigation List */
.drawer-list {
  background: transparent;
  padding: 8px 0;
}

/* Section Headers */
.nav-section {
  margin: 4px 8px;
  border-radius: 8px;
  overflow: hidden;
}

.nav-section::v-deep .v-list-group__header {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin: 2px 0;
  padding: 0 12px;
  min-height: 44px;
  transition: all 0.3s ease;
}

.nav-section::v-deep .v-list-group__header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-section::v-deep .v-list-group__header.v-list-item--active {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  letter-spacing: 0.3px;
}

/* Submenus */
.submenu {
  margin-left: 8px;
}

.submenu::v-deep .v-list-group__header {
  background: transparent !important;
  min-height: 36px;
  padding: 0 8px;
}

.submenu-title {
  font-weight: 500;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

/* Navigation Items */
.nav-item {
  min-height: 36px;
  padding: 0 16px 0 32px !important;
  margin: 1px 0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.nav-icon {
  margin-right: 12px;
  min-width: 24px !important;
}

.nav-icon .v-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
}

.item-title {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
}

/* Active States */
.nav-item.v-list-item--active {
  background: rgba(255, 255, 255, 0.12);
}

.nav-item.v-list-item--active .item-title {
  color: white;
  font-weight: 500;
}

.nav-item.v-list-item--active .nav-icon .v-icon {
  color: #ffd54f;
}

/* Scrollbar Styling */
.app-drawer ::-webkit-scrollbar {
  width: 6px;
}

.app-drawer ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.app-drawer ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.app-drawer ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Animation for expanding/collapsing */
.v-list-group__items {
  transition: all 0.3s ease;
}

/* Focus states for accessibility */
.nav-item:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
}
</style>