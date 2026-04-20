const Bull = require('bull');
const queue = new Bull('email-queue', { redis: { host: '127.0.0.1', port: 6379 } });

async function check() {
  const failed = await queue.getFailed();
  const completed = await queue.getCompleted();
  console.log('Failed:', failed.length);
  failed.forEach(j => console.log('Job:', j.id, 'Reason:', j.failedReason));
  console.log('Completed:', completed.length);
  process.exit(0);
}
check();
