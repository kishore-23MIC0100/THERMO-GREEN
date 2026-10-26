"""Keep direct PlatformIO builds in sync with the canonical safety table."""
import json
from pathlib import Path
Import('env')
root = Path(env.subst('$PROJECT_DIR')).resolve().parent.parent
c = json.loads((root / 'shared/safety.json').read_text())
lines = ['// Generated from shared/safety.json. Run npm run generate; do not edit.', '#pragma once', '#include <cstdint>']
for key, name in [('tripC', 'TRIP_C'), ('resetMarginC', 'RESET_MARGIN_C'), ('watchdogMs', 'WATCHDOG_MS'), ('sampleMs', 'SAMPLE_MS')]:
    lines.append(f'constexpr {"float" if key.endswith("C") else "uint32_t"} {name} = {float(c[key]) if key.endswith("C") else c[key]}{"f" if key.endswith("C") else "U"};')
for key, value in c['faults'].items():
    lines.append(f'constexpr uint8_t {key} = {value};')
(root / 'firmware/esp32/include/shared_config.h').write_text('\n'.join(lines) + '\n')
