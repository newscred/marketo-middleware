import url from 'url';
import axios from 'axios';
import Accessify from '../accessify/index.js';
import { appLogger } from '../logger.js';

/*
Marketo answers a failed REST call with HTTP 200 and a body of
`{success: false, errors: [{code, message}]}` — axios does not reject, and the
`result` array is absent. Reading `result[0]` directly therefore turns a perfectly
descriptive Marketo error into an opaque TypeError. Every call routes through this
helper so the Marketo error reaches the caller intact.
*/
function assertMarketoSuccess(response, operationName) {
  const responseBody = response.data;

  if (responseBody && responseBody.success === false) {
    const marketoErrors = responseBody.errors ?? [];
    const detail = marketoErrors
      .map(marketoError => `${marketoError.code}: ${marketoError.message}`)
      .join('; ');
    const error = new Error(
      `Marketo ${operationName} failed — ${detail || 'no error detail returned'}`
    );
    error.marketoErrors = marketoErrors;
    error.marketoRequestId = responseBody.requestId;
    throw error;
  }

  if (!responseBody || !Array.isArray(responseBody.result)) {
    throw new Error(
      `Marketo ${operationName} returned no result array: ` +
      `${JSON.stringify(responseBody).slice(0, 500)}`
    );
  }

  return responseBody.result;
}

export default class Marketo {
  constructor(baseURL, clientId, clientSecret, rootProgram, orgId, toFolder, token) {
    this.baseURL = baseURL;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.programId = rootProgram;
    this.orgId = orgId;
    this.toFolder = toFolder;
    this.token = token;
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
    if (!tokenAPIResponse.data?.access_token) {
      throw new Error(
        `Marketo token request returned no access_token: ` +
        `${JSON.stringify(tokenAPIResponse.data).slice(0, 300)}`
      );
    }
    this.accessToken = tokenAPIResponse.data.access_token;
  }
  async getEmailPreviewURL(emailId) {
    const accessify = new Accessify(this.token);
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
    return assertMarketoSuccess(requestData, 'cloneProgram')[0];
  }
  async getEmailFromProgram(programId) {
    const requestData = await axios.get(
      `${this.restURL}/asset/v1/emails.json?access_token=${this.accessToken}&folder={"id":${programId},"type":"Program"}`
    );
    return assertMarketoSuccess(requestData, 'getEmailFromProgram')[0];
  }
  async bulkUpsertTokenData(programId, tokenData) {
    await Promise.all(Object.entries(tokenData).map(([name, value]) => {
      if (!value) { return Promise.resolve(); }
      return this.upsertTokenData(programId, {value, name});
    }));
  }
  async upsertTokenData(programId, {value, name}) {
    const requestData = await axios.post(
      `${this.restURL}/asset/v1/folder/${programId}/tokens.json?access_token=${this.accessToken}`,
      new url.URLSearchParams({
        name,
        value: value.value ?? value,
        type: value.type ?? 'text',
        folderType: 'Program'
      }).toString(),
      {headers: {'content-type': 'application/x-www-form-urlencoded'}}
    );
    assertMarketoSuccess(requestData, `upsertTokenData(${name})`);
  }
  async getEmailPreview(emailId) {
    const emailPreview = await axios.get(
      `${this.restURL}/asset/v1/email/${emailId}/fullContent.json?access_token=${this.accessToken}`
    );
    return assertMarketoSuccess(emailPreview, 'getEmailPreview')[0].content;
  }
  async deleteProgram(programId) {
    const requestData = await axios.post(
      `${this.restURL}/asset/v1/program/${programId}/delete.json?access_token=${this.accessToken}`
    );
    assertMarketoSuccess(requestData, 'deleteProgram');
  }
};
