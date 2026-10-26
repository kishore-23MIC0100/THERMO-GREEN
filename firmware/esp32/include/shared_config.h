// Generated from shared/safety.json. Run npm run generate; do not edit.
#pragma once
#include <cstdint>
constexpr float TRIP_C = 35.5f;
constexpr float RESET_MARGIN_C = 2.0f;
constexpr uint32_t WATCHDOG_MS = 3000U;
constexpr uint32_t SAMPLE_MS = 500U;
constexpr uint8_t THERMAL_TRIP = 1;
constexpr uint8_t SENSOR_FAULT = 2;
constexpr uint8_t LINK_TIMEOUT = 4;
constexpr uint8_t E_STOP = 8;
constexpr uint8_t BAD_COMMAND = 16;
