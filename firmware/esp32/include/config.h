#pragma once
#include "shared_config.h"
constexpr int SENSOR_PIN = 4;
constexpr int GAS_PIN = 34;
constexpr int RELAY_PIN = 23;
// Verify with a lamp and the heater disconnected, then set true and reflash.
constexpr bool RELAY_POLARITY_VERIFIED = false;
constexpr bool RELAY_ACTIVE_LOW = true;
constexpr bool SECOND_PROBE_REQUIRED = false;
constexpr char FIRMWARE_VERSION[] = "1.0.0";
