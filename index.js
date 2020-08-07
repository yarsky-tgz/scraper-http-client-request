const merge = require('deepmerge');
const request = require('request-promise-native');
const CloudflareBypasser = require('cloudflare-bypasser');
const promiseRetryOrigin = require('promise-retry');
const NotRetryableError = require('./errors/NotRetryableError');

class ResponseError extends Error {
  constructor(message, response) {
    super(message);
    this.response = response;
  }
}

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
};
const STAGES_CONSTANTS = {
  RAW: 0,
  CLOUDFLARE: 1,
  PROXIED_RAW: 2,
  PROXIED_CLOUDFLARE: 3,
};
const STAGE_DESCRIPTION = {
  [STAGES_CONSTANTS.RAW]: 'direct connection',
  [STAGES_CONSTANTS.CLOUDFLARE]: 'cloudflare bypasser',
  [STAGES_CONSTANTS.PROXIED_RAW]: 'proxy',
  [STAGES_CONSTANTS.PROXIED_CLOUDFLARE]: 'proxied cloudflare bypasser',
};
const RETRY_OPTIONS = {
  retries: 10,
  factor: 0,
  minTimeout: 0,
};

const clientTypes = [
  options => request.defaults(options),
  (options) => {
    const cf = new CloudflareBypasser(options);
    return async (...args) => {
      const result = await cf.request(...args);
      if ((result.statusCode !== 200) && ((result.statusCode !== 301)))
        throw new ResponseError('Wrong status code', result)
      return result
    }
  },
];

function getClients(proxyWrapper, jar) {
  const options = merge({}, DEFAULT_OPTIONS);
  options.jar = jar;
  const clients = clientTypes.map(clientType => clientType(options));
  for (let i = 0; i < clientTypes.length; i++) clients.push(proxyWrapper(clients[i]));
  return clients;
}

const clientConstructor = (limiter) => {
  const jar = request.jar();
  let proxy;
  let additionalOptions;
  let initialStage = 0;
  let shouldUseProxyNextTime = false;
  const proxyWrapper = client => (options) => {
    if (!proxy) throw new NotRetryableError('Proxy is not set');
    const optionsCopy = (typeof options === 'string')
      ? { url: options, proxy } : Object.assign({ proxy }, options);
    return client(optionsCopy);
  };
  const clients = getClients(proxyWrapper, jar);
  const promiseRetry = limiter.wrap(promiseRetryOrigin);
  const requestWrapper = (options, checkResult) => {
    if (additionalOptions) {
      options = (typeof options === 'string')
        ? merge({ url: options }, additionalOptions) : merge(options, additionalOptions);
    }
    const priority = options.priority || 5;
    delete options.priority;
    let currentStage = shouldUseProxyNextTime ? STAGES_CONSTANTS.PROXIED_RAW : initialStage;
    let currentRetry = 0;
    return promiseRetry.withOptions({ priority }, (retry) => {
      requestWrapper.usedProxy = (currentStage >= 2);
      requestWrapper.headers = Object.assign({}, DEFAULT_OPTIONS.headers, options.headers);
      //log.info(`fetching ${options.url || options} via ${STAGE_DESCRIPTION[currentStage]}, priority ${priority}, try #${currentRetry}`);
      return clients[currentStage](options)
        .then((result) => {
          if (!checkResult || checkResult(result)) {
            shouldUseProxyNextTime = false;
            return result.body;
          }
          throw new Error('result did not pass check');
        })
        .catch((e) => {
          if (e instanceof NotRetryableError) throw e;
          const code = (e && e.response && e.response.statusCode) || 1000;
          const rawMessage = e.message || e.toString();
          const errorMessage = rawMessage.length < 50 ? rawMessage : `server responded with code ${code}, try #${currentRetry}`;
          currentRetry++;
          if (currentRetry > 2) {
            currentStage += (code !== 503) && ((currentStage === STAGES_CONSTANTS.RAW)
              || (currentStage === STAGES_CONSTANTS.RAW)) ? 2 : 1;
            currentRetry = 0;
          }
          if (currentStage > (clients.length - 1)) throw e;
          //log.error(`retrying ${options.url || options} because ${errorMessage}`);
          retry(e);
        });
    }, RETRY_OPTIONS);
  };
  requestWrapper.jar = jar;
  requestWrapper.addOptions = (options) => {
    additionalOptions = options;
  };
  requestWrapper.setStage = (stage) => {
    initialStage = stage;
  };
  requestWrapper.setProxy = ({ host, port }) => {
    proxy = `http://${host}:${port}`;
  };
  requestWrapper.shouldUseProxyNextTime = () => {
    shouldUseProxyNextTime = true;
  };
  return requestWrapper;
};
clientConstructor.stages = STAGES_CONSTANTS;

module.exports = clientConstructor;
