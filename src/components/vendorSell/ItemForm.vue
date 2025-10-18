<template>
  <div>
    <div v-if="selectedModelLabel" class="mb-3">
      <div class="caption text--secondary">Selected item</div>
      <div class="font-weight-medium">{{ selectedModelLabel }}</div>
    </div>

    <v-form ref="itemFormRef" v-model="valid" lazy-validation>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.lazy.number="local.price"
            label="Price (per unit)"
            type="number"
            dense
            outlined
            prepend-inner-icon="mdi-currency-inr"
            @change="onFieldChange"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.lazy.number="local.quantity"
            label="Quantity"
            type="number"
            dense
            outlined
            @change="onFieldChange"
          />
        </v-col>

        <v-col cols="12" md="6" class="mt-2">
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.lazy.number="local.discount"
                label="Discount (₹)"
                type="number"
                dense
                outlined
                min="0"
                @change="onFieldChange"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.lazy="local.hsn"
                label="HSN"
                type="text"
                dense
                outlined
                @change="onFieldChange"
              />
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="6" class="mt-2">
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.lazy.number="local.cgst"
                label="CGST (%)"
                type="number"
                dense
                outlined
                @change="onFieldChange"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.lazy.number="local.sgst"
                label="SGST (%)"
                type="number"
                dense
                outlined
                @change="onFieldChange"
              />
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" class="mt-2">
          <v-checkbox
            v-model="local.kitGiven"
            label="Kit given"
            dense
            hide-details
            @change="onFieldChange"
          />
        </v-col>

        <v-col cols="12" class="text-right mt-3">
          <v-btn
            color="primary"
            elevation="3"
            @click="onAddOrUpdateClicked"
            :disabled="!canAddItem || !formValidForSubmit"
          >
            <v-icon left>{{ isEditing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
            {{ isEditing ? 'Update item' : 'Add to invoice' }}
          </v-btn>

          <v-btn
            v-if="isEditing"
            text
            class="ml-2"
            @click="$emit('cancel-edit')"
          >
            Cancel
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script>
export default {
  name: 'ItemForm',
  props: {
    selectedModelKey: { default: null },
    inventoriesMap: { type: Object, default: () => ({}) },
    inventoryKeyField: { type: String, default: 'id' },
    itemForm: {
      type: Object,
      default: () => ({ price: 0, quantity: 1, discount: 0, cgst: 0, sgst: 0, hsn: '', kitGiven: false })
    },
    isEditing: { type: Boolean, default: false },
    canAddItem: { type: Boolean, default: false }
  },
  emits: ['update:itemForm', 'add-or-update', 'cancel-edit'],
  data() {
    return {
      local: { ...this.itemForm },
      valid: true,
      _debounceTimer: null
    }
  },
  computed: {
    selectedModelLabel() {
      if (!this.selectedModelKey) return null
      const inv = this.inventoriesMap[this.selectedModelKey]
      return (inv && (inv.modelName || inv.label || inv.model || inv.name)) || null
    },
    formValidForSubmit() {
      const price = Number(this.local.price || 0)
      const qty = Number(this.local.quantity || 0)
      return price >= 0 && qty > 0
    }
  },
  watch: {
    // sync only when parent replaces itemForm reference
    itemForm(newVal) {
      if (newVal && newVal !== this.local) {
        this.local = { ...newVal }
      }
    }
  },
  beforeUnmount() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
  },
  methods: {
    // debounce shallow update emits (reduce reactivity churn)
    scheduleEmitUpdate() {
      if (this._debounceTimer) clearTimeout(this._debounceTimer)
      this._debounceTimer = setTimeout(() => {
        this.emitUpdate()
        this._debounceTimer = null
      }, 300)
    },

    emitUpdate() {
      const payload = {
        price: Number(this.local.price || 0),
        quantity: Number(this.local.quantity || 0),
        discount: Number(this.local.discount || 0),
        cgst: Number(this.local.cgst || 0),
        sgst: Number(this.local.sgst || 0),
        hsn: this.local.hsn || '',
        kitGiven: !!this.local.kitGiven
      }
      this.$emit('update:itemForm', payload)
    },

    onFieldChange() {
      this.scheduleEmitUpdate()
    },

    onAddOrUpdateClicked() {
      if (!this.formValidForSubmit) {
        this.$refs.itemFormRef && this.$refs.itemFormRef.validate && this.$refs.itemFormRef.validate()
        return
      }
      if (this._debounceTimer) { clearTimeout(this._debounceTimer); this._debounceTimer = null }
      this.emitUpdate()
      this.$emit('add-or-update')
    }
  }
}
</script>

<style scoped>
.caption { font-size: 12px; color: rgba(0,0,0,0.6); }
</style>
