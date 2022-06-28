'use strict';

const express = require('express');

// Setup Prometheus client
const client = require('prom-client');

// Collect default metrics from Prometheus
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({
    timeout: 10000,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // These are the default buckets.
  });

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

// Setup custom histogram for http_request_duration_ms
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]  // buckets for response time from 0.1ms to 500ms
})

// Use middleware to pass our response start time
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next() 
})

app.get('/', (req, res, next) => {
  res.json({msg: 'Hello World'});
  next() // Ensure that we continue the request
});

// Use middleware to calculate how long the response took and pass it to the custom Prometheus gauge.
app.use((req, res, next) => {
  const responseTimeInMs = Date.now() - res.locals.startEpoch
  httpRequestDurationMicroseconds
    .labels(req.method, req.path, res.statusCode)
    .observe(responseTimeInMs)

  next()
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.end(await client.register.metrics())
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);