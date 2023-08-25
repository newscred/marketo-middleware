import url from 'url';
import axios from 'axios';
import Accessify from '../accessify/index.js';
import { appLogger } from '../logger.js';

export default class Marketo {
  constructor(baseURL, clientId, clientSecret, rootProgram, orgId, toFolder) {
    this.baseURL = baseURL;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.programId = rootProgram;
    this.orgId = orgId;
    this.toFolder = toFolder;
  }
  get restURL() {
    return `${this.baseURL}/rest`;
  }
  async initialize() {
    await this.generateToken();
  }
  async generateToken() {
    const tokenAPIResponse = await axios.get(
      `${this.baseURL}/identity/oauth/token?grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`
    );
    this.accessToken = tokenAPIResponse.data.access_token;
  }
  async getEmailPreviewURL(emailId) {
    const accessify = new Accessify(this.orgId);
    // get an email preview html
    const emailPreview = await this.getEmailPreview(emailId);
    appLogger.info({emailId}, 'fetched preview');

    // launch previewURL
    const previewURL = await accessify.store(`email-${emailId}`, emailPreview);
    appLogger.info({ previewURL }, 'launched a previewURL');
    return previewURL;
  }
  async cloneProgram(newName) {
    const cloneData = `name=${newName}&folder={"id":${this.toFolder},"type":"Folder"}&description=Description`;
    const requestData = await axios.post(
      `${this.restURL}/asset/v1/program/${this.programId}/clone.json?access_token=${this.accessToken}`,
      cloneData,
      {headers: {'content-type': 'application/x-www-form-urlencoded'}}
    );
    return requestData.data.result[0];
  }
  async getEmailFromProgram(programId) {
    const requestData = await axios.get(
      `${this.restURL}/asset/v1/emails.json?access_token=${this.accessToken}&folder={"id":${programId},"type":"Program"}`
    );
    return requestData.data.result[0];
  }
  async bulkUpsertTokenData(programId, tokenData) {
    await Promise.all(Object.entries(tokenData).map(([name, value]) => {
      if (!value) { return Promise.resolve(); }
      return this.upsertTokenData(programId, {value, name});
    }));
  }
  async upsertTokenData(programId, {value, name}) {
    await axios.post(
      `${this.restURL}/asset/v1/folder/${programId}/tokens.json?access_token=${this.accessToken}`,
      new url.URLSearchParams({
        name,
        value: value.value ?? value,
        type: value.type ?? 'text',
        folderType: 'Program'
      }).toString(),
      {headers: {'content-type': 'application/x-www-form-urlencoded'}}
    );
  }
  async getEmailPreview(emailId) {
    const emailPreview = await axios.get(
      `${this.restURL}/asset/v1/email/${emailId}/fullContent.json?access_token=${this.accessToken}`
    );
    return emailPreview.data.result[0].content;
  }
  async deleteProgram(programId) {
    await axios.post(
      `${this.restURL}/asset/v1/program/${programId}/delete.json?access_token=${this.accessToken}`
    );
  }
};
