import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ScatterChart, Scatter, ZAxis } from 'recharts';
import { Treemap } from 'recharts';
import html2canvas from 'html2canvas';

// Format numbers in INR units (Crore, Lakh) or with commas for small numbers
function formatINR(num) {
  if (typeof num !== 'number') return num;
  if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr'; // Crore
  if (num >= 100000) return (num / 100000).toFixed(2) + ' Lakh';
  return num.toLocaleString('en-IN');
}

// Custom tooltip for both bars
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const quotedValue = payload.find(p => p.dataKey === 'totalQuotedValue');
    const countValue = payload.find(p => p.dataKey === 'opportunityCount');
    return (
      <div style={{ background: '#fff', border: '1px solid #eee', padding: 10 }}>
        <strong>{label}</strong>
        <div>
          Total Quoted Value: {quotedValue ? formatINR(quotedValue.value) : '-'}
        </div>
        <div>
          Count of Opportunities: {countValue ? countValue.value : '-'}
        </div>
      </div>
    );
  }
  return null;
};

const legendStyle = {
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 8,
  color: '#2a3f54'
};

const sectionStyle = {
  margin: 'clamp(24px, 5vw, 40px) auto',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
  borderRadius: 'clamp(16px, 3vw, 24px)',
  padding: 'clamp(20px, 4vw, 32px)',
  boxShadow: '0 8px 32px rgba(227, 234, 252, 0.5)',
  border: '1px solid rgba(227, 234, 252, 0.8)',
  width: '95%',
  maxWidth: '1400px',
  overflowX: 'auto',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 48px rgba(227, 234, 252, 0.8)'
  }
};

const chartTitleStyle = {
  color: '#2a3f54',
  fontSize: 'clamp(18px, 3vw, 24px)',
  marginBottom: '4px',
  fontWeight: 'bold'
};

const chartDescStyle = {
  color: '#888',
  marginBottom: '16px',
  fontSize: 'clamp(14px, 2vw, 16px)'
};

