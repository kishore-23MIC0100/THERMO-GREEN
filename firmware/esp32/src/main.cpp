#include <Arduino.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"
#include "safety.h"

OneWire wire(SENSOR_PIN);
DallasTemperature sensors(&wire);
Safety safety;
DeviceAddress reactorAddress, plateAddress;
bool reactorPresent = false, platePresent = false;
uint32_t conversionAt = 0, lastEmit = 0, seq = 0;
uint32_t gasTotal = 0, gasCount = 0;
int gas = 0;
char input[192];
size_t used = 0;
bool discarding = false;

void relay() { digitalWrite(RELAY_PIN, (safety.heater != RELAY_ACTIVE_LOW) ? HIGH : LOW); }
void telemetry(int ack = -1, bool accepted = true) {
  JsonDocument d;
  d["v"] = 2; d["seq"] = seq++; d["uptime_ms"] = millis();
  if (std::isfinite(safety.temp)) d["temp"] = safety.temp; else d["temp"] = nullptr;
  if (platePresent && std::isfinite(safety.temp2)) d["temp2"] = safety.temp2; else d["temp2"] = nullptr;
  d["gas"] = gas; d["heater"] = safety.heater ? 1 : 0; d["fault"] = safety.fault;
  d["trip_c"] = TRIP_C; d["armed"] = RELAY_POLARITY_VERIFIED; d["firmware"] = FIRMWARE_VERSION;
  if (ack >= 0) { d["ack"] = ack; d["accepted"] = accepted; }
  serializeJson(d, Serial); Serial.println();
}
void command() {
  JsonDocument d;
  if (deserializeJson(d, input)) { safety.trip(BAD_COMMAND); relay(); return; }
  int id = d["id"].is<int>() && d["id"].as<int>() >= 0 ? d["id"].as<int>() : -1;
  const char* cmd = d["cmd"] | "";
  bool ok = true;
  if (!strcmp(cmd, "heartbeat")) safety.heartbeat(millis());
  else if (!strcmp(cmd, "estop")) safety.trip(E_STOP);
  else if (!strcmp(cmd, "reset_fault")) ok = safety.reset(millis());
  else if (!strcmp(cmd, "heater") || (d["cmd"].isNull() && d["heater"].is<int>())) {
    JsonVariant v = !strcmp(cmd, "heater") ? d["value"] : d["heater"];
    if (!v.is<int>() || (v.as<int>() != 0 && v.as<int>() != 1)) { safety.trip(BAD_COMMAND); ok = false; }
    else ok = safety.setHeater(v.as<int>() == 1, millis(), RELAY_POLARITY_VERIFIED);
  } else { safety.trip(BAD_COMMAND); ok = false; }
  safety.tick(millis()); relay();
  if (strcmp(cmd, "heartbeat") || id >= 0) telemetry(id, ok);
}
void setup() {
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW); pinMode(RELAY_PIN, OUTPUT);
  Serial.begin(115200); analogReadResolution(12); analogSetPinAttenuation(GAS_PIN, ADC_11db);
  safety.secondRequired = SECOND_PROBE_REQUIRED;
  sensors.begin(); sensors.setResolution(11); sensors.setWaitForConversion(false);
  reactorPresent = sensors.getAddress(reactorAddress, 0);
  platePresent = sensors.getAddress(plateAddress, 1);
  sensors.requestTemperatures(); conversionAt = millis();
}
void loop() {
  uint32_t now = millis();
  // Bound serial work so malformed/flooded input cannot starve autonomous safety.
  for (int n = 0; n < 64 && Serial.available(); ++n) {
    char c = char(Serial.read());
    if (c == '\n') {
      if (!discarding && used) { input[used] = 0; command(); }
      used = 0; discarding = false;
    } else if (c != '\r' && !discarding) {
      if (used < sizeof(input) - 1) input[used++] = c;
      else { discarding = true; safety.trip(BAD_COMMAND); }
    }
  }
  gasTotal += analogRead(GAS_PIN); ++gasCount;
  if (uint32_t(now - conversionAt) >= SAMPLE_MS) {
    safety.sample(reactorPresent ? sensors.getTempC(reactorAddress) : NAN, platePresent ? sensors.getTempC(plateAddress) : NAN, platePresent, now);
    gas = int(gasTotal / gasCount); gasTotal = 0; gasCount = 0;
    sensors.requestTemperatures(); conversionAt = now;
  }
  safety.tick(now); relay();
  if (uint32_t(now - lastEmit) >= SAMPLE_MS) { telemetry(); lastEmit = now; }
  delay(1);
}
