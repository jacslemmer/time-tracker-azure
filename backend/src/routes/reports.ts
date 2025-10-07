import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createDbPool } from '../utils/database';

const pool = createDbPool(process.env.DATABASE_URL!);

const router = Router();

// Generate reports
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, dateFilter, startDate, endDate } = req.query;

    // Build date filter
    let dateCondition = '';
    const params: any[] = [req.user!.id];
    let paramIndex = 2;

    if (dateFilter && dateFilter !== 'all') {
      switch (dateFilter) {
        case 'today':
          dateCondition = `AND te.start_time >= EXTRACT(EPOCH FROM DATE_TRUNC('day', CURRENT_TIMESTAMP)) * 1000`;
          break;
        case 'this-week':
          dateCondition = `AND te.start_time >= EXTRACT(EPOCH FROM DATE_TRUNC('week', CURRENT_TIMESTAMP)) * 1000`;
          break;
        case 'this-month':
          dateCondition = `AND te.start_time >= EXTRACT(EPOCH FROM DATE_TRUNC('month', CURRENT_TIMESTAMP)) * 1000`;
          break;
        case 'this-year':
          dateCondition = `AND te.start_time >= EXTRACT(EPOCH FROM DATE_TRUNC('year', CURRENT_TIMESTAMP)) * 1000`;
          break;
        case 'custom':
          if (startDate && endDate) {
            dateCondition = `AND te.start_time >= $${paramIndex} AND te.start_time <= $${paramIndex + 1}`;
            params.push(new Date(startDate as string).getTime());
            params.push(new Date(endDate as string).getTime());
            paramIndex += 2;
          }
          break;
      }
    }

    let query = '';
    let data: any[] = [];

    switch (type) {
      case 'all':
        // All entries report
        query = `
          SELECT
            te.start_time,
            te.end_time,
            te.is_manual,
            te.seconds,
            p.name as project_name,
            p.client_name,
            p.hourly_rate
          FROM time_entries te
          JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = $1 ${dateCondition}
          ORDER BY te.start_time DESC
        `;

        const allResult = await pool.query(query, params);
        data = allResult.rows.map((row) => ({
          date: new Date(row.start_time).toLocaleString(),
          client: row.client_name,
          project: row.project_name,
          startTime: row.is_manual ? 'Manual' : new Date(row.start_time).toLocaleTimeString(),
          endTime: row.is_manual ? 'Manual' : new Date(row.end_time).toLocaleTimeString(),
          hours: (row.seconds / 3600).toFixed(2),
          rate: row.hourly_rate,
          billing: ((row.seconds / 3600) * row.hourly_rate).toFixed(2),
          type: row.is_manual ? 'Manual' : 'Tracked',
        }));
        break;

      case 'by-client':
        // By client report
        query = `
          SELECT
            p.client_name,
            COUNT(te.id) as entry_count,
            SUM(te.seconds) as total_seconds,
            AVG(p.hourly_rate) as avg_rate
          FROM time_entries te
          JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = $1 ${dateCondition}
          GROUP BY p.client_name
          ORDER BY total_seconds DESC
        `;

        const clientResult = await pool.query(query, params);
        data = clientResult.rows.map((row) => ({
          client: row.client_name,
          entryCount: row.entry_count,
          hours: (row.total_seconds / 3600).toFixed(2),
          billing: ((row.total_seconds / 3600) * row.avg_rate).toFixed(2),
        }));
        break;

      case 'by-project':
        // By project report
        query = `
          SELECT
            p.client_name,
            p.name as project_name,
            p.budget,
            p.hourly_rate,
            COUNT(te.id) as entry_count,
            SUM(te.seconds) as total_seconds
          FROM time_entries te
          JOIN projects p ON te.project_id = p.id
          WHERE te.user_id = $1 ${dateCondition}
          GROUP BY p.id, p.client_name, p.name, p.budget, p.hourly_rate
          ORDER BY total_seconds DESC
        `;

        const projectResult = await pool.query(query, params);
        data = projectResult.rows.map((row) => {
          const hours = row.total_seconds / 3600;
          const billing = hours * row.hourly_rate;
          const remaining = row.budget - billing;

          return {
            client: row.client_name,
            project: row.project_name,
            entryCount: row.entry_count,
            hours: hours.toFixed(2),
            billing: billing.toFixed(2),
            budget: row.budget.toFixed(2),
            remaining: remaining.toFixed(2),
            remainingStatus: remaining >= 0 ? 'positive' : 'negative',
          };
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json(data);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Export CSV
router.post('/export/csv', (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=time-tracker-report-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export JSON
router.post('/export/json', (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'No data provided' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=time-tracker-data-${new Date().toISOString().split('T')[0]}.json`
    );
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
});

export default router;
