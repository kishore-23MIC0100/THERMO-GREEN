import { readFileSync, writeFileSync } from 'node:fs';
const c = JSON.parse(readFileSync(new URL('../shared/safety.json', import.meta.url), 'utf8'));
const names = {
  tripC: 'TRIP_C',
  resetMarginC: 'RESET_MARGIN_C',
  watchdogMs: 'WATCHDOG_MS',
  sampleMs: 'SAMPLE_MS',
};
const lines = [
  '// Generated from shared/safety.json. Run npm run generate; do not edit.',
  '#pragma once',
  '#include <cstdint>',
];
for (const [key, name] of Object.entries(names))
  lines.push(
    `constexpr ${key.endsWith('C') ? 'float' : 'uint32_t'} ${name} = ${c[key]}${key.endsWith('C') ? 'f'.replace('f', Number.isInteger(c[key]) ? '.0f' : 'f') : 'U'};`,
  );
for (const [key, value] of Object.entries(c.faults))
  lines.push(`constexpr uint8_t ${key} = ${value};`);
writeFileSync(
  new URL('../firmware/esp32/include/shared_config.h', import.meta.url),
  lines.join('\n') + '\n',
);
