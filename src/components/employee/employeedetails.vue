<template>
  <v-card outlined max-width="700" class="mx-auto my-4 employee-detail-card" elevation="2">
    <v-card-title class="pa-4 d-flex align-center">
      <v-avatar size="56" class="mr-4" v-if="employee.avatarUrl">
        <v-img :src="employee.avatarUrl"></v-img>
      </v-avatar>
      <div>
        <div class="headline font-weight-bold">{{ employee.employeeName || '—' }}</div>
        <div class="subheading grey--text text--darken-1">
          {{ employee.userId || employee.venderId || '' }}
        </div>
      </div>
      <v-spacer />
      <div class="text-right">
        <div><strong>Role:</strong> {{ employee.employeeRole || '-' }}</div>
        <div><strong>Department:</strong> {{ employee.department || '-' }}</div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-row>
        <!-- Contact Info -->
        <v-col cols="12" md="6">
          <v-list dense two-line>
            <v-list-item>
              <v-list-item-icon><v-icon color="primary">mdi-email</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>{{ employee.email || '-' }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-icon><v-icon color="primary">mdi-phone</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Phone</v-list-item-title>
                <v-list-item-subtitle>{{ employee.phone || '-' }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-icon><v-icon color="primary">mdi-account-box</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Vendor ID</v-list-item-title>
                <v-list-item-subtitle>{{ employee.venderId || '-' }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-col>

        <!-- Permissions -->
        <v-col cols="12" md="6">
          <div class="mb-2 font-weight-medium" style="font-size: 1.1rem;">Permissions</div>
          <v-chip-group column>
            <v-chip
              v-for="(val, key) in permissionEntries"
              :key="key"
              class="ma-1"
              small
              :color="val === true ? 'green lighten-3' : val === false ? 'red lighten-4' : 'grey lighten-3'"
            >
              <v-icon left small :color="val === true ? 'green darken-1' : val === false ? 'red darken-1' : 'grey darken-1'">
                {{ val === true ? 'mdi-check-circle' : val === false ? 'mdi-cancel' : 'mdi-help-circle' }}
              </v-icon>
              {{ key }}: {{ val === true ? 'Yes' : val === false ? 'No' : String(val) }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <!-- Address Section -->
      <v-row>
        <v-col cols="12" md="6">
          <h4 class="mb-2 font-weight-medium">Current Address</h4>
          <div v-if="employee.currentAddress" class="address-block">
            <p><strong>Name:</strong> {{ employee.currentAddress.name || '-' }}</p>
            <p><strong>Line1:</strong> {{ employee.currentAddress.line1 || '-' }}</p>
            <p><strong>Line2:</strong> {{ employee.currentAddress.line2 || '-' }}</p>
            <p><strong>City:</strong> {{ employee.currentAddress.city || '-' }}</p>
            <p><strong>Tahsil:</strong> {{ employee.currentAddress.tahsil || '-' }}</p>
            <p><strong>State:</strong> {{ employee.currentAddress.state || '-' }}</p>
            <p><strong>Pincode:</strong> {{ employee.currentAddress.pincode || '-' }}</p>
            <p><strong>Country:</strong> {{ employee.currentAddress.country || '-' }}</p>
          </div>
          <div v-else class="grey--text text--lighten-1">No current address available.</div>
        </v-col>

        <v-col cols="12" md="6">
          <h4 class="mb-2 font-weight-medium">Permanent Address</h4>
          <div v-if="employee.permanentAddress" class="address-block">
            <p><strong>Name:</strong> {{ employee.permanentAddress.name || '-' }}</p>
            <p><strong>Line1:</strong> {{ employee.permanentAddress.line1 || '-' }}</p>
            <p><strong>Line2:</strong> {{ employee.permanentAddress.line2 || '-' }}</p>
            <p><strong>City:</strong> {{ employee.permanentAddress.city || '-' }}</p>
            <p><strong>Tahsil:</strong> {{ employee.permanentAddress.tahsil || '-' }}</p>
            <p><strong>State:</strong> {{ employee.permanentAddress.state || '-' }}</p>
            <p><strong>Pincode:</strong> {{ employee.permanentAddress.pincode || '-' }}</p>
            <p><strong>Country:</strong> {{ employee.permanentAddress.country || '-' }}</p>
          </div>
          <div v-else class="grey--text text--lighten-1">No permanent address available.</div>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <!-- Bank Information -->
      <div>
        <h4 class="mb-3 font-weight-medium">Bank Details</h4>
        <v-row v-if="employee.bank">
          <v-col cols="12" sm="4"><strong>Bank Name:</strong> {{ employee.bank.bankName || '-' }}</v-col>
          <v-col cols="12" sm="4"><strong>Branch:</strong> {{ employee.bank.branch || '-' }}</v-col>
          <v-col cols="12" sm="4"><strong>IFSC:</strong> {{ employee.bank.ifsc || '-' }}</v-col>
          <v-col cols="12" sm="6"><strong>Account Holder:</strong> {{ employee.bank.accountHolder || '-' }}</v-col>
          <v-col cols="12" sm="6"><strong>Account Number:</strong> {{ employee.bank.accountNumber || '-' }}</v-col>
        </v-row>
        <div v-else class="grey--text text--lighten-1">No bank details available.</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EmployeeDetail',
  props: {
    employee: {
      type: Object,
      required: true
    }
  },
  computed: {
    permissionEntries() {
      if (!this.employee.userPermissions) return {};
      return Object.entries(this.employee.userPermissions).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
    }
  }
};
</script>

<style scoped>
.employee-detail-card {
  font-family: 'Roboto', sans-serif;
}

.address-block p {
  margin: 4px 0;
  font-size: 0.9rem;
}

h4 {
  border-bottom: 2px solid #1976d2;
  padding-bottom: 4px;
  margin-bottom: 12px;
  color: #1976d2;
}
</style>
