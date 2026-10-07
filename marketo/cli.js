import url from 'url';
import axios from 'axios';
import Accessify from '../accessify/index.js';
import { log, redactURL, truncateBody } from '../logger.js';

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
  get authHeaders() {
    return { Authorization: `Bearer ${this.accessToken}` };
  }
  // Every Marketo call goes through here, so each one leaves a timed line with
  // Marketo's requestId behind - the id Marketo support asks for.
  // Token calls set credentialBodies: their request and response bodies are the credentials.
  async _request(operationName, requestConfig, { credentialBodies = false } = {}) {
    const startedAt = Date.now();
    const requestSummary = {
      operation: operationName,
      method: requestConfig.method.toUpperCase(),
      url: redactURL(requestConfig.url),
    };
    if (!credentialBodies) {
      log().debug({ ...requestSummary, requestBody: truncateBody(requestConfig.data) }, 'marketo request');
    }

    let response;
    try {
      response = await axios(requestConfig);
    } catch (err) {
      log().error({ ...requestSummary, err, durationMs: Date.now() - startedAt }, 'marketo request failed');
      throw err;
    }

    const responseBody = response.data;
    const responseSummary = {
      ...requestSummary,
      durationMs: Date.now() - startedAt,
      status: response.status,
      marketoRequestId: responseBody?.requestId,
    };
    if (responseBody?.success === false) {
      log().error({ ...responseSummary, errors: responseBody.errors }, 'marketo rejected the request');
    } else {
      log().info(
        { ...responseSummary, resultCount: Array.isArray(responseBody?.result) ? responseBody.result.length : undefined },
        'marketo request ok'
      );
    }
    if (!credentialBodies) {
      log().debug({ ...requestSummary, responseBody: truncateBody(responseBody) }, 'marketo response');
    }
    return response;
  }
  async initialize() {
    await this.generateToken();
  }
  async generateToken() {
    const tokenAPIResponse = await this._request('generateToken', {
      method: 'get',
      url: `${this.baseURL}/identity/oauth/token?grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`,
    }, { credentialBodies: true });
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
    log().info({emailId}, 'fetched preview');

    // launch previewURL
    const previewURL = await accessify.store(`email-${emailId}`, emailPreview);
    log().info({ previewURL }, 'launched a previewURL');
    return previewURL;
  }
  async cloneProgram(newName) {
    const cloneData = `name=${newName}&folder={"id":${this.toFolder},"type":"Folder"}&description=Description`;
    const requestData = await this._request('cloneProgram', {
      method: 'post',
      url: `${this.restURL}/asset/v1/program/${this.programId}/clone.json`,
      data: cloneData,
      headers: {'content-type': 'application/x-www-form-urlencoded', ...this.authHeaders},
    });
    return assertMarketoSuccess(requestData, 'cloneProgram')[0];
  }
  async getEmailFromProgram(programId) {
    const requestData = await this._request('getEmailFromProgram', {
      method: 'get',
      url: `${this.restURL}/asset/v1/emails.json?folder={"id":${programId},"type":"Program"}`,
      headers: this.authHeaders,
    });
    return assertMarketoSuccess(requestData, 'getEmailFromProgram')[0];
  }
  async bulkUpsertTokenData(programId, tokenData) {
    await Promise.all(Object.entries(tokenData).map(([name, value]) => {
      if (!value) { return Promise.resolve(); }
      return this.upsertTokenData(programId, {value, name});
    }));
  }
  async upsertTokenData(programId, {value, name}) {
    const requestData = await this._request(`upsertTokenData(${name})`, {
      method: 'post',
      url: `${this.restURL}/asset/v1/folder/${programId}/tokens.json`,
      data: new url.URLSearchParams({
        name,
        value: value.value ?? value,
        type: value.type ?? 'text',
        folderType: 'Program'
      }).toString(),
      headers: {'content-type': 'application/x-www-form-urlencoded', ...this.authHeaders},
    });
    assertMarketoSuccess(requestData, `upsertTokenData(${name})`);
  }
  async getEmailPreview(emailId) {
    const emailPreview = await this._request('getEmailPreview', {
      method: 'get',
      url: `${this.restURL}/asset/v1/email/${emailId}/fullContent.json`,
      headers: this.authHeaders,
    });
    return assertMarketoSuccess(emailPreview, 'getEmailPreview')[0].content;
  }
  async deleteProgram(programId) {
    const requestData = await this._request('deleteProgram', {
      method: 'post',
      url: `${this.restURL}/asset/v1/program/${programId}/delete.json`,
      headers: this.authHeaders,
    });
    assertMarketoSuccess(requestData, 'deleteProgram');
  }
};
