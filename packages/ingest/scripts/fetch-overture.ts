import { openDuck } from '../src/duck';
import { fetchOverture } from '../src/sources/overture';

const db = await openDuck();
const t = Date.now();
await fetchOverture(db);
console.log('took', Math.round((Date.now() - t) / 1000), 's');
db.close();
