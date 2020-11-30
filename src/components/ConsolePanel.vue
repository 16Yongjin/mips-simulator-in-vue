<template lang="pug">
v-row.h-50.ma-0.pt-5
  v-card.h-100.card.rounded-xl(elevation="4")
    v-card-title.card-title 콘솔
    v-card-text.code.card-text(ref="consoleOutput")
      pre.pl-2(v-for="(output, i) in stdout.outputs" :key="i" :style="`color: ${output.color}`")
        | {{ output.text }}
    v-card-text
      v-text-field(
        hide-details
        v-model="input"
        @keydown.enter="onConsoleEnter"
        placeholder="명령어를 입력하세요. (help로 명령어 목록 보기)" filled)
</template>

<script lang="ts">
import { stdout } from '@/simulator/stdout'
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'

@Component({ name: 'ConsolePanel' })
export default class ConsolePanel extends Vue {
  get input() {
    return this.value
  }

  set input(v: string) {
    this.$emit('input', v)
  }

  @Prop(String)
  value!: string

  stdout = stdout

  onConsoleEnter() {
    this.$emit('consoleEnter')
  }

  @Watch('stdout.outputs')
  async onStdOutChange() {
    await this.$nextTick()
    this.scrollDownConsole()
  }

  scrollDownConsole() {
    const consoleOutput = this.$refs.consoleOutput as Element
    if (consoleOutput) {
      consoleOutput.scrollTo(0, consoleOutput.scrollHeight)
    }
  }
}
</script>
