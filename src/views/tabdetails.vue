<template>
  <div>
    <div class="topBar">
      <div>
        <!-- Top Navbar -->
        <nav class="navbar">
          <div class="navbar-left">
            <!-- Sidebar toggle button -->
            <v-btn
              icon
              class="toggle-btn"
              @click="$emit('toggle-sidebar')"
            >
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </div>

          <div class="navbar-right" ref="navbarRight">
            <!-- Profile Avatar (click opens small dropdown) -->
            <div class="profile-wrapper" ref="profileWrapper">
              <img
                class="avatar"
                src="https://randomuser.me/api/portraits/men/85.jpg"
                alt="Profile"
                @click.stop="toggleProfile"
              />

              <!-- PROFILE DROPDOWN -->
              <div
                class="profile-menu"
                v-if="showProfileMenu"
                @click.stop
              >
                <div class="profile-info">
                  <div class="profile-name">{{ displayName }}</div>
                  <div class="profile-email" v-if="displayEmail">{{ displayEmail }}</div>
                </div>

                <div class="profile-actions">
                  <button class="btn-logout" @click="handleLogout">Logout</button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>

    <div class="bodyDetails">
      <component :is="componentName" />
    </div>
  </div>
</template>

<script>
import Addclient from '@/components/client/addclient.vue';
import Addemployee from '@/components/employee/addemployee.vue';
import AddInventryVue from '@/components/inventry/addInventry.vue';
import ClientTable from '@/components/client/clienttable.vue';
import EmployeeTable from '@/components/employee/employeetable.vue';
import InventryTable from '@/components/inventry/inventryTable.vue';
import MODELNAME from '@/components/modelName/addModelName.vue';
import BILL from '@/components/bill/addbill.vue';
import ADDSPARES from '@/components/spares/addSpares.vue';
import SPARESTABLE from '@/components/spares/sparesTable.vue';
import SellToVendor from '@/components/vendorSell/sellToVendor.vue';
import SellToVendorDetails from '@/components/vendorSell/SellToVendorTable.vue';
import LEDGER from '@/components/ledger/ledgerComponent.vue'
import LEDGERENTRY from '@/components/ledger/AllEntriesTable.vue'
import ADDENTRY from '@/components/ledger/AddEntryForm.vue'
import CLIENTSUMMERY from '@/components/ledger/ClientSummaryCard.vue'
import DAYBOOK from '@/components/ledger/DayBook.vue'
import QUICKINVOICE from '@/components/sales/QuickInvoice.vue'
import AllCustomerInvoices from '@/components/sales/CustomerInvoiceTable.vue'
import RTODetails from '@/components/sales/FinanceAndRto.vue'

