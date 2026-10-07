import axios from 'axios';
import { log, redactURL, truncateBody } from './logger.js';

const DEFAULT_SSO_DOMAIN = "https://accounts.welcomesoftware.com";

// Token calls set credentialBodies: their request and response bodies are the credentials.
// expectedFailureStatuses keeps a failure the caller recovers from (such as an
// unset Accessify key) from showing up as an error.
export async function requestCMP(
  operationName,
  requestConfig,
  { credentialBodies = false, expectedFailureStatuses = [] } = {}
) {
  const startedAt = Date.now();
  const requestSummary = {
    operation: operationName,
    method: requestConfig.method.toUpperCase(),
    url: redactURL(requestConfig.url),
  };
  let response;
  try {
    response = await axios(requestConfig);
  } catch (err) {
    const failureLevel = expectedFailureStatuses.includes(err.response?.status) ? 'info' : 'error';
    log()[failureLevel]({ ...requestSummary, err, durationMs: Date.now() - startedAt }, 'cmp request failed');
    throw err;
  }
  log().info({ ...requestSummary, status: response.status, durationMs: Date.now() - startedAt }, 'cmp request ok');
  if (!credentialBodies) {
    log().debug({ ...requestSummary, responseBody: truncateBody(response.data) }, 'cmp response');
  }
  return response;
}

export async function getToken(clientId, clientSecret) {
  const tokenRequest = await requestCMP('getToken', {
    method: 'post',
    url: `${process.env.SSO_DOMAIN || DEFAULT_SSO_DOMAIN}/o/oauth2/v1/token`,
    data: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    },
    headers: {
      'Content-Type': 'application/json'
    },
  }, { credentialBodies: true });
  return tokenRequest.data.access_token;
};

export async function postPublicAPI(token, url, data) {
  log().debug({ url, requestBody: truncateBody(data) }, 'cmp request body');
  const previewApiResponse = await requestCMP('postPublicAPI', {
    method: 'post',
    url,
    data,
    headers: {
      'authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  return previewApiResponse.data;
};

export async function getAssetURL(token, link) {
  const previewApiResponse = await requestCMP('getAssetURL', {
    method: 'get',
    url: link,
    headers: {
      'authorization': `Bearer ${token}`
    },
  });
  return previewApiResponse.data.url;
};
