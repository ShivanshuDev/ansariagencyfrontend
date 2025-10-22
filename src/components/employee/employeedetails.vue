<template>
  <v-card
    outlined
    max-width="1200"
    class="mx-auto my-0 pa-0 employee-detail-card"
    elevation="10"
  >
    <!-- Header / Identity -->
    <div class="card-hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <v-avatar size="72" class="mr-4 hero-avatar" :class="!employee.avatarUrl && 'avatar-fallback'">
            <template v-if="employee.avatarUrl">
              <v-img :src="employee.avatarUrl" :alt="employee.employeeName || 'Employee'"></v-img>
            </template>
            <template v-else>
              <span class="initials">{{ initials }}</span>
            </template>
          </v-avatar>

          <div class="hero-meta">
            <div class="hero-name">
              {{ employee.employeeName || '—' }}
              <v-chip v-if="employee?.userId" small class="ml-2 chip-id" label>
                {{ employee.userId }}
              </v-chip>
              <v-chip v-else-if="employee?.venderId" small class="ml-2 chip-id" label>
                {{ employee.venderId }}
              </v-chip>
            </div>

            <div class="hero-sub grey--text text--lighten-3">
              {{ subtitle }}
            </div>
          </div>
        </div>

        <div class="hero-right">
          <v-chip class="ma-1" small label color="#ffffff10" text-color="white">
            <v-icon left small>mdi-shield-account</v-icon>
            {{ employee.employeeRole || 'Role —' }}
          </v-chip>
          <v-chip class="ma-1" small label color="#ffffff10" text-color="white">
            <v-icon left small>mdi-domain</v-icon>
            {{ employee.department || 'Department —' }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Body -->
    <v-card-text class="pa-6">
      <v-row>
        <!-- Contact -->
        <v-col cols="12" md="6">
          <div class="section-card">
            <div class="section-title">
              <v-icon class="mr-2" small>mdi-card-account-phone</v-icon>
              Contact
            </div>

            <v-list dense two-line class="transparent-list">
              <v-list-item>
                <v-list-item-avatar tile class="li-icon">
                  <v-icon color="primary">mdi-email</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>
                    <a
                      v-if="employee.email"
                      class="link"
                      :href="`mailto:${employee.email}`"
                    >{{ employee.email }}</a>
                    <span v-else>—</span>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action v-if="employee.email">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn icon v-on="on" @click="copy(employee.email)">
                        <v-icon small>mdi-content-copy</v-icon>
                      </v-btn>
                    </template>
                    <span>Copy email</span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>

              <v-list-item>
                <v-list-item-avatar tile class="li-icon">
                  <v-icon color="primary">mdi-phone</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>Phone</v-list-item-title>
                  <v-list-item-subtitle>
                    <a
                      v-if="employee.phone"
                      class="link"
                      :href="`tel:${employee.phone}`"
                    >{{ employee.phone }}</a>
                    <span v-else>—</span>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action v-if="employee.phone">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn icon v-on="on" @click="copy(employee.phone)">
                        <v-icon small>mdi-content-copy</v-icon>
                      </v-btn>
                    </template>
                    <span>Copy phone</span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>

              <v-list-item>
                <v-list-item-avatar tile class="li-icon">
                  <v-icon color="primary">mdi-identifier</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>Password</v-list-item-title>
                  <v-list-item-subtitle>{{ employee.password || '—' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-col>

        <!-- Permissions -->
        <v-col cols="12" md="6">
          <div class="section-card">
            <div class="section-title">
              <v-icon class="mr-2" small>mdi-lock-check</v-icon>
              Permissions
            </div>

            <div class="chip-wrap">
              <template v-if="Object.keys(permissionEntries).length">
                <v-chip
                  v-for="(val, key) in permissionEntries"
                  :key="key"
                  class="ma-1 perm-chip"
                  small
                  :color="chipColor(val)"
                  :text-color="chipText(val)"
                  label
                >
                  <v-icon left small>{{ chipIcon(val) }}</v-icon>
                  {{ prettifyKey(key) }}: {{ labelFor(val) }}
                </v-chip>
              </template>
              <div v-else class="empty-hint grey--text text--darken-1">
                No permissions configured.
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Addresses -->
      <div class="section-split-title">
        <span>Addresses</span>
      </div>
      <v-row>
        <v-col cols="12" md="12">
          <div class="section-card subtle">
            <div class="section-title">
              <v-icon class="mr-2" small>mdi-home-map-marker</v-icon>
              Current Address
            </div>
            <div v-if="employee.currentAddress" class="kv-grid">
              <div class="kv"><b>{{ employee.currentAddress.name || employee.currentAddress.employeeName || '—' }}, {{ employee.currentAddress.line1 || '—' }}, {{ employee.currentAddress.line2 || '—' }}, {{ employee.currentAddress.city || '—' }}, {{ employee.currentAddress.tahsil || '—' }}, {{ employee.currentAddress.state || '—' }}, {{ employee.currentAddress.pincode || '—' }}, {{ employee.currentAddress.country || '—' }}</b></div>
             
            </div>
            <div v-else class="empty-hint">No current address available.</div>
          </div>
        </v-col>
      </v-row>

      <!-- Bank -->
      <div class="section-split-title">
        <span>Bank Details</span>
      </div>
      <div class="section-card glass">
        <v-row v-if="employee.bank">
          <v-col cols="12" sm="4" class="kv-line">
            <v-icon small class="mr-2">mdi-bank</v-icon>
            <span class="kv-label">Bank Name</span>
            <span class="kv-value">{{ employee.bank.bankName || '—' }}</span>
          </v-col>
          <v-col cols="12" sm="4" class="kv-line">
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            <span class="kv-label">Branch</span>
            <span class="kv-value">{{ employee.bank.branch || '—' }}</span>
          </v-col>
          <v-col cols="12" sm="4" class="kv-line">
            <v-icon small class="mr-2">mdi-form-textbox-password</v-icon>
            <span class="kv-label">IFSC</span>
            <span class="kv-value mono">{{ employee.bank.ifsc || '—' }}</span>
            <v-spacer></v-spacer>
            <v-btn v-if="employee.bank.ifsc" small text @click="copy(employee.bank.ifsc)">Copy</v-btn>
          </v-col>

          <v-col cols="12" sm="6" class="kv-line">
            <v-icon small class="mr-2">mdi-account</v-icon>
            <span class="kv-label">Account Holder</span>
            <span class="kv-value">{{ employee.bank.accountHolder || '—' }}</span>
          </v-col>
          <v-col cols="12" sm="6" class="kv-line">
            <v-icon small class="mr-2">mdi-credit-card-chip</v-icon>
            <span class="kv-label">Account Number</span>
            <span class="kv-value mono">{{ maskedAccount }}</span>
            <v-spacer></v-spacer>
            <v-btn
              v-if="employee.bank.accountNumber"
              small
              text
              @click="copy(employee.bank.accountNumber)"
            >
              Copy
            </v-btn>
          </v-col>
        </v-row>
        <div v-else class="empty-hint">No bank details available.</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    name: 'EmployeeDetailPro',
    props: {
      employee: {
        type: Object,
        required: true
      }
    },
    computed: {
      permissionEntries() {
        const up = this.employee?.userPermissions || {};
        // keep original key order if possible
        return Object.keys(up).reduce((acc, k) => {
          acc[k] = up[k];
          return acc;
        }, {});
      },
      initials() {
        const name = (this.employee?.employeeName || '').trim();
        if (!name) return '—';
        const parts = name.split(/\s+/).slice(0, 2);
        return parts.map(p => p[0]?.toUpperCase()).join('');
      },
      subtitle() {
        const email = this.employee?.email;
        const phone = this.employee?.phone;
        if (email && phone) return `${email} • ${phone}`;
        return email || phone || '—';
      },
      maskedAccount() {
        const acct = this.employee?.bank?.accountNumber;
        if (!acct) return '—';
        const s = String(acct);
        if (s.length <= 4) return s;
        return '•••• ' + s.slice(-4);
      },
      lastUpdated() {
        // if your object contains updatedAt, prefer that
        const updated = this.employee?.updatedAt || this.employee?.lastModified;
        if (!updated) return '—';
        try {
          const d = new Date(updated);
          return isNaN(d.getTime()) ? String(updated) : d.toLocaleString();
        } catch {
          return String(updated);
        }
      }
    },
    methods: {
      prettifyKey(k) {
        return k
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, m => m.toUpperCase());
      },
      labelFor(v) {
        if (v === true) return 'Yes';
        if (v === false) return 'No';
        return String(v);
      },
      chipIcon(v) {
        if (v === true) return 'mdi-check-circle';
        if (v === false) return 'mdi-cancel';
        return 'mdi-help-circle';
        // could add mdi-timer-sand for pending states if needed
      },
      chipColor(v) {
        if (v === true) return 'green lighten-4';
        if (v === false) return 'red lighten-4';
        return 'grey lighten-3';
      },
      chipText(v) {
        if (v === true) return 'green darken-2';
        if (v === false) return 'red darken-2';
        return 'grey darken-2';
      },
      async copy(text) {
        try {
          await navigator.clipboard.writeText(text);
          this.$emit('copied', text);
        } catch (e) {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          this.$emit('copied', text);
        }
      }
    }
  };
</script>

<style scoped>
/* ===== Card Shell ===== */
.employee-detail-card {
  font-family: 'Inter', 'Roboto', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: saturate(1.1);
  transition: box-shadow .25s ease, transform .25s ease;
}
.employee-detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0,0,0,.08), 0 10px 10px rgba(0,0,0,.04) !important;
}

