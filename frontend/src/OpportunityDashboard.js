import React, { useEffect, useState, useRef } from 'react';
import OwnerPerformanceChart from './OwnerPerformanceChart';
import html2canvas from 'html2canvas';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';
import TablePagination from '@mui/material/TablePagination';

// Utility to format value in crore/million units
function formatValueCroreMillion(value) {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(2) + ' Cr';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' M';
  } else if (value >= 100000) {
    return (value / 100000).toFixed(2) + ' L';
  }
  return value.toLocaleString();
}

// Helper to build query param for prefix
function getPrefixParam(prefix) {
  return prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : '';
}

// Helper to build filter query string
function getFilterQuery(filters) {
  const params = [];
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  return params.length ? `&${params.join('&')}` : '';
}

function OpportunityDashboard() {
  const [tab, setTab] = useState('visual');
  const [refreshKey, setRefreshKey] = useState(0);

  // Table data
  const [opportunities, setOpportunities] = useState([]);
  // Chart data
  const [ownerPerf, setOwnerPerf] = useState([]);
  const [stagePerf, setStagePerf] = useState([]);
  const [industryPerf, setIndustryPerf] = useState([]);
  const [statePerf, setStatePerf] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [proposalPerf, setProposalPerf] = useState([]);
  const [closedWon, setClosedWon] = useState([]);
  // Unified loading state
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Add state for OpportunityID prefix filter
  const [oppPrefix, setOppPrefix] = useState('ALL');

  // Filters state (dropdown value per column)
  const [filters, setFilters] = useState({
    OpportunityID: '',
    CreatedDate: '',
    AccountName: '',
    IndustryType: '',
    State: '',
    OpportunityOwner: '',
    ProposalOwner: '',
    Stage: '',
    Capacity: '',
    QuotedValue: '',
    FinalValue: '',
    TentativeClosingDate: '',
  });

  // Fetch all data (table + charts)
  const reloadAll = () => {
    setLoading(true);
    const prefixParam = getPrefixParam(oppPrefix);
    const filterQuery = getFilterQuery(filters);
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8003';
    Promise.all([
      fetch(`${apiBaseUrl}/opportunities${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/owner-performance${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/stage-performance${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/industry-performance${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/state-quoted-value${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/over-time${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/proposal-performance${prefixParam}${filterQuery}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/opportunities/closed-won-stacked${prefixParam}${filterQuery}`).then(res => res.json())
    ])
      .then(([table, owner, stage, industry, state, overtime, proposal, closedwon]) => {
        setOpportunities(table);
        setOwnerPerf(owner);
        setStagePerf(stage);
        setIndustryPerf(industry);
        setStatePerf(state);
        setOverTime(overtime);
        setProposalPerf(proposal);
        setClosedWon(closedwon);
        setData(table); // Set data for table pagination
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Only refetch on refreshKey or oppPrefix
  useEffect(() => {
    reloadAll();
  }, [refreshKey, oppPrefix, filters]);

  // SSE: Listen for backend events and trigger refresh
  useEffect(() => {
    const evtSource = new EventSource('http://172.26.0.217:4000/events');
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'opportunities_updated') {
          setRefreshKey(k => k + 1);
        }
      } catch {}
    };
    return () => evtSource.close();
  }, []);

  // Call this after any data-changing action (upload, add, update, delete)
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const chartRefs = {
    chart1: useRef(),
    // Add more refs as needed for additional charts
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
    const kpiCards = document.getElementById('kpi-cards');
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
    link.download = 'all-opportunity-kpi-charts.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Excel upload handler
  const handleExcelUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await fetch('http://172.26.0.217:4000/upload/opportunities', {
      method: 'POST',
      body: formData,
    });
    triggerRefresh();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Table columns
  const columns = [
    { key: 'OpportunityID', label: 'OpportunityID' },
    { key: 'CreatedDate', label: 'CreatedDate' },
    { key: 'AccountName', label: 'AccountName' },
    { key: 'IndustryType', label: 'IndustryType' },
    { key: 'State', label: 'State' },
    { key: 'OpportunityOwner', label: 'OpportunityOwner' },
    { key: 'ProposalOwner', label: 'ProposalOwner' },
    { key: 'Stage', label: 'Stage' },
    { key: 'Capacity', label: 'Capacity' },
    { key: 'QuotedValue', label: 'QuotedValue' },
    { key: 'FinalValue', label: 'FinalValue' },
    { key: 'TentativeClosingDate', label: 'TentativeClosingDate' },
  ];

  // Dropdown options for each column
  const columnOptions = {};
  columns.forEach(col => {
    columnOptions[col.key] = Array.from(
      new Set(data.map(row => row[col.key]).filter(v => v !== undefined && v !== null && v !== ''))
    ).sort();
  });

  // Filter handler for dropdown
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      OpportunityID: '',
      CreatedDate: '',
      AccountName: '',
      IndustryType: '',
      State: '',
      OpportunityOwner: '',
      ProposalOwner: '',
      Stage: '',
      Capacity: '',
      QuotedValue: '',
      FinalValue: '',
      TentativeClosingDate: '',
    });
    setPage(0);
  };

  // Extract unique prefixes (first two letters) from OpportunityID
  const prefixSet = new Set();
  data.forEach(row => {
    if (row.OpportunityID && typeof row.OpportunityID === 'string' && row.OpportunityID.length >= 2) {
      prefixSet.add(row.OpportunityID.substring(0, 2).toUpperCase());
    }
  });
  const prefixOptions = Array.from(prefixSet).sort();

  // Map prefix to display name
  const prefixNames = {
    PO: 'Service',
    BO: 'Biofuels',
    WO: 'Water',
    SO: 'Sugar',
    ALL: 'All Opportunity'
  };

  // Filter data by prefix
  const prefixFilteredData = oppPrefix === 'ALL'
    ? data
    : data.filter(row => row.OpportunityID && row.OpportunityID.substring(0, 2).toUpperCase() === oppPrefix);

  // Filtered data (dropdown filter)
  const filteredData = prefixFilteredData.filter(row =>
    columns.every(col =>
      !filters[col.key] ||
      row[col.key] === filters[col.key]
    )
  );

  // KPI calculations
  const totalOpportunities = prefixFilteredData.length;
  const totalFinalValue = prefixFilteredData.reduce((sum, row) => sum + (parseFloat(row.FinalValue) || 0), 0);
  const totalQuotedValue = prefixFilteredData.reduce((sum, row) => sum + (parseFloat(row.QuotedValue) || 0), 0);

  // Opportunity Owner count (unique)
  const ownerCounts = {};
  prefixFilteredData.forEach(row => {
    if (row.OpportunityOwner) {
      ownerCounts[row.OpportunityOwner] = (ownerCounts[row.OpportunityOwner] || 0) + 1;
    }
  });
  const uniqueOwners = Object.keys(ownerCounts);
  const opportunityOwnerCount = uniqueOwners.length;

  // Top Opportunity Owner (name and count)
  const topOwnerEntry = Object.entries(ownerCounts)
    .sort((a, b) => b[1] - a[1])[0];
  const topOwnerName = topOwnerEntry ? topOwnerEntry[0] : 'N/A';
  const topOwnerCount = topOwnerEntry ? topOwnerEntry[1] : 0;

  // Total Closed Won (Stage === 'Closed Won')
  const totalClosedWon = prefixFilteredData.filter(row => row.Stage === 'Closed Won').length;

  // Top State (state with most opportunities)
  const stateCounts = {};
  prefixFilteredData.forEach(row => {
    if (row.State) {
      stateCounts[row.State] = (stateCounts[row.State] || 0) + 1;
    }
  });
  const topStateEntry = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
  const topState = topStateEntry[0];
  const topStateCount = topStateEntry[1];

  const kpiCardContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: '16px',
    margin: '24px auto',
    padding: '0 24px',
    maxWidth: '1200px',
    width: '100%'
  };

  const kpiCardStyle = {
    flex: '1 1 280px',
    width: 'calc(33.33% - 16px)',
    minWidth: '250px',
    maxWidth: '320px',
    height: '120px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
    border: '1px solid rgba(227, 234, 252, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      background: 'inherit',
      opacity: 0.7
    }
  };

  return (
    <div>
      {/* Tabs + Download Button in one row (Professional UI) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        background: '#f7f9fc',
        borderRadius: 16,
        boxShadow: '0 2px 12px #e3eafc',
        padding: 'clamp(10px, 2vw, 18px)',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Pill-style tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          background: '#f7f9fc',
          borderRadius: 24,
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
            transition: 'background 0.18s, box-shadow 0.18s',
            letterSpacing: 0.5,
            outline: 'none',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          Download All Charts
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'visual' && (
        <div>
          {/* KPI Cards */}
          <div
            id="kpi-cards"
            style={kpiCardContainerStyle}
          >
            <div style={{
              ...kpiCardStyle, 
              background: 'linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 100%)',
              borderLeft: '4px solid #0088FE'
            }}>
              <div style={{ 
                fontSize: '15px', 
                color: '#1565C0', 
                fontWeight: 600, 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span>
                <span>Opportunity Summary</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1976D2', marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '24px', color: '#0088FE', fontWeight: 'bold' }}>{totalOpportunities}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(25, 118, 210, 0.1)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1976D2', marginBottom: '4px' }}>Closed Won</div>
                  <div style={{ fontSize: '24px', color: '#0088FE', fontWeight: 'bold' }}>{totalClosedWon}</div>
                </div>
              </div>
            </div>

            <div style={{
              ...kpiCardStyle, 
              background: 'linear-gradient(135deg, #E0F7FA 0%, #FFFFFF 100%)',
              borderLeft: '4px solid #00C49F'
            }}>
              <div style={{ 
                fontSize: '15px', 
                color: '#00695C', 
                fontWeight: 600, 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💰</span>
                <span>Value Overview</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#00796B', marginBottom: '4px' }}>Quoted</div>
                  <div style={{ fontSize: '20px', color: '#00C49F', fontWeight: 'bold' }}>{formatValueCroreMillion(totalQuotedValue)}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(0, 121, 107, 0.1)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#00796B', marginBottom: '4px' }}>Final</div>
                  <div style={{ fontSize: '20px', color: '#00C49F', fontWeight: 'bold' }}>{formatValueCroreMillion(totalFinalValue)}</div>
                </div>
              </div>
            </div>

            <div style={{
              ...kpiCardStyle, 
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFFFFF 100%)',
              borderLeft: '4px solid #FFBB28'
            }}>
              <div style={{ 
                fontSize: '15px', 
                color: '#F57F17', 
                fontWeight: 600, 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🏆</span>
                <span>Top Performance</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#F57F17', marginBottom: '4px' }}>Top Owner</div>
                  <div style={{ fontSize: '15px', color: '#FFBB28', fontWeight: 'bold', marginBottom: '2px' }}>{topOwnerName}</div>
                  <div style={{ fontSize: '20px', color: '#FFBB28', fontWeight: 'bold' }}>{topOwnerCount}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(245, 127, 23, 0.1)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#F57F17', marginBottom: '4px' }}>Top State</div>
                  <div style={{ fontSize: '15px', color: '#FFBB28', fontWeight: 'bold', marginBottom: '2px' }}>{topState}</div>
                  <div style={{ fontSize: '20px', color: '#FFBB28', fontWeight: 'bold' }}>{topStateCount}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#1976D2' }}>Filter by Opportunity  Type:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="radio" value="ALL" checked={oppPrefix === 'ALL'} onChange={() => setOppPrefix('ALL')} /> {prefixNames['ALL']}
            </label>
            {prefixOptions.map(prefix => (
              <label key={prefix} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="radio" value={prefix} checked={oppPrefix === prefix} onChange={() => setOppPrefix(prefix)} /> {prefixNames[prefix] || prefix}
              </label>
            ))}
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={{ padding: '0 clamp(10px, 2vw, 20px)' }}>
              <div ref={chartRefs.chart1}>
                <OwnerPerformanceChart data={ownerPerf} prefix={oppPrefix} />
              </div>
              {/* Add more chart components here, passing stagePerf, industryPerf, etc. as needed */}
              {/* Example: <StagePerformanceChart data={stagePerf} /> */}
            </div>
          )}
        </div>
      )}
      {tab === 'table' && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px #eee',
          padding: 'clamp(16px, 4vw, 24px)',
          margin: '0 clamp(10px, 2vw, 20px)',
          overflowX: 'auto'
        }}>
          <h2 style={{ color: '#2a3f54', marginBottom: 16 }}>Opportunities Table</h2>
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
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => (
                      <tr
                        key={row.OpportunityID || idx}
                        style={{
                          background: idx % 2 === 0 ? 'rgba(248, 250, 255, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                          borderBottom: '1px solid rgba(227, 234, 252, 0.3)'
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
                            {row[col.key]}
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
                  count={filteredData.length}
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

export default OpportunityDashboard;

// You are getting this error because @mui/material is not installed in your project.
// To fix this, run the following command in your frontend directory:

// npm install @mui/material @emotion/react @emotion/styled

// If you use yarn:
// yarn add @mui/material @emotion/react @emotion/styled

// After installing, restart your development server.