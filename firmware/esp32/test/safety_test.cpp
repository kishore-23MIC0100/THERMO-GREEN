#include "safety.h"
#include <cassert>
#include <iostream>
Safety ready() { Safety s; s.heartbeat(100); s.sample(28, NAN, false, 100); return s; }
int main() {
  Safety s; s.tick(0); assert(!s.heater); assert(s.fault & LINK_TIMEOUT);
  s = ready(); assert(s.setHeater(true, 100, true)); s.sample(TRIP_C, NAN, false, 200); assert(!s.heater && (s.fault & THERMAL_TRIP));
  s.sample(34, NAN, false, 300); assert(!s.reset(300)); s.sample(30, NAN, false, 400); assert(s.reset(400)); assert(!s.heater);
  for (float t : {-127.f, 85.f, NAN, 126.f}) { s = ready(); s.setHeater(true, 100, true); s.sample(t, NAN, false, 200); assert(!s.heater && (s.fault & SENSOR_FAULT)); }
  s = ready(); s.setHeater(true, 100, true); s.tick(3101); assert(!s.heater && (s.fault & LINK_TIMEOUT)); assert(!s.reset(3101));
  s = ready(); s.trip(E_STOP); assert(!s.setHeater(true, 200, true)); assert(s.reset(200));
  s = ready(); assert(!s.setHeater(true, 100, false)); s.sample(28, 36, true, 200); assert(s.fault & THERMAL_TRIP);
  s = ready(); s.secondRequired = true; s.sample(28, NAN, false, 200); assert(s.fault & SENSOR_FAULT);
  s = ready(); s.setHeater(true, 100, true); s.heartbeat(2500); s.tick(2500); assert(s.fault & SENSOR_FAULT);
  s = ready(); s.trip(BAD_COMMAND); assert(!s.setHeater(true, 200, true));
  s = ready(); s.lastHeartbeat = UINT32_MAX - 1000; s.lastSample = 500; s.tick(500); assert(!(s.fault & LINK_TIMEOUT));
  std::cout << "Firmware safety: boot, trip latch, cooldown, sentinels, watchdog, estop, arm interlock, second probe, sample freshness, bad command, rollover PASS\n";
}
