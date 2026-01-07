import React, { useState } from 'react';

function UploadExcel({ onUploadSuccess }) {
  const [type, setType] = useState('opportunity');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' | 'error'
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setMessage('');
    setMsgType('');
    if (!file) {
      setMessage('Please select a file to upload.');
      setMsgType('error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    // Map type to correct backend endpoint
    const endpoint =
      type === 'opportunity'
        ? 'opportunities'
        : type === 'lead'
        ? 'leads'
        : '';
    if (!endpoint) {
      setMessage('Invalid data type selected.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}/upload/${endpoint}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Upload failed. Please try again.');
        setMsgType('error');
        console.error('Upload error details:', data);
      } else {
        setMessage('Upload successful!');
        setMsgType('success');
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      }
    } catch (err) {
      setMessage('Upload failed: ' + err.message);
      setMsgType('error');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: '#fafdff',
        borderRadius: 14,
        boxShadow: '0 2px 12px #e3eafc',
        padding: 24,
        maxWidth: 400,
        margin: '0 auto'
      }}
    >
      <label style={{ fontWeight: 600, color: '#2a3f54', fontSize: 16 }}>
        Select Data Type:
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{
            marginLeft: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1.5px solid #b0c4de',
            fontSize: 16,
            background: '#fff',
            fontFamily: 'inherit'
          }}
        >
          <option value="opportunity">Opportunity</option>
          <option value="lead">Lead</option>
        </select>
      </label>
      <label style={{ fontWeight: 600, color: '#2a3f54', fontSize: 16 }}>
        Choose Excel File:
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={e => setFile(e.target.files[0])}
          style={{
            marginLeft: 12,
            padding: '8px 0',
            fontSize: 16,
            fontFamily: 'inherit'
          }}
        />
      </label>
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          padding: '12px 0',
          fontSize: 18,
          borderRadius: 8,
          border: 'none',
          background: loading ? '#b0c4de' : '#0088FE',
          color: '#fff',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px #e3eafc',
          transition: 'background 0.2s'
        }}
      >
        {loading ? 'Uploading...' : <><span style={{ fontSize: 20, marginRight: 8 }}>⬆️</span>Upload Excel</>}
      </button>
      {message && (
        <div
          style={{
            marginTop: 4,
            padding: '10px 16px',
            borderRadius: 8,
            background: msgType === 'success' ? '#e6f9f0' : '#fff0f0',
            color: msgType === 'success' ? '#008060' : '#d32f2f',
            border: `1.5px solid ${msgType === 'success' ? '#00C49F' : '#f5bcbc'}`,
            fontWeight: 500,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {msgType === 'success' ? '✔️' : '❌'} {message}
        </div>
      )}
    </div>
  );
}

export default UploadExcel;
