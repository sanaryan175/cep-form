import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { getDashboardData, exportSurveysToExcel } from '../services/api';
import { Users, TrendingUp, AlertTriangle, CheckCircle, LogOut, Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    localStorage.removeItem('adminAuthorized');
    window.location.href = '/admin';
  };

  const handleExport = async () => {
    try {
      const blob = await exportSurveysToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  const tooltipValueFormatter = (value, name) => {
    if (name === 'count') return [value, 'Responses'];
    return [value, name];
  };

  const tooltipLabelFormatter = (label) => label;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setDashboardData(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Your access has expired or is invalid. Please request a new access code.');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 3000);
      } else {
        setError('Failed to load dashboard data');
      }
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, dailyTrend, sections } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Awareness Survey Dashboard </h1>
            <p className="text-gray-600">Real-time insights from community feedback</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalResponses}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Responses</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.todayResponses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Risk Perception</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgRiskScale.toFixed(1)}/5</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Interest</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.platformInterestRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="chart-container mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Response Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Responses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Section Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Age Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sections.basicInfo.ageGroups}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload, percent }) => `${payload?._id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {sections.basicInfo.ageGroups.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, 'Responses']}
                  labelFormatter={tooltipLabelFormatter}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Loan Experience */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Loan Experience</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sections.basicInfo.loanExperience}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Loan Awareness */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Interest Rate Understanding</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sections.loanAwareness.interestUnderstanding}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hidden Charges Experience */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hidden Charges Experience</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sections.loanAwareness.hiddenCharges}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload, percent }) => `${payload?._id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {sections.loanAwareness.hiddenCharges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={tooltipValueFormatter}
                  labelFormatter={tooltipLabelFormatter}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Fraud Experience */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fraud Experience</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sections.financialRisk.fraudExperience}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Interest */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Usage Willingness</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sections.platformNeed.willingness}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Features */}
        <div className="chart-container mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Desired Platform Features</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sections.platformNeed.features}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={tooltipValueFormatter} labelFormatter={tooltipLabelFormatter} />
              <Bar dataKey="count" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Common Fears */}
        {sections.platformNeed.fears && sections.platformNeed.fears.length > 0 && (
          <div className="chart-container mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Fears</h2>
            <div className="space-y-3">
              {sections.platformNeed.fears.map((fear, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{fear._id}</span>
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                    {fear.count} responses
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
