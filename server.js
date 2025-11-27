import express from 'express';
import { handler } from './build/handler.js';
// import { CronJob } from 'cron';

// new CronJob(
// 	'* * * * * *', // cronTime
// 	function () {
// 		console.log('You will see this message every second');
// 	}, // onTick
// 	null, // onComplete
// 	true, // start
// 	'Europe/London' // timeZone
// );

const app = express();

app.use(handler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Listening on ${port}`);
});
