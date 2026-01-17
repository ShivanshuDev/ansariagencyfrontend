<template>
  <v-container fluid class="model-manager pa-4">
    <v-row dense>
      <!-- ========== LEFT: CATEGORIES PANEL ========== -->
      <v-col cols="12" md="3">
        <v-card class="rounded elevation-3 category-card">
          <!-- Header -->
          <v-card-title class="py-3 px-4 d-flex align-center">
            <div>
              <div class="section-title">Categories</div>
              <div class="section-subtitle">
                Manage model groups & quick selection
              </div>
            </div>
            <v-spacer />
            <v-chip
              small
              label
              class="category-count-chip"
            >
              {{ categoriesData.length }} total
            </v-chip>
          </v-card-title>

          <v-divider class="mx-4" />

          <!-- Add category -->
          <v-card-text class="px-4 pt-3 pb-1">
            <v-row align="center" no-gutters>
              <v-col cols="8" class="pr-2">
                <v-text-field
                  v-model="newCategory"
                  label="New category"
                  dense
                  outlined
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-folder-plus"
                  @keyup.enter="createCategory"
                />
              </v-col>
              <v-col cols="4" class="pl-1">
                <v-btn
                  :loading="loading"
                  block
                  color="primary"
                  class="rounded-lg text-none"
                  @click="createCategory"
                  :disabled="!newCategory"
                >
                  <v-icon left small>mdi-plus</v-icon>
                  Add
                </v-btn>
              </v-col>
            </v-row>
            <p class="helper-text mt-2 mb-0">
              Tip: click a category to pre-fill it when adding a model.
            </p>
          </v-card-text>

          <v-divider class="mt-2 mb-1" />

          <!-- Category list -->
          <v-card-text class="pt-0 pb-3 px-2">
            <v-list two-line dense class="category-list">
              <v-list-item
                v-for="(c, idx) in categoriesData"
                :key="c.category || c.name || idx"
                @click="selectCategoryForForm(c)"
                class="category-row px-3"
                :class="{ 'category-row--active': (c.category || c.name) === form.category }"
              >
                <v-list-item-content>
                  <v-list-item-title class="text-truncate font-weight-medium">
                    {{ c.category || c.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="c.count" class="caption">
                    {{ c.count }} models
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action style="display:flex; flex-direction:row;" class="category-actions">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon small v-bind="attrs" v-on="on" @click.stop="addModelForCategory(c)">
                        <v-icon small>mdi-plus</v-icon>
                      </v-btn>
                    </template>
                    <span>Add model in this category</span>
                  </v-tooltip>

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon small v-bind="attrs" v-on="on" @click.stop="openCategoryDialog('edit', c)">
                        <v-icon small>mdi-pencil</v-icon>
                      </v-btn>
                    </template>
                    <span>Rename category</span>
                  </v-tooltip>

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon small v-bind="attrs" v-on="on" @click.stop="deleteCategoryConfirm(c)">
                        <v-icon small color="red">mdi-delete</v-icon>
                      </v-btn>
                    </template>
                    <span>Delete category</span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>

              <v-list-item
                v-if="!categoriesData || categoriesData.length === 0"
                class="px-3"
              >
                <v-list-item-content>
                  <v-list-item-title class="text--secondary">
                    No categories yet
                  </v-list-item-title>
                  <v-list-item-subtitle class="caption text--disabled">
                    Start by creating your first category above.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- ========== RIGHT: MODELS TABLE ========== -->
      <v-col cols="12" md="9">
        <v-card class="rounded elevation-3 models-card">
          <!-- Header -->
          <v-card-title class="py-3 px-4 d-flex align-center models-header">
            <div>
              <div class="section-title">Models</div>
              <div class="section-subtitle">
                {{ filteredModels.length }} model{{ filteredModels.length === 1 ? '' : 's' }} found
                <span v-if="form.category">
                  · Selected category:
                  <strong>{{ form.category }}</strong>
                </span>
              </div>
            </div>

            <v-spacer />

            <!-- NEW: Category filter for models table -->
            <v-select
              v-model="selectedCategoryFilter"
              :items="categoriesData.map(c => c.category || c.name)"
              label="Filter by category"
              dense
              outlined
              hide-details
              clearable
              class="mr-3 category-filter"
            />

            <v-select
              v-model="selectedModelFilter"
              :items="displayModels.map(m => m.modelName)"
              label="Filter by model"
              dense
              outlined
              hide-details
              clearable
              class="mr-3 model-filter"
            />

            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search models"
              single-line
              hide-details
              dense
              outlined
              class="mr-3 search-field"
              @input="debouncedFilter"
              clearable
            />

            <v-btn
              color="primary"
              class="text-none rounded-lg"
              small
              @click="openModelDialog()"
              style="height:40px;"
            >
              <v-icon left small>mdi-plus</v-icon>
              Add Model
            </v-btn>
          </v-card-title>

          <v-divider />

          <!-- Table -->
          <v-card-text class="px-0 pb-0 pt-1">
            <v-data-table
              class="elevation-0 fixed-rows models-table"
              :headers="headers"
              :items="filteredModels"
              :items-per-page="13"
              :footer-props="{
                'items-per-page-options': [13]
              }"
              dense
              item-key="modelName"
              :item-class="rowClass"
              @click:row="selectModel"
            >
              <!-- MODEL NAME + CATEGORY + COLORS SUMMARY -->
              <template v-slot:item.modelName="{ item }">
                <div class="d-flex align-center justify-space-between model-cell" style="width:480px;">
                  <div class="model-main">
                    <!-- Model name with tooltip -->
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <div
                          v-bind="attrs"
                          v-on="on"
                          class="font-weight-medium text-truncate model-name"
                          :style="{
                            cursor: item.modelName?.length > 30 ? 'pointer' : 'default'
                          }"
                        >
                          {{
                            item.modelName && item.modelName.length > 50
                              ? item.modelName.substring(0, 50) + '...'
                              : item.modelName
                          }}
                        </div>
                      </template>
                      <span>{{ item.modelName }}</span>
                    </v-tooltip>

                    <!-- Category -->
                    <div class="caption text--secondary text-truncate model-category">
                      {{ item.category || '—' }}
                    </div>
                  </div>

                  <div class="text-right model-meta">
                    <v-chip
                      small
                      v-if="item.colors && item.colors.length"
                      label
                      class="model-color-count-chip"
                    >
                      <v-icon left x-small>mdi-palette</v-icon>
                      {{ item.colors.length }} color{{ item.colors.length === 1 ? '' : 's' }}
                    </v-chip>
                  </div>
                </div>
              </template>

              <!-- COLORS -->
              <template v-slot:item.color="{ item }">
                <div class="d-flex align-center flex-wrap colors-cell">
                  <template v-for="(c,i) in (item.colors || []).slice(0,3)">
                    <v-tooltip bottom :key="`c-${getKey(item.modelName)}-${i}`">
                      <template v-slot:activator="{ on, attrs }">
                        <v-chip
                          v-bind="attrs"
                          v-on="on"
                          small
                          class="ma-1 color-chip text-truncate"
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
                    class="ma-1 more-chip"
                    outlined
                    pill
                  >
                    +{{ item.colors.length - 3 }} more
                  </v-chip>
                </div>
              </template>

              <!-- ACTIONS -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end actions-cell">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        @click.stop="openDetails(item)"
                      >
                        <v-icon small>mdi-eye</v-icon>
                      </v-btn>
                    </template>
                    <span>View details</span>
                  </v-tooltip>

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        :loading="itemLoading[getKey(item.modelName)]"
                        :disabled="itemLoading[getKey(item.modelName)]"
                        @click.stop="onEdit(item)"
                      >
                        <v-icon small>mdi-pencil</v-icon>
                      </v-btn>
                    </template>
                    <span>Edit model</span>
                  </v-tooltip>

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        :loading="itemLoading['del-'+getKey(item.modelName)]"
                        :disabled="itemLoading['del-'+getKey(item.modelName)]"
                        @click.stop="confirmDelete(item)"
                      >
                        <v-icon small color="red">mdi-delete</v-icon>
                      </v-btn>
                    </template>
                    <span>Delete model</span>
                  </v-tooltip>
                </div>
              </template>

              <template v-slot:no-data>
                <v-alert type="info" dense class="ma-4">
                  No models found. Try adjusting your search or add a new model.
                </v-alert>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ========== DELETE CONFIRMATION DIALOG ========== -->
    <v-dialog v-model="deleteDialog.visible" persistent max-width="420">
      <v-card class="rounded">
        <v-card-title class="headline">
          Confirm delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete model
          "<strong>{{ deleteDialog.item?.modelName }}</strong>"?
          This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text class="text-none" @click="() => (deleteDialog.visible = false)">
            Cancel
          </v-btn>
          <v-btn
            :loading="itemLoading['del-'+getKey(deleteDialog.item?.modelName)]"
            color="red"
            class="text-none"
            @click="() => deleteModel(deleteDialog.item)"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== MODEL DIALOG (ADD / EDIT) ========== -->
    <v-dialog v-model="modelDialog.visible" persistent max-width="720px">
      <v-card class="rounded">
        <v-card-title class="py-3 px-4">
          <div class="headline">
            {{ modelDialog.mode === 'edit' ? 'Edit Model' : 'Add Model' }}
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4 pb-2 px-4">
          <v-form ref="modelDialogForm" v-model="modelDialog.valid" lazy-validation>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.category"
                  :items="categoriesData.map(c => c.category || c.name)"
                  label="Category"
                  dense
                  outlined
                  :rules="[rules.required]"
                  hide-details="auto"
                  clearable
                  prepend-inner-icon="mdi-folder"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.modelName"
                  :rules="[rules.required, rules.min3]"
                  label="Model Name"
                  name="modelName"
                  required
                  outlined
                  dense
                  hide-details="auto"
                  prepend-inner-icon="mdi-shape-outline"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.trim="form.hsn"
                  :rules="[rules.required, rules.hsnDigits]"
                  label="HSN (4–8 digits)"
                  outlined
                  dense
                  name="hsn"
                  hide-details="auto"
                  maxlength="8"
                  prepend-inner-icon="mdi-barcode"
                  @input="form.hsn = (form.hsn || '').replace(/[^0-9]/g,'')"
                />
              </v-col>

              <v-col cols="12" md="6" class="d-flex align-center">
                <v-chip
                  small
                  label
                  :color="form.active ? 'green' : 'red'"
                  :text-color="form.active ? 'white' : 'white'"
                  class="mr-2"
                >
                  <v-icon left small>
                    {{ form.active ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                  {{ form.active ? 'Active' : 'Inactive' }}
                </v-chip>
                <span class="caption text--secondary">
                  (Status can be toggled in backend or a separate flow if needed)
                </span>
              </v-col>
            </v-row>

            <!-- Colors section -->
            <div class="mt-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="subtitle-2 font-weight-medium d-flex align-center">
                  <v-icon small class="mr-1">mdi-palette</v-icon>
                  Colors
                </div>
                <v-btn
                  small
                  text
                  class="text-none"
                  @click="addColorField"
                  :disabled="loading"
                >
                  <v-icon small left>mdi-plus</v-icon>
                  Add color
                </v-btn>
              </div>
              <p class="helper-text mb-2">
                Add all color names or codes associated with this model.
              </p>

              <div v-if="form.colorInputs.length === 0" class="text--secondary mb-2">
                No color fields — click "Add color" to start.
              </div>

              <div class="color-inputs-scroll">
                <v-row
                  v-for="(c, idx) in form.colorInputs"
                  :key="`fci-${idx}`"
                  class="mb-2"
                  align="center"
                  no-gutters
                >
                  <v-col cols="11" class="pr-2">
                    <v-text-field
                      ref="colorInputs"
                      v-model="form.colorInputs[idx]"
                      :label="`Color ${idx + 1}`"
                      dense
                      outlined
                      hide-details
                      clearable
                      @keyup.enter="onColorEnter(idx)"
                      prepend-inner-icon="mdi-palette"
                    />
                  </v-col>
                  <v-col cols="1" class="d-flex justify-end">
                    <v-btn icon small @click="removeColorField(idx)">
                      <v-icon small color="red">mdi-delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 pt-1">
          <v-spacer />
          <v-btn text class="text-none" @click="closeModelDialog">
            Cancel
          </v-btn>
          <v-btn
            :loading="itemLoading[getKey(modelDialog.editingKey)]"
            color="primary"
            class="text-none"
            @click="submitModelFromDialog"
          >
            {{ modelDialog.mode === 'edit' ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== CATEGORY DIALOG ========== -->
    <v-dialog v-model="categoryDialog.visible" persistent max-width="420px">
      <v-card class="rounded">
        <v-card-title class="py-3 px-4">
          <span class="headline">
            {{ categoryDialog.mode === 'add' ? 'Add Category' : 'Edit Category' }}
          </span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4 pb-2 px-4">
          <v-form ref="categoryForm" v-model="categoryDialog.valid" lazy-validation>
            <v-text-field
              v-model="categoryDialog.value"
              label="Category name"
              :rules="[rules.required]"
              outlined
              dense
              hide-details="auto"
              prepend-inner-icon="mdi-folder"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 pt-1">
          <v-spacer />
          <v-btn text class="text-none" @click="closeCategoryDialog">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            class="text-none"
            :loading="loading"
            @click="confirmCategoryDialog"
          >
            {{ categoryDialog.mode === 'add' ? 'Add' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========== MODEL DETAILS DIALOG ========== -->
    <v-dialog v-model="modelDetailsDialog.visible" max-width="720px">
      <v-card class="rounded elevation-8">
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
                <v-icon left small>mdi-folder</v-icon>
                {{ modelDetailsDialog.data.category }}
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

          <v-btn
            icon
            small
            class="mr-1"
            @click="copyText(modelDetailsDialog.data?.modelName)"
          >
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon small @click="closeDetails">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Body -->
        <v-card-text class="pt-4">
          <v-container fluid class="pt-0">
            <v-row dense>
              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Model Name</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.modelName || '—' }}
                  <v-btn
                    text
                    x-small
                    class="ml-1 text-none"
                    @click="copyText(modelDetailsDialog.data?.modelName)"
                  >
                    Copy
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Category</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.category || '—' }}
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">HSN</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.hsn || '—' }}
                  <v-btn
                    text
                    x-small
                    class="ml-1 text-none"
                    @click="copyText(modelDetailsDialog.data?.hsn)"
                  >
                    Copy
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Status</div>
                <div class="value d-flex align-center">
                  <v-icon
                    small
                    class="mr-1"
                    :color="modelDetailsDialog.data?.active ? 'green' : 'red'"
                  >
                    {{ modelDetailsDialog.data?.active ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                  {{ modelDetailsDialog.data?.active ? 'Active' : 'Inactive' }}
                </div>
              </v-col>

              <v-col cols="12" md="6" class="mb-3">
                <div class="label">Total Colors</div>
                <div class="value">
                  {{ modelDetailsDialog.data?.colors?.length || 0 }}
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Colors -->
            <div class="mb-2 d-flex align-center">
              <v-icon small class="mr-2">mdi-palette</v-icon>
              <div class="subtitle-2 font-weight-medium">Colors</div>
            </div>

            <div v-if="modelDetailsDialog.data?.colors?.length" class="d-flex flex-wrap">
              <v-tooltip
                bottom
                v-for="(c, i) in modelDetailsDialog.data.colors"
                :key="'chip-'+i"
              >
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
          <v-btn text class="text-none" @click="closeDetails">
            Close
          </v-btn>
          <v-spacer />
          <v-btn color="primary" class="text-none" @click="goToEditFromDetails">
            <v-icon left>mdi-pencil</v-icon>
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- ========== GLOBAL SNACKBAR ========== -->
    <v-snackbar
      v-model="snackbar.visible"
      :timeout="3000"
      :color="snackbar.color || 'success'"
      top
      right
      elevation="6"
    >
      {{ snackbar.message }}

      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.visible = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

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

      deleteDialog: { visible: false, item: null },

      selectedModelFilter: null,

      // NEW: selected category filter for the models table
      selectedCategoryFilter: null,
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
      let list = this.displayModels;

      // NEW: Filter by selected category (from header v-select)
      if (this.selectedCategoryFilter) {
        list = list.filter(m => m.category === this.selectedCategoryFilter);
      }

      // Existing model filter from dropdown
      if (this.selectedModelFilter) {
        list = list.filter(m => m.modelName === this.selectedModelFilter);
      }

      // Existing search filter
      if (!this.search || this.search.trim() === "") return list;

      const q = this.search.trim().toLowerCase();
      return list.filter(m =>
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

    showSnackbar(message, color = "success") {
  this.snackbar.visible = false;

  this.$nextTick(() => {
    this.snackbar.message = message;
    this.snackbar.color = color;
    this.snackbar.visible = true;
  });
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
      this.selectedModel = {
        modelName: item.modelName,
        hsn: item.hsn || null,
        colors: Array.isArray(item.colors) ? [...item.colors] : [],
        active: !!item.active,
        category: item.category || null,
        __originalName: item.modelName
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
/* =========================
   Layout background
   ========================= */
.model-manager {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at top left, #eef2ff 0, #f9fafb 38%, #ffffff 100%);
}

/* Center content a bit on large screens */
.model-manager > .v-row {
  max-width: 1300px;
  margin: 0 auto;
}

/* =========================
   Generic typography
   ========================= */
.section-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.section-subtitle {
  font-size: 0.78rem;
  color: rgba(15, 23, 42, 0.6);
}

/* Helper text */
.helper-text {
  font-size: 0.7rem;
  color: rgba(15, 23, 42, 0.55);
}

/* Truncate utility */
.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* =========================
   Card shells
   ========================= */
.category-card,
.models-card {
  border-radius: 18px !important;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow:
    0 20px 25px -20px rgba(15, 23, 42, 0.25),
    0 0 0 1px rgba(148, 163, 184, 0.08);
  background: #ffffff;
}

/* slight glow on hover */
.category-card:hover,
.models-card:hover {
  box-shadow:
    0 24px 45px -26px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(129, 140, 248, 0.35);
  transition: box-shadow 0.18s ease;
}

/* Accent stripe on left card */
.category-card {
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1, #22c55e);
}

/* =========================
   Categories area
   ========================= */
.category-count-chip {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(79, 70, 229, 0.09) !important;
  color: #4f46e5 !important;
  border-radius: 999px;
}

/* Scroll area for categories */
.category-list {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Custom scrollbar (webkit) */
.category-list::-webkit-scrollbar {
  width: 6px;
}
.category-list::-webkit-scrollbar-track {
  background: transparent;
}
.category-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7);
  border-radius: 999px;
}

/* Category row */
.category-row {
  cursor: pointer;
  border-radius: 14px;
  margin: 2px 4px;
  padding-left: 10px !important;
  padding-right: 10px !important;
  transition: background 0.14s ease, transform 0.08s ease, box-shadow 0.12s ease;
}

.category-row:hover {
  background: rgba(129, 140, 248, 0.07);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.category-row--active {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.16), rgba(34, 197, 94, 0.12));
  box-shadow: 0 8px 18px rgba(129, 140, 248, 0.25);
}

/* category row actions */
.category-actions .v-btn {
  margin-left: 2px;
}

/* =========================
   Models header / filters
   ========================= */
.models-header {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(239, 246, 255, 0.95));
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.models-header .v-select,
.models-header .v-text-field {
  max-width: 210px;
}

.search-field {
  max-width: 260px;
}

/* Make filter controls more compact */
.category-filter,
.model-filter,
.search-field {
  margin-right: 10px !important;
}

/* "Add model" button */
.models-header .v-btn {
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  font-weight: 600;
}

/* =========================
   Data table
   ========================= */
.models-table .v-data-table__wrapper {
  max-height: 620px;
}

/* sticky header */
.models-table thead tr {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f9fafb;
}

.models-table thead th {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(15, 23, 42, 0.7) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.5) !important;
}

/* fixed row size */
.fixed-rows .v-data-table__wrapper table tbody tr {
  height: 50px;
}

/* cells */
.fixed-rows .v-data-table__wrapper td,
.fixed-rows .v-data-table__wrapper th {
  padding: 8px 12px;
  vertical-align: middle;
}

/* zebra rows */
.models-table tbody tr:nth-child(even) {
  background-color: rgba(248, 250, 252, 0.88);
}

/* row hover */
.models-table tbody tr:hover:not(.placeholder-row) {
  background-color: #eef2ff !important;
  box-shadow: 0 6px 16px rgba(148, 163, 184, 0.5);
  transform: translateY(-1px);
}

/* keep text from wrapping badly */
.fixed-rows .v-data-table__wrapper td > *,
.fixed-rows .v-data-table__wrapper td div,
.fixed-rows .v-data-table__wrapper td span {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Placeholder rows invisible but keep height */
.fixed-rows .placeholder-row td {
  color: transparent !important;
  border-color: transparent !important;
  pointer-events: none;
}

/* model cell */
.model-cell {
  width: 100%;
}

.model-main {
  min-width: 0;
  max-width: 420px;
}

.model-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.model-category {
  font-size: 0.75rem;
  color: rgba(100, 116, 139, 0.95);
  max-width: 380px;
}

.model-meta {
  min-width: 0;
}

/* =========================
   Chips in table
   ========================= */
.model-color-count-chip {
  font-size: 0.72rem;
  background: rgba(59, 130, 246, 0.08) !important;
  color: #2563eb !important;
  border-radius: 999px;
}

.colors-cell {
  max-width: 480px;
}

.color-chip {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  max-width: 160px;
  border-radius: 999px;
}

.color-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}

.more-chip {
  font-size: 0.75rem;
  border-radius: 999px;
}

/* =========================
   Actions cell
   ========================= */
.actions-cell .v-btn {
  margin-left: 4px;
}

/* =========================
   Model dialog / details
   ========================= */
.v-dialog .v-card {
  border-radius: 18px !important;
}

.details-header {
  background: radial-gradient(circle at top left, rgba(129, 140, 248, 0.28), rgba(34, 197, 94, 0.24));
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.label {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  opacity: 0.7;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.value {
  font-size: 0.95rem;
}

/* Color chips in details dialog */
.color-chip {
  max-width: 180px;
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid;
}

/* =========================
   Color inputs scroll (dialog)
   ========================= */
.color-inputs-scroll {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;

  display: flex;
  flex-wrap: wrap;
  max-width: 780px;
}

.color-inputs-scroll .v-row {
  flex: 0 0 190px;
  max-width: 190px;
  margin-right: 8px;
}

.color-inputs-scroll .v-text-field {
  min-width: 190px;
}

/* =========================
   Responsive tweaks
   ========================= */
@media (max-width: 1264px) {
  .models-header {
    flex-wrap: wrap;
  }

  .models-header > .v-spacer {
    display: none;
  }

  .models-header .v-select,
  .models-header .v-text-field {
    max-width: 100%;
    margin-top: 8px;
  }

  .models-header .v-btn {
    margin-top: 8px;
  }
}

@media (max-width: 960px) {
  .category-list {
    max-height: 260px;
  }

  .models-table .v-data-table__wrapper {
    max-height: 420px;
  }

  .model-manager {
    padding: 16px;
  }
}
</style>
