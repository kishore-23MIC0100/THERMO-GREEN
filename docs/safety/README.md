# Safety invariants and limits

| Invariant | Implementation |
|---|---|
| Boot OFF | Output initialized OFF; relay polarity interlock ships disabled |
| Thermal trip | Reactor or present second probe at/above shared trip threshold latches THERMAL_TRIP |
| Invalid sensor | -127, 85, NaN, out-of-range, required missing second probe or stale conversion prevents heat |
| Link failure | More than 3 s since heartbeat latches LINK_TIMEOUT, independent of browser |
| Emergency stop | E_STOP is latched, immediate OFF |
| Reset | Explicit request, fresh valid samples, heartbeat present and all present probes below trip−2 °C; leaves heater OFF |
| Bad input | Unsupported or malformed command latches BAD_COMMAND; bounded serial processing preserves safety loop scheduling |
| UI requests | Fresh v2 telemetry, no faults, matching threshold, armed firmware and relay dwell; pending until ack |
| Storage failure | Automatic requests stop, OFF requested and recording failure shown |

`shared/safety.json` is authoritative. Never change the hard trip by editing a dashboard input. The setpoint ceiling is clamped to trip−0.5 °C.

Fault bits: THERMAL_TRIP=1, SENSOR_FAULT=2, LINK_TIMEOUT=4, E_STOP=8, BAD_COMMAND=16. Multiple reasons combine by bitwise OR.

The firmware and browser cannot guarantee a welded contact opens, a poorly rated relay switches safely, the pump actually runs, the cold plate stays cool, or a sensor is mounted correctly. Flow and power are not instrumented. Use physical power isolation and a second source probe; commission ratings, polarity, electrical isolation, liquid compatibility and fuse selection on the real rig.

This software is a supervised laboratory prototype. No industrial safety certification or hardware production acceptance is claimed.
