/* IoT data usage calculator: estimates monthly cellular data per device and per fleet from editable assumptions. */
(function () {
  'use strict';

  var root = document.querySelector('[data-iot-calculator]');
  if (!root) {
    return;
  }

  var i18n = {};
  try {
    i18n = JSON.parse(document.getElementById('iot-calculator-i18n').textContent);
  } catch (e) {
    i18n = {};
  }

  var MB = 1024 * 1024;
  var DAYS = 30;

  // Example starting points only; every value stays editable and is shown on the page.
  var PRESETS = {
    gps: { devices: 100, interval: 30, activeHours: 10, payload: 50, overhead: 80, heartbeat: 180, heartbeatSize: 20, events: 10, eventSize: 60, downlinks: 2, downlinkSize: 50, setups: 24, setupSize: 200, otaMb: 0, retry: 10 },
    meter: { devices: 500, interval: 900, activeHours: 24, payload: 200, overhead: 80, heartbeat: 0, heartbeatSize: 0, events: 2, eventSize: 100, downlinks: 1, downlinkSize: 100, setups: 1, setupSize: 5000, otaMb: 0, retry: 5 },
    pos: { devices: 50, interval: 0, activeHours: 12, payload: 0, overhead: 80, heartbeat: 300, heartbeatSize: 40, events: 80, eventSize: 2000, downlinks: 5, downlinkSize: 500, setups: 80, setupSize: 5000, otaMb: 2, retry: 5 }
  };

  var fields = Array.prototype.slice.call(root.querySelectorAll('[data-field]'));

  function num(name) {
    var el = root.querySelector('[data-field="' + name + '"]');
    var v = el ? parseFloat(el.value) : 0;
    return isFinite(v) && v > 0 ? v : 0;
  }

  function fmt(value, digits) {
    var lang = document.documentElement.lang || 'en';
    return Number(value).toLocaleString(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }

  function compute() {
    var activeHours = Math.min(num('activeHours'), 24);
    var idleHours = 24 - activeHours;
    var overhead = num('overhead');
    var interval = num('interval');
    var heartbeat = num('heartbeat');

    var reportsPerDay = interval > 0 ? (activeHours * 3600) / interval : 0;
    var heartbeatsPerDay = heartbeat > 0 ? (idleHours * 3600) / heartbeat : 0;

    var parts = {
      reports: reportsPerDay * (num('payload') + overhead),
      heartbeats: heartbeatsPerDay * (num('heartbeatSize') + overhead),
      events: num('events') * (num('eventSize') + overhead),
      downlinks: num('downlinks') * (num('downlinkSize') + overhead),
      setups: num('setups') * num('setupSize')
    };

    var retry = 1 + num('retry') / 100;
    var monthly = {};
    var trafficBytes = 0;
    Object.keys(parts).forEach(function (key) {
      monthly[key] = parts[key] * DAYS * retry;
      trafficBytes += monthly[key];
    });
    monthly.ota = num('otaMb') * MB;

    var perDeviceMb = (trafficBytes + monthly.ota) / MB;
    var devices = Math.max(1, Math.round(num('devices')) || 1);
    return { perDeviceMb: perDeviceMb, fleetGb: (perDeviceMb * devices) / 1024, devices: devices, monthly: monthly, reportsPerDay: reportsPerDay };
  }

  function render() {
    var r = compute();
    root.querySelector('[data-out="perDevice"]').textContent = fmt(r.perDeviceMb, r.perDeviceMb < 10 ? 2 : 1) + ' MB';
    root.querySelector('[data-out="fleet"]').textContent = fmt(r.fleetGb, r.fleetGb < 10 ? 2 : 1) + ' GB';
    root.querySelector('[data-out="devices"]').textContent = fmt(r.devices, 0);
    root.querySelector('[data-out="reports"]').textContent = fmt(r.reportsPerDay, 0);

    var total = Object.keys(r.monthly).reduce(function (s, k) { return s + r.monthly[k]; }, 0) || 1;
    Object.keys(r.monthly).forEach(function (key) {
      var row = root.querySelector('[data-break="' + key + '"]');
      if (!row) {
        return;
      }
      var mb = r.monthly[key] / MB;
      row.querySelector('[data-break-value]').textContent = fmt(mb, mb < 1 ? 3 : 2) + ' MB';
      row.querySelector('[data-break-bar]').style.width = Math.round((r.monthly[key] / total) * 100) + '%';
    });

    var note = root.querySelector('[data-out="note"]');
    note.textContent = r.perDeviceMb <= 30 ? (i18n.fits30 || '') : (i18n.over30 || '');

    var wa = root.querySelector('[data-out="whatsapp"]');
    if (wa) {
      var text = (i18n.waIntro || '') + ' ' + fmt(r.perDeviceMb, 1) + ' MB/' + (i18n.perDeviceMonth || 'device/month') + ', ' + r.devices + ' ' + (i18n.devicesWord || 'devices') + ', ' + (i18n.interval || 'interval') + ' ' + num('interval') + ' s. ' + (i18n.waAsk || '');
      wa.href = 'https://wa.me/' + (wa.getAttribute('data-number') || '') + '?text=' + encodeURIComponent(text);
    }
  }

  function applyPreset(name) {
    var p = PRESETS[name];
    if (!p) {
      return;
    }
    fields.forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (Object.prototype.hasOwnProperty.call(p, key)) {
        el.value = p[key];
      }
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-preset]'), function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-preset') === name ? 'true' : 'false');
    });
    render();
  }

  fields.forEach(function (el) {
    el.addEventListener('input', render);
  });
  Array.prototype.forEach.call(root.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', function () {
      applyPreset(btn.getAttribute('data-preset'));
    });
  });

  applyPreset('gps');
})();
