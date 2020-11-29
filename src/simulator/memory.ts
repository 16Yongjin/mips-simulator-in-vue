import { stdout } from './stdout'

enum SIZE { BYTE, HALF_WORD, WORD };

enum READ_WRITE { READ, WRITE };

const bytesToUint32 = (bytes: number[]) => new DataView(new Uint8Array(bytes).buffer).getUint32(0)

class Memory {
  programMEM: Uint8Array
  dataMEM: Uint8Array
  stackMEM: Uint8Array

  constructor() {
    this.programMEM = new Uint8Array({ length: 0x100000 })
    this.dataMEM = new Uint8Array({ length: 0x100000 })
    this.stackMEM = new Uint8Array({ length: 0x100000 })
  }

  setByte(address: number, value: number) {
    this.MEM(address, value, READ_WRITE.WRITE, SIZE.BYTE)
  }

  setHalfWord(address: number, value: number) {
    this.MEM(address, value, READ_WRITE.WRITE, SIZE.HALF_WORD)
  }

  setWord(address: number, value: number) {
    this.MEM(address, value, READ_WRITE.WRITE, SIZE.WORD)
  }

  getByte(address: number) {
    return this.MEM(address, 0, READ_WRITE.READ, SIZE.BYTE)
  }

  getHalfWord(address: number) {
    return this.MEM(address, 0, READ_WRITE.READ, SIZE.HALF_WORD)
  }

  getWord(address: number) {
    return this.MEM(address, 0, READ_WRITE.READ, SIZE.WORD)
  }

  MEM(address: number, value: number, nRW: READ_WRITE, size: number) {
    const sel = address >> 20
    const offset = address & 0xFFFFF
    let pM = null

    // 메모리 종류 선택
    if (sel === 0x004) pM = this.programMEM // program memory
    else if (sel === 0x100) pM = this.dataMEM // data memory
    else if (sel === 0x7FF) pM = this.stackMEM // stack
    else { stdout.printError('[ERROR] 잘못된 메모리 접근\n'); return -1 }

    // 워드 사이즈 선택
    let _size = 0
    if (size === SIZE.BYTE) _size = 1
    else if (size === SIZE.HALF_WORD) _size = 2
    else if (size === SIZE.WORD) _size = 4

    if (nRW === READ_WRITE.READ) { // 메모리 읽기
      let bytes = [0, 0, 0, 0]
      for (let i = 0; i < _size; i++) {
        bytes.push(pM[offset + i])
      }
      bytes = bytes.slice(-4)
      const word = bytesToUint32(bytes)
      return word
    } else if (nRW === READ_WRITE.WRITE) { // 메모리 쓰기
      const bytes = new Uint32Array([value])
      const view = new DataView(bytes.buffer)
      for (let i = 0; i < _size; i++) {
        pM[offset + (_size - i - 1)] = view.getUint8(i)
      }
    }

    return 0
  }

  reset() {
    this.programMEM = new Uint8Array({ length: 0x100000 })
    this.dataMEM = new Uint8Array({ length: 0x100000 })
    this.stackMEM = new Uint8Array({ length: 0x100000 })
  }

  view(start: number, end: number) {
    const words = []
    for (let address = start; address <= end; address += 4) {
      const word = this.getWord(address)
      words.push({ address, word })
    }
    return words
  }

  printMemory(start: number, end: number) {
    const words = this.view(start, end)
    stdout.printDebug('------------------------')
    stdout.printDebug('|  address |   value   |')
    stdout.printDebug('|----------------------|')
    words.forEach(({ address, word }) => {
      stdout.printDebug(`| ${address.toString(16).padStart(8, '0')} | ${word.toString(16).padStart(9, '0')} |`)
    })
    stdout.printDebug('------------------------')
  }
}
export const memory = new Memory()
