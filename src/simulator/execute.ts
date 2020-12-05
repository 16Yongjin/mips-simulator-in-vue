import { memory } from './memory'
import { register } from './register'
import { ALU } from './alu'
import { decode, OPCODE, FUNCT } from './decode'
import { stdout } from './stdout'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [$zero, $at, $v0, $v1, $a0, $a1, $a2, $a3, $t0, $t1, $t2, $t3, $t4, $t5, $t6, $g7, $s0, $s1, $s2, $s3, $s4, $s5, $s6, $s7, $t8, $t9, $k0, $k1, $gp, $sp, $fp, $ra] = Array.from({ length: register.size }).map((_, i) => i)

enum ALU_OPS {
  ALU_NO_SHIFT, ALU_SLL, ALU_SRL, ALU_SRA, ALU_SET_LESS, ALU_ADD = 8, ALU_SUBTRACT, ALU_AND = 12, ALU_OR, ALU_XOR, ALU_NOR
};

const R = register.R

export const sll = (rd: number, rt: number, sh: number) => {
  // R[$rd] ← R[$rt] << shamt
  R[rd] = ALU(R[rt], sh, ALU_OPS.ALU_SLL) >>> 0
  return 0
}

export const srl = (rd: number, rt: number, sh: number) => {
  // R[$rd] ← R[$rt] >> shamt
  R[rd] = ALU(R[rt], sh, ALU_OPS.ALU_SRL) >>> 0
  return 0
}

export const sra = (rd: number, rt: number, sh: number) => {
  // R[$rd] ← R[$rt] >> shamt
  R[rd] = ALU(R[rt], sh, ALU_OPS.ALU_SRA) >>> 0
  return 0
}

export const jr = (rs: number) => {
  // PC ← R[$rs]
  register.PC = R[rs]
  return 0
}

export const syscall = () => {
  switch (R[$v0]) {
    case 1: stdout.print(R[$a0].toString()); break
    case 10: stdout.print('프로그램 종료'); return 1
    case 11: stdout.print(String.fromCharCode(R[$a0])); break
  }
  return 0
}

export const mfhi = (rd: number) => {
  // R[$rd] ← HI
  R[rd] = register.HI >>> 0
  return 0
}

export const mflo = (rd: number) => {
  // R[$rd] ← LO
  R[rd] = register.LO >>> 0
  return 0
}

export const mul = (rs: number, rt: number) => {
  // {HI, LO} ← R[$rs] * R[$rt]
  const result = R[rs] * R[rt]
  register.HI = Math.floor(result / 4294967296)
  register.LO = (result & 0xFFFFFFFF) >>> 0
  return 0
}

export const add = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] + R[$rt]
  R[rd] = ALU(R[rs] >> 0, R[rt] >> 0, ALU_OPS.ALU_ADD) >>> 0
  stdout.printDebug(`[DEBUG] ADD 결과: R[rd] ${R[rd]}`)
  return 0
}

export const sub = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] - R[$rt]
  R[rd] = ALU(R[rs] >> 0, R[rt] >> 0, ALU_OPS.ALU_SUBTRACT) >>> 0
  stdout.printDebug(`[DEBUG] SUB 결과: R[rd] ${R[rd]}\n`)
  return 0
}

export const and = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] & R[$rt]
  R[rd] = ALU(R[rs], R[rt], ALU_OPS.ALU_AND) >>> 0
  return 0
}

export const or = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] | R[$rt]
  R[rd] = ALU(R[rs], R[rt], ALU_OPS.ALU_OR) >>> 0
  return 0
}

export const xor = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] ^ R[$rt]
  R[rd] = ALU(R[rs], R[rt], ALU_OPS.ALU_XOR) >>> 0
  return 0
}

export const nor = (rd: number, rs: number, rt: number) => {
  R[rd] = ALU(R[rs], R[rt], ALU_OPS.ALU_NOR) >>> 0
  return 0
}

export const slt = (rd: number, rs: number, rt: number) => {
  // R[$rd] ← R[$rs] < R[$rt]
  R[rd] = ALU(R[rs], R[rt], ALU_OPS.ALU_SET_LESS) >>> 0
  return 0
}

