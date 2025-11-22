const { sql } = require('../config/db');
const base = require('./base.model');

exports.getSchedule = async (providerId) => {
  // 1. Fetch existing schedule
  const query = `
    SELECT * FROM ProviderSchedules 
    WHERE ProviderId = @providerId
  `;
  const existing = await base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }
  ]);

  // 2. If empty, create default M-F 9-5 schedule (initial setup)
  if (existing.length === 0) {
    return await _createDefaultSchedule(providerId);
  }

  // 3. Sort by Day of Week (Monday first)
  const sorter = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  return existing.sort((a, b) => sorter[a.DayOfWeek] - sorter[b.DayOfWeek]);
};

exports.updateSchedule = async (providerId, days) => {
  const pool = await require('../config/db').poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    for (const day of days) {
      const request = new sql.Request(transaction);
      const upsertQuery = `
        MERGE ProviderSchedules AS target
        USING (SELECT @providerId AS ProviderId, @day AS DayOfWeek) AS source
        ON (target.ProviderId = source.ProviderId AND target.DayOfWeek = source.DayOfWeek)
        WHEN MATCHED THEN
            UPDATE SET 
                StartTime = @startTime, 
                EndTime = @endTime, 
                IsActive = @isActive, 
                UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
            INSERT (ProviderId, DayOfWeek, StartTime, EndTime, IsActive)
            VALUES (@providerId, @day, @startTime, @endTime, @isActive);
      `;
      
      request.input('providerId', sql.UniqueIdentifier, providerId);
      request.input('day', sql.NVarChar, day.dayOfWeek);
      request.input('startTime', sql.NVarChar, day.startTime);
      request.input('endTime', sql.NVarChar, day.endTime);
      request.input('isActive', sql.Bit, day.isActive ? 1 : 0);
      
      await request.query(upsertQuery);
    }

    await transaction.commit();
    return true;
  } catch (err) {
    if (transaction._begun) await transaction.rollback();
    throw err;
  }
};

async function _createDefaultSchedule(providerId) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const defaults = [];
  
  const pool = await require('../config/db').poolConnect;
  
  for (const day of days) {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const item = {
      ProviderId: providerId,
      DayOfWeek: day,
      StartTime: '09:00 AM',
      EndTime: '05:00 PM',
      IsActive: !isWeekend
    };
    defaults.push(item);

    const q = `INSERT INTO ProviderSchedules (ProviderId, DayOfWeek, StartTime, EndTime, IsActive) VALUES (@p, @d, @s, @e, @a)`;
    const req = new sql.Request(pool);
    req.input('p', providerId);
    req.input('d', day);
    req.input('s', '09:00 AM');
    req.input('e', '05:00 PM');
    req.input('a', !isWeekend);
    await req.query(q);
  }
  return defaults;
}