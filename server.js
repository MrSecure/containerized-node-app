'use strict';

const express = require('express');
const Prometheus = require('prom-client');
const metricsInterval = Prometheus.collectDefaultMetrics();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(await Prometheus.register.metrics())
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);