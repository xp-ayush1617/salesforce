import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import TablePagination from '@mui/material/TablePagination';
import Box from '@mui/material/Box';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#FEA8B0', '#B0FEA8', '#FEA800'];

const LEAD_TYPE_NAMES = {
  'PL': 'Service',
  'BL': 'Biofuels',
  'WL': 'Water',
  'SL': 'Sugar',
  'all': 'All Leads'  // Added 'all' type for completeness
};

function formatMonthLabel(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = parseInt(month, 10) - 1;
  if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return monthStr;
  return `${months[mIdx]} ${year.slice(2)}`;
}

const legendStyle = {
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 8,
  color: '#2a3f54'
};

const sectionStyle = {
  margin: 'clamp(16px, 3vw, 24px) auto',
  background: '#fff',
  borderRadius: 'clamp(12px, 2vw, 16px)',
  padding: 'clamp(16px, 4vw, 32px)',
  boxShadow: '0 2px 12px #e3eafc',
  width: '100%',
  maxWidth: '1400px',
  minWidth: '320px',
  overflowX: 'auto'
};

const chartTitleStyle = {
  color: '#2a3f54',
  fontSize: 'clamp(18px, 3vw, 24px)',
  marginBottom: 'clamp(4px, 1vw, 8px)',
  fontWeight: 'bold'
};

const chartDescStyle = {
  color: '#888',
  marginBottom: 'clamp(12px, 2vw, 20px)',
  fontSize: 'clamp(14px, 2vw, 16px)',
  lineHeight: 1.4
};

const downloadBtnStyle = {
  margin: 'clamp(16px, 3vw, 24px) 0',
  padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 32px)',
  fontSize: 'clamp(14px, 2vw, 16px)',
  borderRadius: 'clamp(6px, 1vw, 8px)',
  border: 'none',
  background: 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #e3eafc',
  transition: 'all 0.3s ease',
  letterSpacing: 0.5,
  outline: 'none',
  whiteSpace: 'nowrap'
};

