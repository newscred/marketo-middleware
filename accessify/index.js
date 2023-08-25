import axios from 'axios';
import { appLogger } from '../logger.js';
import { defaultMapping } from './tokenConfig.js';

export default class Accessify {
  constructor(orgId) {
    this.orgId = orgId;
    this.integrationId = 'mkto-middleware';
  }
  get baseURL() {
    return `${process.env.ACCESSIFY_URL}/instance/${this.orgId}/integration/${this.integrationId}/value`;
  }
  get publicURL() {
    return `${process.env.ACCESSIFY_PUBLIC_URL || process.env.ACCESSIFY_URL}/instance/${this.orgId}/integration/${this.integrationId}/value`;
  }
  async store(key, value) {
    await axios.put(
      `${this.baseURL}/${key}`,
      { value, mimeType: 'text/html' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return `${this.publicURL}/${key}`;
  }
  async getData(key) {
    const response = await axios.get(`${this.baseURL}/${key}`);
    return response.data;
  }
  async getConfig() {
    try {
      const config = await this.getData('_config');
      return config;
    } catch (err) {
      appLogger.error({err}, 'error fetching config data');
      return {};
    }
  }
  async getContentTypeMapping() {
    try {
      const config = await this.getData('_content_type');
      return config;
    } catch (err) {
      appLogger.error({err}, 'error fetching config data');
      return defaultMapping;
    }
  }
};
