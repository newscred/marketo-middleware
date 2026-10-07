import { log } from '../logger.js';

async function createEmail(marketo, mktoTokens, programTitle) {
  // clone program
  const clonedProgram = await marketo.cloneProgram(
    programTitle || `preview-email-${Date.now()}`
  );
  log().info('program cloned');

  // fetch cloned email object
  const email = await marketo.getEmailFromProgram(clonedProgram.id);
  log().info('email retrieved');

  // upsert token data
  await marketo.bulkUpsertTokenData(clonedProgram.id, mktoTokens);
  log().info('tokens writing complete to marketo');
  return { clonedProgram, email };
}

export async function generateEmail(marketo, mktoTokens, programTitle) {
  const { clonedProgram, email } = await createEmail(marketo, mktoTokens, programTitle);
  log().info('email created');

  const previewURL = await marketo.getEmailPreviewURL(email.id);

  return {clonedProgram, previewURL};
};
