import axios from 'axios';
import { appLogger } from '../logger.js';
import { defaultMapping } from './tokenConfig.js';

export default class Accessify {
  constructor(token) {
    this.token = token;
  }
  get baseURL() {
    return `${process.env.ACCESSIFY_URL}/value`;
  }
  get publicURL() {
    return `${process.env.ACCESSIFY_PUBLIC_URL || process.env.ACCESSIFY_URL}/value`;
  }
  async store(key, value) {
    await axios.put(
      `${this.baseURL}/${key}`,
      { value, mimeType: 'text/html' },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` } }
    );
    return `${this.publicURL}/${key}`;
  }
  async getData(key) {
    const response = await axios.get(
      `${this.baseURL}/${key}`, 
      { headers: { 'Authorization': `Bearer ${this.token}` } }
    );
    return response.data;
  }
  /*
  Log a failed lookup at a level matching its severity: a 404 means the key is not
  set, an expected condition the caller recovers from, and is logged at debug; any
  other failure is logged at error. `fallbackDescription` names the value used
  instead and completes the message.
  */
  _logLookupFailure(key, err, fallbackDescription) {
    const isMissing = err.response?.status === 404;
    const logAtLevel = isMissing ? appLogger.debug : appLogger.error;
    logAtLevel.call(
      appLogger,
      {err, key, status: err.response?.status},
      `accessify key '${key}' ${isMissing ? 'not set' : 'could not be read'}, ${fallbackDescription}`
    );
  }
  async getConfig() {
    try {
      const config = await this.getData('_config');
      return config;
    } catch (err) {
      this._logLookupFailure('_config', err, 'using environment values');
      return {};
    }
  }
  async getContentTypeMapping() {
    try {
      const config = await this.getData('_content_type');
      return config;
    } catch (err) {
      this._logLookupFailure('_content_type', err, 'falling back to the bundled default mapping');
      return defaultMapping;
    }
  }
};
