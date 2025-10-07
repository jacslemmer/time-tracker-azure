import { useState } from 'react';
import { DateFilter, ReportType } from '../types';
import * as api from '../services/api';

export const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReport(reportType, dateFilter, startDate, endDate);
      setReportData(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportCSV(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-tracker-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export CSV');
    }
  };

  const handleExportJSON = async () => {
    try {
      const blob = await api.exportJSON(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export JSON');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Generate Report</h2>

        <div className="form-group">
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
            <option value="all">All Entries</option>
            <option value="by-client">By Client</option>
            <option value="by-project">By Project</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date Filter</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateFilter === 'custom' && (
          <>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </>
        )}

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleGenerateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={handleExportCSV}>
                Export CSV
              </button>
              <button className="btn btn-secondary" onClick={handleExportJSON}>
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="card" style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {Object.keys(reportData[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value: any, i) => (
                    <td key={i}>{typeof value === 'object' ? JSON.stringify(value) : value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
