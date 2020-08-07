# scraper-http-client-request
Powerful HTTP client for scrapers with cookies jar, cloudflare bypasser, rate limiter, concurrency and retrys

## Install

```bash
npm i scraper-http-client-request bottleneck
```

## Intro: what I will get?

You will get [`request-promise-native`](https://npmjs.com/package/request-promise-native) wrapped together with

* [`deepmerge`](https://npmjs.com/package/deepmerge)
* [`promise-retry`](https://npmjs.com/package/promise-retry)
* [`cloudflare-bypasser`](https://npmjs.com/package/cloudflare-bypasser)

## Usage

```javascript
const Bottleneck = require('bottleneck')
const client = require('scraper-http-client-request')(new Bottleneck({
  maxConcurrent: 10, //concurrent requests at the same time
  minTime: 333 //slow down, limit rate to keep pause between requests, reead the [docs](https://npmjs.com/package/cloudflare-bypasser)
}))

```
