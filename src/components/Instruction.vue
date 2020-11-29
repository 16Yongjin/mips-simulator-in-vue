<template lang="pug">
.app-container.rounded-xl
  .header
    .header-title.d-flex
      v-icon.mr-2(x-large) mdi-cpu-32-bit
      | MIPS Simulator
    v-spacer
    div.header-actions
      v-btn.mr-4(fab @click="step" color="red")
        v-icon(large) mdi-debug-step-over
      v-btn(fab @click="go" color="primary")
        v-icon(large) mdi-play
  v-container.h-100(fluid)
    v-row(style="height: calc(100vh - 17rem)")
      v-col.h-100(cols="4")
        v-card.card.h-100.rounded-xl(elevation="4")
          v-card-title.card-title
            div 명령어
            v-spacer
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
              v-checkbox.breakpoint.ma-0.pa-0(v-model="breakPoints[instruction.address]")
              div.mr-3  [{{ formatHex(instruction.address) }}]
              div.mr-3  {{ formatHex(instruction.word) }}
              div.font-weight-bold {{ instruction.decoded }}

      v-col.h-100(cols="2")
        v-card.h-100.card.rounded-xl(elevation="4")
          v-card-title.card-title 레지스터
          v-card-text.code.card-text
            div(v-for="(reg, i) in register.entries()" :key="i")
              .d-flex(:class="{ changed: registerChanged[reg.name]}")
                div.w-100 {{ reg.name }}
                div.w-100 {{ reg.value }}

      v-col.h-100.d-flex.flex-column(cols="6")
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

        v-row.h-50.ma-0.pt-5
          v-card.h-100.card.rounded-xl(elevation="4")
            v-card-title.card-title 콘솔
            v-card-text.code.card-text(ref="consoleOutput")
              pre.pl-2(v-for="(output, i) in stdout.outputs" :key="i" :style="`color: ${output.color}`")
                | {{ output.text }}
            v-card-text
              v-text-field(
                v-model="consoleInput"
                @keydown.enter="onConsoleInput"
                placeholder="명령어를 입력하세요. (help로 명령어 목록 보기)" filled)
    input.hidden(type="file" ref="file" @change="onFile")
    v-snackbar(v-model="snackbar")
     | {{ snackbarText }}
     template(v-slot:action="{ attrs }")
      v-btn(text @click="snackbar = false, continueGo(register.PC)" v-bind="attrs") 계속
      v-btn(text @click="snackbar = false, continueStep()" v-bind="attrs") 한 단계
      v-btn(text @click="snackbar = false" v-bind="attrs") 취소
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'
import { printDecode, decode } from '@/simulator/decode'
import { register } from '@/simulator/register'
import { memory } from '@/simulator/memory'
import { stepProgram } from '@/simulator/execute'
import { stdout } from '@/simulator/stdout'

interface InstructionInfo {
  address: number
  word: number
  decoded: string
}

@Component({ name: 'Instruction' })
export default class Instruction extends Vue {
  instructions = [] as InstructionInfo[]

  instructionCount = 0

  dataCount = 0

  register = register

  stdout = stdout

  registerChanged = {} as Record<string, boolean>

  breakPoints = {} as Record<number, boolean>

  consoleInput = ''

  snackbar = false

  snackbarText = ''

  presetFiles = [
    { name: 'as_ex01_arith.bin', url: '/1.bin' },
    { name: 'as_ex02_logic.bin', url: '/2.bin' },
    { name: 'as_ex03_ifelse.bin', url: '/3.bin' },
    { name: 'as_ex04_fct.bin', url: '/4.bin' }
  ]

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
    const sp = this.register.R[29]
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

  step() {
    const breakPoint = this.breakPoints[this.register.PC]
    if (breakPoint) return this.showBreakPoint()

    register.saveState()
    stepProgram()
    this.registerChanged = register.compareState()
  }

