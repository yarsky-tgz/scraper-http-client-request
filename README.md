# scraper-http-client-request
Powerful HTTP client for scrapers with cookies jar, cloudflare bypasser, rate limiter, concurrency and retrys

## Install

```bash
npm i scraper-http-client-request bottleneck
```

## Intro: what I will get?

You will get HTTP __client__ [`request-promise-native`](https://npmjs.com/package/request-promise-native) wrapped together with

* [`promise-retry`](https://npmjs.com/package/promise-retry)
* [`cloudflare-bypasser`](https://npmjs.com/package/cloudflare-bypasser)

and it will be wrapped into created by you [bottleneck](https://npmjs.com/package/bottleneck)

While retrying it will use such loop: 

*direct* -> *through proxy* -> *direct, cloudflare-bypassing* -> *proxy, clooudflare-bypassing*

## Default options

```javascript
const DEFAULT_OPTIONS = {
  json: true,
  resolveWithFullResponse: true,
  gzip: true,
  followAllRedirects: true,
  encoding: 'utf8',
  agentOptions: {
    keepAlive: true,
    keepAliveMsecs: 3000,
  },
  timeout: 8000,
  headers: {
    accept: 'application/json,text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'en-US;q=0.8,en;q=0.7',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'upgrade-insecure-requests': 1,
  },
}
```

you can `.addOptions(additionalOptionsObject)` and it weel be deep merged into above defaults. 

## Usage

```javascript
const Bottleneck = require('bottleneck')
const client = require('scraper-http-client-request')(new Bottleneck({
  maxConcurrent: 10, //concurrent requests at the same time
  minTime: 333 //slow down, limit rate to keep pause between requests, reead the [docs](https://npmjs.com/package/bottleneck)
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
client.setProxy({ host: '', port: 3128 })
client.shouldUseProxyNextTime() //it will use proxy next time
client.addOptions() //merge some options to defaults of `request-promise-native`
client.setPromiseRetryOptions(options) //you can set your own
```
