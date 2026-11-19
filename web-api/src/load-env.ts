import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Imported first, so modules that read process.env at import time see the file too.
for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'web-api/.env')
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
