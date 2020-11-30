<template lang="pug">
v-row.h-50.ma-0
  v-col.h-100.pa-0.mr-3
    v-card.card.rounded-xl.mb-5(elevation="4")
      v-card-title.card-title 데이터
      v-card-text.code.card-text
        .d-flex(v-for="(word, i) in dataMemory()" :key="i")
          div(v-if="i === 2" style="height: 4px;")
          div.pr-2 [{{ word.address.toString(16) }}]
          div 0x{{ formatHex(word.word) }}({{word.word >> 0}})

  v-col.h-100.pa-0.ml-3
    v-card.card.rounded-xl.mb-5(elevation="4")
      v-card-title.card-title 스택
      v-card-text.code.card-text.stack-data
        .d-flex(v-for="(word, i) in stackMemory()" :key="i")
          div.pr-2 [{{ word.address.toString(16) }}]
          div 0x{{ formatHex(word.word) }}({{word.word >> 0}})
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { memory } from '@/simulator/memory'
import { register } from '@/simulator/register'
import { Prop } from 'vue-property-decorator'

@Component({ name: 'MemoryPanel' })
export default class MemoryPanel extends Vue {
  @Prop(Number)
  dataCount!: number

  register = register

  dataMemory() {
    const words = []
    const address = 0x10000000
    for (let i = 0; i < this.dataCount; i++) {
      const word = memory.getWord(address + 4 * i)
      words.push({ address: address + 4 * i, word })
    }

    return words
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
}
</script>
