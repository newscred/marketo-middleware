import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const CONFIG_FILE = '/opt/newscred/marketo-middleware.env';
dotenv.config({
  path: fs.existsSync(CONFIG_FILE)
    ? CONFIG_FILE
    : path.resolve(process.cwd(), '.env')
});

// Read here, after dotenv has loaded, so importing modules never see a value
// that depends on import order. On a hosted app LOG_LEVEL is a free-text app
// parameter; changing it redeploys the container with the new value.
export const logSettings = {
  level: (process.env.LOG_LEVEL || 'info').trim().toLowerCase(),
  fileHandler: process.env.LOG_HANDLER === 'file',
};
