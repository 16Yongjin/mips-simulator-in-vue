export enum SHIFT_OPERATION { NO_SHIFT, SLL, SRL, SRA };

export enum ADD_SUB { ADD, SUB };

export enum LOGIC_OPERATION { AND, OR, XOR, NOR };

enum ALU_OPERATION { SHIFT, CHECK_ZERO, ADD_SUB, LOGIC_OPERATION };

const ALU_OPERATION_STR = ['No Shift', 'SLL', 'SRL', 'SRA', 'Set Less', 'Set Less', 'Set Less', 'Set Less', 'Add', 'Subtract', 'Add', 'Subtract', 'AND', 'OR', 'XOR', 'NOR']

export const logicOperation = (X: number, Y: number, S: number) => {
  switch (S) {
    case LOGIC_OPERATION.AND: return X & Y
    case LOGIC_OPERATION.OR: return X | Y
    case LOGIC_OPERATION.XOR: return X ^ Y
    case LOGIC_OPERATION.NOR: return ~(X | Y)
    default: console.error('[ERROR] error in logic operation\n'); return -1
  }
}

export const shiftOperation = (X: number, Y: number, C: number) => {
  switch (C) {
    case SHIFT_OPERATION.NO_SHIFT: return X
    case SHIFT_OPERATION.SLL: return X << Y
    case SHIFT_OPERATION.SRL: return X >>> Y
    case SHIFT_OPERATION.SRA: return X >> Y
    default: console.error('[ERROR] error in shift operation\n'); return -1
  }
}

export const addSubtract = (X: number, Y: number, C: number) => {
  switch (C) {
    case ADD_SUB.ADD: return X + Y
    case ADD_SUB.SUB: return X - Y
    default: console.error('[ERROR] error in add/sub operation\n'); return -1
  }
}
export const checkSetLess = (X: number, Y: number) => {
  return +(X < Y)
}

export const ALU = (X: number, Y: number, S: number): number => {
  console.debug('[DEBUG] ALU %s 연산 실행\n', ALU_OPERATION_STR[S])

  const S32 = (S >> 2) & 3
  const S10 = S & 3
  const S0 = S & 1

  switch (S32) {
    case ALU_OPERATION.SHIFT: return shiftOperation(X, Y, S10)
    case ALU_OPERATION.CHECK_ZERO: return checkSetLess(X, Y)
    case ALU_OPERATION.ADD_SUB: return addSubtract(X, Y, S0)
    case ALU_OPERATION.LOGIC_OPERATION: return logicOperation(X, Y, S10)
    default: console.error('[ERROR] Compiler is weired\n'); return -1
  }
}
