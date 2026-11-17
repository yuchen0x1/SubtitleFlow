export function downsampleToPcm16(input: Float32Array, inputRate: number, targetRate = 16000): Int16Array {
  if (inputRate <= 0 || targetRate <= 0) throw new Error('Sample rates must be positive');
  if (input.length === 0) return new Int16Array();
  if (inputRate === targetRate) return floatToPcm16(input);
  const ratio = inputRate / targetRate;
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Int16Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const sourceStart = Math.floor(index * ratio);
    const sourceEnd = Math.min(input.length, Math.max(sourceStart + 1, Math.floor((index + 1) * ratio)));
    let sum = 0;
    for (let sourceIndex = sourceStart; sourceIndex < sourceEnd; sourceIndex += 1) sum += input[sourceIndex];
    output[index] = clampToInt16(sum / (sourceEnd - sourceStart));
  }
  return output;
}

export function floatToPcm16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) output[index] = clampToInt16(input[index]);
  return output;
}

export function clampToInt16(value: number): number {
  const clamped = Math.max(-1, Math.min(1, value));
  return clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
}