// Utility style for download button
const downloadBtnStyle = {
  margin: '18px 0',
  padding: 'clamp(8px, 2vw, 11px) clamp(20px, 4vw, 28px)',
  fontSize: 'clamp(14px, 2vw, 16px)',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(90deg, #0088FE 60%, #00C49F 100%)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #e3eafc',
  transition: 'background 0.18s, box-shadow 0.18s',
  letterSpacing: 0.5,
  outline: 'none'
};

// Chart by Stage
function StagePerformanceChart({ prefix }) {
  const [data, setData] = useState([]);
  const chartRef = useRef();

  useEffect(() => {
    // Use environment variable for API base URL
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8003';
    fetch(`${apiBaseUrl}/opportunities/stage-performance${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'stage-performance-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Stage Performance</div>
      <div style={chartDescStyle}>
        <em>   Total Quoted Value and Opportunity Count grouped by Stage.</em>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 16, right: 120, left: 120, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Stage"
              label={{
                value: 'Stage',
                position: 'insideBottom',
                offset: 20,
                dy: 30,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatINR}
              label={{
                value: 'Total Quoted Value (INR)',
                angle: -90,
                position: 'insideLeft',
                offset: 30,
                dx: -50,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={v => v}
              label={{
                value: 'Opportunity Count',
                angle: -90,
                position: 'insideRight',
                offset: 30,
                dx: 50,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <Legend
              wrapperStyle={legendStyle}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="totalQuotedValue" fill="#0088FE" name="Total Quoted Value (INR)" />
            <Bar yAxisId="right" dataKey="opportunityCount" fill="#00C49F" name="Opportunity Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
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

// Chart by Owner
function OwnerPerformanceChartInner({ prefix }) {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('horizontal'); // 'horizontal', 'vertical', 'treemap'
  const [metric, setMetric] = useState('totalQuotedValue'); // 'totalQuotedValue' or 'opportunityCount'
  const chartRef = useRef();

  useEffect(() => {
    fetch(`http://172.26.0.217:4000/opportunities/owner-performance${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  // Assign a unique color to each owner
  const colorPalette = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FE8B8B", "#8BFEA2", "#FEA28B", "#8BA2FE", "#C4C49F",
    "#B388FF", "#FFB300", "#F44336", "#43A047", "#1E88E5", "#D81B60", "#8E24AA", "#FDD835", "#00ACC1", "#FF7043"
  ];
  const ownerColors = {};
  data.forEach((d, idx) => {
    ownerColors[d.OpportunityOwner] = colorPalette[idx % colorPalette.length];
  });

  // Tooltip for all chart types
  const OwnerTooltip = ({ active, payload, label }) => {
    let d = payload && payload.length ? (payload[0].payload || payload[0]) : null;
    if (active && d) {
      return (
        <div style={{ background: '#fff', border: '1px solid #eee', padding: 10 }}>
          <strong>{d.OpportunityOwner || d.name || label}</strong>
          <div>
            Total Quoted Value: {d.totalQuotedValue !== undefined ? formatINR(d.totalQuotedValue) : '-'}
          </div>
          <div>
            Opportunity Count: {d.opportunityCount !== undefined ? d.opportunityCount : '-'}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'owner-performance-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Owner Performance</div>
      <div style={chartDescStyle}>
        <em>
          Total  Quoted Value and Opportunity Count grouped by Opportunity Owner.<br />
          Select chart type and metric to visualize.
        </em>
        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              checked={chartType === 'horizontal'}
              onChange={() => setChartType('horizontal')}
            /> Horizontal Bar Chart
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              checked={chartType === 'vertical'}
              onChange={() => setChartType('vertical')}
            /> Vertical Bar Chart
          </label>
          <span style={{ marginLeft: 32 }}>
            <label>
              <input
                type="radio"
                checked={metric === 'totalQuotedValue'}
                onChange={() => setMetric('totalQuotedValue')}
              /> Total Quoted Value
            </label>
            <label style={{ marginLeft: 16 }}>
              <input
                type="radio"
                checked={metric === 'opportunityCount'}
                onChange={() => setMetric('opportunityCount')}
              /> Opportunity Count
            </label>
          </span>
        </div>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
          {chartType === 'horizontal' ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 16, right: 120, left: 180, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey={metric}
                tickFormatter={metric === 'totalQuotedValue' ? formatINR : v => v}
                label={{
                  value: metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count',
                  position: 'insideBottom',
                  offset: 20,
                  dy: 30,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
                allowDecimals={false}
                domain={[0, 'auto']}
                interval={0}
                minTickGap={1}
              />
              <YAxis
                type="category"
                dataKey="OpportunityOwner"
                width={140}
                interval={0}
                label={{
                  value: 'Opportunity Owner',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 30,
                  dx: -60,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
              />
              <Tooltip content={OwnerTooltip} labelFormatter={label => `Opportunity Owner: ${label}`} />
              <Legend
                wrapperStyle={legendStyle}
                layout="horizontal"
                verticalAlign="top"
                align="center"
              />
              <Bar
                dataKey={metric}
                fill="#0088FE"
                name={metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count'}
              />
            </BarChart>
          ) : (
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 16, right: 120, left: 120, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="OpportunityOwner"
                interval={0}
                minTickGap={1}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 14, fill: '#2a3f54', fontWeight: 'bold' }}
                label={{
                  value: 'Opportunity Owner',
                  angle: 0,
                  position: 'insideBottom',
                  offset: 20,
                  dy: 30,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
              />
              <YAxis
                type="number"
                dataKey={metric}
                tickFormatter={metric === 'totalQuotedValue' ? formatINR : v => v}
                label={{
                  value: metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 30,
                  dx: -50,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={OwnerTooltip} labelFormatter={label => `Opportunity Owner: ${label}`} />
              <Legend
                wrapperStyle={legendStyle}
                layout="horizontal"
                verticalAlign="top"
                align="center"
              />
              <Bar
                dataKey={metric}
                fill="#0088FE"
                name={metric === 'totalQuotedValue' ? 'Quoted Value (INR)' : 'Opportunity Count'}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
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

// Chart by Industry
function IndustryPerformanceChart({ prefix }) {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('bubble'); // 'bubble' or 'bar'
  const [metric, setMetric] = useState('totalQuotedValue'); // 'totalQuotedValue' or 'opportunityCount'
  const chartRef = useRef();

  useEffect(() => {
    fetch(`http://172.26.0.217:4000/opportunities/industry-performance${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'industry-performance-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Industry Performance</div>
      <div style={chartDescStyle}>
        <em>
          Select chart type and metric to visualize Industry Performance.<br />
          Bubble chart: Bubble size = selected metric.<br />
          Bar chart: Bar length = selected metric.
        </em>
        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              checked={chartType === 'bubble'}
              onChange={() => setChartType('bubble')}
            /> Bubble Chart
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              checked={chartType === 'bar'}
              onChange={() => setChartType('bar')}
            /> Horizontal Bar Chart
          </label>
          <span style={{ marginLeft: 32 }}>
            <label>
              <input
                type="radio"
                checked={metric === 'totalQuotedValue'}
                onChange={() => setMetric('totalQuotedValue')}
              /> Total Quoted Value
            </label>
            <label style={{ marginLeft: 16 }}>
              <input
                type="radio"
                checked={metric === 'opportunityCount'}
                onChange={() => setMetric('opportunityCount')}
              /> Opportunity Count
            </label>
          </span>
        </div>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
          {chartType === 'bubble' ? (
            <ScatterChart
              layout="vertical"
              margin={{ top: 16, right: 120, left: 180, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey={metric}
                tickFormatter={metric === 'totalQuotedValue' ? formatINR : v => v}
                label={{
                  value: metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count',
                  position: 'insideBottom',
                  offset: 20,
                  dy: 30,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
                allowDecimals={false}
                domain={[0, 'auto']}
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
              <ZAxis
                dataKey={metric}
                range={[100, 400]}
                name={metric === 'totalQuotedValue' ? 'Total Quoted Value' : 'Opportunity Count'}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #eee', padding: 10 }}>
                        <strong>{label}</strong>
                        <div>
                          Total Quoted Value: {d?.totalQuotedValue !== undefined ? formatINR(d.totalQuotedValue) : '-'}
                        </div>
                        <div>
                          Opportunity Count: {d?.opportunityCount !== undefined ? d.opportunityCount : '-'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                labelFormatter={label => `Industry Type: ${label}`}
              />
              <Legend
                wrapperStyle={legendStyle}
                layout="horizontal"
                verticalAlign="top"
                align="center"
              />
              <Scatter
                name="Industry"
                data={data}
                fill="#0088FE"
              />
            </ScatterChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 16, right: 120, left: 180, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey={metric}
                tickFormatter={metric === 'totalQuotedValue' ? formatINR : v => v}
                label={{
                  value: metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count',
                  position: 'insideBottom',
                  offset: 20,
                  dy: 30,
                  style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
                }}
                allowDecimals={false}
                domain={[0, 'auto']}
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
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #eee', padding: 10 }}>
                        <strong>{label}</strong>
                        <div>
                          Total Quoted Value: {d?.totalQuotedValue !== undefined ? formatINR(d.totalQuotedValue) : '-'}
                        </div>
                        <div>
                          Opportunity Count: {d?.opportunityCount !== undefined ? d.opportunityCount : '-'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                labelFormatter={label => `Industry Type: ${label}`}
              />
              <Legend
                wrapperStyle={legendStyle}
                layout="horizontal"
                verticalAlign="top"
                align="center"
              />
              <Bar
                dataKey={metric}
                fill="#0088FE"
                name={metric === 'totalQuotedValue' ? 'Total Quoted Value (INR)' : 'Opportunity Count'}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
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

// Chart by State (Horizontal Bar Chart)
function StateQuotedValueChart({ prefix }) {
  const [data, setData] = useState([]);
  const chartRef = useRef();

  useEffect(() => {
    fetch(`http://172.26.0.217:4000/opportunities/state-quoted-value${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'state-quoted-value-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Total Quoted Value by State</div>
      <div style={chartDescStyle}>
        <em>Horizontal bar chart of Total Quoted Value grouped by State.</em>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 16, right: 120, left: 180, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={formatINR}
              label={{
                value: 'Total  Quoted Value (INR)',
                position: 'insideBottom',
                offset: 20,
                dy: 30,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
              allowDecimals={false}
              domain={[0, 'auto']}
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
            <Tooltip
              formatter={formatINR}
              labelFormatter={label => `State: ${label}`}
            />
            <Legend
              wrapperStyle={legendStyle}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
            <Bar dataKey="totalQuotedValue" fill="#0088FE" name="Total  Quoted Value (INR)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
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

// Opportunities Over Time Chart
function OpportunitiesOverTimeChart({ prefix }) {
  const [data, setData] = useState([]);
  const chartRef = useRef();

  useEffect(() => {
    fetch(`http://172.26.0.217:4000/opportunities/over-time${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'opportunities-over-time-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Opportunities Over Time</div>
      <div style={chartDescStyle}>
        <em>
          Total quoted value of opportunities grouped by Tentative Closing Date (quarter).
        </em>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 120, left: 120, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="quarter"
              interval={0}
              minTickGap={10}
              angle={-45}
              textAnchor="end"
              height={100} // increase height to give more space for label and ticks
              label={{
                value: 'Tentative Closing Date (Quarter)',
                position: 'insideBottom',
                offset: 40, // increase offset for more gap
                dy: 50,     // increase dy for more gap
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
            />
            <YAxis
              tickFormatter={formatINR}
              label={{
                value: 'Total Quoted Value (INR)',
                angle: -90,
                position: 'insideLeft',
                offset: 30,
                dx: -50,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={formatINR}
              labelFormatter={label => `Quarter: ${label}`}
            />
            <Legend
              wrapperStyle={legendStyle}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
            <Bar dataKey="totalQuotedValue" fill="#0088FE" name="Total Quoted Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
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

// Chart by Proposal Owner
function ProposalOwnerChart({ prefix }) {
  const [data, setData] = useState([]);
  const chartRef = useRef();

  useEffect(() => {
    fetch(`http://172.26.0.217:4000/opportunities/proposal-performance${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [prefix]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'proposal-owner-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Proposal Owner Performance</div>
      <div style={chartDescStyle}>
        <em>
          Number of opportunities handled by each Proposal Owner.
        </em>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 120, left: 120, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ProposalOwner"
              interval={0}
              minTickGap={1}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 14, fill: '#2a3f54', fontWeight: 'bold' }}
              label={{
                value: 'Proposal Owner',
                position: 'insideBottom',
                offset: 20,
                dy: 30,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
            />
            <YAxis
              tickFormatter={v => v}
              label={{
                value: 'Proposal Count',
                angle: -90,
                position: 'insideLeft',
                offset: 30,
                dx: -50,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={v => v}
              labelFormatter={label => `Proposal Owner: ${label}`}
            />
            <Legend
              wrapperStyle={legendStyle}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
            <Bar dataKey="proposalCount" fill="#FF9800" name="Proposal Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
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

// Chart by Closed Won Opportunities (Stacked)
function ClosedWonStackedChart({ prefix }) {
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState('owner'); // 'owner' or 'industry'
  const chartRef = useRef();

  useEffect(() => {
    const endpoint = viewType === 'owner' 
      ? '/opportunities/closed-won-stacked'
      : '/opportunities/closed-won-stacked-industry';
      
    fetch(`http://172.26.0.217:4000${endpoint}${prefix && prefix !== 'ALL' ? `?prefix=${prefix}` : ''}`)
      .then(res => res.json())
      .then(apiData => {
        const transformedData = Object.values(
          apiData.reduce((acc, row) => {
            if (!acc[row.State]) {
              acc[row.State] = {
                State: row.State,
                totalStateValue: row.totalStateValue,
                totalStateCount: row.totalStateCount
              };
            }
            const key = viewType === 'owner' ? row.OpportunityOwner : row.IndustryType;
            acc[row.State][key] = row.closedWonValue;
            acc[row.State][`${key}_count`] = row.opportunityCount;
            return acc;
          }, {})
        );
        setData(transformedData);
      })
      .catch(console.error);
  }, [viewType, prefix]);

  // Get unique keys for stacks
  const stackKeys = Array.from(new Set(
    data.flatMap(d => Object.keys(d).filter(k => 
      !['State', 'totalStateValue', 'totalStateCount', 'totalStateQuoted'].includes(k) &&
      !k.includes('_quoted') && 
      !k.includes('_count')
    ))
  ));

  // Colors for stacks (expand for more stacks)
  const colors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FE8B8B", "#8BFEA2", "#FEA28B", "#8BA2FE", "#C4C49F",
    "#B388FF", "#FFB300", "#F44336", "#43A047", "#1E88E5", "#D81B60", "#8E24AA", "#FDD835", "#00ACC1", "#FF7043"
  ];

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'closed-won-stacked-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Custom tooltip for stacked chart
  const StackedTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0].payload;
      const totalStateValue = firstPayload.totalStateValue || 0;
      const totalStateCount = firstPayload.totalStateCount || 0;

      return (
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: '280px',
          fontSize: '13px'
        }}>
          {/* State Header */}
          <div style={{
            borderBottom: '2px solid #f0f0f0',
            marginBottom: '12px',
            paddingBottom: '8px'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#2a3f54',
              marginBottom: '4px'
            }}>
              {label}
            </div>
            <div style={{ color: '#666' }}>
              <div style={{ fontWeight: 'bold' }}>
                Total Closed Won: {formatINR(totalStateValue)}
              </div>
              <div>Total Opportunities: {totalStateCount}</div>
            </div>
          </div>

          {/* Owner Details */}
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {payload.map((entry, index) => {
              const owner = entry.dataKey;
              const value = entry.value;
              const count = entry.payload[`${owner}_count`] || 0;

              return (
                <div key={owner} style={{
                  padding: '8px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${entry.color}`
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2a3f54',
                    marginBottom: '4px'
                  }}>
                    {owner}
                  </div>
                  <div style={{ color: '#666' }}>
                    <div>Closed Won: {formatINR(value)}</div>
                    <div>Opportunities: {count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={sectionStyle}>
      <div style={chartTitleStyle}>Closed Won Value by State</div>
      <div style={chartDescStyle}>
        <em>State-wise breakdown of closed won opportunities</em>
        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              checked={viewType === 'owner'}
              onChange={() => setViewType('owner')}
            /> By Opportunity Owner
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              checked={viewType === 'industry'}
              onChange={() => setViewType('industry')}
            /> By Industry Type
          </label>
        </div>
      </div>
      
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 16, right: 120, left: 180, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tickFormatter={formatINR}
              label={{
                value: 'Total Closed Won Final Value (INR)',
                position: 'insideBottom',
                offset: 40, // increased from 20
                dy: 45,    // increased from 30
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
            />
            <YAxis 
              type="category" 
              dataKey="State" 
              width={160}
              label={{
                value: 'State',
                angle: -90,
                position: 'insideLeft',
                offset: 30,
                dx: -60,
                style: { textAnchor: 'middle', fill: '#888', fontWeight: 'bold', fontSize: 16 }
              }}
            />
            <Tooltip content={<StackedTooltip />} />
            <Legend 
              wrapperStyle={legendStyle}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
            {stackKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={colors[index % colors.length]}
                name={key}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
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

// Show all charts together
function AllPerformanceCharts({ prefix }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 clamp(10px, 2vw, 20px)' }}>
      <StagePerformanceChart prefix={prefix} />
      <OwnerPerformanceChartInner prefix={prefix} />
      <IndustryPerformanceChart prefix={prefix} />
      <StateQuotedValueChart prefix={prefix} />
      <OpportunitiesOverTimeChart prefix={prefix} />
      <ProposalOwnerChart prefix={prefix} />
      <ClosedWonStackedChart prefix={prefix} />
    </div>
  );
}

export default AllPerformanceCharts;