/** J 포맷 명령어 */

export const j = (address: number) => {
  // PC ← {(PC + 4)[31:28], address, 00}
  register.PC = (((register.PC + 4) & 0xf0000000) | (address << 2)) >>> 0
  return 0
}

export const jal = (address: number) => {
  // R[31] ← PC + 8
  // PC ← {(PC + 4)[31:28], address, 00}

  R[$ra] = register.PC
  register.PC = (((register.PC + 4) & 0xf0000000) | (address << 2)) >>> 0
  return 0
}

/** I 포맷 명령어 */

export const bltz = (rs: number, rt: number, imm: number) => {
  if (R[rs] < R[rt]) register.PC = register.PC + imm * 4 >>> 0
  return 0
}

export const beq = (rs: number, rt: number, imm: number) => {
  // if(R[$rs] = R[$rt])
  //   PC ← PC + 4 + SignExt18b({imm, 00})
  if (R[rs] === R[rt]) register.PC = register.PC + imm * 4 >>> 0
  return 0
}

export const bne = (rs: number, rt: number, imm: number) => {
  // if(R[$rs] != R[$rt])
  //  PC ← PC + 4 + SignExt18b({imm, 00})
  if (R[rs] !== R[rt]) register.PC = register.PC + imm * 4 >>> 0
  return 0
}

export const addi = (rt: number, rs: number, imm: number) => {
  // R[$rt] ← R[$rs] + SignExt16b(imm)
  R[rt] = ALU(R[rs], imm, ALU_OPS.ALU_ADD) >>> 0
  return 0
}

export const slti = (rt: number, rs: number, imm: number) => {
  // R[$rt] ← R[$rs] < SignExt16b(imm)
  R[rt] = ALU(R[rs], imm, ALU_OPS.ALU_SET_LESS) >>> 0
  return 0
}

export const andi = (rt: number, rs: number, imm: number) => {
  // R[$rt] ← R[$rs] & {0 × 16, imm}
  R[rt] = ALU(R[rs], imm, ALU_OPS.ALU_AND) >>> 0
  return 0
}

export const ori = (rt: number, rs: number, imm: number) => {
  // R[$rt] ← R[$rs] | {0 × 16, imm}
  R[rt] = ALU(R[rs], imm, ALU_OPS.ALU_OR) >>> 0
  return 0
}

export const xori = (rt: number, rs: number, imm: number) => {
  // R[$rt] ← R[$rs] ^ {0 × 16, imm}
  R[rt] = ALU(R[rs], imm, ALU_OPS.ALU_XOR) >>> 0
  return 0
}

export const lui = (rt: number, imm: number) => {
  // R[$rt] ← {(imm)[15:0], 0 × 16}
  R[rt] = (imm & 0xffff) << 16 >>> 0
  return 0
}

export const lb = (rt: number, imm: number, rs: number) => {
  // R[$rt] ← SignExt8b(Mem1B(R[$rs] + SignExt16b(imm)))
  R[rt] = memory.getByte(R[rs] + imm) >>> 0
  stdout.printDebug(`[DEBUG] lb 읽은 메모리: 0x${R[rt].toString(16)}`)
  return 0
}

export const lw = (rt: number, imm: number, rs: number) => {
  // R[$rt] ← Mem4B(R[$rs] + SignExt16b(imm))
  R[rt] = memory.getWord(R[rs] + imm) >>> 0
  stdout.printDebug(`[DEBUG] lw 읽은 메모리: 0x${R[rt].toString(16)}`)
  return 0
}

export const lbu = (rt: number, imm: number, rs: number) => {
  // R[$rt] ← {0 × 24, Mem1B(R[$rs] + SignExt16b(imm))}
  R[rt] = memory.getByte(R[rs] + imm) >>> 0
  return 0
}

export const sb = (rt: number, imm: number, rs: number) => {
  // Mem1B(R[$rs] + SignExt16b(imm)) ← (R[$rt])[7:0]
  memory.setByte(R[rs] + imm, R[rt])
  return 0
}

