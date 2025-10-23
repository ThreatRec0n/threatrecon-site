import Bottleneck from 'bottleneck';

export const queue = new Bottleneck({
  maxConcurrent: 4,
  reservoir: 10,
  reservoirRefreshInterval: 60_000,
  reservoirRefreshAmount: 10,
  minTime: 300,
});

queue.on('failed', async (error, jobInfo) => {
  if (jobInfo.retryCount < 2) {
    return 300 * (jobInfo.retryCount + 1);
  }
});
