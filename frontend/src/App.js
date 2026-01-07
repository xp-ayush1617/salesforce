import React, { useState } from 'react';
import UploadExcel from './UploadExcel';
import OpportunityDashboard from './OpportunityDashboard';
import LeadDashboard from './LeadDashboard';

// Modal component for success message
function SuccessModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(30,40,60,0.25)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-in-out',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 'clamp(16px, 3vw, 20px)',
        padding: 'clamp(24px, 5vw, 48px)',
        boxShadow: '0 16px 64px rgba(176, 196, 222, 0.3)',
        textAlign: 'center',
        width: '90%',
        maxWidth: '400px',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(227, 234, 252, 0.8)',
        transform: 'scale(1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 20px 80px rgba(176, 196, 222, 0.4)'
        }
      }}>
        <div style={{ fontSize: 54, color: '#00C49F', marginBottom: 18, fontWeight: 700, textShadow: '0 2px 8px #e0f7fa' }}>✔</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, color: '#1a2a3a' }}>Upload Successful</div>
        <div style={{ color: '#666', marginBottom: 28, fontSize: 17 }}>Your Excel file was uploaded successfully.</div>
        <button
          style={{
            padding: '12px 38px', fontSize: 18, borderRadius: 10, border: 'none',
            background: 'linear-gradient(90deg,#0088FE 60%,#00C49F 100%)',
            color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px #e3eafc',
            letterSpacing: 0.5, transition: 'background 0.2s'
          }}
          onClick={onClose}
          onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,#00C49F 60%,#0088FE 100%)'}
          onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg,#0088FE 60%,#00C49F 100%)'}
        >
          Close
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// Modal for Upload Excel
function UploadModal({ open, onClose, onUploadSuccess }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(30,40,60,0.25)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-in-out',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 'clamp(16px, 3vw, 20px)',
        padding: 'clamp(20px, 4vw, 40px)',
        boxShadow: '0 16px 64px rgba(176, 196, 222, 0.3)',
        width: '90%',
        maxWidth: '540px',
        position: 'relative',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(227, 234, 252, 0.8)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 20px 80px rgba(176, 196, 222, 0.4)'
        }
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18, background: 'none', border: 'none',
            fontSize: 28, color: '#888', cursor: 'pointer', fontWeight: 700, transition: 'color 0.2s'
          }}
          aria-label="Close"
          onMouseOver={e => e.currentTarget.style.color = '#0088FE'}
          onMouseOut={e => e.currentTarget.style.color = '#888'}
        >×</button>
        <div style={{ marginBottom: 22, textAlign: 'center' }}>
          <span style={{
            fontSize: 32,
            color: '#0088FE',
            background: 'linear-gradient(135deg,#e3f2fd 60%,#f7f9fc 100%)',
            borderRadius: '50%',
            padding: 12,
            boxShadow: '0 2px 12px #e3eafc'
          }}>📤</span>
          <h2 style={{
            fontSize: 27,
            color: '#1a2a3a',
            fontWeight: 800,
            letterSpacing: 0.5,
            margin: '14px 0 0 0'
          }}>Upload Excel Data</h2>
        </div>
        <UploadExcel
          onUploadSuccess={() => {
            onClose();
            onUploadSuccess();
          }}
        />
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function App() {
  // Set 'lead' as default view
  const [view, setView] = useState('lead');
  const [modalOpen, setModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, #f7f9fc 0%, #e3eafc 100%), url("https://www.transparenttextures.com/patterns/cubes.png")`,
      fontFamily: "'Segoe UI', 'din', Arial, sans-serif",
      backgroundBlendMode: 'lighten',
      width: '100%',
      overflowX: 'hidden'
    }}>
      <header style={{
        padding: 'clamp(16px, 3vw, 24px) clamp(10px, 2vw, 20px)',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,249,252,0.95) 100%)',
        boxShadow: '0 8px 32px rgba(37, 47, 97, 0.08)',
        marginBottom: 'clamp(20px, 4vw, 32px)',
        borderBottomLeftRadius: 'clamp(16px, 3vw, 24px)',
        borderBottomRightRadius: 'clamp(16px, 3vw, 24px)',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}>
        <h1 style={{
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          fontSize: 'clamp(24px, 5vw, 42px)',
          margin: 0,
          color: '#1c2a39',
          fontWeight: 600,
          letterSpacing: 1.2,
        }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <img
              src={process.env.PUBLIC_URL + '/logo192.png'}
              alt="Logo"
              style={{
                width: 'clamp(32px, 8vw, 48px)',
                height: 'clamp(32px, 8vw, 48px)',
                borderRadius: 8,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                objectFit: 'cover',
              }}
            />
            <span style={{
              background: 'linear-gradient(90deg, #0d47a1, #1976d2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              padding: '0 10px'
            }}>
              Salesforce Insights (SED)
            </span>
          </span>
        </h1>
      </header>

      {/* Professional Top Bar: Lead, Opportunity, Upload Excel (right) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'clamp(12px, 2vw, 20px)',
        marginBottom: 'clamp(16px, 3vw, 24px)',
        padding: 'clamp(12px, 2vw, 20px)',
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        boxShadow: '0 8px 32px rgba(227, 234, 252, 0.5)',
        border: '2px solid rgba(227, 234, 252, 0.8)',
        width: '92%',
        maxWidth: '1400px',
        margin: '0 auto 20px auto',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease-in-out',
        transform: 'translateY(0)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 48px rgba(227, 234, 252, 0.8)'
        }
      }}>
        {/* Pill-style tabs, left side */}
        <div style={{
          display: 'flex',
          gap: 0,
          background: 'linear-gradient(90deg,#f7f9fc 60%,#e3eafc 100%)',
          borderRadius: '16px',
          boxShadow: '0 2px 12px #e3eafc',
          padding: '0',
          border: '2px solid #dbeafe',
          overflow: 'hidden',
          flexGrow: 1,
          maxWidth: '100%'
        }}>
          <button
            style={{
              padding: 'clamp(10px, 2vw, 18px) clamp(20px, 4vw, 54px)',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              borderRadius: '16px 0 0 16px',
              border: 'none',
              background: view === 'lead'
                ? 'linear-gradient(90deg,#e0f7fa 70%,#f7f9fc 100%)'
                : 'transparent',
              color: view === 'lead' ? '#00C49F' : '#2a3f54',
              fontWeight: view === 'lead' ? 800 : 500,
              cursor: 'pointer',
              boxShadow: view === 'lead' ? '0 2px 12px #e0f7fa' : 'none',
              outline: 'none',
              borderRight: '2px solid #dbeafe',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s'
            }}
            onClick={() => setView('lead')}
          >
            Lead
          </button>
          <button
            style={{
              padding: 'clamp(10px, 2vw, 18px) clamp(20px, 4vw, 54px)',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              borderRadius: '0 16px 16px 0',
              border: 'none',
              background: view === 'opportunity'
                ? 'linear-gradient(90deg,#e3f2fd 70%,#f7f9fc 100%)'
                : 'transparent',
              color: view === 'opportunity' ? '#0088FE' : '#2a3f54',
              fontWeight: view === 'opportunity' ? 800 : 500,
              cursor: 'pointer',
              boxShadow: view === 'opportunity' ? '0 2px 12px #e3eafc' : 'none',
              outline: 'none',
              borderLeft: '2px solid #dbeafe',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s'
            }}
            onClick={() => setView('opportunity')}
          >
            Opportunity
          </button>
        </div>

        {/* Upload Excel button */}
        <button
          style={{
            padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 38px)',
            fontSize: 'clamp(14px, 2vw, 18px)',
            borderRadius: '12px',
            border: '2.5px solid #0088FE',
            background: 'linear-gradient(90deg,#e3f2fd 60%,#f7f9fc 100%)',
            color: '#0088FE',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 12px #e3eafc',
            transition: 'all 0.18s',
            outline: 'none',
            letterSpacing: 0.3,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
          onClick={() => setModalOpen(true)}
          onMouseOver={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg,#0088FE 20%,#e3f2fd 100%)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#00C49F';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg,#e3f2fd 60%,#f7f9fc 100%)';
            e.currentTarget.style.color = '#0088FE';
            e.currentTarget.style.borderColor = '#0088FE';
          }}
        >
          <span style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', verticalAlign: 'middle' }}>📤</span>
          Upload Excel Data
        </button>
      </div>

      <main style={{
        width: '95%',
        maxWidth: '1800px',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 24px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,249,252,0.95) 100%)',
        borderRadius: 'clamp(16px, 3vw, 24px)',
        boxShadow: '0 8px 32px rgba(37, 47, 97, 0.08)',
        minHeight: '420px',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(8px)',
        overflowX: 'auto',
        border: '1px solid rgba(227, 234, 252, 0.5)'
      }}>
        {view === 'opportunity' ? <OpportunityDashboard /> : <LeadDashboard />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px 10px',
        background: 'linear-gradient(90deg, #f5f7fa 0%, #e4f1f9 100%)',
        color: '#1a237e',
        fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
        fontSize: 'clamp(14px, 2vw, 16px)',
        marginTop: '30px',
        borderTop: '2px solid #0288d1',
        width: '100%'
      }}>
        <span style={{ 
          fontWeight: 700, 
          color: '#0d47a1',
          fontSize: 'clamp(16px, 2.5vw, 18px)'
        }}>
          © 2025 SEDL
        </span>
        <br />
        <span style={{
          color: '#00796b',
          fontWeight: 500,
          fontSize: 'clamp(13px, 2vw, 15px)',
          letterSpacing: 0.3
        }}>
          Developed by SEDL IT Department
        </span>
      </footer>
      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadSuccess={() => setSuccessOpen(true)}
      />
      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

export default App;

