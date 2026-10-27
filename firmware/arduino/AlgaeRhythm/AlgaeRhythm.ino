
/*
  AlgaeRhythm / THERMO-GREEN - ESP32 USB Web Serial firmware
  Compatible with the repository's v2 newline-delimited JSON protocol.

  IMPORTANT SAFETY:
  - Heater is disabled until the physical relay OFF/ON polarity has been verified.
  - Keep the heater's 12 V circuit DISCONNECTED during first USB/sensor tests.
  - Verify a DC-rated switching path, fusing, an independent thermal cutoff,
    safe ESP32 startup bias, wiring and coolant flow before any powered test.
  - The ESP32 cannot verify pump circulation without an installed flow sensor.
  - Firmware reports its GPIO/relay output, not verified contact feedback.

  Arduino IDE libraries: OneWire, DallasTemperature, ArduinoJson (version 7.x).
  Board: ESP32 Dev Module. Serial: 115200 baud.
*/

#include <Arduino.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>
#include <string.h>

// ================= PIN CONFIGURATION =================

constexpr uint8_t TEMP_PIN  = 4;
constexpr uint8_t MQ_PIN    = 34;
constexpr uint8_t RELAY_PIN = 23;

// ================= RELAY CONFIGURATION =================

// IMPORTANT: Verify with heater power disconnected.
constexpr bool RELAY_ACTIVE_LOW = true;
constexpr bool RELAY_POLARITY_VERIFIED = false;

// ================= SAFETY SETTINGS =================

constexpr float TRIP_C = 35.5f;
constexpr float RESET_MARGIN_C = 2.0f;

constexpr uint32_t SAMPLE_MS = 500;
constexpr uint32_t WATCHDOG_MS = 3000;
constexpr uint32_t SENSOR_STALE_MS = SAMPLE_MS * 4;

constexpr char FIRMWARE_VERSION[] = "1.0.0-arduino";

// ================= FAULT CODES =================

enum Fault : uint8_t {
  THERMAL_TRIP = 1,
  SENSOR_FAULT = 2,
  LINK_TIMEOUT = 4,
  E_STOP = 8,
  BAD_COMMAND = 16
};

// ================= SENSOR SETUP =================

OneWire oneWire(TEMP_PIN);
DallasTemperature ds18b20(&oneWire);

// ================= GLOBAL VARIABLES =================

float reactorC = NAN;
int gasADC = 0;

bool heaterOn = false;
bool sensorSampled = false;
bool sensorOK = false;
bool heartbeatReceived = false;

uint8_t faultMask = 0;

uint32_t lastSampleMs = 0;
uint32_t conversionStartedMs = 0;
uint32_t lastHeartbeatMs = 0;
uint32_t lastTelemetryMs = 0;
uint32_t sequence = 0;

char inputLine[192];
size_t inputLength = 0;
bool discardLongLine = false;

// ================= RELAY CONTROL =================

void applyRelay() {

  const bool outputOn =
      heaterOn &&
      RELAY_POLARITY_VERIFIED &&
      faultMask == 0;

  digitalWrite(
    RELAY_PIN,
    outputOn
        ? (RELAY_ACTIVE_LOW ? LOW : HIGH)
        : (RELAY_ACTIVE_LOW ? HIGH : LOW)
  );
}

// ================= FAULT HANDLING =================

void trip(uint8_t reason) {

  faultMask |= reason;

  heaterOn = false;

  applyRelay();
}

// ================= HEARTBEAT CHECK =================

bool freshHeartbeat(uint32_t now) {

  return heartbeatReceived &&
         uint32_t(now - lastHeartbeatMs) <= WATCHDOG_MS;
}

// ================= SENSOR FRESHNESS =================

bool freshSensor(uint32_t now) {

  return sensorSampled &&
         sensorOK &&
         uint32_t(now - lastSampleMs) <= SENSOR_STALE_MS;
}

// ================= TEMPERATURE VALIDATION =================

bool validTemperature(float t) {

  return isfinite(t) &&
         t >= -55.0f &&
         t <= 125.0f &&
         t != 85.0f &&
         t != DEVICE_DISCONNECTED_C;
}

// ================= SAFETY CONTROLLER =================

void enforceSafety(uint32_t now) {

  if (!freshHeartbeat(now)) {
    trip(LINK_TIMEOUT);
  }

  if (sensorSampled && !freshSensor(now)) {
    trip(SENSOR_FAULT);
  }

  if (sensorOK && reactorC >= TRIP_C) {
    trip(THERMAL_TRIP);
  }

  if (!freshSensor(now) || faultMask != 0) {
    heaterOn = false;
  }

  applyRelay();
}

// ================= SENSOR READING =================

void sampleSensors(uint32_t now) {

  if (uint32_t(now - conversionStartedMs) < SAMPLE_MS) {
    return;
  }

  // Read DS18B20
  const float measured = ds18b20.getTempCByIndex(0);

  reactorC = validTemperature(measured)
      ? measured
      : NAN;

  sensorOK = isfinite(reactorC);

  sensorSampled = true;
  lastSampleMs = now;

  if (!sensorOK) {
    trip(SENSOR_FAULT);
  }

  // Read MQ-135 with averaging
  uint32_t sum = 0;

  for (int n = 0; n < 8; ++n) {
    sum += uint32_t(analogRead(MQ_PIN));
  }

  gasADC = int(sum / 8);

  // Start next nonblocking conversion
  ds18b20.requestTemperatures();

  conversionStartedMs = now;
}