  go() {
    register.saveState()

    while (true) {
      const breakPoint = this.breakPoints[this.register.PC]
      if (breakPoint) {
        this.showBreakPoint()
        break
      }
      const end = stepProgram()
      if (end) break
    }

    this.registerChanged = register.compareState()
  }

  continueStep() {
    register.saveState()
    stepProgram()
    this.registerChanged = register.compareState()
  }

  continueGo(address: number) {
    register.saveState()

    while (true) {
      const breakPoint = this.breakPoints[this.register.PC]
      if (this.register.PC !== address && breakPoint) {
        this.stdout.print('Break Point')
        this.showSnackbar(
          `중단점 0x${this.register.PC.toString(16)}에서 실행을 멈춥니다.`
        )
        break
      }
      const end = stepProgram()
      if (end) break
    }

    this.registerChanged = register.compareState()
  }

  openFile() {
    const fileElem = this.$refs.file as HTMLInputElement
    if (fileElem) fileElem.click()
  }

  async onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    console.log(file)

    if (!file) return

    const binary = await file.arrayBuffer()
    this.readBinray(binary)
  }

  async loadFile(url: string) {
    const response = await fetch(url)
    const binary = await response.arrayBuffer()
    this.readBinray(binary)
  }

  readBinray(binary: ArrayBuffer) {
    const array = [...new Uint8Array(binary)]
    const view = new DataView(new Uint8Array(binary).buffer)
    const instructionCount = view.getUint32(0)
    const dataCount = view.getUint32(4)
    this.instructionCount = instructionCount
    this.dataCount = dataCount

    memory.reset()
    stdout.reset()
    register.reset()
    register.PC = 0x400000

    this.instructions = []
    for (let i = 0; i < instructionCount; i++) {
      const word = view.getUint32(4 * (i + 2))
      const address = 0x400000 + 4 * i
      const decoded = decode(word)
      memory.setWord(0x400000 + 4 * i, word)
      const instructionInfo = { word, address, decoded }
      this.instructions.push(instructionInfo)
      printDecode(word)
    }

    for (let i = 0; i < dataCount; i++) {
      const word = view.getUint32(4 * (i + 2 + instructionCount))
      memory.setWord(0x10000000 + 4 * i, word)
    }

    console.log(instructionCount, dataCount)

    console.log(array)

    this.breakPoints = {}
    this.registerChanged = {}
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

  async onConsoleInput() {
    const input = this.consoleInput.toString()
    if (!input) return

    stdout.print(input)
    this.repl(input)
    this.consoleInput = ''
    this.scrollDownConsole()
  }

  formatHex(number: number) {
    return number.toString(16).padStart(8, '0')
  }

  repl(commands: string) {
    const [command, arg1, arg2] = commands.split(/\s+/)

    if (command === 'j') {
      console.debug('[프로그램 점프하기] 주소: %s\n', arg1)
      const pcAddress = parseInt(arg1) >>> 0
      if (Number.isInteger(pcAddress)) register.jump(pcAddress)
      return
    } else if (command === 'g') {
      stdout.printDebug('[프로그램 전체 실행]')
      return this.go()
    } else if (command === 's') {
      stdout.printDebug('[프로그램 명령어 한 단계 실행]')
      return this.step()
    } else if (command === 'sm') {
      stdout.printDebug(`[프로그램 메모리 설정] 주소: ${arg1}, 값: ${arg2}`)
      const memoryAddress = parseInt(arg1)
      const memoryValue = parseInt(arg2)
      if (!Number.isInteger(memoryAddress) || !Number.isInteger(memoryValue)) {
        return stdout.printError('[ERROR] 잘못된 명령어입니다.')
      }
      return memory.setWord(memoryAddress >>> 0, memoryValue >>> 0)
    } else if (command === 'sr') {
      const registerIndex = parseInt(arg1)
      const registerValue = parseInt(arg2)
      stdout.printDebug(
        `[프로그램 레지스터 설정] 인덱스: ${registerIndex}, 값: ${registerValue}`
      )
      if (
        !Number.isInteger(registerIndex) ||
        !Number.isInteger(registerValue)
      ) {
        return stdout.printError('[ERROR] 잘못된 명령어입니다.')
      }
      this.register.saveState()
      this.register.set(registerIndex, registerValue >>> 0)
      this.registerChanged = this.register.compareState()
      return
    } else if (command === 'm') {
      stdout.printDebug(`[메모리 출력] 시작: ${arg1}, 끝: ${arg2}`)
      const memoryStart = parseInt(arg1)
      const memoryEnd = parseInt(arg2)
      if (!Number.isInteger(memoryStart) || !Number.isInteger(memoryEnd)) {
        return stdout.printError('[ERROR] 잘못된 명령어입니다.')
      }
      return memory.printMemory(memoryStart, memoryEnd)
    } else if (command === 'r') {
      return this.stdout.printDebug('옆 레지스터 칸을 보세요')
    } else if (command === 'c') {
      return this.stdout.reset()
    } else if (command === 'b') {
      const breakPointAddress = parseInt(arg1)
      if (!Number.isInteger(breakPointAddress)) {
        return stdout.printError('[ERROR] 잘못된 명령어입니다.')
      }

      this.breakPoints[breakPointAddress] = !this.breakPoints[breakPointAddress]
      stdout.printDebug(
        `중단점 ${this.breakPoints[breakPointAddress] ? '설정' : '해제'}`
      )
      return
    } else if (command === 'help' || command === 'h') {
      stdout.print('[사용가능한 명령어]')
      stdout.print('j <주소>                  해당하는 주소로 점프합니다.')
      stdout.print('g                        프로그램 전체를 실행합니다.')
      stdout.print(
        's                        프로그램 명령어 하나를 실행합니다.'
      )
      stdout.print(
        'm <시작 주소> <끝 주소>    해당하는 주소의 메모리를 출력합니다.'
      )
      stdout.print(
        'sm <주소> <값>            해당하는 주소의 메모리를 설정합니다.'
      )
      stdout.print(
        'sr <인덱스> <값>          해당하는 인덱스의 레지스터를 설정합니다.'
      )
      stdout.print('c                        콘솔창을 비웁니다.')
      return
    }

    stdout.printError('[ERROR] 잘못된 명령어입니다.')
  }

  showBreakPoint() {
    this.stdout.print('Break Point')
    this.showSnackbar(
      `중단점 0x${this.register.PC.toString(16)}에서 실행을 멈춥니다.`
    )
  }

  showSnackbar(text: string) {
    this.snackbarText = text
    this.snackbar = true
  }

  async mounted() {
    const response = await fetch('./1.bin')
    const binary = await response.arrayBuffer()
    this.readBinray(binary)
  }
}
</script>

