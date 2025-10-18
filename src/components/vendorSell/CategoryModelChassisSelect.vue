<template>
  <div>
    <!-- Category select -->
    <v-select
      :items="categories"
      item-text="label"
      item-value="value"
      label="Category"
      v-model="categoryLocal"
      dense
      outlined
      clearable
      @change="onCategoryChange"
      hide-details
    />

    <!-- Model select (filtered by category) -->
    <v-select
      v-if="modelsForCategory.length"
      :items="modelsForCategory"
      item-text="label"
      item-value="value"
      label="Model"
      v-model="modelLocal"
      dense
      outlined
      clearable
      :searchable="true"
      @change="onModelChange"
      hide-details
      class="mt-3"
    />

    <!-- Chassis select (filtered by model & category). searchable -->
    <v-select
      v-if="chassisForModel.length"
      :items="chassisForModel"
      item-text="label"
      item-value="value"
      label="Select chassis / inventory"
      v-model="chassisLocal"
      dense
      outlined
      clearable
      :searchable="true"
      @change="onChassisChange"
      class="mt-3"
      hide-details
    />
  </div>
</template>

<script>
export default {
  name: 'CategoryModelChassisSelect',
  props: {
    inventories: { type: Array, default: () => [] }, // expects items that each have: categoryName, modelName, chassisNumber (or sk)
    value: { default: null } // this will be the selected chassis-key (same semantics as selectedModelKey in parent)
  },
  data() {
    return {
      categoryLocal: null,
      modelLocal: null,
      chassisLocal: this.value
    }
  },
  computed: {
    // build categories from inventories
    categories() {
      const m = {}
      this.inventories.forEach(it => {
        const cat = (it.categoryName || 'Uncategorized').trim()
        if (!m[cat]) m[cat] = true
      })
      return Object.keys(m).sort().map(k => ({ label: k, value: k }))
    },

    // models grouped by category
    modelsForCategory() {
      if (!this.categoryLocal) return []
      const m = {}
      this.inventories.forEach(it => {
        if ((it.categoryName || '').trim() !== this.categoryLocal) return
        const model = (it.modelName || it.label || 'Unknown Model').trim()
        if (!m[model]) m[model] = true
      })
      return Object.keys(m).sort().map(k => ({ label: k, value: k }))
    },

    // chassis list for selected model (items with unique chassis)
    chassisForModel() {
      if (!this.categoryLocal || !this.modelLocal) return []
      // we will present array of { label: "<chassis> — warehouse — color", value: key }
      // the `key` should be the same unique key you used in parent (we assume inventories contain __key)
      const rows = this.inventories
        .filter(it => (it.categoryName || '').trim() === this.categoryLocal && (it.modelName || it.label || '').trim() === this.modelLocal)
        .map(it => {
          const labelParts = []
          const chassis = it.chassisNumber || it.gsisk3 || it.sk || '—'
          if (chassis) labelParts.push(String(chassis))
          if (it.warehouse) labelParts.push(String(it.warehouse))
          if (it.color) labelParts.push(String(it.color))
          return { label: labelParts.join(' • '), value: it.__key }
        })

      // remove duplicates if any (value uniqueness)
      const seen = new Set()
      const uniq = []
      for (const r of rows) {
        if (!seen.has(r.value)) { seen.add(r.value); uniq.push(r) }
      }
      return uniq
    }
  },
  watch: {
    value(val) { this.chassisLocal = val },
    chassisLocal(val) { this.$emit('input', val) }
  },
  methods: {
    onCategoryChange() {
      this.modelLocal = null
      this.chassisLocal = null
      this.$emit('input', null)
    },
    onModelChange() {
      this.chassisLocal = null
      this.$emit('input', null)
    },
    onChassisChange() {
      // emit happens via watcher; also emit a dedicated event for convenience
      this.$emit('chassis-selected', this.chassisLocal)
    }
  }
}
</script>