function LeadStatusOverTimeChart({ data, chartRef }) {
  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'lead-status-over-time.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];
  // Ensure all statuses are present for every month
  const months = Array.from(new Set(safeData.map(d => d.month))).filter(Boolean).sort();
  const statuses = Array.from(new Set(safeData.map(d => d.LeadStatus))).filter(Boolean);
  const chartData = months.map(month => {
    const row = { month };
    statuses.forEach(status => {
      const found = safeData.find(d => d.month === month && d.LeadStatus === status);
      row[status] = found ? found.leadCount : 0;
    });
    return row;
  });
  const colors = {
    'New Enquiry': '#8884d8',
    'Converted': '#82ca9d',
    'Working - Contacted': '#ffc658',
    'Not Converted': '#ff7300'
  };
  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Leads by Status Over Time</div>
      <div style={chartDescStyle}>
        <em>Stacked area chart: X-axis is month, Y-axis is count of leads, stacks are Lead Status.</em>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={chartData} margin={{ top: 32, right: 140, left: 140, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            wrapperStyle={{ fontWeight: 'bold', fontSize: 16, color: '#2a3f54' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
          />
          <XAxis
            dataKey="month"
            interval={0}
            minTickGap={10}
            angle={-45}
            textAnchor="end"
            height={100}
            tickFormatter={monthStr => {
              if (!monthStr) return '';
              const [year, month] = monthStr.split('-');
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const mIdx = parseInt(month, 10) - 1;
              if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return monthStr;
              return `${months[mIdx]} ${year.slice(2)}`;
            }}
            label={{
              value: 'Month',
              position: 'insideBottom',
              offset: 20,
              dy: 40,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, 'auto']}
            label={{
              value: 'Lead Count',
              angle: -90,
              position: 'insideLeft',
              offset: 30,
              dx: -50,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <Tooltip />
          {statuses.map((status, idx) => (
            <Area
              key={status}
              type="monotone"
              dataKey={status}
              stackId="1"
              stroke={colors[status] || "#8884d8"}
              fill={colors[status] || "#8884d8"}
              name={status}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <button
        style={downloadBtnStyle}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #00C49F 60%, #0088FE 100%)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)'}
        onClick={handleDownload}
      >
        ⬇️ Download as PNG
      </button>
    </div>
  );
}

function LeadIndustryChart({ data, chartRef }) {
  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'lead-by-industry.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];
  return (
    <div style={sectionStyle}>
      <div style={{ color: '#2a3f54', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Leads by Industry</div>
      <div style={{ color: '#888', marginBottom: 16, fontSize: 16 }}>
        <em>Y-axis: Industry Type, X-axis: Number of Leads.</em>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(420, safeData.length * 44)}>
        <BarChart
          data={safeData}
          layout="vertical"
          margin={{ top: 32, right: 140, left: 180, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            wrapperStyle={{ fontWeight: 'bold', fontSize: 16, color: '#2a3f54' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            domain={[0, 'auto']}
            label={{
              value: 'Lead Count',
              position: 'insideBottom',
              offset: 20,
              dy: 40,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
            interval={0}
            minTickGap={1}
          />
          <YAxis
            type="category"
            dataKey="IndustryType"
            width={140}
            interval={0}
            label={{
              value: 'Industry Type',
              angle: -90,
              position: 'insideLeft',
              offset: 30,
              dx: -60,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <Tooltip />
          <Bar dataKey="leadCount" fill="#0088FE" name="Lead Count" />
        </BarChart>
      </ResponsiveContainer>
      <button
        style={downloadBtnStyle}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #00C49F 60%, #0088FE 100%)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)'}
        onClick={handleDownload}
      >
        ⬇️ Download as PNG
      </button>
    </div>
  );
}

function LeadRegionChart({ data, chartRef }) {
  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'lead-by-region.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];
  return (
    <div style={sectionStyle}>
      <div style={{ color: '#2a3f54', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Leads by Region (State)</div>
      <div style={{ color: '#888', marginBottom: 16, fontSize: 16 }}>
        <em>Y-axis: State, X-axis: Number of Leads.</em>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(420, safeData.length * 44)}>
        <BarChart
          data={safeData}
          layout="vertical"
          margin={{ top: 32, right: 140, left: 180, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            wrapperStyle={{ fontWeight: 'bold', fontSize: 16, color: '#2a3f54' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            domain={[0, 'auto']}
            label={{
              value: 'Lead Count',
              position: 'insideBottom',
              offset: 20,
              dy: 40,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
            interval={0}
            minTickGap={1}
          />
          <YAxis
            type="category"
            dataKey="State"
            width={140}
            interval={0}
            label={{
              value: 'State',
              angle: -90,
              position: 'insideLeft',
              offset: 30,
              dx: -60,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <Tooltip />
          <Bar dataKey="leadCount" fill="#00C49F" name="Lead Count" />
        </BarChart>
      </ResponsiveContainer>
      <button
        style={downloadBtnStyle}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #00C49F 60%, #0088FE 100%)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)'}
        onClick={handleDownload}
      >
        ⬇️ Download as PNG
      </button>
    </div>
  );
}

function LeadOwnerChart({ data, chartRef }) {
  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'lead-by-owner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const safeData = Array.isArray(data) ? data : [];
  return (
    <div style={sectionStyle}>
      <div style={{ color: '#2a3f54', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Leads by Lead Owner</div>
      <div style={{ color: '#888', marginBottom: 16, fontSize: 16 }}>
        <em>X-axis: Lead Owner, Y-axis: Number of Leads.</em>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={safeData} margin={{ top: 32, right: 140, left: 140, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            wrapperStyle={{ fontWeight: 'bold', fontSize: 16, color: '#2a3f54' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
          />
          <XAxis
            dataKey="LeadOwner"
            interval={0}
            minTickGap={10}
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 14, fill: '#2a3f54', fontWeight: 'bold' }}
            label={{
              value: 'Lead Owner',
              position: 'insideBottom',
              offset: 20,
              dy: 40,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, 'auto']}
            label={{
              value: 'Lead Count',
              angle: -90,
              position: 'insideLeft',
              offset: 30,
              dx: -50,
              style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
            }}
          />
          <Tooltip />
          <Bar dataKey="leadCount" fill="#FF9800" name="Lead Count" />
        </BarChart>
      </ResponsiveContainer>
      <button
        style={downloadBtnStyle}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #00C49F 60%, #0088FE 100%)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)'}
        onClick={handleDownload}
      >
        ⬇️ Download as PNG
      </button>
    </div>
  );
}

function LeadDashboard() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Add new state for lead types
  const [leadTypes, setLeadTypes] = useState(['all']);
  const [selectedType, setSelectedType] = useState('all');
  
  const [tab, setTab] = useState('visual');
  const [refreshKey, setRefreshKey] = useState(0);

  // Table data
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart data
  const [statusData, setStatusData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);

  // Pagination state for table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Table columns
  const columns = [
    { key: 'LeadNo', label: 'LeadNo' },
    { key: 'Date', label: 'Date' },
    { key: 'CompanyAccountName', label: 'CompanyAccountName' },
    { key: 'State', label: 'State' },
    { key: 'IndustryType', label: 'IndustryType' },
    { key: 'FirstName', label: 'FirstName' },
    { key: 'LastName', label: 'LastName' },
    { key: 'Email', label: 'Email' },
    { key: 'Mobile', label: 'Mobile' },
    { key: 'LeadOwner', label: 'LeadOwner' },
    { key: 'LeadStatus', label: 'LeadStatus' },
  ];

  // Filters state (dropdown value per column)
  const [filters, setFilters] = useState({
    LeadNo: '',
    Date: '',
    CompanyAccountName: '',
    State: '',
    IndustryType: '',
    FirstName: '',
    LastName: '',
    Email: '',
    Mobile: '',
    LeadOwner: '',
    LeadStatus: '',
  });

  // Dropdown options for each column
  const columnOptions = {};
  columns.forEach(col => {
    columnOptions[col.key] = Array.from(
      new Set(leads.map(lead => lead[col.key]).filter(v => v !== undefined && v !== null && v !== ''))
    ).sort();
  });

  // Table fetch
  const reloadLeads = () => {
    setLoading(true);
    fetch(`${apiBaseUrl}/leads`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading leads:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  // Modified reloadCharts with prefix filtering for all endpoints
  const reloadCharts = () => {
    const prefix = selectedType === 'all' ? '' : `?prefix=${selectedType}`;
    
    Promise.all([
      fetch(`${apiBaseUrl}/leads/status-over-time${prefix}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/leads/industry-performance${prefix}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/leads/region-performance${prefix}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/leads/owner-performance${prefix}`).then(res => res.json())
    ])
    .then(([statusData, industryData, regionData, ownerData]) => {
      setStatusData(statusData);
      setIndustryData(industryData);
      setRegionData(regionData);
      setOwnerData(ownerData);
    })
    .catch(err => {
      console.error('Error loading charts:', err);
      setError(err.message);
    });
  };

  // Only refetch on refreshKey
  useEffect(() => {
    reloadLeads();
    reloadCharts();
  }, [refreshKey, selectedType]);

  // Fetch lead types
  useEffect(() => {
    fetch(`${apiBaseUrl}/leads/types`)
      .then(res => res.json())
      .then(types => {
        setLeadTypes(['all', ...types]);
      })
      .catch(err => {
        console.error('Error fetching lead types:', err);
        setError(err.message);
      });
  }, []);

  // SSE: Listen for backend events and trigger refresh
  useEffect(() => {
    const evtSource = new EventSource(`${apiBaseUrl}/events`);
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'leads_updated') {
          setRefreshKey(k => k + 1);
        }
      } catch {}
    };
    return () => evtSource.close();
  }, []);

  // Call this after any data-changing action (upload, add, update, delete)
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Excel upload handler
  const handleExcelUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`${apiBaseUrl}/upload/leads`, {
      method: 'POST',
      body: formData,
    });
    triggerRefresh();
  };

  // Example for add/update/delete:
  // After successful POST/PUT/DELETE, call triggerRefresh();

  const chartRefs = {
    chart1: useRef(),
    chart2: useRef(),
    chart3: useRef(),
    chart4: useRef(),
  };

  const handleDownload = async (refKey, filename) => {
    const ref = chartRefs[refKey];
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download all charts and KPI cards as one image
  const handleDownloadAllAsOne = async () => {
    // Create a container to clone KPI cards and all charts
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Clone KPI cards
    const kpiCards = document.getElementById('lead-kpi-cards');
    if (kpiCards) {
      const kpiClone = kpiCards.cloneNode(true);
      kpiClone.style.marginBottom = '24px';
      container.appendChild(kpiClone);
    }

    // Clone charts
    Object.values(chartRefs).forEach(ref => {
      if (ref.current) {
        const clone = ref.current.cloneNode(true);
        clone.style.marginBottom = '16px';
        container.appendChild(clone);
      }
    });

    document.body.appendChild(container);
    const canvas = await html2canvas(container);
    document.body.removeChild(container);
    const link = document.createElement('a');
    link.download = 'all-lead-kpi-charts.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handler for dropdown
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      LeadNo: '',
      Date: '',
      CompanyAccountName: '',
      State: '',
      IndustryType: '',
      FirstName: '',
      LastName: '',
      Email: '',
      Mobile: '',
      LeadOwner: '',
      LeadStatus: '',
    });
    setPage(0);
  };

  // Filtered leads (dropdown filter)
  const filteredLeads = leads.filter(lead =>
    columns.every(col =>
      !filters[col.key] ||
      lead[col.key] === filters[col.key]
    )
  );

  // KPI calculations
  // Calculate KPIs based on the filtered leads
  const getFilteredLeads = () => {
    if (selectedType === 'all') return leads;
    return leads.filter(lead => lead.LeadNo.startsWith(selectedType));
  };

  const filteredLeadsForKPIs = getFilteredLeads();
  const totalLeads = filteredLeadsForKPIs.length;

  // Lead Owner counts with filtering
  const ownerCounts = {};
  filteredLeadsForKPIs.forEach(lead => {
    if (lead.LeadOwner) {
      ownerCounts[lead.LeadOwner] = (ownerCounts[lead.LeadOwner] || 0) + 1;
    }
  });
  const uniqueOwners = Object.keys(ownerCounts);
  const topOwnerEntry = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0];
  const topOwnerName = topOwnerEntry ? topOwnerEntry[0] : 'N/A';
  const topOwnerCount = topOwnerEntry ? topOwnerEntry[1] : 0;

  // State counts with filtering
  const stateCounts = {};
  filteredLeadsForKPIs.forEach(lead => {
    if (lead.State) {
      stateCounts[lead.State] = (stateCounts[lead.State] || 0) + 1;
    }
  });
  const topStateEntry = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0];
  const topState = topStateEntry ? topStateEntry[0] : 'N/A';
  const topStateCount = topStateEntry ? topStateEntry[1] : 0;

  // Industry counts with filtering
  const industryCounts = {};
  filteredLeadsForKPIs.forEach(lead => {
    if (lead.IndustryType) {
      industryCounts[lead.IndustryType] = (industryCounts[lead.IndustryType] || 0) + 1;
    }
  });
  const uniqueIndustries = Object.keys(industryCounts);
  const topIndustryEntry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0];
  const topIndustry = topIndustryEntry ? topIndustryEntry[0] : 'N/A';
  const topIndustryCount = topIndustryEntry ? topIndustryEntry[1] : 0;

  // Modify the LeadTypeFilter component
  const LeadTypeFilter = () => (
    <div style={{
      marginBottom: 'clamp(20px, 4vw, 32px)',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
      padding: 'clamp(16px, 3vw, 24px)',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      boxShadow: '0 8px 32px rgba(227, 234, 252, 0.5)',
      border: '1px solid rgba(227, 234, 252, 0.8)',
      backdropFilter: 'blur(8px)',
      maxWidth: '1800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        color: '#2a3f54',
        fontSize: '16px',
        marginBottom: '12px'
      }}>
        Filter by Lead Type:
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            borderRadius: '8px',
            border: selectedType === 'all' ? '2px solid #0088FE' : '1px solid #e3eafc',
            background: selectedType === 'all' ? '#e3f2fd' : '#fff',
            color: selectedType === 'all' ? '#0088FE' : '#2a3f54',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => {
            setSelectedType('all');
            setRefreshKey(k => k + 1);
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = selectedType === 'all' ? '#e3f2fd' : '#f7f9fc';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = selectedType === 'all' ? '#e3f2fd' : '#fff';
          }}
        >
          All Leads
        </button>
        {leadTypes
          .filter(type => type !== 'all')
          .map(type => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '8px',
                background: selectedType === type ? '#e3f2fd' : 'transparent',
                border: '1px solid #e3eafc'
              }}
            >
              <input
                type="radio"
                value={type}
                checked={selectedType === type}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              {LEAD_TYPE_NAMES[type] || type}
            </label>
          ))}
      </div>
    </div>
  );

  // Add error display
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}. Please try refreshing the page.
      </div>
    );
  }

  // Responsive styles hook
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic grid columns based on window width
  const getGridColumns = () => {
    if (windowWidth <= 768) return '1fr';
    if (windowWidth <= 1400) return 'repeat(2, 1fr)';
    return 'repeat(4, minmax(0, 1fr))';
  };

  return (
    <div>
      {/* Tabs + Download Button in one row (Professional UI) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(20px, 3vw, 32px)',
        background: 'linear-gradient(135deg, #f7f9fc 0%, #ffffff 100%)',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        boxShadow: '0 4px 24px rgba(37, 47, 97, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: 'clamp(12px, 2.5vw, 24px)',
        flexWrap: 'wrap',
        gap: 'clamp(16px, 3vw, 24px)',
        width: '100%',
        minWidth: '300px',
        maxWidth: '100%',
        position: 'relative',
        isolation: 'isolate',
        border: '1px solid rgba(227, 234, 252, 0.5)'
      }}>
        {/* Pill-style tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          background: '#f7f9fc',
          borderRadius: '24px',
          boxShadow: '0 2px 8px #e3eafc',
          padding: '0',
          maxWidth: '100%',
          flexGrow: 1,
          minWidth: '280px'
        }}>
          <button
            style={{
              padding: '14px 38px',
              fontSize: 18,
              borderRadius: '24px 0 0 24px',
              // Fix: Use explicit border sides to avoid mixing with borderRight
              borderTop: tab === 'visual' ? '2px solid #0088FE' : '1px solid #e3eafc',
              borderBottom: tab === 'visual' ? '2px solid #0088FE' : '1px solid #e3eafc',
              borderLeft: tab === 'visual' ? '2px solid #0088FE' : '1px solid #e3eafc',
              borderRight: 'none',
              background: tab === 'visual' ? 'linear-gradient(90deg,#e3f2fd 60%,#f7f9fc 100%)' : '#f7f9fc',
              color: tab === 'visual' ? '#0088FE' : '#2a3f54',
              fontWeight: tab === 'visual' ? 'bold' : '500',
              cursor: 'pointer',
              boxShadow: tab === 'visual' ? '0 2px 8px #e3eafc' : 'none',
              outline: 'none',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s'
            }}
            onClick={() => setTab('visual')}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,#e3f2fd 80%,#f7f9fc 100%)'}
            onMouseOut={e => e.currentTarget.style.background = tab === 'visual'
              ? 'linear-gradient(90deg,#e3f2fd 60%,#f7f9fc 100%)'
              : '#f7f9fc'}
          >
           Insights
          </button>
          <button
            style={{
              padding: '14px 38px',
              fontSize: 18,
              borderRadius: '0 24px 24px 0',
              // Fix: Use explicit border sides to avoid mixing with borderLeft
              borderTop: tab === 'table' ? '2px solid #00C49F' : '1px solid #e3eafc',
              borderBottom: tab === 'table' ? '2px solid #00C49F' : '1px solid #e3eafc',
              borderRight: tab === 'table' ? '2px solid #00C49F' : '1px solid #e3eafc',
              borderLeft: 'none',
              background: tab === 'table' ? 'linear-gradient(90deg,#e0f7fa 60%,#f7f9fc 100%)' : '#f7f9fc',
              color: tab === 'table' ? '#00C49F' : '#2a3f54',
              fontWeight: tab === 'table' ? 'bold' : '500',
              cursor: 'pointer',
              boxShadow: tab === 'table' ? '0 2px 8px #e0f7fa' : 'none',
              outline: 'none',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s'
            }}
            onClick={() => setTab('table')}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,#e0f7fa 80%,#f7f9fc 100%)'}
            onMouseOut={e => e.currentTarget.style.background = tab === 'table'
              ? 'linear-gradient(90deg,#e0f7fa 60%,#f7f9fc 100%)'
              : '#f7f9fc'}
          >
          Metrics
          </button>
        </div>

        {/* Download All Charts button */}
          <button
            onClick={handleDownloadAllAsOne}
            style={{
              padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 38px)',
              fontSize: 'clamp(14px, 2vw, 18px)',
              borderRadius: '24px',
              border: 'none',
              background: 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #e3eafc',
              transition: 'all 0.3s ease',
              letterSpacing: 0.5,
              outline: 'none',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            ⬇️ Download All Charts
          </button>
      </div>

      {/* KPI Cards */}
      <div
        id="lead-kpi-cards"
        style={{
          display: 'grid',
          gridTemplateColumns: getGridColumns(),
          gap: windowWidth <= 768 ? '16px' : '24px',
          marginBottom: '32px',
          padding: '0 20px',
          maxWidth: '1800px',
          margin: '0 auto 32px auto',
          transition: 'transform 0.3s ease',
          transform: 'translateY(0)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.1)'
          }
        }}>
        {/* Total Leads Card */}
        <div style={{
          width: '100%',
          height: '160px',
          background: 'linear-gradient(145deg, #ffffff 0%, #e3f2fd 100%)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
          border: '1px solid rgba(227, 234, 252, 0.8)',
          borderLeft: '4px solid #0088FE',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          transform: 'translateY(0)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.1)'
          }
        }}>
          <div style={{
            fontSize: '16px',
            color: '#1565C0',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📊</span>Total Leads
          </div>
          <div style={{
            fontSize: '32px',
            color: '#0088FE',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {totalLeads}
          </div>
        </div>

        {/* Top Lead Owner Card */}
        <div style={{
          width: '100%',
          height: '160px',
          background: 'linear-gradient(145deg, #ffffff 0%, #e0f7fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
          border: '1px solid rgba(227, 234, 252, 0.8)',
          borderLeft: '4px solid #00C49F',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          transform: 'translateY(0)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.1)'
          }
        }}>
          <div style={{
            fontSize: '16px',
            color: '#00695C',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👑</span>Top Lead Owner
          </div>
          <div style={{
            fontSize: '24px',
            color: '#00C49F',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
            {topOwnerName}
          </div>
          <div style={{
            fontSize: '32px',
            color: '#00C49F',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {topOwnerCount}
          </div>
        </div>

        {/* Top State Card */}
        <div style={{
          width: '100%',
          height: '160px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fffde7 100%)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
          border: '1px solid rgba(227, 234, 252, 0.8)',
          borderLeft: '4px solid #FFBB28',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          transform: 'translateY(0)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.1)'
          }
        }}>
          <div style={{
            fontSize: '16px',
            color: '#F57F17',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🏆</span>Top State
          </div>
          <div style={{
            fontSize: '24px',
            color: '#FFBB28',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
            {topState}
          </div>
          <div style={{
            fontSize: '32px',
            color: '#FFBB28',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {topStateCount}
          </div>
        </div>

        {/* Top Industry Card */}
        <div style={{
          width: '100%',
          height: '160px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fce4ec 100%)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
          border: '1px solid rgba(227, 234, 252, 0.8)',
          borderLeft: '4px solid #D500F9',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          transform: 'translateY(0)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.1)'
          }
        }}>
          <div style={{
            fontSize: '16px',
            color: '#C2185B',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🏭</span>Top Industry
          </div>
          <div style={{
            fontSize: '24px',
            color: '#D500F9',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
            {topIndustry}
          </div>
          <div style={{
            fontSize: '32px',
            color: '#D500F9',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {topIndustryCount}
          </div>
        </div>
      </div>

      {/* Charts section */}
      {tab === 'visual' && (
        <div style={{ padding: '0 10px' }}>
          <LeadTypeFilter />
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div ref={chartRefs.chart1}>
                <LeadStatusOverTimeChart data={statusData} chartRef={chartRefs.chart1} />
              </div>
              <div ref={chartRefs.chart2}>
                <LeadIndustryChart data={industryData} chartRef={chartRefs.chart2} />
              </div>
              <div ref={chartRefs.chart3}>
                <LeadRegionChart data={regionData} chartRef={chartRefs.chart3} />
              </div>
              <div ref={chartRefs.chart4}>
                <LeadOwnerChart data={ownerData} chartRef={chartRefs.chart4} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Table section */}
      {tab === 'table' && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px #eee',
          padding: 'clamp(16px, 4vw, 24px)',
          margin: '0 10px',
          overflowX: 'auto'
        }}>
          <h2 style={{ color: '#2a3f54', marginBottom: 16 }}>Leads Table</h2>
          <div style={{ marginBottom: 12 }}>
            <button
              style={{
                padding: '6px 18px',
                borderRadius: 6,
                background: '#0088FE',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                marginRight: 8
              }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table
                border="1"
                cellPadding="5"
                cellSpacing="0"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '1800px',
                  tableLayout: 'auto'
                }}
              >
                <thead>
                  <tr style={{
                    background: '#f7f9fc',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2
                  }}>
                    {columns.map(col => (
                      <th
                        key={col.key}
                        style={{
                          padding: 8,
                          border: '1px solid #eee',
                          background: '#f7f9fc',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        {col.label}
                        <div>
                          <select
                            value={filters[col.key]}
                            onChange={e => handleFilterChange(col.key, e.target.value)}
                            style={{
                              width: '95%',
                              marginTop: 4,
                              padding: '3px 6px',
                              borderRadius: 4,
                              border: '1px solid #ccc',
                              fontSize: 13
                            }}
                          >
                            <option value="">All</option>
                            {columnOptions[col.key].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((lead, idx) => (
                      <tr
                        key={lead.LeadNo || idx}
                        style={{
                          background: idx % 2 === 0 ? '#f9fbff' : '#fff',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#e3f2fd'}
                        onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#f9fbff' : '#fff'}
                      >
                        {columns.map(col => (
                          <td
                            key={col.key}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #eee',
                              minWidth: '150px',
                              maxWidth: 'none',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              lineHeight: 1.4
                            }}
                          >
                            {lead[col.key]}
                          </td>
                        ))}
                      </tr>
                  ))}
                </tbody>
              </table>
              <Box>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredLeads.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Box>
           </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeadDashboard;

