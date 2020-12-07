<template lang="pug">
v-row.h-50.ma-0
  v-col.h-100.pa-0.mr-3
    v-card.card.rounded-xl.mb-5(elevation="4" ref="Card")
      v-card-title.card-title 데이터
      v-card-text.code.card-text(ref="dataMemory")
        v-virtual-scroll(:items='items' :height='panelHeight' item-height='24')
          template(v-slot:default='{ item: address }')
            .d-flex.mem(:class="{ changed: dataChanged[address]}" @click="selectMemory(address)")
              div.pr-2 [{{ address.toString(16) }}]
              div 0x{{ formatHex(getDataMemory(address)) }}({{getDataMemory(address) >> 0}})

  v-col.h-100.pa-0.ml-3
    v-card.card.rounded-xl.mb-5(elevation="4")
      v-card-title.card-title 스택
      v-card-text.code.card-text.stack-data
        .d-flex(v-for="(word, i) in stackMemory()" :key="i" :class="{ changed: dataChanged[word.address]}")
          div.pr-2 [{{ word.address.toString(16) }}]
          div 0x{{ formatHex(word.word) }}({{word.word >> 0}})

  edit-dialog(
    target="메모리"
    v-model="editDialog"
    :name="selectedAddress"
    :currentValue="selectedAddressValue"
    @close="editDialog = false"
    @complete="completeEdit")
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { memory } from '@/simulator/memory'
import { register } from '@/simulator/register'
import { Prop } from 'vue-property-decorator'
import EditDialog from '@/components/EditDialog.vue'

const addressList = Array.from({ length: 10000 }).map(
  (_, i) => 0x10000000 + 4 * i
)

@Component({ name: 'MemoryPanel', components: { EditDialog } })
export default class MemoryPanel extends Vue {
  @Prop(Number)
  dataCount!: number

  @Prop(Object)
  changedMemory!: Record<number, boolean>

  dataChanged = memory.changedData as Record<number, boolean>

  register = register

  items = addressList

  panelHeight = 300

  editDialog = false

  selectedAddress = ''

  selectedAddressValue = ''

  dataMemory() {
    const words = []
    const address = 0x10000000
    for (let i = 0; i < this.dataCount; i++) {
      const word = memory.getWord(address + 4 * i)
      words.push({ address: address + 4 * i, word })
    }

    return words
  }

  getDataMemory(address: number) {
    const word = memory.getWord(address)
    return word
  }

  stackMemory() {
    const words = []
    const sp = this.register.SP
    if (sp >> 20 !== 0x7ff) return []

    const stackEnd = 0x80000000
    for (let address = sp; address < stackEnd; address += 4) {
      console.log(address.toString(16))
      const word = memory.getWord(address)
      words.unshift({ address, word })
    }
    console.log('stack', words)

    return words
  }

  formatHex(number: number) {
    return number.toString(16).padStart(8, '0')
  }

  updatePanelHeight() {
    const panel = this.$refs.dataMemory as Element
    this.panelHeight = panel?.clientHeight - 24 || 300
  }

  selectMemory(address: number) {
    this.selectedAddress = `0x${this.formatHex(address)}`
    this.selectedAddressValue = `0x${this.formatHex(
      this.getDataMemory(address)
    )}`
    this.editDialog = true
  }

  completeEdit(value: object) {
    console.log('memory edit', value)
    this.$emit('memoryEdit', value)
  }

  mounted() {
    this.updatePanelHeight()
    window.addEventListener('resize', this.updatePanelHeight.bind(this))
  }

  destroyed() {
    window.removeEventListener('resize', this.updatePanelHeight.bind(this))
  }
}
</script>

<style lang="scss" scoped>
.mem {
  cursor: pointer;

  &:hover {
    background: rgba($color: #fff, $alpha: 0.1) !important;
    border-radius: 4px;
  }
}
</style>
