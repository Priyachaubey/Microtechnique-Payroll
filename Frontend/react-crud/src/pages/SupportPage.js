import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { supportApi } from '../api/index';
import toast from 'react-hot-toast';

export default function SupportPage({ isAdmin }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');

  // Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await supportApi.getTickets();
      setTickets(res.data || []);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId) => {
    try {
      const res = await supportApi.getReplies(ticketId);
      setReplies(res.data || []);
    } catch (err) {
      toast.error('Failed to load replies');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await supportApi.createTicket({ subject, description });
      toast.success('Ticket submitted');
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to submit ticket');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    try {
      await supportApi.addReply(selectedTicket.ticketId, { message: replyMessage });
      setReplyMessage('');
      fetchReplies(selectedTicket.ticketId);
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      await supportApi.updateStatus(ticketId, status);
      toast.success('Status updated');
      fetchTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openTicket = (t) => {
    setSelectedTicket(t);
    fetchReplies(t.ticketId);
  };

  return (
    <AppLayout role={isAdmin ? 'admin' : 'employee'}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, height: 'calc(100vh - 80px)' }}>
        
        {/* Left column: Ticket List */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--gray-900)' }}>Support Tickets</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>HR & IT Support Desk</p>
            </div>
            {!isAdmin && (
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setShowCreateModal(true)}>
                New Ticket
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>No tickets found.</div>
            ) : (
              tickets.map(t => (
                <div 
                  key={t.ticketId}
                  onClick={() => openTicket(t)}
                  style={{ 
                    padding: 16, borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                    background: selectedTicket?.ticketId === t.ticketId ? 'var(--primary-50)' : '#FFF',
                    borderLeft: selectedTicket?.ticketId === t.ticketId ? '4px solid var(--primary-600)' : '4px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{t.subject}</div>
                    <span className={`badge ${t.status === 'Open' ? 'badge-warning' : (t.status === 'InProgress' ? 'badge-primary' : 'badge-success')}`}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)' }}>
                    <span>{isAdmin ? t.employeeName : `Ticket #${t.ticketId}`}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Ticket Chat View */}
        <div style={{ flex: '2', background: '#FFF', borderRadius: 16, border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedTicket ? (
            <>
              <div style={{ padding: 20, borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: 'var(--gray-900)' }}>{selectedTicket.subject}</h2>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                    By {selectedTicket.employeeName} • {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                </div>
                {isAdmin && (
                  <select 
                    className="form-control" 
                    value={selectedTicket.status} 
                    onChange={e => handleStatusUpdate(selectedTicket.ticketId, e.target.value)}
                    style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  >
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#FFF', padding: 16, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', marginBottom: 8 }}>Original Message:</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-900)', whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</div>
                </div>
                
                {replies.map(r => (
                  <div key={r.replyId} style={{ 
                    background: isAdmin ? (r.senderName === selectedTicket.employeeName ? '#FFF' : '#EEF2FF') : (r.senderName === selectedTicket.employeeName ? '#EEF2FF' : '#FFF'), 
                    padding: 16, borderRadius: 12, border: '1px solid',
                    borderColor: isAdmin ? (r.senderName === selectedTicket.employeeName ? 'var(--gray-200)' : '#C7D2FE') : (r.senderName === selectedTicket.employeeName ? '#C7D2FE' : 'var(--gray-200)'),
                    alignSelf: isAdmin ? (r.senderName === selectedTicket.employeeName ? 'flex-start' : 'flex-end') : (r.senderName === selectedTicket.employeeName ? 'flex-end' : 'flex-start'),
                    maxWidth: '80%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-500)', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{r.senderName}</span>
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--gray-900)', whiteSpace: 'pre-wrap' }}>{r.message}</div>
                  </div>
                ))}
              </div>
              
              {selectedTicket.status !== 'Closed' && (
                <div style={{ padding: 16, borderTop: '1px solid var(--gray-200)', background: '#FFF' }}>
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: 12 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={replyMessage} 
                      onChange={e => setReplyMessage(e.target.value)} 
                      placeholder="Type your reply..." 
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>Send</button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              Select a ticket to view conversation
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>Raise Support Ticket</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Subject</label>
                <input required className="form-control" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief issue summary" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea required className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows="5" placeholder="Detail your issue..."></textarea>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
