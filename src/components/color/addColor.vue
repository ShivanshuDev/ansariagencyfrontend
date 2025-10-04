<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <!-- Form card -->
        <v-card class="pa-4">
          <v-card-title>
            {{ editing ? "Update Color" : "Add New Color" }}
          </v-card-title>

          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="form.colorName"
                :rules="[rules.required, rules.min3]"
                label="Color Name"
                required
                outlined
                dense
              />
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn text @click="onReset" :disabled="loading">Reset</v-btn>

            <v-btn
              color="primary"
              :loading="loading"
              @click="onSubmit"
            >
              {{ editing ? "Update Color" : "Add Color" }}
            </v-btn>

            <v-btn
              v-if="editing"
              text
              @click="cancelEdit"
              :disabled="loading"
            >
              Cancel Edit
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-snackbar v-model="snackbar.visible" :timeout="3500">
          {{ snackbar.message }}
          <template v-slot:action>
            <v-btn text @click="snackbar.visible = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-col>

      <v-col cols="12" md="6">
        <!-- Table card -->
        <v-card class="pa-4">
          <v-card-title>
            Colors
            <v-spacer />
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              dense
              style="max-width: 240px"
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="displayColors"
            :search="search"
            :items-per-page="10"
            class="elevation-1"
            dense
          >
            <template v-slot:item.colorName="{ item }">
              {{ displayColorLabel(item) }}
            </template>

            <template v-slot:no-data>
              No colors found.
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "AddColorManager",
  data() {
    return {
      // form state
      form: {
        colorName: "",
      },
      valid: false,
      loading: false,
      // table & search
      colors: [], // raw items from API
      search: "",
      headers: [
        { text: "Color Name", value: "colorName", sortable: true },
        { text: "Actions", value: "actions", sortable: false, align: "end" }
      ],
      // editing
      editing: false,
      originalColorName: "",

      snackbar: {
        visible: false,
        message: ""
      },

      // validation rules
      rules: {
        required: v => !!v || "This field is required",
        min3: v => (v && v.length >= 3) || "Minimum 3 characters"
      },

      // endpoints (change if needed)
      endpoints: {
        getColors: process.env.VUE_APP_AGENCY_BACKEND_URL+"getColor",
        addColor: process.env.VUE_APP_AGENCY_BACKEND_URL+"addColor",
        updateColorBase: process.env.VUE_APP_AGENCY_BACKEND_URL+"updateColor"
      }
    };
  },
  computed: {
    displayColors() {
      return this.colors.map(c => {
        if (typeof c === "string") {
          return { colorName: c, __raw: c };
        }
        return {
          colorName: c.colorName ?? c.name ?? c.label ?? "",
          __raw: c
        };
      });
    }
  },
  mounted() {
    this.fetchColors();
  },
  methods: {
    async fetchColors() {
      try {
        const res = await axios.get(this.endpoints.getColors);
        if (Array.isArray(res.data)) {
          this.colors = res.data;
        } else if (res.data && Array.isArray(res.data.colors)) {
          this.colors = res.data.colors;
        } else {
          console.warn("Unexpected /getColor response shape:", res.data);
          this.colors = [];
        }
      } catch (err) {
        console.error("Failed to fetch colors:", err);
        this.colors = [];
        this.showSnackbar("Failed to fetch colors");
      }
    },

    async addColor(payload) {
      const res = await axios.post(this.endpoints.addColor, payload);
      return res.data;
    },

    async updateColor(oldName, payload) {
      let data = {};
      data['oldColorName'] = oldName
      data['newColorName'] = payload.colorName
      console.log('oldName', oldName)
      console.log('payload', payload)
      console.log('data', data)
      const url = `${this.endpoints.updateColorBase}}`;
      const res = await axios.post(url, data);
      return res.data;
    },

    displayColorLabel(item) {
      return item.colorName;
    },

    showSnackbar(msg) {
      this.snackbar.message = msg;
      this.snackbar.visible = true;
    },

    async onSubmit() {
      const formRef = this.$refs.form;
      if (formRef) {
        const ok = await formRef.validate();
        if (!ok) return;
      }

      const payload = {
        colorName: this.form.colorName.trim()
      };

      this.loading = true;
      try {
        if (this.editing) {
          await this.updateColor(this.originalColorName, payload);
          this.showSnackbar("Color updated successfully");
        } else {
          await this.addColor(payload);
          this.showSnackbar("Color added successfully");
        }
        await this.fetchColors();
        this.onReset();
      } catch (err) {
        console.error("Add/Update error:", err);
        const msg = err?.response?.data?.message || err.message || "Operation failed";
        this.showSnackbar(msg);
      } finally {
        this.loading = false;
      }
    },

    onReset() {
      this.form.colorName = "";
      this.editing = false;
      this.originalColorName = "";
      if (this.$refs.form) this.$refs.form.resetValidation();
    },

    cancelEdit() {
      this.onReset();
    },

    onEdit(item) {
      this.editing = true;
      this.form.colorName = item.colorName;
      this.originalColorName = item.colorName;
      this.$nextTick(() => {
        const el = this.$el.querySelector('input[name="colorName"]');
        if (el) el.focus();
      });
    }
  }
};
</script>
