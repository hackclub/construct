import Airtable from 'airtable';
import { env } from '$env/dynamic/private';

export const airtableBase = env.AIRTABLE_TOKEN ? new Airtable({ apiKey: env.AIRTABLE_TOKEN }).base(env.AIRTABLE_BASE) : null;
