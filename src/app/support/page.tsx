"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get(`/support/all-tickets`);
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (ticketId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/support/respond`, {
        ticketId,
        text: replyText
      });
      setReplyText("");
      setReplyingTo(null);
      fetchTickets();
      alert("Response sent via email and socket!");
    } catch (err) {
      console.error("Error responding to ticket:", err);
      alert("Failed to respond");
    }
  };

  const resolveTicket = async (ticketId: string) => {
    try {
      // Optionally we could add a specific endpoint for resolving, but we can just use the respond logic.
      await api.post(`/support/resolve/${ticketId}`);
      fetchTickets();
    } catch (err) {
      console.error("Error resolving:", err);
    }
  };

  return (
    <div className="screen on" id="sc-admin-support">
      <div className="ph">
        <div>
          <h1>Support Tickets</h1>
          <p>Client support management.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchTickets}><i className="ti ti-refresh"></i> Refresh</button>
      </div>
      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-red"><i className="ti ti-ticket"></i></div>
          <div><div className="astat-lbl">Open</div><div className="astat-val">{tickets.filter(t => t.status === "open").length}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-clock"></i></div>
          <div><div className="astat-lbl">In Progress</div><div className="astat-val">{tickets.filter(t => t.status === "pending").length}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-circle-check"></i></div>
          <div><div className="astat-lbl">Resolved Total</div><div className="astat-val">{tickets.filter(t => t.status === "resolved").length}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-clock-hour-4"></i></div>
          <div><div className="astat-lbl">Total Tickets</div><div className="astat-val">{tickets.length}</div></div>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Client</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading Tickets...</td></tr>
              ) : tickets.map(ticket => (
                <tr key={ticket._id} onClick={() => setSelectedTicket(ticket)} style={{ cursor: "pointer" }}>
                  <td className="td-mono c-t3">{ticket._id.slice(-6)}</td>
                  <td className="fw6">{ticket.user?.email || 'Unknown'}</td>
                  <td className="c-t2">{ticket.subject}</td>
                  <td>
                    <span className={`st ${ticket.status === 'open' ? 'st-pending' : ticket.status === 'pending' ? 'st-processing' : 'st-approved'}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="text-xs c-t3">{new Date(ticket.createdAt).toLocaleString()}</td>
                  <td>
                    {ticket.status === "resolved" ? (
                      <button className="btn btn-xs btn-ghost" onClick={(event) => { event.stopPropagation(); setSelectedTicket(ticket); }}>View</button>
                    ) : (
                      <div className="fal gap6" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        {replyingTo === ticket._id ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <input 
                              type="text" 
                              className="fi" 
                              placeholder="Type response..." 
                              style={{ width: '200px' }}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button className="btn btn-sm btn-primary" onClick={() => handleRespond(ticket._id)}>Send</button>
                            <button className="btn btn-sm btn-outline" onClick={() => setReplyingTo(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn btn-sm btn-primary" onClick={() => setReplyingTo(ticket._id)}>Respond</button>
                            <button className="btn btn-sm btn-success" onClick={() => resolveTicket(ticket._id)}><i className="ti ti-check"></i> Resolve</button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && tickets.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center" }}>No tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={(event) => { if (event.target === event.currentTarget) setSelectedTicket(null); }}>
          <div className="card w-full max-w-2xl bg-white" style={{ maxHeight: "85vh", overflowY: "auto" }}>
            <div className="fb mb14"><div><h2 style={{ margin: 0 }}>{selectedTicket.subject}</h2><div className="text-xs c-t3 mt-1">{selectedTicket.user?.email || "Unknown client"} · {selectedTicket.status}</div></div><button className="btn btn-outline btn-xs" onClick={() => setSelectedTicket(null)}>Close</button></div>
            <div className="flex flex-col gap-3 mb14">
              {(selectedTicket.messages || []).map((message: any, index: number) => <div key={index} className={`p-3 rounded-lg ${message.sender === "admin" ? "bg-[#EFF6FF] ml-8" : "bg-[#F8FAFC] mr-8"}`}><div className="text-[10px] font-bold uppercase c-t3 mb-1">{message.sender === "admin" ? "Support" : "Client"}</div><div className="text-sm c-t1">{message.text}</div></div>)}
            </div>
            {selectedTicket.status !== "resolved" && <div className="flex gap-2"><input className="fi flex-1" placeholder="Write a response..." value={replyText} onChange={(event) => setReplyText(event.target.value)} /><button className="btn btn-primary" onClick={() => handleRespond(selectedTicket._id)} disabled={!replyText.trim()}>Send</button><button className="btn btn-success" onClick={() => resolveTicket(selectedTicket._id)}>Resolve</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}
