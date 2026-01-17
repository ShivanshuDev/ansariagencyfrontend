<template>
  <v-card
    outlined
    max-width="1860px"
    class="mx-auto my-0 mt-0 pa-4 employee-detail-card"
    elevation="10"
  >
    <!-- Header / Identity -->
    <div class="card-hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <v-avatar
            size="72"
            class="mr-4 hero-avatar"
            :class="!employee.avatarUrl && 'avatar-fallback'"
          >
            <template v-if="employee.avatarUrl">
              <v-img :src="employee.avatarUrl" />
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
            </div>
            <div class="hero-sub grey--text text--lighten-3">
              {{ subtitle }}
            </div>
          </div>
        </div>

        <div class="hero-right">
          <v-chip small label color="#ffffff10" text-color="white">
            <v-icon left small>mdi-shield-account</v-icon>
            {{ employee.employeeRole || 'Role —' }}
          </v-chip>
          <v-chip small label color="#ffffff10" text-color="white">
            <v-icon left small>mdi-domain</v-icon>
            {{ employee.department || 'Department —' }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Body -->
    <v-card-text class="pa-6">
      <v-row>
        <!-- ================= CONTACT (ROW) ================= -->
        <v-col cols="12" md="12">
          <div class="section-card">
            <div class="section-title">
              <v-icon small class="mr-2">mdi-card-account-phone</v-icon>
              Contact
            </div>

            <v-row dense>
              <v-col cols="12" md="4">
                <div class="contact-box">
                  <v-icon small color="primary">mdi-email</v-icon>
                  <div>
                    <div class="label">Email</div>
                    <div class="value">
                      <a v-if="employee.email" class="link" :href="`mailto:${employee.email}`">
                        {{ employee.email }}
                      </a>
                      <span v-else>—</span>
                    </div>
                  </div>
                  <v-spacer />
                  <v-btn icon small v-if="employee.email" @click="copy(employee.email)">
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div class="contact-box">
                  <v-icon small color="primary">mdi-phone</v-icon>
                  <div>
                    <div class="label">Phone</div>
                    <div class="value">
                      <a v-if="employee.phone" class="link" :href="`tel:${employee.phone}`">
                        {{ employee.phone }}
                      </a>
                      <span v-else>—</span>
                    </div>
                  </div>
                  <v-spacer />
                  <v-btn icon small v-if="employee.phone" @click="copy(employee.phone)">
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div class="contact-box">
                  <v-icon small color="primary">mdi-lock</v-icon>
                  <div>
                    <div class="label">Password</div>
                    <div class="value mono">{{ employee.password || '—' }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>

        <!-- ================= PERMISSIONS (IMAGE STYLE) ================= -->
        <v-col cols="12" md="12">
          <div class="section-card">
            <div class="section-title">
              <v-icon small class="mr-2">mdi-lock-check</v-icon>
              Permissions
            </div>

            <v-row dense>
              <v-col
                v-for="(permissions, module) in permissionEntries"
                :key="module"
                cols="12"
                md="3"
              >
                <div class="permission-box">
                  <div class="permission-header">
                    <v-icon left small>mdi-shield</v-icon>
                    {{ prettifyKey(module) }}
                  </div>

                  <div class="permission-body">
                    <v-checkbox
                      v-for="(value, key) in permissions"
                      :key="key"
                      dense
                      hide-details
                      disabled
                      :input-value="value"
                      :label="prettifyKey(key)"
                    />
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>

      <!-- Address -->
      <div class="section-split-title">
        <span>Addresses</span>
      </div>

      <div class="section-card subtle">
        <div class="section-title">
          <v-icon small class="mr-2">mdi-home-map-marker</v-icon>
          Current Address
        </div>
        <div v-if="employee.currentAddress" class="kv">
          <b>
            {{ employee.currentAddress.houseStreet }},
            {{ employee.currentAddress.villageTownCity }},
            {{ employee.currentAddress.district }},
            {{ employee.currentAddress.state }} -
            {{ employee.currentAddress.pincode }}
          </b>
        </div>
      </div>

      <!-- Bank -->
      <div class="section-split-title">
        <span>Bank Details</span>
      </div>

      <div class="section-card glass">
        <v-row v-if="employee.bank">
          <v-col cols="12" sm="4" class="kv-line">
            <span class="kv-label">Bank</span>
            <span class="kv-value">{{ employee.bank.bankName }}</span>
          </v-col>
          <v-col cols="12" sm="4" class="kv-line">
            <span class="kv-label">Branch</span>
            <span class="kv-value">{{ employee.bank.branch }}</span>
          </v-col>
          <v-col cols="12" sm="4" class="kv-line">
            <span class="kv-label">IFSC</span>
            <span class="kv-value mono">{{ employee.bank.ifsc }}</span>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EmployeeDetailPro',
  props: { employee: { type: Object, required: true } },
  computed: {
    permissionEntries() {
      return this.employee?.userPermissions || {}
    },
    initials() {
      return (this.employee?.employeeName || '—')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
    },
    subtitle() {
      return [this.employee?.email, this.employee?.phone].filter(Boolean).join(' • ') || '—'
    }
  },
  methods: {
    prettifyKey(k) {
      return k.replace(/[_-]/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
    },
    async copy(text) {
      await navigator.clipboard.writeText(text)
    }
  }
}
</script>

<style scoped>
.contact-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 12px;
  padding: 10px;
}
.label { font-size: 12px; color: #6b6f93 }
.value { font-weight: 600 }
.mono { font-family: monospace }

.permission-box {
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  overflow: hidden;
}
.permission-header {
  background: linear-gradient(135deg,#3a3ee0,#24264f);
  color: white;
  padding: 8px 12px;
  font-weight: 700;
}
.permission-body { padding: 10px }

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
