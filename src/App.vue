<template lang="pug">
  v-app.app(dark)
    .app-container.rounded-xl
      app-header(@step="step" @go="go")
      v-container.h-100(fluid)
        v-row(style="height: calc(100vh - 16rem)")
          instruction-panel(
            :breakPoints="breakPoints"
            :presetFiles="presetFiles"
            :instructions="instructions"
            @loadFile="loadFile"
            @openFile="openFile"
            @write="onUserWrite"
          )
          register-panel(:registerChanged="registerChanged")
          v-col.h-100.d-flex.flex-column(cols="6")
            memory-panel(:dataCount="dataCount" :key="Math.random()")
            console-panel(v-model="consoleInput" @consoleEnter="onConsoleInput")

        input.hidden(type="file" ref="file" @change="onFile")
        v-snackbar(v-model="snackbar")
          | {{ snackbarText }}
          template(v-slot:action="{ attrs }")
            v-btn(text @click="snackbar = false, continueGo(register.PC)" v-bind="attrs") 계속
            v-btn(text @click="snackbar = false, continueStep()" v-bind="attrs") 한 단계
            v-btn(text @click="snackbar = false" v-bind="attrs") 취소
    .credit
      | 20-2 Computer Architecture Team 3 조용진, 김상우, 오석진
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import AppHeader from '@/components/AppHeader.vue'
import BreakPoint from '@/components/BreakPoint.vue'
import ConsolePanel from '@/components/ConsolePanel.vue'
import MemoryPanel from '@/components/MemoryPanel.vue'
import RegisterPanel from '@/components/RegisterPanel.vue'
import InstructionPanel from '@/components/InstructionPanel.vue'
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

@Component({
  name: 'Instruction',
  components: {
    AppHeader,
    BreakPoint,
    ConsolePanel,
    MemoryPanel,
    RegisterPanel,
    InstructionPanel
  }
})
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

    if (!file) return

    const binary = await file.arrayBuffer()
    this.readBinray(binary)
  }

  async loadFile(url: string) {
    const response = await fetch(url)
    const binary = await response.arrayBuffer()
    this.readBinray(binary)
  }

  onUserWrite({ words, data }: { words: number[]; data: number[] }) {
    this.readUserInstruction(words, data)
  }

  readUserInstruction(words: number[], data: number[]) {
    this.instructionCount = words.length
    this.dataCount = data.length

    memory.reset()
    stdout.reset()
    register.reset()
    register.PC = 0x400000
    this.breakPoints = {}
    this.registerChanged = {}
    this.instructions = []

    this.instructions = words.map((word, i) => {
      const address = 0x400000 + 4 * i
      const decoded = decode(word)
      memory.setWord(0x400000 + 4 * i, word)
      const instructionInfo = { word, address, decoded }
      return instructionInfo
    })

    data.forEach((word, i) => {
      memory.setWord(0x10000000 + 4 * i, word)
    })
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
      memory.setWord(address, word)
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

  async onConsoleInput() {
    const input = this.consoleInput.toString()
    if (!input) return

    stdout.print(input)
    this.repl(input)
    this.consoleInput = ''
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
    const response = await fetch('/1.bin')
    const binary = await response.arrayBuffer()
    this.readBinray(binary)
  }
}
</script>

<style lang="scss">
.app {
  background-image: url('/background.jpg') !important;
  background-repeat: no-repeat;
  background-size: cover !important;
}

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
  margin: 3rem;
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
}

.card {
  height: 100%;
  width: 100%;
  background: rgba($color: #000000, $alpha: 0.7) !important;
  display: flex !important;
  flex-direction: column;

  &-title {
    font-weight: bold;
    font-size: 1.4rem;
    margin: 0.8rem 0.8rem 0 0.8rem !important;
    padding-bottom: 0 !important;
  }

  &-text {
    position: relative;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba($color: #fff, $alpha: 0.3) transparent;
    height: calc(100% - 1.6rem);
    padding: 1.5rem;
    margin: 0.8rem 0;
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

.credit {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}
</style>
