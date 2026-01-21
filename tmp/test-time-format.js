// 测试时间格式化
const startDate = '2026-01-31T15:21:01.630Z';
const endDate = '2026-01-31T16:21:01.630Z';

const start = new Date(startDate);
const end = new Date(endDate);

console.log('=== 测试时间格式化 ===');
console.log('Start time (ISO):', startDate);
console.log('End time (ISO):', endDate);
console.log('');

console.log('Start time (toUTCString):', start.toUTCString());
console.log('End time (toUTCString):', end.toUTCString());
console.log('');

console.log('Start time (toString):', start.toString());
console.log('End time (toString):', end.toString());
console.log('');

console.log('Start hour (getUTCHours):', start.getUTCHours());
console.log('End hour (getUTCHours):', end.getUTCHours());
console.log('');

// 测试是否同一天
const isSameDay = (
  start.getUTCFullYear() === end.getUTCFullYear() &&
  start.getUTCMonth() === end.getUTCMonth() &&
  start.getUTCDate() === end.getUTCDate()
);
console.log('Is same day (UTC):', isSameDay);
console.log('');

// 测试格式化
const options = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
};

const startFormatted = start.toLocaleString('en-US', options);
console.log('Start formatted (timeZone=UTC):', startFormatted);

const endTime = end.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
});
console.log('End time formatted (timeZone=UTC):', endTime);
console.log('');

console.log('Final result (with UTC):', startFormatted + ' - ' + endTime + ' UTC');
console.log('');

// 测试不带 timeZone 选项的格式化
const optionsNoTZ = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const startFormattedNoTZ = start.toLocaleString('en-US', optionsNoTZ);
const endTimeNoTZ = end.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit'
});
console.log('Without timeZone option:');
console.log('Start formatted:', startFormattedNoTZ);
console.log('End time formatted:', endTimeNoTZ);
console.log('Final result:', startFormattedNoTZ + ' - ' + endTimeNoTZ);
