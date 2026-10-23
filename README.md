# IoT Data Usage Calculator

A small, dependency-free calculator that estimates the **monthly cellular data** of an IoT device and a whole fleet: GPS trackers, smart meters, POS terminals, gateways and similar devices.

- **Hosted version (English / 中文 / Español):** https://www.globallotsim.com/iot-data-usage-calculator/
- **Run locally:** download the repository and open `index.html` in a browser. No build step, no tracking, no network calls.

## How the estimate works

For one device per day the calculator adds:

| Traffic | Formula |
|---------|---------|
| Reports | active hours × 3,600 ÷ reporting interval × (payload + protocol overhead) |
| Heartbeats | idle hours × 3,600 ÷ heartbeat interval × (heartbeat payload + overhead) |
| Events | events per day × (event payload + overhead) |
| Commands | downlink commands per day × (command payload + overhead) |
| Connection setup | new connections per day × bytes per setup |

The daily total is multiplied by 30 days and by `1 + retry margin`, then firmware (OTA) volume per month is added. The fleet total is the per-device figure × number of devices. 1 MB = 1,048,576 bytes.

## Example presets

The presets are starting points, not measurements. Replace them with your own device settings.

| Preset | Interval | Active hours | Payload | Result per device |
|--------|----------|--------------|---------|-------------------|
| GPS tracker | 30 s | 10 h | 50 B | about 6 MB / month |
| Smart meter | 15 min | 24 h | 200 B | about 1 MB / month |
| POS terminal | event-driven, 80 transactions/day over TLS | 12 h | 2 KB | about 20 MB / month |

## Inputs that are often underestimated

- **Protocol overhead:** IP and TCP headers plus acknowledgements can double a small report.
- **Reconnections:** a TLS handshake can cost several kilobytes; reconnecting for every message can use more data than the messages.
- **Retries:** weak coverage, vehicles and metal enclosures increase resends.
- **Firmware updates:** a single full image can exceed a month of telemetry.

Always confirm the estimate with measured usage from a pilot.

## Related guides

- [IoT SIM for GPS trackers: 30 MB plans, pooled data and APN setup](https://www.globallotsim.com/gps-tracker-sim/)
- [APN and SMS setup for GPS trackers](https://github.com/loginzhou/gps-tracker-iot-sim-apn-settings)
- [APN setup for cellular modules and routers](https://github.com/loginzhou/globallotsim-iot-apn-config-guide)

Maintained by [Quanqiu IoT](https://www.globallotsim.com), a Global IoT SIM and eSIM connectivity provider.
- [GPS tracker reporting intervals and keep-alive timers](https://www.globallotsim.com/iot-sim-for-gps-tracker-reporting-intervals-and-keep-alive-timers/) — firmware settings that drive monthly data

## License

MIT
