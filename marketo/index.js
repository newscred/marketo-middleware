import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';
import { getToken, postPublicAPI } from '../cmp.js';
import Marketo from './cli.js';
import { prepareMKTOTokenData } from './tokenMapper.js';
import { generateEmail } from './service.js';
import Accessify from '../accessify/index.js';

function _getConfigFromENV() {
  return {
    PREVIEW_FOLDER_ID: process.env.PREVIEW_FOLDER_ID || 92,
    PUBLISH_FOLDER_ID: process.env.PUBLISH_FOLDER_ID || 262,
    APP_CLIENT_ID: process.env.APP_CLIENT_ID,
    APP_CLIENT_SECRET: process.env.APP_CLIENT_SECRET,
    MARKETO_CLIENT_ID: process.env.MARKETO_CLIENT_ID,
    MARKETO_CLIENT_SECRET: process.env.MARKETO_CLIENT_SECRET,
    MARKETO_BASE_URL: process.env.MARKETO_REST_URL,
  };
}

export async function publishMarketo(req, res) {
  const payload = req.body;
  const structuredContent = payload.data.assets.structured_contents[0];
  const contentTypeName = structuredContent.content_body.content_type.name;
  const orgId = payload.data.organization.id;
  // get app token for open api calls
  
  const configFromEnv = _getConfigFromENV();
  const token = await getToken(configFromEnv.APP_CLIENT_ID, configFromEnv.APP_CLIENT_SECRET);

  const accessify = new Accessify(token);
  const contentTypeMapping = await accessify.getContentTypeMapping();
  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting publishing for non supported content type');
    return res.status(200).json({message: 'not publishing since the contentType did not match'});
  }
  const contentType = contentTypeMapping[contentTypeName];
  // get config data from accessify
  const configFromAccessify = await accessify.getConfig();
  const config = {
    ...configFromEnv,
    ...configFromAccessify
  };

  const fieldsWithLocal = structuredContent.content_body.latest_fields_version.fields;
  const structuredContentId = structuredContent.id;
  appLogger.info('publishing marketo');

  // prepare mkto token data
  const mktoTokens = await prepareMKTOTokenData(fieldsWithLocal, contentType.mapping, token);
  appLogger.info('prepared MKTO token data');

  // initialize marketo cli
  const marketo = new Marketo(
    config.MARKETO_BASE_URL,
    config.MARKETO_CLIENT_ID,
    config.MARKETO_CLIENT_SECRET,
    contentType.programId,
    orgId,
    config.PUBLISH_FOLDER_ID,
    token,
  );
  appLogger.info({
    baseURL: config.MARKETO_BASE_URL,
    clientID: config.MARKETO_CLIENT_ID,
    clientSecret: config.MARKETO_CLIENT_SECRET,
    programID: contentType.programId,
    orgId,
    toFolderID: config.PUBLISH_FOLDER_ID
  }, 'marketo cli initiated');
  await marketo.initialize();

  // generate marketo email
  const { previewURL } = await generateEmail(marketo, mktoTokens, `${structuredContent.title}-${Date.now()}`);
  appLogger.info({url: previewURL}, 'preview generated');

  await postPublicAPI(token, payload.data.publishing_event.links.publishing_metadata, {
    data: [{
      status: 'published',
      status_message: 'Successfully published to Marketo',
      publishing_destination_updated_at: (new Date()).toISOString(),
      public_url: previewURL,
      asset_id: structuredContentId,
      locale: 'en'
    }],
  });
  appLogger.info('publishing completed');
  return res.status(200).json({success: true});
};

export async function generatePreview(req, res) {
  const payload = req.body;
  const fieldsWithLocal = payload.data.assets?.structured_contents[0]?.content_body.fields_version.fields;
  appLogger.info('Generating preview');
  const contentTypeName = payload.data.assets?.structured_contents[0].content_body.content_type.name;
  const orgId = payload.data.organization.id;

  const configFromEnv =  _getConfigFromENV();

  // get app token for open api calls
  const token = await getToken(configFromEnv.APP_CLIENT_ID, configFromEnv.APP_CLIENT_SECRET);
  appLogger.info('generated Token');

  const accessify = new Accessify(token);
  const contentTypeMapping = await accessify.getContentTypeMapping();
  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting preview for non supported content type');
    return res.status(200).json({
      message: 'not generating the preview since the contentType did not match'
    });
  }
  const contentType = contentTypeMapping[contentTypeName];
  // get config data from accessify
  const configFromAccessify = await accessify.getConfig();
  const config = {
    ...configFromEnv,
    ...configFromAccessify,
  };

  const hash = payload.data.assets?.structured_contents[0]?.content_body.fields_version.content_hash;
  // acknowledge the preview request
  await postPublicAPI(token, payload.data.links.acknowledge, {
    acknowledged_by: "mkto-middleware",
    content_hash: hash,
  });
  appLogger.info({url: payload.data.links.acknowledge}, 'preview acknowledged');

  // prepare mkto token data
  const mktoTokens = await prepareMKTOTokenData(fieldsWithLocal, contentType.mapping, token);
  appLogger.debug({mktoTokens}, 'prepared MKTO token data');

  // initialize marketo cli
  const marketo = new Marketo(
    config.MARKETO_BASE_URL,
    config.MARKETO_CLIENT_ID,
    config.MARKETO_CLIENT_SECRET,
    contentType.programId,
    orgId,
    config.PREVIEW_FOLDER_ID,
    token
  );
  appLogger.info({
    baseURL: config.MARKETO_BASE_URL,
    clientID: config.MARKETO_CLIENT_ID,
    clientSecret: config.MARKETO_CLIENT_SECRET,
    programID: contentType.programId,
    orgId,
    toFolderID: config.PREVIEW_FOLDER_ID
  }, 'marketo cli initiated');

  await marketo.initialize();

  // generate marketo email
  const {clonedProgram, previewURL} = await generateEmail(marketo, mktoTokens);
  appLogger.info({url: previewURL}, 'preview generated');

  // delete the temp program
  marketo.deleteProgram(clonedProgram.id);
  appLogger.info('deleted temp program');

  // send complete api call to the openapi
  await postPublicAPI(token, payload.data.links.complete, {
    keyedPreviews: {
      [`marketo-email-${uuidv4()}`]: previewURL
    },
  });
  appLogger.info('preview completed');
  return res.status(200).json({success: true});
};