<style lang="scss" scoped>
.w-100 {
  width: 100%;
}

.h-100 {
  height: 100%;
}

.h-50 {
  height: 50%;
}

.app-container {
  margin: 4rem;
  padding: 1rem;
  background: rgba($color: #000000, $alpha: 0.5) !important;
}

.header {
  display: flex;
  align-content: center;
  height: 4rem;
  font-size: 2rem;
  font-weight: bold;
  margin-top: 1rem;
  padding: 0 1rem;

  &-title {
    align-self: center;
  }

  &-actions {
    align-self: center;
  }
}

.running {
  background: #555;
  border-radius: 8px;
}

.changed {
  color: red;
}

.hidden {
  display: none;
}

.code {
  font-family: monospace;
  font-size: 1rem;
}

.card {
  height: 100%;
  width: 100%;
  background: rgba($color: #000000, $alpha: 0.7) !important;
  display: flex;
  flex-direction: column;

  &-title {
    font-weight: bold;
    font-size: 1.4rem;
    margin: 0.8rem 0.8rem 0 0.8rem;
    padding-bottom: 0;
  }

  &-text {
    overflow-y: auto;
    scrollbar-width: thin;
    width: calc(100% - 0.8rem);
    height: 100%;
    margin: 0.8rem;
  }
}

.breakpoint {
  height: 24px;
}

.stack-data {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
