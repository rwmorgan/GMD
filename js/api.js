/* API facade: picks the demo or live adapter based on config. */

import { IS_DEMO } from './config.js';
import { DemoAdapter } from './api-demo.js';
import { SupabaseAdapter } from './api-supabase.js';

export const api = IS_DEMO ? new DemoAdapter() : new SupabaseAdapter();
