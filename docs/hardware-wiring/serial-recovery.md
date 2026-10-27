# ESP32 USB errors and safe recovery

The reported photos show fresh reactor/ADC readings, a latched `SENSOR FAULT + LINK TIMEOUT`, an unverified relay lock, and a stale “Serial port is closed” error. The photos establish symptoms; they do not establish sensor wiring, relay polarity, or the physical cause of a transient sensor fault.

## What the update fixes

- The runtime previously attempted periodic heartbeats while the USB chooser/port open was pending. Writes now wait for a ready transport and successful port open.
- Read EOF and write failures now detach the source, disable commands, mark pending requests failed, and clear current readings. A closed port cannot remain labeled LIVE. Old transport callbacks cannot feed a new session.
- Teardown is idempotent, releases/cancels stream resources, and bounds the best-effort OFF request before closing. A browser that has lost USB cannot guarantee OFF delivery; firmware independently handles heartbeat loss.
- Recognized ESP32 startup text is logged as boot/diagnostic output, not sensor data. Malformed JSON remains rejected; no reading is fabricated or silently repaired. Both firmware variants emit newline-delimited JSON at 115200 baud.
- Device fault bits are preserved separately from a browser-detected invalid probe. CSV exports both the effective safety mask and device-reported mask.
- The fault panel explains current versus latched conditions and why reset is blocked. An acknowledged reset does not arm or start heating and disables prior automatic workload demand.

## Interpret the flags

| State | Meaning and next action |
| --- | --- |
| `armed: false` | Intentional relay verification lock. Monitoring and a safe fault reset are available; heater ON stays blocked. Keep `RELAY_POLARITY_VERIFIED=false` until the documented physical checks are completed. |
| `fault & 4` | Heartbeat timeout latch. The supplied Arduino sketch deliberately latches it during startup before the first heartbeat. Keep the dashboard tab active and restore the USB/heartbeat stream. A fresh stream does not automatically clear the latch. |
| `fault & 2`, current probe invalid | Sensor reading is missing, sentinel, or otherwise invalid. Inspect DS18B20 wiring/pull-up and stable readings with heater power disconnected. Do not clear the guard to obtain heat. |
| `fault & 2`, current probe valid | A prior sensor fault remains latched. Inspect the cause and reading stability; current valid readings alone do not prove the physical fault was resolved. |
| `fault: 6` | Both sensor and heartbeat bits are set. Resolve both conditions before the explicit reset. |
| DISCONNECTED after a serial failure | Reconnect through the USB chooser. An old value is not a current live reading. |

## Dashboard recovery flow

1. Keep the heater supply disconnected during sensor/communication commissioning. Close Arduino/PlatformIO serial monitors so the USB port has one owner.
2. Refresh the updated dashboard, choose **Connect ESP32**, select the correct USB port, and wait for valid v2 sensor packets. The port opens at 115200 baud; the dashboard shows CONNECTING/AWAITING TELEMETRY rather than green LIVE before data arrives.
3. Keep the tab visible. Verify fresh, stable DS18B20 readings and the advertised 35.5 °C trip. All available probes must be valid and below **33.5 °C** before reset.
4. Select **Reset latched fault → Confirm reset** only after the fault cause is resolved. The ESP32 must acknowledge the request. Reset leaves the commanded heater output OFF.
5. `armed=false` remains an intentional lock after reset. Do not edit the verification flag just to enable the UI. Physical relay polarity, boot-time OFF behavior, appropriate test-load switching, independent cutoff, and safe reset bias must be verified separately with heater power disconnected.

A reported `heater=0/1` is firmware's commanded output state. It is not independent contact feedback, measured electrical power, or proof of coolant circulation.

## Heater switch behavior

After commissioning, fresh fault-free v2 telemetry must advertise `armed=true` and the matching trip before the dashboard permits ON. The **Heater power** switch sends an identified command and shows a pending request until firmware reports its state. An accepted acknowledgement must include the requested heater state; a mismatch is a failed command, not a successful ON indication. The switch never claims independent contact feedback.

**The Heater power toggle** can be selected again while ON is pending. It cancels the earlier ON request, sends OFF without waiting for restart dwell, and removes compute's automatic heater coupling. Late acknowledgement of the cancelled request cannot overwrite the latest command result with a spurious timeout. Fresh telemetry still determines the displayed state; stale/disconnected readings become unavailable. A rejected, timed-out, or inconsistent command requests OFF and explains the problem rather than hiding it.

The operator reported that physical relay verification has **not** been performed. Both firmware variants therefore retain `RELAY_POLARITY_VERIFIED=false`; this software update does not unlock or flash the real relay. Use a labelled simulation to demonstrate ON/OFF while the physical commissioning remains pending.

## Standalone Arduino sketch

The supplied sketch is preserved at `firmware/arduino/AlgaeRhythm/AlgaeRhythm.ino`, including:

```cpp
constexpr bool RELAY_ACTIVE_LOW = true;
constexpr bool RELAY_POLARITY_VERIFIED = false;
```

Arduino IDE dependencies are OneWire, DallasTemperature and ArduinoJson 7.x. A reproducible PlatformIO configuration is provided alongside the sketch:

```sh
pio run -d firmware/arduino
```

Observed compile: ESP32 Dev Module (`esp32dev`), espressif32 6.12.0, OneWire 2.3.8, DallasTemperature 3.11.0, ArduinoJson 7.4.2. It passed with 21,920 bytes RAM and 290,397 bytes flash; upstream OneWire preprocessor warnings remain. This compiles the generic target, not a verified upload for an identified physical board.

The original modular firmware remains in `firmware/esp32`. Its shared safety configuration and unverified relay flag are unchanged. Choose one firmware build for the board; do not combine two separate sketches in one Arduino folder. No device was flashed or physically tested here.

## Verification evidence

Unit checks cover stream-lock cleanup, unexpected EOF, write failure with an open read stream, chooser cancellation, device versus browser fault masks, and safe reset with an unverified relay. The browser serial fixture covers delayed port opening across a heartbeat interval, boot text, `fault=6`/`armed=false`, manual acknowledged reset, temperature/ADC propagation into status and the twin, and write-failure disconnection. These are declared fixtures, not physical hardware evidence.
