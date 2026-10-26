#pragma once
#include <cmath>
#include <cstdint>
#include "shared_config.h"

struct Safety {
  uint8_t fault = 0;
  bool heater = false;
  bool sensorReady = false;
  float temp = NAN;
  float temp2 = NAN;
  bool secondPresent = false;
  bool secondRequired = false;
  uint32_t lastHeartbeat = 0;
  uint32_t lastSample = 0;
  bool hasHeartbeat = false;
  static bool valid(float t) { return std::isfinite(t) && t >= -55 && t <= 125 && t != 85 && t != -127; }
  void trip(uint8_t reason) { fault |= reason; heater = false; }
  void heartbeat(uint32_t now) { lastHeartbeat = now; hasHeartbeat = true; }
  void sample(float t, float t2, bool second, uint32_t now) {
    temp = t; temp2 = t2; secondPresent = second; lastSample = now;
    sensorReady = valid(t) && (!second || valid(t2)) && (!secondRequired || second);
    if (!sensorReady) trip(SENSOR_FAULT);
    if (sensorReady && (t >= TRIP_C || (second && t2 >= TRIP_C))) trip(THERMAL_TRIP);
  }
  void tick(uint32_t now) {
    if (!hasHeartbeat || uint32_t(now - lastHeartbeat) > WATCHDOG_MS) trip(LINK_TIMEOUT);
    if (!sensorReady || uint32_t(now - lastSample) > SAMPLE_MS * 4) { heater = false; if (sensorReady) trip(SENSOR_FAULT); }
    if (fault) heater = false;
  }
  bool setHeater(bool on, uint32_t now, bool armed) {
    tick(now);
    heater = on && armed && !fault && sensorReady;
    return heater == on;
  }
  bool reset(uint32_t now) {
    if (!sensorReady || uint32_t(now - lastSample) > SAMPLE_MS * 4 || !hasHeartbeat || uint32_t(now - lastHeartbeat) > WATCHDOG_MS || temp >= TRIP_C - RESET_MARGIN_C || (secondPresent && temp2 >= TRIP_C - RESET_MARGIN_C)) return false;
    fault = 0; heater = false; return true;
  }
};
