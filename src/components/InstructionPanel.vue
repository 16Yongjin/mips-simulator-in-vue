<template lang="pug">
v-col.h-100(cols="4")
  v-card.card.h-100.rounded-xl(elevation="4")
    v-card-title.card-title
      div 명령어
      v-spacer
      div
        write-dialog(@write="onUserWrite")
      div.mr-2
        v-menu(rounded offset-y)
          template(v-slot:activator="{ attrs, on }")
            v-btn(icon v-on="on" v-bind="attrs")
              v-icon(medium) mdi-format-list-bulleted-square
          v-list
            v-list-item(v-for="file in presetFiles" :key="file.name" link @click="loadFile(file.url)")
              v-list-item-title(v-text="file.name")
      div
        v-btn(icon @click="openFile")
          v-icon(medium) mdi-file-plus

    v-card-text.code.card-text
      .d-flex.pa-2(
        v-for="(instruction, i) in instructions" :key="i"
        :class="{ running: instruction.address === register.PC }")
        break-point(v-model="breakPoints[instruction.address]")
        div.mr-3  [{{ formatHex(instruction.address) }}]
        div.mr-3  {{ formatHex(instruction.word) }}
        div.font-weight-bold {{ instruction.decoded }}
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { register } from '@/simulator/register'
import { Prop } from 'vue-property-decorator'
import { InstructionInfo, PresetFile } from '@/types'
import BreakPoint from '@/components/BreakPoint.vue'
import WriteDialog from '@/components/WriteDialog.vue'

@Component({ name: 'RegisterPanel', components: { BreakPoint, WriteDialog } })
export default class RegisterPanel extends Vue {
  @Prop(Object)
  breakPoints!: Record<number, boolean>

  @Prop(Array)
  presetFiles!: PresetFile[]

  @Prop(Array)
  instructions!: InstructionInfo[]

  loadFile(url: string) {
    this.$emit('loadFile', url)
  }

  openFile() {
    this.$emit('openFile')
  }

  onUserWrite({ words, data }: { words: number[]; data: number[] }) {
    this.$emit('write', { words, data })
  }

  register = register

  formatHex(number: number) {
    return number.toString(16).padStart(8, '0')
  }
}
</script>
