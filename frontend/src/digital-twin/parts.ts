export const PARTS = {
  heater: {
    name: 'Thermal test vehicle',
    spec: '40 W PTC plate · 12 V / 3.3 A',
    role: 'Represents AI-workload heat; this is not a real server.',
    connections: 'Relay-controlled heater rail → cold plate',
    hazard: 'Hot surface. Use a fused, DC-rated switching path.',
  },
  coldplate: {
    name: 'Aluminium Block #1',
    spec: 'Cold plate · approximately 4 × 4 × 2 cm',
    role: 'Transfers PTC heat into the closed coolant loop.',
    connections: 'Pump → Block #1 → reactor heat exchanger',
    hazard:
      'A beaker-only sensor cannot detect local overheating after pump failure. Add a second probe here.',
  },
  pump: {
    name: 'R385 diaphragm pump',
    spec: '12 V direct supply · nominal ~1.2 L/min',
    role: 'Circulates distilled water in the closed loop.',
    connections: 'Separate 12 V supply branch; no ESP32 control',
    hazard: 'Flow is not instrumented. Confirm circulation physically before heating.',
  },
  tubes: {
    name: 'Closed coolant circuit',
    spec: 'Silicone tube · 6 mm ID / 8 mm OD',
    role: 'Transfers heat without mixing coolant and reactor medium.',
    connections: 'Pump → Block #1 → Block #2 → pump',
    hazard:
      'Check clamps and leaks with heater power disconnected. Flow animation is illustrative.',
  },
  exchanger: {
    name: 'Block #2 / heat exchanger',
    spec: 'Submerged closed-circuit exchanger',
    role: 'Transfers heat into the reactor water.',
    connections: 'Block #1 → Block #2 → pump',
    hazard:
      'Bare aluminium reacts with alkaline lime water and can release hydrogen. Use distilled water or a compatible isolated exchanger.',
  },
  reactor: {
    name: 'Reactor container',
    spec: '250 mL borosilicate beaker',
    role: 'Current prototype uses water for thermal experiments.',
    connections: 'Isolated exchanger + DS18B20 probe',
    hazard: 'Keep liquids below and away from all power rails. No carbon capture is measured here.',
  },
  probe: {
    name: 'DS18B20 temperature probe',
    spec: 'GPIO 4 · 4.7 kΩ pull-up to 3.3 V',
    role: 'Measures reactor temperature for safety and analysis.',
    connections: '3.3 V / GND / GPIO 4',
    hazard: 'Disconnected, NaN, and power-on sentinel readings force heater OFF.',
  },
  gas: {
    name: 'MQ-135 gas module',
    spec: 'GPIO 34 · raw 12-bit ADC',
    role: 'Records a relative gas-sensor response.',
    connections: 'Analog output through verified 5 V → 3.3 V divider',
    hazard:
      'This sensor is not a calibrated CO₂ instrument. Never interpret raw ADC as ppm or captured mass.',
  },
  esp32: {
    name: 'ESP32 DevKit V1',
    spec: 'USB serial · 115200 baud',
    role: 'Has autonomous final authority over heater safety.',
    connections: 'GPIO 4 sensor · GPIO 34 gas · GPIO 23 relay',
    hazard: 'Lost heartbeat, sensor fault, thermal trip, or E-stop latches heater OFF.',
  },
  relay: {
    name: 'Opto-isolated relay',
    spec: '5 V module · GPIO 23 signal',
    role: 'Switches the heater branch only.',
    connections: 'GPIO 23 → relay IN; fused heater rail through contacts',
    hazard:
      'Verify polarity using a lamp before connecting the heater. Contacts must be DC rated at 12 V / 3.3 A or higher.',
  },
  supply: {
    name: 'DC power supply',
    spec: '12 V / 5 A',
    role: 'Powers the heater and always-powered pump branch.',
    connections: 'Separate fused heater and pump branches',
    hazard: 'Keep AC mains enclosed; isolate wet apparatus from electrical connections.',
  },
} as const;
export type PartId = keyof typeof PARTS;
