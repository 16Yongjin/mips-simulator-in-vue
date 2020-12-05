<template lang="pug">
v-col.h-100(cols="2")
  v-card.h-100.card.rounded-xl(elevation="4")
    v-card-title.card-title 레지스터
    v-card-text.code.card-text
      div(v-for="(reg, i) in register.entries()" :key="i")
        .d-flex.reg(:class="{ changed: registerChanged[reg.name]}" @click="selectRegister(reg)")
          div.w-100 {{ reg.name }}
          div.w-100 {{ reg.value }}
  edit-dialog(
    target="레지스터"
    v-model="editDialog"
    :name="selectedRegisterName"
    :currentValue="selectedRegisterValue"
    @close="editDialog = false"
    @complete="completeEdit")
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { register } from '@/simulator/register'
import { Prop } from 'vue-property-decorator'
import EditDialog from '@/components/EditDialog.vue'

@Component({ name: 'RegisterPanel', components: { EditDialog } })
export default class RegisterPanel extends Vue {
  @Prop(Object)
  registerChanged!: Record<string, boolean>

  register = register

  editDialog = false

  selectedRegisterName: string | null = null

  selectedRegisterValue: string | null = null

  selectRegister({ name, value }: { name: string; value: number }) {
    this.selectedRegisterName = name
    this.selectedRegisterValue = `0x${value}`
    this.editDialog = true
  }

  completeEdit(value: object) {
    this.$emit('registerEdit', value)
  }
}
</script>

<style lang="scss" scoped>
.reg {
  cursor: pointer;

  &:hover {
    background: rgba($color: #fff, $alpha: 0.1) !important;
    border-radius: 4px;
  }
}
</style>