/* ===== Hero / Header ===== */
.card-hero {
  border:1px solid green;
  position: relative;
  background: radial-gradient(1200px 320px at 10% -10%, #5a62f2 10%, #3a3ee0 40%, #24264f 100%);
  min-height: 120px;
  display: flex;
  align-items: flex-end;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(240px 80px at 80% 10%, rgba(255,255,255,.20) 0, rgba(255,255,255,0) 60%),
    radial-gradient(300px 120px at 10% 90%, rgba(255,255,255,.15) 0, rgba(255,255,255,0) 70%);
  pointer-events: none;
}
.hero-content {
  position: relative;
  z-index: 1;
  color: white;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 18px 24px;
}
.hero-left {
  display: flex;
  align-items: center;
}
.hero-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}
.hero-avatar {
  border: 3px solid rgba(255,255,255,.35);
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
}
.avatar-fallback {
  background: linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.08));
  color: white;
}
.initials {
  font-weight: 700;
  font-size: 22px;
  letter-spacing: .5px;
}
.hero-meta { display: flex; flex-direction: column; }
.hero-name {
  font-weight: 800;
  font-size: 1.35rem;
  line-height: 1.15;
  display: flex;
  align-items: center;
}
.hero-sub { font-size: .95rem; opacity: .9; }
.chip-id {
  background: rgba(255,255,255,.10) !important;
  color: #fff !important;
  border: 1px solid rgba(255,255,255,.25);
}