// ================= SEND REAL-TIME JSON =================

void publishTelemetry(
    int ack = -1,
    bool accepted = true
) {

  JsonDocument packet;

  packet["v"] = 2;
  packet["seq"] = sequence++;
  packet["uptime_ms"] = millis();

  if (sensorOK) {
    packet["temp"] = reactorC;
  } else {
    packet["temp"] = nullptr;
  }

  packet["temp2"] = nullptr;

  packet["gas"] = gasADC;
  packet["heater"] = heaterOn ? 1 : 0;
  packet["fault"] = faultMask;

  packet["trip_c"] = TRIP_C;
  packet["armed"] = RELAY_POLARITY_VERIFIED;
  packet["firmware"] = FIRMWARE_VERSION;

  if (ack >= 0) {
    packet["ack"] = ack;
    packet["accepted"] = accepted;
  }

  serializeJson(packet, Serial);

  // One JSON object per line
  Serial.println();
}

// ================= RESET SAFETY FAULT =================

bool resetAllowed(uint32_t now) {

  return freshHeartbeat(now) &&
         freshSensor(now) &&
         reactorC < TRIP_C - RESET_MARGIN_C;
}

// ================= RECEIVE DASHBOARD COMMANDS =================

void handleCommand() {

  JsonDocument command;

  DeserializationError error =
      deserializeJson(command, inputLine);

  if (error) {

    trip(BAD_COMMAND);
    publishTelemetry();
    return;
  }

  const int id =
      command["id"].is<int>() &&
      command["id"].as<int>() >= 0
          ? command["id"].as<int>()
          : -1;

  const char* action = command["cmd"] | "";

  bool accepted = false;

  const uint32_t now = millis();

  // -------- HEARTBEAT --------

  if (strcmp(action, "heartbeat") == 0) {

    heartbeatReceived = true;
    lastHeartbeatMs = now;

    accepted = true;
  }

  // -------- EMERGENCY STOP --------

  else if (strcmp(action, "estop") == 0) {

    trip(E_STOP);
    accepted = true;
  }

  // -------- RESET FAULT --------

  else if (strcmp(action, "reset_fault") == 0) {

    if (resetAllowed(now)) {

      faultMask = 0;
      heaterOn = false;

      accepted = true;
    }
  }

  // -------- HEATER COMMAND --------

  else if (
      strcmp(action, "heater") == 0 ||
      (
        command["cmd"].isNull() &&
        command["heater"].is<int>()
      )
  ) {

    JsonVariant requested =
        strcmp(action, "heater") == 0
            ? command["value"]
            : command["heater"];

    if (
      !requested.is<int>() ||
      (
        requested.as<int>() != 0 &&
        requested.as<int>() != 1
      )
    ) {

      trip(BAD_COMMAND);
    }

    else if (requested.as<int>() == 0) {

      heaterOn = false;

      accepted = true;
    }

    else {

      enforceSafety(now);

      accepted =
          RELAY_POLARITY_VERIFIED &&
          faultMask == 0 &&
          freshHeartbeat(now) &&
          freshSensor(now) &&
          reactorC < TRIP_C;

      heaterOn = accepted;
    }
  }

  // -------- INVALID COMMAND --------

  else {

    trip(BAD_COMMAND);
  }

  enforceSafety(now);

  if (
    strcmp(action, "heartbeat") != 0 ||
    id >= 0
  ) {

    publishTelemetry(id, accepted);
  }
}

// ================= SERIAL MESSAGE READER =================

void processSerial() {

  for (
    int n = 0;
    n < 64 && Serial.available() > 0;
    ++n
  ) {

    const char c = char(Serial.read());

    if (c == '\n') {

      if (!discardLongLine && inputLength > 0) {

        inputLine[inputLength] = '\0';

        handleCommand();
      }

      inputLength = 0;
      discardLongLine = false;
    }

    else if (c != '\r' && !discardLongLine) {

      if (inputLength < sizeof(inputLine) - 1) {

        inputLine[inputLength++] = c;

      } else {

        discardLongLine = true;

        trip(BAD_COMMAND);
      }
    }
  }
}

// ================= SETUP =================

void setup() {

  // Keep heater OFF on startup
  digitalWrite(
    RELAY_PIN,
    RELAY_ACTIVE_LOW ? HIGH : LOW
  );

  pinMode(RELAY_PIN, OUTPUT);

  applyRelay();

  // USB Serial
  Serial.begin(115200);

  // MQ-135 analog input
  analogReadResolution(12);
  analogSetPinAttenuation(MQ_PIN, ADC_11db);

  // Temperature sensor
  ds18b20.begin();

  ds18b20.setResolution(11);

  ds18b20.setWaitForConversion(false);

  ds18b20.requestTemperatures();

  conversionStartedMs = millis();

  lastTelemetryMs = millis();

  // No human-readable Serial banners.
  // Dashboard requires JSON-only communication.
}

// ================= MAIN LOOP =================

void loop() {

  const uint32_t now = millis();

  // Read incoming dashboard commands
  processSerial();

  // Get live hardware sensor values
  sampleSensors(now);

  // Execute independent safety logic
  enforceSafety(now);

  // Send live data every 500ms
  if (
    uint32_t(now - lastTelemetryMs) >= SAMPLE_MS
  ) {

    lastTelemetryMs = now;

    publishTelemetry();
  }

  delay(1);
}
