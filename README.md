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
const { STAGES: { PROXIED_CLOUDFLARE } } = require('scraper-http-client-request/constants')

/* 

**__Important__** on case of retry we have by default 4 stages cycle. You can set any other starting stage.

In case if we are RAW 'proxy' option will be ignore, but it must be present 

  1. RAW
  2. CLOUDFLARE
  3. PROXIED_RAW
  4. PROXIED_CLOUDFLARE
  
*/  

client.setStage(PROXIED_CLOUDFLARE) //get full needed security from start, to avoid pauses on load


```
