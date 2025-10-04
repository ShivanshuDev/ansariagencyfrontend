<template>
  <v-container fluid>
    <v-row dense>
      <!-- CATEGORIES -->
      <v-col cols="12" md="3">
        <v-card class="pa-3">
          <v-card-title class="d-flex align-center">
            <div class="headline">Categories</div>
            <v-spacer />
            <v-btn icon small @click="openCategoryDialog('add')"><v-icon>mdi-plus</v-icon></v-btn>
          </v-card-title>

          <v-card-text>
            <v-row align="center" class="mb-2">
              <v-col cols="8" class="pr-1">
                <v-text-field
                  v-model="newCategory"
                  label="New category"
                  dense
                  outlined
                  hide-details
                  @keyup.enter="createCategory"
                  clearable
                />
              </v-col>
              <v-col cols="4" class="pl-1">
                <v-btn :loading="loading" block color="primary" @click="createCategory" :disabled="!newCategory">
                  Add
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-2" />

            <v-list two-line dense class="category-list" >
              <v-list-item
                v-for="(c, idx) in categoriesData"
                :key="c.category || c.name || idx"
                @click="selectCategoryForForm(c)"
                class="category-row" style="border-bottom:1px solid gray;"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ c.category || c.name }}</v-list-item-title>
                  <v-list-item-subtitle v-if="c.count">{{ c.count }} models</v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action style="display:flex; flex-direction:row;">
                  <v-btn icon small @click.stop="openCategoryDialog('edit', c)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon small @click.stop="deleteCategoryConfirm(c)"><v-icon color="red">mdi-delete</v-icon></v-btn>
                </v-list-item-action>
              </v-list-item>

              <v-list-item v-if="!categoriesData || categoriesData.length === 0">
                <v-list-item-content>
                  <v-list-item-title class="text--secondary">No categories yet</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- MODEL FORM (dialog-based trigger) -->
      <v-col cols="12" md="3">
        <v-card class="pa-3">
          <v-card-title>
            <div>{{ editing ? "Update Model" : "Add New Model" }}</div>
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <div class="text--secondary">Open dialog to add or edit a model (edit affects only clicked row).</div>
            <v-divider class="my-3" />
            <div class="caption">Selected category: <strong>{{ form.category || '-' }}</strong></div>
            <v-row class="mt-3">
              <v-col cols="12">
                <v-btn block color="primary" @click="openModelDialog()" :disabled="loading">Open Model Dialog</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.visible" :timeout="3500">
          {{ snackbar.message }}
          <template v-slot:action>
            <v-btn outlined text @click="snackbar.visible = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-col>

      <!-- MODELS TABLE -->
      <v-col cols="12" md="6">
        <v-card class="pa-3">
          <v-card-title>
            <div class="headline">Models</div>
            <v-spacer />
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              dense
              @input="debouncedFilter"
              style="max-width:260px"
              clearable
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredModels"
            :items-per-page="6"
            dense
            class="elevation-1"
            item-key="modelName"
            @click:row="selectModel"
          >
            <template v-slot:item.modelName="{ item }">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ item.modelName }}</div>
                  <div class="caption text--secondary">{{ item.category }}</div>
                </div>
                <div class="text-right">
                  <v-chip small v-if="item.colors && item.colors.length">{{ item.colors.length }} colors</v-chip>
                </div>
              </div>
            </template>

            <template v-slot:item.color="{ item }">
              <div>
                <span v-for="(c,i) in (item.colors||[]).slice(0,3)" :key="`c-${item.modelName}-${i}`">{{ c }}<span v-if="i < Math.min((item.colors||[]).length,3)-1">, </span></span>
                <span v-if="item.colors && item.colors.length > 3">…</span>
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon small :loading="itemLoading[getKey(item.modelName)]" @click.stop="onEdit(item)" :disabled="itemLoading[getKey(item.modelName)]">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>

              <v-btn icon small :loading="itemLoading['del-'+getKey(item.modelName)]" @click.stop="confirmDelete(item)" :disabled="itemLoading['del-'+getKey(item.modelName)]">
                <v-icon color="red">mdi-delete</v-icon>
              </v-btn>
            </template>

            <template v-slot:no-data>
              <v-alert type="info" dense>No models found.</v-alert>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete confirmation dialog (per-item) -->
    <v-dialog v-model="deleteDialog.visible" persistent max-width="420">
      <v-card>
        <v-card-title class="headline">Confirm delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete model "<strong>{{ deleteDialog.item?.modelName }}</strong>"? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="() => (deleteDialog.visible = false)">Cancel</v-btn>
          <v-btn :loading="itemLoading['del-'+getKey(deleteDialog.item?.modelName)]" color="red" @click="() => deleteModel(deleteDialog.item)">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Model dialog (add/edit) -->
    <v-dialog v-model="modelDialog.visible" persistent max-width="680px">
      <v-card>
        <v-card-title>
          <div class="headline">{{ modelDialog.mode === 'edit' ? 'Edit Model' : 'Add Model' }}</div>
        </v-card-title>

        <v-card-text>
          <v-form ref="modelDialogForm" v-model="modelDialog.valid" lazy-validation>
            <v-text-field
              v-model="form.modelName"
              :rules="[rules.required, rules.min3]"
              label="Model Name"
              name="modelName"
              required
              outlined
              dense
            />

            <v-select
              v-model="form.category"
              :items="categoriesData.map(c => c.category || c.name)"
              label="Category"
              dense
              outlined
              :rules="[rules.required]"
              hide-details
              clearable
            />

            <!-- new status field (v-model bound) -->
            <v-text-field
              v-model="form.status"
              label="Status"
              dense
              outlined
              hide-details
              class="mt-3"
              placeholder="e.g. available / out-of-stock"
            />

            <div class="mt-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="subtitle-1">Colors</div>
                <div>
                  <v-btn small text @click="addColorField" :disabled="loading">Add color field</v-btn>
                </div>
              </div>

              <div v-if="form.colorInputs.length === 0" class="text--secondary mb-2">No color fields — click "Add color field".</div>

              <div style="max-height:220px; overflow:auto;">
                <v-row v-for="(c, idx) in form.colorInputs" :key="`fci-${idx}`" class="mb-2" align="center">
                  <v-col cols="8">
                    <v-text-field
                      ref="colorInputs"
                      v-model="form.colorInputs[idx]"
                      :label="`Color ${idx + 1}`"
                      dense
                      outlined
                      hide-details
                      @keyup.enter="onColorEnter(idx)"
                      clearable
                    />
                  </v-col>
                  <v-col cols="4" class="text-right d-flex align-center">
                    <v-chip small class="mr-2">
                      <span class="swatch" :style="{ background: form.colorInputs[idx] }"></span>
                      <span class="ml-2">{{ form.colorInputs[idx] }}</span>
                    </v-chip>
                    <v-btn icon small @click="removeColorField(idx)"><v-icon color="red">mdi-delete</v-icon></v-btn>
                  </v-col>
                </v-row>
              </div>
            </div>

            <v-switch v-model="form.active" label="Active" inset dense class="mt-2" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeModelDialog">Cancel</v-btn>
          <v-btn :loading="itemLoading[getKey(modelDialog.editingKey)]" color="primary" @click="submitModelFromDialog">{{ modelDialog.mode === 'edit' ? 'Update' : 'Add' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Category dialog -->
    <v-dialog v-model="categoryDialog.visible" persistent max-width="420px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ categoryDialog.mode === 'add' ? 'Add Category' : 'Edit Category' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="categoryForm" v-model="categoryDialog.valid" lazy-validation>
            <v-text-field v-model="categoryDialog.value" label="Category name" :rules="[rules.required]" outlined dense />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeCategoryDialog">Cancel</v-btn>
          <v-btn color="primary" :loading="loading" @click="confirmCategoryDialog">{{ categoryDialog.mode === 'add' ? 'Add' : 'Save' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "AddModelManager",
  data() {
    return {
      loading: false,
      valid: false,
      models: [],
      categoriesData: [],
      search: "",
      searchTimer: null,

      // form
      form: {
        modelName: "",
        colorInputs: [],
        active: true,
        category: null,
        status: ""            // <-- added status bound with v-model
      },
      editing: false,
      originalModelName: "",

      selectedModel: null,
      newColor: "",
      newCategory: "",

      snackbar: { visible: false, message: "" },

      headers: [
        { text: "Category", value: "category", sortable: true },
        { text: "Model Name", value: "modelName", sortable: true },
        { text: "Color", value: "color", sortable: false },
        { text: "Actions", value: "actions", sortable: false, align: "end" }
      ],

      rules: {
        required: v => !!v || "This field is required",
        min3: v => (v && v.length >= 3) || "Minimum 3 characters"
      },

      endpoints: {
        addCategory: process.env.VUE_APP_AGENCY_BACKEND_URL + "addCategory",
        addModel: process.env.VUE_APP_AGENCY_BACKEND_URL + "addModel",
        getModels: process.env.VUE_APP_AGENCY_BACKEND_URL + "getModel",
        updateModelBase: process.env.VUE_APP_AGENCY_BACKEND_URL + "updateModel",
        deleteModelBase: process.env.VUE_APP_AGENCY_BACKEND_URL + "deleteModel",
        getCategories: process.env.VUE_APP_AGENCY_BACKEND_URL + "getCategory",
        deleteCategoryBase: process.env.VUE_APP_AGENCY_BACKEND_URL + "deleteCategory"
      },

      // Dialog/UI controls
      categoryDialog: { visible: false, mode: "add", value: "", valid: false, editingItem: null },
      modelDialog: { visible: false, mode: "add", valid: false, editingKey: null },
      colorDialog: { visible: false },
      dialogNewColor: "",

      // per-item loading map
      itemLoading: {},

      // delete confirmation dialog
      deleteDialog: { visible: false, item: null }
    };
  },

  computed: {
    displayModels() {
      return (this.models || []).map(m => {
        if (!m) return { modelName: "", colors: [], active: true, category: null, __raw: m };
        const modelName = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
        const colors = Array.isArray(m.colors) ? m.colors : (Array.isArray(m.color) ? m.color : (m.colors ? [m.colors] : []));
        const active = typeof m.active !== "undefined" ? !!m.active : true;
        const category = m.category ?? m.cat ?? m.categoryName ?? null;
        const status = m.status ?? null;
        return { modelName, colors, active, category, status, __raw: m };
      });
    },

    filteredModels() {
      if (!this.search || this.search.trim() === "") return this.displayModels;
      const q = this.search.trim().toLowerCase();
      return this.displayModels.filter(m =>
        (m.modelName && m.modelName.toLowerCase().includes(q)) ||
        (m.category && m.category.toString().toLowerCase().includes(q)) ||
        (m.colors && m.colors.join(", ").toLowerCase().includes(q)) ||
        (m.status && m.status.toString().toLowerCase().includes(q))
      );
    },

    hasSelectedModelChanged() {
      if (!this.selectedModel) return false;
      const orig = this.models.find(m => {
        const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
        return name === this.selectedModel.modelName;
      });
      if (!orig) return true;
      const origColors = Array.isArray(orig.colors) ? orig.colors : (orig.colors ? orig.colors : []);
      return JSON.stringify(origColors) !== JSON.stringify(this.selectedModel.colors || []);
    }
  },

  mounted() {
    this.fetchModels();
    this.fetchCategories();
  },

  methods: {
    // utility to normalize a key for itemLoading (safe)
    getKey(name) {
      if (!name) return "";
      // remove spaces and encode to keep key safe
      return encodeURIComponent(name).replace(/%/g, "_");
    },

    showSnackbar(msg) {
      this.snackbar.message = msg;
      this.snackbar.visible = true;
    },

    // ---- CATEGORIES ----
    async fetchCategories() {
      try {
        const res = await axios.get(this.endpoints.getCategories);
        const categories = res?.data?.categories ?? res?.data?.data ?? res?.data ?? [];
        this.categoriesData = Array.isArray(categories)
          ? categories.map(c => (typeof c === "string" ? { category: c } : (c.category ? c : { category: c.name || c.category })))
          : [];
      } catch (err) {
        console.error("fetchCategories failed", err);
        this.categoriesData = [];
      }
    },

    openCategoryDialog(mode = "add", item = null) {
      this.categoryDialog.mode = mode;
      this.categoryDialog.editingItem = item;
      this.categoryDialog.value = mode === "edit" && item ? (item.category || item.name) : "";
      this.categoryDialog.visible = true;
    },

    closeCategoryDialog() {
      this.categoryDialog.visible = false;
      this.categoryDialog.value = "";
      this.categoryDialog.editingItem = null;
      if (this.$refs.categoryForm) this.$refs.categoryForm.resetValidation();
    },

    async confirmCategoryDialog() {
      const form = this.$refs.categoryForm;
      if (form) {
        const ok = await form.validate();
        if (!ok) return;
      }
      const val = (this.categoryDialog.value || "").toString().trim();
      if (!val) return;
      if (this.categoryDialog.mode === "add") {
        this.newCategory = val;
        await this.createCategory();
      } else {
        const oldName = this.categoryDialog.editingItem ? (this.categoryDialog.editingItem.category || this.categoryDialog.editingItem.name) : null;
        if (oldName && oldName !== val) {
          try {
            this.loading = true;
            // fallback: delete + add if update endpoint missing
            await axios.delete(`${this.endpoints.deleteCategoryBase}/${encodeURIComponent(oldName)}`);
            await axios.post(this.endpoints.addCategory, { category: val });
            this.showSnackbar("Category updated");
            await this.fetchCategories();
          } catch (err) {
            console.error("updateCategory failed", err);
            this.showSnackbar(err?.response?.data?.message || err.message || "Update failed");
          } finally {
            this.loading = false;
          }
        }
      }
      this.closeCategoryDialog();
    },

    async createCategory() {
      const name = (this.newCategory || "").toString().trim();
      if (!name) return;
      this.loading = true;
      try {
        await axios.post(this.endpoints.addCategory, { category: name });
        this.showSnackbar("Category added");
        this.newCategory = "";
        await this.fetchCategories();
      } catch (err) {
        console.error("createCategory failed", err);
        this.showSnackbar(err?.response?.data?.message || err.message || "Add category failed");
      } finally {
        this.loading = false;
      }
    },

    selectCategoryForForm(c) {
      const name = c.category || c.name;
      if (!name) return;
      this.form.category = name;
      this.showSnackbar(`Selected category "${name}"`);
    },

    deleteCategoryConfirm(item) {
      const name = item.category || item.name;
      if (!name) return;
      if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
      this.deleteCategory(item);
    },

    async deleteCategory(item) {
      this.loading = true;
      const name = item.category || item.name;
      try {
        await axios.delete(`${this.endpoints.deleteCategoryBase}/${encodeURIComponent(name)}`);
        this.showSnackbar("Category deleted");
        await this.fetchCategories();
      } catch (err) {
        console.error("deleteCategory failed", err);
        this.showSnackbar(err?.response?.data?.message || err.message || "Delete failed");
      } finally {
        this.loading = false;
      }
    },

    // ---- MODELS ----
    async fetchModels() {
      try {
        const res = await axios.get(this.endpoints.getModels);
        const data = res?.data ?? [];
        if (Array.isArray(data)) this.models = data;
        else if (data && Array.isArray(data.models)) this.models = data.models;
        else if (data && Array.isArray(data.data)) this.models = data.data;
        else this.models = [];
      } catch (err) {
        console.error("fetchModels failed", err);
        this.models = [];
        this.showSnackbar("Failed to fetch models");
      }
    },

    async addModel(payload) {
      const res = await axios.post(this.endpoints.addModel, payload);
      return res.data;
    },

    // UPDATED: send pk/sk in payload (no oldName/newName)
    async updateModel(oldName, payload) {
      // build pk/sk from payload.modelName (v-model bound)
      const model = (payload.modelName || "").toString().trim();
      if (!model) throw new Error("modelName missing in payload");
      const pk = `MODEL#${model}`;
      const sk = 'MODEL#INFO';

      // ensure payload contains pk/sk and only allowed fields
      const body = {
        pk,
        sk,
        modelName: model,
        category: payload.category ?? null,
        colors: Array.isArray(payload.colors) ? payload.colors : (payload.colors ? [payload.colors] : []),
        status: payload.status ?? (payload.active !== undefined ? (payload.active ? 'active' : 'inactive') : undefined),
        active: typeof payload.active === 'boolean' ? payload.active : undefined
      };

      // remove undefined entries
      Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

      const url = `${this.endpoints.updateModelBase}`;
      const res = await axios.post(url, body);
      return res.data;
    },

    async deleteModelApi(modelName) {
      const res = await axios.put(`${this.endpoints.deleteModelBase}/${encodeURIComponent(modelName)}`);
      return res.data;
    },

    // Open model dialog for add/edit (only that item)
    openModelDialog(item = null) {
      if (item) {
        this.editing = true;
        this.originalModelName = item.modelName;
        this.form.modelName = item.modelName;
        this.form.colorInputs = Array.isArray(item.colors) ? [...item.colors] : [];
        this.form.active = !!item.active;
        this.form.category = item.category || null;
        this.form.status = item.status || "";
        this.modelDialog.mode = "edit";
        this.modelDialog.editingKey = this.getKey(item.modelName);
      } else {
        this.editing = false;
        this.originalModelName = "";
        this.form.modelName = "";
        this.form.colorInputs = [];
        this.form.active = true;
        this.form.category = null;
        this.form.status = "";
        this.modelDialog.mode = "add";
        this.modelDialog.editingKey = null;
      }
      this.modelDialog.visible = true;
    },

    closeModelDialog() {
      this.modelDialog.visible = false;
      if (this.$refs.modelDialogForm) this.$refs.modelDialogForm.resetValidation();
      if (!this.editing) this.resetForm(true);
      this.modelDialog.editingKey = null;
    },

    // Called by dialog save button
    async submitModelFromDialog() {
      const editingKey = this.modelDialog.editingKey ? this.modelDialog.editingKey : null;
      if (editingKey) this.$set(this.itemLoading, editingKey, true);
      else this.loading = true;

      try {
        await this.onSubmit();
        // close the dialog if submission didn't throw
        this.modelDialog.visible = false;
      } catch (err) {
        // onSubmit handles snackbars
      } finally {
        if (editingKey) this.$set(this.itemLoading, editingKey, false);
        else this.loading = false;
        this.modelDialog.editingKey = null;
      }
    },

    // FORM UX
    addColorField() {
      if (!Array.isArray(this.form.colorInputs)) this.form.colorInputs = [];
      this.form.colorInputs.push("");
      this.$nextTick(() => {
        const refs = this.$refs.colorInputs;
        if (refs) {
          const last = Array.isArray(refs) ? refs[refs.length - 1] : refs;
          if (last && last.$el) {
            const input = last.$el.querySelector("input");
            if (input) input.focus();
          }
        }
      });
    },

    removeColorField(idx) {
      this.form.colorInputs.splice(idx, 1);
    },

    onColorEnter(idx) {
      const val = (this.form.colorInputs[idx] || "").trim();
      if (val && idx === this.form.colorInputs.length - 1) this.addColorField();
    },

    resetForm(keepActive = false) {
      this.form.modelName = "";
      this.form.colorInputs = [];
      this.form.active = keepActive ? true : false;
      this.form.category = null;
      this.form.status = "";
      this.editing = false;
      this.originalModelName = "";
      if (this.$refs.form) this.$refs.form.resetValidation();
    },

    cancelEdit() {
      this.resetForm();
      this.modelDialog.visible = false;
    },

    // SUBMIT (Add / Update)
    async onSubmit() {
      const formRef = this.$refs.form || this.$refs.modelDialogForm;
      if (formRef) {
        const ok = await formRef.validate();
        if (!ok) return;
      }

      const modelName = (this.form.modelName || "").toString().trim();
      if (!modelName) { this.showSnackbar("Model name is required"); return; }
      if (!this.form.category) { this.showSnackbar("Category is required"); return; }

      const colors = (this.form.colorInputs || []).map(c => (c || "").toString().trim()).filter(Boolean);
      const uniqueColors = Array.from(new Set(colors));

      const payload = {
        modelName,
        colors: uniqueColors,
        active: !!this.form.active,
        category: this.form.category || null,
        status: this.form.status || undefined
      };

      if (this.editing) {
        const oldName = this.originalModelName;
        const loadingKey = this.getKey(oldName);
        this.$set(this.itemLoading, loadingKey, true);
        try {
          // updateModel now expects payload with pk/sk built inside it
          await this.updateModel(null, payload);
          this.showSnackbar("Model updated");

          // Find and update local model by oldName
          const idx = this.models.findIndex(m => {
            const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
            return name === oldName;
          });

          if (idx !== -1) {
            this.$set(this.models, idx, { modelName: payload.modelName, colors: payload.colors, active: payload.active, category: payload.category, status: payload.status });
          } else {
            await this.fetchModels();
          }

          if (this.selectedModel && this.selectedModel.modelName === oldName) {
            this.selectedModel.modelName = payload.modelName;
            this.selectedModel.colors = Array.from(payload.colors);
            this.selectedModel.category = payload.category;
            this.selectedModel.active = payload.active;
            this.selectedModel.status = payload.status;
          }
        } catch (err) {
          console.error("update model error", err);
          this.showSnackbar(err?.response?.data?.message || err.message || "Update failed");
          throw err;
        } finally {
          this.$set(this.itemLoading, loadingKey, false);
          this.resetForm(true);
        }
      } else {
        // Add
        try {
          this.loading = true;
          await this.addModel(payload);
          this.showSnackbar("Model added");
          this.models.unshift({ modelName: payload.modelName, colors: payload.colors, active: payload.active, category: payload.category, status: payload.status });
          await this.fetchCategories();
          this.resetForm(true);
        } catch (err) {
          console.error("add model failed", err);
          this.showSnackbar(err?.response?.data?.message || err.message || "Add failed");
          throw err;
        } finally {
          this.loading = false;
        }
      }
    },

    // EDIT / SELECT MODEL
    onEdit(item) {
      this.openModelDialog(item);
    },

    // Delete flow
    confirmDelete(item) {
      this.deleteDialog.item = item;
      this.deleteDialog.visible = true;
    },

    async deleteModel(item) {
      if (!item || !item.modelName) return;
      const key = this.getKey(item.modelName);
      this.$set(this.itemLoading, 'del-'+key, true);
      try {
        await this.deleteModelApi(item.modelName);
        this.showSnackbar("Model deleted");
        const idx = this.models.findIndex(m => {
          const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
          return name === item.modelName;
        });
        if (idx !== -1) this.models.splice(idx, 1);
        if (this.selectedModel && this.selectedModel.modelName === item.modelName) this.clearSelection();
      } catch (err) {
        console.error("delete failed", err);
        this.showSnackbar(err?.response?.data?.message || err.message || "Delete failed");
      } finally {
        this.$set(this.itemLoading, 'del-'+key, false);
        this.deleteDialog.visible = false;
        this.deleteDialog.item = null;
      }
    },

    selectModel(item) {
      this.selectedModel = { modelName: item.modelName, colors: Array.isArray(item.colors) ? [...item.colors] : [], active: !!item.active, category: item.category || null, status: item.status || "" };
    },

    clearSelection() {
      this.selectedModel = null;
      this.newColor = "";
    },

    // COLORS PANEL ACTIONS
    addColorToSelected() {
      const color = (this.newColor || "").toString().trim();
      if (!color || !this.selectedModel) return;
      this.selectedModel.colors = this.selectedModel.colors || [];
      if (!this.selectedModel.colors.includes(color)) this.selectedModel.colors.push(color);
      this.newColor = "";
    },

    removeColor(index) {
      if (!this.selectedModel) return;
      this.selectedModel.colors.splice(index, 1);
    },

    openColorDialog() {
      if (!this.selectedModel) { this.showSnackbar("Select a model first"); return; }
      this.dialogNewColor = "";
      this.colorDialog.visible = true;
    },

    closeColorDialog() {
      this.colorDialog.visible = false;
      this.dialogNewColor = "";
    },

    dialogAddColor() {
      if (!this.dialogNewColor || !this.selectedModel) return;
      const c = (this.dialogNewColor || "").toString().trim();
      if (!this.selectedModel.colors) this.selectedModel.colors = [];
      if (!this.selectedModel.colors.includes(c)) this.selectedModel.colors.push(c);
      this.dialogNewColor = "";
    },

    dialogRemoveColor(i) {
      if (!this.selectedModel) return;
      this.selectedModel.colors.splice(i, 1);
    },

    // SAVE colors & status using pk/sk constructed here
    async saveSelectedModelColors() {
      if (!this.selectedModel) return;
      const key = this.getKey(this.selectedModel.modelName);
      this.$set(this.itemLoading, key, true);
      try {
        const payload = {
          modelName: this.selectedModel.modelName,
          colors: Array.isArray(this.selectedModel.colors) ? this.selectedModel.colors : [],
          active: !!this.selectedModel.active,
          category: this.selectedModel.category || null,
          status: this.selectedModel.status || undefined
        };

        await this.updateModel(null, payload);

        this.showSnackbar("Model colors saved");

        const idx = this.models.findIndex(m => {
          const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
          return name === this.selectedModel.modelName;
        });
        if (idx !== -1) {
          this.$set(this.models, idx, { modelName: payload.modelName, colors: payload.colors, active: payload.active, category: payload.category, status: payload.status });
        } else {
          await this.fetchModels();
        }

        this.colorDialog.visible = false;
      } catch (err) {
        console.error("save colors failed", err);
        this.showSnackbar(err?.response?.data?.message || err.message || "Save failed");
      } finally {
        this.$set(this.itemLoading, key, false);
      }
    },

    // UX
    debouncedFilter() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {}, 200);
    }
  }
};
</script>

<style scoped>
.category-list { max-height: 360px; overflow-y: auto; }
.category-row { cursor: pointer; }
.color-list { max-height: 220px; overflow-y: auto; }
.v-data-table .v-chip { min-width: 36px; text-align: center; }
.swatch { width: 18px; height: 18px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.08); display: inline-block; }
</style>