/* ===== Sections ===== */
.section-title {
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 8px;
  color: #1f2440;
}
.section-card {
  background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.75));
  border: 1px solid rgba(9, 12, 69, 0.06);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 22px rgba(31,36,64,.04);
}
.section-card.subtle {
  background: linear-gradient(180deg, rgba(250,250,255,.82), rgba(255,255,255,.74));
}
.section-card.glass {
  background: rgba(255,255,255,.65);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

/* Transparent list look */
.transparent-list {
  background: transparent !important;
}
.li-icon {
  background: #f2f4ff;
  border-radius: 10px;
}

/* Split title line */
.section-split-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #20244f;
  font-weight: 800;
  margin: 22px 2px 12px;
}
.section-split-title::before,
.section-split-title::after {
  content: "";
  flex: 1 1 0%;
  height: 1px;
  background: linear-gradient(90deg, rgba(32,36,79,.25), rgba(32,36,79,0));
}
.section-split-title::before { background: linear-gradient(90deg, rgba(32,36,79,0), rgba(32,36,79,.25)); }

/* Grid KVs */
.kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 8px 14px;
}
.kv {
  display: flex;
  justify-content: space-between;
  font-size: .94rem;
  padding: 8px 10px;
  border: 1px dashed rgba(32,36,79,.10);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.65));
}
.kv > span { color: #4a4f7a; }
.kv > b { color: #161a36; }

/* Inline KV lines for bank */
.kv-line {
  display: flex;
  align-items: center;
  font-size: .96rem;
  border: 1px solid rgba(32,36,79,.06);
  background: rgba(255,255,255,.7);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.kv-label { color: #4a4f7a; margin-right: 8px; }
.kv-value { color: #111532; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace; }

/* Chips */
.perm-chip {
  border: 1px solid rgba(0,0,0,.06);
}
.chip-wrap { display: flex; flex-wrap: wrap; }
.empty-hint { font-size: .92rem; padding: 6px 2px; }

/* Footer */
.card-footer {
  background: linear-gradient(180deg, #ffffff, #fbfbff);
}
.muted { color: #6b6f93; font-size: .92rem; }

/* Links */
.link {
  color: #3A3EE0;
  text-decoration: none;
  border-bottom: 1px dotted rgba(58,62,224,.35);
}
.link:hover { opacity: .85; }

/* Responsive */
@media (max-width: 600px) {
  .hero-content { padding: 16px; flex-direction: column; align-items: flex-start; }
  .hero-right { margin-top: 6px; justify-content: flex-start; }
  .kv-grid { grid-template-columns: 1fr; }
}
</style>
