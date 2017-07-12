const {
  splitInstruction,
  wrapMaxInt
 } = require('../utils');
const {
  INSTRUCTION_MAP,
  REGISTERS,
  STACK_SIZE,
  ARITHMETIC
} = require('../constants');

const output = (value, mode) => {
  switch (mode) {
    case 1:
      process.stdout.write(value.toString(2));
      break;
    case 2:
      process.stdout.write(value.toString(16));
      break;
    case 3:
      process.stdout.write(String.fromCharCode(value));
      break;
    case 0:
    default:
      process.stdout.write(value.toString());
  }
}

const pushStack = (stack, registers, val) => {
  if (registers.SP === STACK_SIZE - 1) {
    console.log('[Error] Stack overflow. Exiting...');
    process.exit(1);
  }
  stack[registers.SP++] = val;
};

const popStack = (stack, registers) => {
  if (registers.SP === 0) {
    console.log('[Error] Stack underflow. Exiting...');
    process.exit(1);
  }
  return stack[--registers.SP];
};

const arithmetic = (registers, rs, rd, high8) => {
  const arithmeticOperation = high8 & 0b00000011;
  const resultMode = high8 & 0b00000100;
  const resultRegister = (resultMode === ARITHMETIC.DESTINATION_MODE)
    ? rd
    : rs;
  let result = 0;

  switch (arithmeticOperation) {
    case ARITHMETIC.ADD:
      result = registers[REGISTERS[rd]] + registers[REGISTERS[rs]];
      break;
    case ARITHMETIC.SUB:
      result = registers[REGISTERS[rs]] - registers[REGISTERS[rd]];
      break;
    case ARITHMETIC.MUL:
      result = registers[REGISTERS[rs]] * registers[REGISTERS[rd]];
      break;
    case ARITHMETIC.DIV:
      result = Math.floor(registers[REGISTERS[rs]] / registers[REGISTERS[rd]]);
      break;
  }

  registers[REGISTERS[resultRegister]] = wrapMaxInt(result);
}

module.exports = (instruction, registers, memory, stack) => {
  const [opcode, rd, rs, high8, high10] = splitInstruction(instruction);
  const namedOpcode = INSTRUCTION_MAP[opcode];

  switch (namedOpcode) {
    case 'CAL':
      pushStack(stack, registers, registers.IP);
      registers.IP = high10;
      return false;
    case 'RET':
      registers.IP = popStack(stack, registers);
      return false;

    case 'MOV':
      registers[REGISTERS[rd]] = registers[REGISTERS[rs]];
      return false;
    case 'LDV':
      registers[REGISTERS[rd]] = high10;
      return false;
    case 'LDR':
      registers[REGISTERS[rd]] = memory[high10];
      return false;
    case 'LDM':
      memory[high10] = registers[REGISTERS[rd]];
      return false;

    case 'ATH':
      arithmetic(registers, rs, rd, high8);
      return false;

    case 'SFT':
      registers[REGISTERS[rs]] = (rd === 0)
        ? registers[REGISTERS[rs]] << high8
        : registers[REGISTERS[rs]] >> high8;
      return false;

    case 'PSH':
      pushStack(stack, registers, registers[REGISTERS[rs]]);
      return false;
    case 'POP':
      registers[REGISTERS[rd]] = popStack(stack, registers);
      return false;

    case 'JLT':
      if (registers.A < registers[REGISTERS[rd]]) {
        registers.IP = high10;
      }
      return false;

    case 'OUT':
      output(registers[REGISTERS[rs]], high8);
      return false;

    case 'HLT': return true;

    default:
      console.log(`Unknown opcode ${opcode}. Exiting...`);
      process.exit(1);
      return false;
  }
}