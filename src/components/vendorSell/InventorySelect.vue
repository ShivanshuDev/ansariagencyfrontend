<template>
  <v-select
    :items="items"
    item-text="label"
    item-value="__key"
    label="Search / select inventory"
    v-model="valueLocal"
    dense
    outlined
    clearable
    :loading="loading"
    @change="$emit('input', valueLocal)"
  />
</template>

<script>
export default {
  name: 'InventorySelect',
  props: {
    items: { type: Array, default: () => [] },
    value: { default: null },
    loading: { type: Boolean, default: false }
  },
  data() { return { valueLocal: this.value } },
  watch: { value(val) { this.valueLocal = val }, valueLocal(val) { this.$emit('input', val) } }
}
</script>
