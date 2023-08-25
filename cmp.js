import axios from 'axios';

export async function getToken(clientId, clientSecret) {
  const tokenData = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  };
  const tokenRequest = await axios.post(
    `${process.env.SSO_DOMAIN}/o/oauth2/v1/token`,
    tokenData,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return tokenRequest.data.access_token;
};

export async function postPublicAPI(token, url, data) {
  const previewApiResponse = await axios.post(
    url,
    data,
    {
      headers: {
        'authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return previewApiResponse.data;
};

export async function getAssetURL(token, link) {
  const previewApiResponse = await axios.get(
    link,
    {
      headers: {
        'authorization': `Bearer ${token}`
      }
    }
  );
  return previewApiResponse.data.url;
};