export const sw = (rt: number, imm: number, rs: number) => {
  // Mem4B(R[$rs] + SignExt16b(imm)) ← R[$rt]
  memory.setWord(R[rs] + imm, R[rt])
  return 0
}

export const instructionFetch = () => {
  // 1. PC 값을 읽어서 메모리에서 명령어 가져오기
  const instruction = memory.getWord(register.PC)
  register.PC = register.PC + 4
  return instruction
}

// 명령어 한 단계씩 실행. s 명령어 입력 시 실행됨
export const stepProgram = () => {
  // TODO: 명렁어 하나만 실행
  // 1. Instruction Fetch: 명령어 가져오기

  const instruction = instructionFetch()

  stdout.printDebug(`[DEBUG] 실행한 명령어: ${decode(instruction)}`)

  // 임시로 명령어가 0x00000000이면 실행 중지
  // 0x00000000인 명령어도 있지만 (sll 0 0 0)
  // go 명령어 실행 시 멈출 방법이 없기 때문
  if (instruction === 0) return 1

  // 2. Instruction Decode: 명령어 해석

  const opcode = instruction >>> 26
  const rs = (instruction >>> 21) & 0b11111
  const rt = (instruction >>> 16) & 0b11111
  const rd = (instruction >>> 11) & 0b11111
  const sh = (instruction >>> 6) & 0b11111
  const imm = instruction << 16 >> 16
  const uImm = instruction & 0b1111111111111111
  const address = instruction & 0b11111111111111111111111111
  const funct = instruction & 0b111111

  // 3. EX, MA, RW: 명령어를 분기하고 해당되는 함수 실행
  if (opcode === OPCODE.R_FORMAT) {
    switch (funct) {
      case FUNCT.SLL: return sll(rd, rt, sh)
      case FUNCT.SRL: return srl(rd, rt, sh)
      case FUNCT.SRA: return sra(rd, rt, sh)
      case FUNCT.JR: return jr(rs)
      case FUNCT.SYSCALL: return syscall()
      case FUNCT.MFHI: return mfhi(rd)
      case FUNCT.MFLO: return mflo(rd)
      case FUNCT.MUL: return mul(rs, rt)
      case FUNCT.ADD: return add(rd, rs, rt)
      case FUNCT.SUB: return sub(rd, rs, rt)
      case FUNCT.AND: return and(rd, rs, rt)
      case FUNCT.OR: return or(rd, rs, rt)
      case FUNCT.XOR: return xor(rd, rs, rt)
      case FUNCT.NOR: return nor(rd, rs, rt)
      case FUNCT.SLT: return slt(rd, rs, rt)
      default: console.error('[ERROR] unknown instruction\n')
    }
  } else {
    switch (opcode) {
      case OPCODE.J: return j(address)
      case OPCODE.JAL: return jal(address)
      case OPCODE.BLTZ: return bltz(rs, rt, imm)
      case OPCODE.BEQ: return beq(rs, rt, imm)
      case OPCODE.BNE: return bne(rs, rt, imm)
      case OPCODE.ADDI: return addi(rt, rs, imm)
      case OPCODE.SLTI: return slti(rt, rs, imm)
      case OPCODE.ANDI: return andi(rt, rs, uImm)
      case OPCODE.ORI: return ori(rt, rs, uImm)
      case OPCODE.XORI: return xori(rt, rs, uImm)
      case OPCODE.LUI: return lui(rt, uImm)
      case OPCODE.LW: return lw(rt, imm, rs)
      case OPCODE.SW: return sw(rt, imm, rs)
      case OPCODE.LB: return lb(rt, imm, rs)
      case OPCODE.SB: return sb(rt, imm, rs)
      case OPCODE.LBU: return lbu(rt, imm, rs)
      default: console.error('[ERROR] unknown instruction\n')
    }
  }

  return 1 // 프로그램 끝났으면 1 반환, 아니면 0 반환
}

// 프로그램 전체 실행. g 명령어 입력 시 실행됨
export const goProgram = () => {
  // 프로그램 syscall 10까지 실행
  while (true) {
    const end = stepProgram()
    if (end) return
  }
}
