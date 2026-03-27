import React, { useState, useEffect } from 'react';
import './StageRemarkModal.css'; // Reusing some modal styles
import { Loader } from '../../../components/Loader';

interface ToDoItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  follow_up_1_date?: string;
  follow_up_1_notes?: string;
  next_step?: string;
}

interface ToDoData {
  consultationCalls: ToDoItem[];
  followups: ToDoItem[];
}

interface ToDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewLead: (leadId: string) => void;
}

const ToDoModal: React.FC<ToDoModalProps> = ({ isOpen, onClose, onViewLead }) => {
  const [data, setData] = useState<ToDoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/crm/todo')
        .then(res => res.json())
        .then(d => {
          setData(d);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch todo list:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="stage-remark-overlay">
      <div className="stage-remark-modal" style={{ maxWidth: 800, width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="stage-remark-header" style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#21615D' }}>📋 Sales To-Do List</h2>
        </div>

        <div className="stage-remark-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', position: 'relative', minHeight: '200px' }}>
          {loading ? (
            <Loader />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* 1. Actionable Items */}
              <section>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12, borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>
                  1. Actionable Items
                </h3>
                
                <div style={{ paddingLeft: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>A. List of consultation calls scheduled</h4>
                  {data?.consultationCalls.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 12 }}>No calls scheduled</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                      {data?.consultationCalls.map(item => (
                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, border: '1px solid #dcfce7' }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                            <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{item.phone}</span>
                          </div>
                          <button 
                            onClick={() => onViewLead(item.id)}
                            style={{ 
                              fontSize: 11, 
                              padding: '4px 10px', 
                              background: '#ffffff', // Light background
                              color: '#21615D', // Dark text
                              borderRadius: 6, 
                              border: '1px solid #21615D', // Border to define it
                              cursor: 'pointer', 
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            View
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>B. Follow ups</h4>
                  {data?.followups.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No follow-ups pending</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {data?.followups.map(item => (
                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, border: '1px solid #dcfce7' }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                            <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{formatDate(item.follow_up_1_date)}</span>
                          </div>
                          <button 
                            onClick={() => onViewLead(item.id)}
                            style={{ 
                              fontSize: 11, 
                              padding: '4px 10px', 
                              background: '#ffffff', // Light background
                              color: '#21615D', // Dark text
                              borderRadius: 6, 
                              border: '1px solid #21615D', // Border
                              cursor: 'pointer', 
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            View
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* 2. Follow up Details */}
              <section>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12, borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>
                  2. Upcoming Follow-up Schedule
                </h3>
                
                {data?.followups.length === 0 ? (
                   <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No detailed follow-ups scheduled</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Name</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, width: 120 }}>Date</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Details</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Next step</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.followups.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                            <td style={{ padding: '10px 12px', color: '#4b5563' }}>{formatDate(item.follow_up_1_date)}</td>
                            <td style={{ padding: '10px 12px', color: '#6b7280' }}>{item.follow_up_1_notes || 'No notes'}</td>
                            <td style={{ padding: '10px 12px', color: '#21615D', fontWeight: 500 }}>{item.next_step || 'Consultation call'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        <div className="stage-remark-footer" style={{ flexShrink: 0 }}>
          <button className="btn-cancel" onClick={onClose} style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ToDoModal;