export default {
  components:{
    Addclient,
    Addemployee,
    AddInventryVue,
    ClientTable,
    EmployeeTable,
    InventryTable,
    MODELNAME,
    BILL,
    ADDSPARES,
    SPARESTABLE,
    SellToVendor,
    SellToVendorDetails,
    LEDGER,
    LEDGERENTRY,
    ADDENTRY,
    CLIENTSUMMERY,
    DAYBOOK,
    QUICKINVOICE,
    AllCustomerInvoices,
    RTODetails
  },
  props: {
    selectedTab: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      dashboards: ["Dashboard"],
      showProfileMenu: false,
      userObj: this.getStoredUser() // initial
    };
  },
  computed: {
    componentName() {
      if(this.selectedTab === 'Addclient') return 'Addclient';
      if(this.selectedTab === 'Addemployee') return 'Addemployee';
      if(this.selectedTab === 'AddInventryVue') return 'AddInventryVue';
      if(this.selectedTab === 'ClientTable') return 'ClientTable';
      if(this.selectedTab === 'EmployeeTable') return 'EmployeeTable';
      if(this.selectedTab === 'InventryTable') return 'InventryTable';
      if(this.selectedTab === 'MODELNAME') return 'MODELNAME';
      if(this.selectedTab === 'BILL') return 'BILL';
      if(this.selectedTab === 'ADDSPARES') return 'ADDSPARES';
      if(this.selectedTab === 'sparesTable') return 'SPARESTABLE';
      if(this.selectedTab === 'SellToVendor') return 'SellToVendor';
      if(this.selectedTab === 'SellToVendorDetails') return 'SellToVendorDetails';
      if(this.selectedTab === 'LEDGER') return 'LEDGER';
      if(this.selectedTab === 'LEDGERENTRY') return 'LEDGERENTRY';
      if(this.selectedTab === 'ADDENTRY') return 'ADDENTRY';
      if(this.selectedTab === 'CLIENTSUMMERY') return 'CLIENTSUMMERY';
      if(this.selectedTab === 'DAYBOOK') return 'DAYBOOK';
      if(this.selectedTab === 'QUICKINVOICE') return 'QUICKINVOICE';
      if(this.selectedTab === 'AllCustomerInvoices') return 'AllCustomerInvoices';
      if(this.selectedTab === 'RTODetails') return 'RTODetails';
      return null;
    },
    displayName() {
      if (!this.userObj) return 'Guest';
      // try common fields
      return this.userObj.name || this.userObj.username || this.userObj.userName || this.userObj.fullName || 'User';
    },
    displayEmail() {
      if (!this.userObj) return '';
      return this.userObj.email || this.userObj.userEmail || '';
    }
  },
  methods: {
    toggleProfile() {
      this.showProfileMenu = !this.showProfileMenu;
      // refresh stored user in case it changed
      this.userObj = this.getStoredUser();
    },
    handleLogout() {
      // clear auth tokens and user details
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // optionally clear any other auth keys you use
      // localStorage.removeItem('other_key');

      this.showProfileMenu = false;
      this.userObj = null;

      // emit logout to parent so App.vue can switch to Login
      this.$emit('logout');
      window.location.reload();
    },
    getStoredUser() {
      try {
        const raw = localStorage.getItem('auth_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    onDocumentClick(e) {
      // close profile menu when clicking outside the profile wrapper
      const wrapper = this.$refs.profileWrapper;
      if (!wrapper) return;
      if (!wrapper.contains(e.target)) {
        this.showProfileMenu = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.onDocumentClick);
  }
};
</script>

<style scoped>
.topBar{
  height: 6vh;
  /* padding: 2px; */
  width: 100%;
  background-color: #f3efef;
}
.bodyDetails{
  height: 94vh;
  padding: 2px;
  width: 100%;
  background-color: #d6e9e9;
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
}
.bodyDetails::-webkit-scrollbar {
  width: 0px;
  background: transparent; /* Chrome/Safari/Webkit */
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px;
  background: #fff;
  border-bottom: 1px solid #eaeaea;
  min-height: 64px;
}
.navbar-left {
  display: flex;
  align-items: center;
}
.breadcrumb {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}
.breadcrumb li {
  font-size: 16px;
  color: #fff;
}
.breadcrumb li + li:before {
  content: ">";
  margin: 0 8px;
  color: #fff;
}
.breadcrumb a {
  color: #2e49fa;
  text-decoration: none;
}
.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}
.search-bar {
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid #e3e3e3;
  font-size: 14px;
  margin-right: 12px;
}
.navbar-icon {
  font-size: 20px;
  color: #3a3b3c;
  cursor: pointer;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-left: 8px;
  cursor: pointer;
  border: 2px solid #e6e6e6;
  transition: transform .12s ease;
}
.avatar:hover {
  transform: translateY(-2px);
}

/* Profile dropdown menu */
.profile-wrapper {
  position: relative;
  display: inline-block;
}

/* small card below avatar */
.profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 200px;
  background: #ffffff;
  color: #222;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  overflow: hidden;
  z-index: 2000;
  padding: 10px;
}

/* user info */
.profile-info {
  padding: 8px 6px;
  border-bottom: 1px solid #f0f0f0;
}
.profile-name {
  font-weight: 600;
  font-size: 14px;
  color: #0d1b2a;
}
.profile-email {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* actions */
.profile-actions {
  display: flex;
  justify-content: center;
  padding: 10px 6px;
}
.btn-logout {
  background: linear-gradient(90deg,#ff6b6b,#ff3b3b);
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform .08s ease;
}
.btn-logout:hover {
  transform: translateY(-2px);
}
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1a237e;
  color: white;
  padding: 10px 20px;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.toggle-btn {
  color: white !important;
  margin-right: 15px;
}

.breadcrumb {
  list-style: none;
  display: flex;
  gap: 5px;
  color: white;
  margin: 0;
  padding: 0;
}

.breadcrumb li a {
  color: white;
  text-decoration: none;
}

.profile-wrapper {
  position: relative;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
}

.profile-menu {
  position: absolute;
  right: 0;
  background-color: white;
  color: black;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  width: 200px;
  padding: 10px;
  z-index: 1000;
}

.btn-logout {
  width: 100%;
  padding: 6px;
  background-color: #001f3f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
