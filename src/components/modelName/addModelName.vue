<template>
  <v-container fluid>
    <v-row dense>
      <!-- CATEGORIES -->
      <v-col cols="12" md="4">
        <v-card class="pa-3">
          <v-card-title class="d-flex align-center">
            <div class="headline">Categories</div>
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
                  <v-btn icon small @click.stop="addModelForCategory(c)"><v-icon>mdi-plus</v-icon></v-btn>
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

      <!-- MODELS TABLE -->
      <v-col cols="12" md="8">
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
              outlined
              @input="debouncedFilter"
              style="max-width:260px"
              clearable
            />
          </v-card-title>

          <v-data-table
            class="elevation-1 fixed-rows"
            :headers="headers"
            :items="filteredModels"
            :items-per-page="10"
            dense
            item-key="modelName"
            :item-class="rowClass"
            @click:row="selectModel"
          >
            <template v-slot:item.modelName="{ item }">
              <div class="d-flex align-center justify-space-between">
                <div style="max-width: 380px; overflow: hidden;">
                  <!-- Tooltip for Model Name -->
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <div
                        v-bind="attrs"
                        v-on="on"
                        class="font-weight-medium"
                        :style="{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '360px',
                          cursor: item.modelName?.length > 30 ? 'pointer' : 'default'
                        }"
                      >
                        {{
                          item.modelName && item.modelName.length > 30
                            ? item.modelName.substring(0, 30) + '...'
                            : item.modelName
                        }}
                      </div>
                    </template>
                    <span>{{ item.modelName }}</span>
                  </v-tooltip>

                  <!-- Category (truncated if too long) -->
                  <div
                    class="caption text--secondary"
                    :style="{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '320px',
                    }"
                  >
                    {{ item.category }}
                  </div>
                </div>

                <div class="text-right">
                  <v-chip small v-if="item.colors && item.colors.length">
                    {{ item.colors.length }} colors
                  </v-chip>
                </div>
              </div>
            </template>

            <!-- HSN appears automatically via headers/value=hsn -->

            <!-- COLORS (chips, truncated text, tooltip, +N more) -->
            <template v-slot:item.color="{ item }">
              <div class="d-flex align-center flex-wrap" style="max-width:480px">
                <template v-for="(c,i) in (item.colors || []).slice(0,3)">
                  <v-tooltip bottom :key="`c-${getKey(item.modelName)}-${i}`">
                    <template v-slot:activator="{ on, attrs }">
                      <v-chip
                        v-bind="attrs"
                        v-on="on"
                        small
                        class="ma-1 color-chip text-truncate"
                        :style="{ maxWidth: '160px' }"
                        outlined
                        pill
                      >
                        {{ truncateText(c, 18) }}
                      </v-chip>
                    </template>
                    <span>{{ c }}</span>
                  </v-tooltip>
                </template>

                <v-chip
                  v-if="item.colors && item.colors.length > 3"
                  small
                  class="ma-1"
                  outlined
                  pill
                >
                  +{{ item.colors.length - 3 }} more
                </v-chip>
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon small @click.stop="openDetails(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>

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
            <br />
            <v-text-field
              v-model="form.modelName"
              :rules="[rules.required, rules.min3]"
              label="Model Name"
              name="modelName"
              required
              outlined
              dense
            />

            <!-- HSN (required) -->
            <v-text-field
              v-model.trim="form.hsn"
              :rules="[rules.required, rules.hsnDigits]"
              label="HSN (4–8 digits)"
              outlined
              dense
              name="hsn"
              hide-details="auto"
              maxlength="8"
              @input="form.hsn = (form.hsn || '').replace(/[^0-9]/g,'')"
            />

            <div class="mt-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="subtitle-1">Colors</div>
                <div>
                  <v-btn small text @click="addColorField" :disabled="loading">Add color</v-btn>
                </div>
              </div>

              <div v-if="form.colorInputs.length === 0" class="text--secondary mb-2">No color fields — click "Add color".</div>

              <div style="max-height:220px; overflow:auto;">
                <br />
                <v-row v-for="(c, idx) in form.colorInputs" :key="`fci-${idx}`" class="mb-2" align="center">
                  <v-col cols="10">
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
                  <v-col cols="1" class="text-right d-flex align-center">
                    <v-btn icon small @click="removeColorField(idx)"><v-icon color="red">mdi-delete</v-icon></v-btn>
                  </v-col>
                </v-row>
              </div>
            </div>
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

    <!-- Model details dialog (polished) -->
    <v-dialog v-model="modelDetailsDialog.visible" max-width="720px">
      <v-card class="rounded-xl elevation-8">
        <!-- Header -->
        <div class="details-header d-flex align-center px-4 py-3">
          <v-avatar size="40" class="mr-3" tile>
            <v-icon large>mdi-car-cog</v-icon>
          </v-avatar>

          <div class="mr-3">
            <div class="text-h6 font-weight-bold mb-1">
              {{ modelDetailsDialog.data?.modelName || '—' }}
            </div>
            <div class="d-flex align-center flex-wrap">
              <v-chip
                v-if="modelDetailsDialog.data?.category"
                small
                class="mr-2 mb-1"
                outlined
              >
                <v-icon left small>mdi-folder</v-icon>{{ modelDetailsDialog.data.category }}
              </v-chip>

              <v-chip
                small
                class="mr-2 mb-1"
                :color="modelDetailsDialog.data?.active ? 'green' : 'red'"
                dark
              >
                <v-icon left small>
                  {{ modelDetailsDialog.data?.active ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
                {{ modelDetailsDialog.data?.active ? 'Active' : 'Inactive' }}
              </v-chip>

              <v-chip
                v-if="modelDetailsDialog.data?.colors?.length"
                small
                class="mb-1"
                outlined
              >
                <v-icon left small>mdi-palette</v-icon>
                {{ modelDetailsDialog.data.colors.length }} colors
              </v-chip>
            </div>
          </div>

          <v-spacer />

          <v-btn icon small class="mr-1" @click="copyText(modelDetailsDialog.data?.modelName)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon small @click="closeDetails">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Body -->
        <v-card-text class="pt-4">
          <!-- Info grid -->
          <v-container fluid class="pt-0">
            <v-row dense>
              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Model Name</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.modelName || '—' }}
                  <v-btn text x-small class="ml-1" @click="copyText(modelDetailsDialog.data?.modelName)">Copy</v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Category</div>
                <div class="value">{{ modelDetailsDialog.data?.category || '—' }}</div>
              </v-col>

              <!-- HSN -->
              <v-col cols="12" md="6" class="mb-3">
                <div class="label">HSN</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.hsn || '—' }}
                  <v-btn text x-small class="ml-1" @click="copyText(modelDetailsDialog.data?.hsn)">Copy</v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Status</div>
                <div class="value d-flex align-center">
                  <v-icon small class="mr-1" :color="modelDetailsDialog.data?.active ? 'green' : 'red'">
                    {{ modelDetailsDialog.data?.active ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                  {{ modelDetailsDialog.data?.active ? 'Active' : 'Inactive' }}
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Total Colors</div>
                <div class="value">{{ modelDetailsDialog.data?.colors?.length || 0 }}</div>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Colors -->
            <div class="mb-2 d-flex align-center">
              <v-icon small class="mr-2">mdi-palette</v-icon>
              <div class="subtitle-2 font-weight-medium">Colors</div>
            </div>

            <div v-if="modelDetailsDialog.data?.colors?.length" class="d-flex flex-wrap">
              <v-tooltip bottom v-for="(c, i) in modelDetailsDialog.data.colors" :key="'chip-'+i">
                <template v-slot:activator="{ on, attrs }">
                  <v-chip
                    v-bind="attrs"
                    v-on="on"
                    small
                    class="ma-1 color-chip"
                    :style="chipStyle(c)"
                    :text-color="chipTextColor(c)"
                    pill
                    outlined
                  >
                    <span class="swatch" :style="swatchStyle(c)"></span>
                    {{ c }}
                  </v-chip>
                </template>
                <span>{{ c }}</span>
              </v-tooltip>
            </div>
            <div v-else class="text--secondary">No colors</div>
          </v-container>
        </v-card-text>

        <!-- Footer -->
        <v-card-actions class="px-4 pb-4">
          <v-btn text @click="closeDetails">Close</v-btn>
          <v-spacer />
          <v-btn color="primary" @click="goToEditFromDetails">
            <v-icon left>mdi-pencil</v-icon>Edit
          </v-btn>
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
      modelDetailsDialog: {
        visible: false,
        data: null,
      },

      loading: false,
      valid: false,
      models: [],
      categoriesData: [],
      search: "",
      searchTimer: null,

      form: {
        modelName: "",
        hsn: "",
        colorInputs: [],
        active: true,
        category: null,
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
        { text: "HSN", value: "hsn", sortable: true },
        { text: "Color", value: "color", sortable: false },
        { text: "Actions", value: "actions", sortable: false, align: "end" }
      ],

      rules: {
        required: v => !!v || "This field is required",
        min3: v => (v && v.length >= 3) || "Minimum 3 characters",
        hsnDigits: v => /^\d{4,8}$/.test(String(v || '')) || "Enter 4–8 digits",
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

      categoryDialog: { visible: false, mode: "add", value: "", valid: false, editingItem: null },
      modelDialog: { visible: false, mode: "add", valid: false, editingKey: null },
      colorDialog: { visible: false },
      dialogNewColor: "",

      itemLoading: {},

      deleteDialog: { visible: false, item: null }
    };
  },

  computed: {
    tableItems() {
      const size = 10;
      const arr = [...this.filteredModels];
      const need = Math.max(0, size - arr.length);
      for (let i = 0; i < need; i++) {
        arr.push({ _placeholder: true, modelName: '', category: '', hsn: '', colors: [] });
      }
      return arr;
    },
    displayModels() {
      return (this.models || []).map(m => {
        if (!m) return { modelName: "", colors: [], active: true, category: null, hsn: null, __raw: m };
        const modelName = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
        const colors = Array.isArray(m.colors) ? m.colors : (Array.isArray(m.color) ? m.color : (m.colors ? [m.colors] : []));
        const active = typeof m.active !== "undefined" ? !!m.active : true;
        const category = m.category ?? m.cat ?? m.categoryName ?? null;
        const hsn = m.hsn ?? m.HSN ?? null;
        return { modelName, colors, active, category, hsn, __raw: m };
      });
    },

    filteredModels() {
      if (!this.search || this.search.trim() === "") return this.displayModels;
      const q = this.search.trim().toLowerCase();
      return this.displayModels.filter(m =>
        (m.modelName && m.modelName.toLowerCase().includes(q)) ||
        (m.category && m.category.toString().toLowerCase().includes(q)) ||
        (m.colors && m.colors.join(", ").toLowerCase().includes(q)) ||
        (m.hsn && String(m.hsn).toLowerCase().includes(q))
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
    rowClass(item) {
      return item?._placeholder ? 'placeholder-row' : '';
    },
    copyText(text) {
      if (!text) return;
      try {
        navigator.clipboard?.writeText(text);
        this.showSnackbar('Copied!');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        this.showSnackbar('Copied!');
      }
    },

    chipStyle(c) {
      const bg = this.normalizeColor(c);
      return { background: this.isLight(bg) ? '#0000000a' : '#ffffff0a', borderColor: bg };
    },
    swatchStyle(c) {
      const bg = this.normalizeColor(c);
      return { background: bg, borderColor: this.isLight(bg) ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.25)' };
    },
    chipTextColor(c) {
      const bg = this.normalizeColor(c);
      return this.isLight(bg) ? undefined : 'white';
    },
    normalizeColor(c) {
      return (c || '').toString().trim();
    },
    isLight(color) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color || '');
      if (!m) return true;
      const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
      const luma = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
      return luma > 0.6;
    },

    openDetails(item) {
      const normalized = {
        modelName: item?.modelName ?? '',
        category: item?.category ?? null,
        hsn: item?.hsn ?? null,
        colors: Array.isArray(item?.colors) ? [...item.colors] : [],
        active: !!item?.active,
        __raw: item,
      };
      this.modelDetailsDialog.data = normalized;
      this.modelDetailsDialog.visible = true;
    },

    closeDetails() {
      this.modelDetailsDialog.visible = false;
      this.modelDetailsDialog.data = null;
    },

    goToEditFromDetails() {
      const item = this.modelDetailsDialog.data;
      this.modelDetailsDialog.visible = false;
      if (!item) return;
      this.openModelDialog({
        modelName: item.modelName,
        category: item.category,
        hsn: item.hsn || "",
        colors: item.colors,
        active: item.active,
      });
    },

    getKey(name) {
      if (!name) return "";
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

    truncateText(text, maxLength = 18) {
      if (!text) return '';
      const t = String(text);
      return t.length > maxLength ? t.slice(0, maxLength) + '…' : t;
    },

    openCategoryDialog(mode = "add", item = null) {
      this.categoryDialog.mode = mode;
      this.categoryDialog.editingItem = item;
      this.categoryDialog.value = mode === "edit" && item ? (item.category || item.name) : "";
      this.categoryDialog.visible = true;
    },

    addModelForCategory(c) {
      const name = c?.category || c?.name || null;
      if (!name) return;
      this.editing = false;
      this.originalModelName = "";
      this.form.modelName = "";
      this.form.hsn = "";
      this.form.colorInputs = [];
      this.form.active = true;
      this.form.category = name;
      this.modelDialog.mode = "add";
      this.modelDialog.editingKey = null;
      this.modelDialog.visible = true;
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

    // updateModel now accepts oldName and includes oldModelName only when provided
    async updateModel(oldName, payload) {
      const model = (payload.modelName || "").toString().trim();
      if (!model) throw new Error("modelName missing in payload");

      const pk = `MODEL#${model}`;
      const sk = 'MODEL#INFO';

      const body = {
        pk,
        sk,
        modelName: model,
        category: payload.category ?? null,
        hsn: payload.hsn ?? null,
        colors: Array.isArray(payload.colors) ? payload.colors : (payload.colors ? [payload.colors] : []),
        active: typeof payload.active === 'boolean' ? payload.active : undefined
      };

      if (oldName && oldName !== model) {
        body.oldModelName = oldName;
      }

      Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

      const url = `${this.endpoints.updateModelBase}`;
      const res = await axios.post(url, body);
      return res.data;
    },

    async deleteModelApi(modelName) {
      const res = await axios.put(`${this.endpoints.deleteModelBase}/${encodeURIComponent(modelName)}`);
      return res.data;
    },

    openModelDialog(item = null) {
      if (item) {
        this.editing = true;
        this.originalModelName = item.modelName;
        this.form.modelName = item.modelName;
        this.form.hsn = item.hsn || "";
        this.form.colorInputs = Array.isArray(item.colors) ? [...item.colors] : [];
        this.form.active = !!item.active;
        this.form.category = item.category || null;
        this.modelDialog.mode = "edit";
        this.modelDialog.editingKey = this.getKey(item.modelName);
      } else {
        this.editing = false;
        this.originalModelName = "";
        this.form.modelName = "";
        this.form.hsn = "";
        this.form.colorInputs = [];
        this.form.active = true;
        this.form.category = null;
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

    async submitModelFromDialog() {
      const editingKey = this.modelDialog.editingKey ? this.modelDialog.editingKey : null;
      if (editingKey) this.$set(this.itemLoading, editingKey, true);
      else this.loading = true;

      try {
        await this.onSubmit();
        this.modelDialog.visible = false;
      } catch (err) {
      } finally {
        if (editingKey) this.$set(this.itemLoading, editingKey, false);
        else this.loading = false;
        this.modelDialog.editingKey = null;
      }
    },

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
      this.form.hsn = "";
      this.form.colorInputs = [];
      this.form.active = keepActive ? true : false;
      this.form.category = null;
      this.editing = false;
      this.originalModelName = "";
      if (this.$refs.form) this.$refs.form.resetValidation();
    },

    cancelEdit() {
      this.resetForm();
      this.modelDialog.visible = false;
    },

    async onSubmit() {
      const formRef = this.$refs.form || this.$refs.modelDialogForm;
      if (formRef) {
        const ok = await formRef.validate();
        if (!ok) return;
      }

      const modelName = (this.form.modelName || "").toString().trim();
      if (!modelName) { this.showSnackbar("Model name is required"); return; }
      if (!this.form.category) { this.showSnackbar("Category is required"); return; }
      if (!/^\d{4,8}$/.test(String(this.form.hsn || ''))) { this.showSnackbar("Enter valid HSN (4–8 digits)"); return; }

      const colors = (this.form.colorInputs || []).map(c => (c || "").toString().trim()).filter(Boolean);
      const uniqueColors = Array.from(new Set(colors));

      const payload = {
        modelName,
        hsn: this.form.hsn,
        colors: uniqueColors,
        active: !!this.form.active,
        category: this.form.category || null,
      };

      if (this.editing) {
        const oldName = this.originalModelName;
        const loadingKey = this.getKey(oldName);
        this.$set(this.itemLoading, loadingKey, true);
        try {
          // only include oldName when actual rename happened
          const oldNameToSend = (oldName && oldName !== payload.modelName) ? oldName : null;
          await this.updateModel(oldNameToSend, payload);
          this.showSnackbar("Model updated");

          const idx = this.models.findIndex(m => {
            const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
            return name === oldName;
          });

          if (idx !== -1) {
            this.$set(this.models, idx, {
              modelName: payload.modelName,
              hsn: payload.hsn,
              colors: payload.colors,
              active: payload.active,
              category: payload.category
            });
          } else {
            await this.fetchModels();
          }

          if (this.selectedModel && this.selectedModel.modelName === oldName) {
            this.selectedModel.modelName = payload.modelName;
            this.selectedModel.hsn = payload.hsn;
            this.selectedModel.colors = Array.from(payload.colors);
            this.selectedModel.category = payload.category;
            this.selectedModel.active = payload.active;
            // update stored original name for selection
            this.selectedModel.__originalName = payload.modelName;
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
        try {
          this.loading = true;
          await this.addModel(payload);
          this.showSnackbar("Model added");
          this.models.unshift({
            modelName: payload.modelName,
            hsn: payload.hsn,
            colors: payload.colors,
            active: payload.active,
            category: payload.category
          });
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

    onEdit(item) {
      this.openModelDialog(item);
    },

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
      // record original name so panel saves know if a rename happened
      this.selectedModel = {
        modelName: item.modelName,
        hsn: item.hsn || null,
        colors: Array.isArray(item.colors) ? [...item.colors] : [],
        active: !!item.active,
        category: item.category || null,
        __originalName: item.modelName  // <-- important: store original
      };
    },

    clearSelection() {
      this.selectedModel = null;
      this.newColor = "";
    },

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

    async saveSelectedModelColors() {
      if (!this.selectedModel) return;
      const key = this.getKey(this.selectedModel.modelName);
      this.$set(this.itemLoading, key, true);
      try {
        const payload = {
          modelName: this.selectedModel.modelName,
          hsn: this.selectedModel.hsn || null,
          colors: Array.isArray(this.selectedModel.colors) ? this.selectedModel.colors : [],
          active: !!this.selectedModel.active,
          category: this.selectedModel.category || null,
        };

        // send oldName only if original name exists and it differs
        const oldNameToSend = (this.selectedModel.__originalName && this.selectedModel.__originalName !== payload.modelName)
          ? this.selectedModel.__originalName
          : null;

        await this.updateModel(oldNameToSend, payload);

        this.showSnackbar("Model colors saved");

        const idx = this.models.findIndex(m => {
          const name = typeof m === "string" ? m : (m.modelName ?? m.name ?? m.label ?? m.model ?? "");
          return name === this.selectedModel.modelName;
        });
        if (idx !== -1) {
          this.$set(this.models, idx, {
            modelName: payload.modelName,
            hsn: payload.hsn,
            colors: payload.colors,
            active: payload.active,
            category: payload.category
          });
        } else {
          await this.fetchModels();
        }

        // update stored original name after successful save
        if (this.selectedModel) this.selectedModel.__originalName = payload.modelName;

        this.colorDialog.visible = false;
      } catch (err) {
        console.error("save colors failed", err);
        this.showSnackbar(err?.response?.data?.message || err.message || "Save failed");
      } finally {
        this.$set(this.itemLoading, key, false);
      }
    },

    debouncedFilter() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {}, 200);
    }
  }
};
</script>


<style scoped>
.category-list { max-height: 730px; overflow-y: auto; }
.category-row { cursor: pointer; }
.color-list { max-height: 220px; overflow-y: auto; }
.v-data-table .v-chip { min-width: 36px; text-align: center; }
.swatch { width: 18px; height: 18px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.08); display: inline-block; }
.details-header{
  background: linear-gradient(135deg, rgba(99,102,241,.22), rgba(16,185,129,.22));
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(0,0,0,.06);
}

.label{
  font-size: .78rem;
  letter-spacing: .02em;
  opacity: .7;
  margin-bottom: .25rem;
  text-transform: uppercase;
}

.value{
  font-size: 1rem;
}

.color-chip{
  transition: transform .12s ease, box-shadow .12s ease;
}
.color-chip:hover{
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.swatch{
  width: 14px;
  height: 14px;
  border-radius: 3px;
  margin-right: 8px;
  border: 1px solid;
}

.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.color-chip {
  max-width: 160px; /* keeps chips tidy in table cells */
}

/* same height rows for Vuetify 2 */
.fixed-rows .v-data-table__wrapper table tbody tr {
  height: 48px;              /* tweak to 44/52 as you like */
}
.fixed-rows .v-data-table__wrapper td,
.fixed-rows .v-data-table__wrapper th {
  padding: 8px 12px;
  vertical-align: middle;
}

/* force single-line with ellipsis inside cells */
.fixed-rows .v-data-table__wrapper td > *,
.fixed-rows .v-data-table__wrapper td div,
.fixed-rows .v-data-table__wrapper td span {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* no chip wrapping; keep them compact */
.fixed-rows .v-chip {
  max-width: 160px;
  white-space: nowrap;
}

/* make placeholder rows invisible but keep height for consistent table height */
.fixed-rows .placeholder-row td {
  color: transparent !important;
  border-color: transparent !important;
  pointer-events: none;
}


</style>
