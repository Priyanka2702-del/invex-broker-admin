"use client";

import { useState, useEffect } from "react";
import api from '@/services/api';
import { useAdminAuth } from '@/context/AdminAuthContext';

type DepositWallets = Record<string, string>;
type WithdrawalMethods = Record<string, boolean>;
type ManagedAdmin = { _id: string; name: string; email: string; active: boolean; plainPassword?: string; createdAt?: string; lastLogin?: string };

const emptyDepositWallets: DepositWallets = {
  USDT_TRC20: '',
  USDT_ERC20: '',
  USDT_BEP20: '',
  BTC: '',
  ETH: '',
};

const emptyWithdrawalMethods: WithdrawalMethods = {
  USDT_TRC20: true,
  USDT_ERC20: true,
  USDT_BEP20: true,
  BTC: true,
  ETH: true,
};

function AdminRow({ managedAdmin, onToggle }: { managedAdmin: ManagedAdmin; onToggle: (a: ManagedAdmin) => void }) {
  const [showPw, setShowPw] = useState(false);
  const pw = managedAdmin.plainPassword;
  return (
    <tr>
      <td>
        <div className="fw6 text-sm">{managedAdmin.name}</div>
        <div className="text-[10px] c-t3">{managedAdmin.createdAt ? new Date(managedAdmin.createdAt).toLocaleDateString() : '—'}</div>
      </td>
      <td className="text-sm">{managedAdmin.email}</td>
      <td>
        {pw ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs select-all" style={{ letterSpacing: showPw ? '0' : '2px' }}>
              {showPw ? pw : '•'.repeat(Math.min(pw.length, 10))}
            </span>
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-[#6B7280] hover:text-[#111827] transition-colors"
              title={showPw ? 'Hide password' : 'Reveal password'}
            >
              <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'} text-sm`} />
            </button>
          </div>
        ) : (
          <span className="text-xs c-t3 italic">Not available</span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <span className={`st ${managedAdmin.active ? 'st-approved' : 'st-rejected'}`}>
          {managedAdmin.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="text-xs c-t3">
        {managedAdmin.lastLogin ? new Date(managedAdmin.lastLogin).toLocaleString() : 'Never'}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className={`btn btn-sm ${managedAdmin.active ? 'btn-danger' : 'btn-success'}`} onClick={() => onToggle(managedAdmin)}>
          {managedAdmin.active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  );
}



export default function Settings() {
  const { admin } = useAdminAuth();


  const [depositWallets, setDepositWallets] = useState<DepositWallets>(emptyDepositWallets);
  const [depositWalletsSaving, setDepositWalletsSaving] = useState(false);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethods>(emptyWithdrawalMethods);
  const [withdrawalMethodsSaving, setWithdrawalMethodsSaving] = useState(false);
  const [financeMessage, setFinanceMessage] = useState('');
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminSaving, setAdminSaving] = useState(false);
  const [managedAdmins, setManagedAdmins] = useState<ManagedAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    encryption: 'TLS',
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
    adminAlertEmail: ''
  });
  
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState('');
  const [smtpMessageOk, setSmtpMessageOk] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [smtpRes, depositRes, withdrawalRes] = await Promise.all([
          api.get('/admin/smtp-config'),
          api.get('/admin/deposit-wallets'),
          api.get('/admin/withdrawal-methods'),
        ]);
        if (smtpRes.data) setSmtpConfig((prev) => ({ ...prev, ...smtpRes.data }));
        if (depositRes.data?.wallets) {
          const wallets = depositRes.data.wallets as Record<string, { walletAddress?: string }>;
          setDepositWallets({
            USDT_TRC20: wallets.USDT_TRC20?.walletAddress || '',
            USDT_ERC20: wallets.USDT_ERC20?.walletAddress || '',
            USDT_BEP20: wallets.USDT_BEP20?.walletAddress || '',
            BTC: wallets.BTC?.walletAddress || '',
            ETH: wallets.ETH?.walletAddress || '',
          });
        }
        if (withdrawalRes.data?.methods) {
          const methods = withdrawalRes.data.methods as Record<string, { enabled?: boolean }>;
          setWithdrawalMethods({
            USDT_TRC20: Boolean(methods.USDT_TRC20?.enabled),
            USDT_ERC20: Boolean(methods.USDT_ERC20?.enabled),
            USDT_BEP20: Boolean(methods.USDT_BEP20?.enabled),
            BTC: Boolean(methods.BTC?.enabled),
            ETH: Boolean(methods.ETH?.enabled),
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const loadManagedAdmins = async () => {
    if (!admin?.isSuperAdmin) return;
    setAdminsLoading(true);
    try {
      const response = await api.get('/admin-auth/admins');
      setManagedAdmins(response.data?.admins || []);
    } catch (err) {
      console.error('Failed to load administrators:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => { loadManagedAdmins(); }, [admin?.isSuperAdmin]);



  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSmtpConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveSmtpConfig = async () => {
    setSmtpMessage('');
    setSmtpSaving(true);
    try {
      await api.post('/admin/smtp-config', smtpConfig);
      setSmtpMessage('SMTP configuration saved.');
      setSmtpMessageOk(true);
    } catch (err: any) {
      setSmtpMessage(err.response?.data?.message || 'Failed to save SMTP config');
      setSmtpMessageOk(false);
    } finally {
      setSmtpSaving(false);
    }
  };

  const testSmtpConfig = async () => {
    setSmtpMessage('');
    setSmtpTesting(true);
    try {
      const response = await api.post('/admin/smtp-config/test', smtpConfig);
      setSmtpMessage(response.data?.message || 'SMTP test email sent.');
      setSmtpMessageOk(true);
    } catch (err: any) {
      setSmtpMessage(err.response?.data?.message || 'SMTP connection failed. Check your credentials.');
      setSmtpMessageOk(false);
    } finally {
      setSmtpTesting(false);
    }
  };

  const updateDepositWallet = (key: keyof DepositWallets, value: string) => {
    setDepositWallets((prev) => ({ ...prev, [key]: value }));
  };

  const saveDepositWallets = async () => {
    setDepositWalletsSaving(true);
    setFinanceMessage('');
    try {
      await api.put('/admin/deposit-wallets', { wallets: depositWallets });
      setFinanceMessage('Deposit wallet settings saved.');
    } catch (err: any) {
      setFinanceMessage(err.response?.data?.message || 'Failed to save deposit wallets.');
    } finally {
      setDepositWalletsSaving(false);
    }
  };

  const toggleWithdrawalMethod = (key: keyof WithdrawalMethods) => {
    setWithdrawalMethods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveWithdrawalMethods = async () => {
    setWithdrawalMethodsSaving(true);
    setFinanceMessage('');
    try {
      await api.put('/admin/withdrawal-methods', { methods: withdrawalMethods });
      setFinanceMessage('Withdrawal method settings saved.');
    } catch (err: any) {
      setFinanceMessage(err.response?.data?.message || 'Failed to save withdrawal methods.');
    } finally {
      setWithdrawalMethodsSaving(false);
    }
  };

  const createAdmin = async () => {
    setAdminSaving(true);
    setFinanceMessage('');
    try {
      await api.post('/admin-auth/admins', adminForm);
      setAdminForm({ name: '', email: '', password: '' });
      await loadManagedAdmins();
      setFinanceMessage('Administrator created. Share the credentials manually with the administrator.');
    } catch (err: any) {
      setFinanceMessage(err.response?.data?.message || 'Unable to create administrator.');
    } finally { setAdminSaving(false); }
  };

  const toggleManagedAdmin = async (managedAdmin: ManagedAdmin) => {
    try {
      await api.put(`/admin-auth/admins/${managedAdmin._id}/status`, { active: !managedAdmin.active });
      await loadManagedAdmins();
      setFinanceMessage(`Administrator ${managedAdmin.active ? 'deactivated' : 'activated'}.`);
    } catch (err: any) {
      setFinanceMessage(err.response?.data?.message || 'Unable to update administrator status.');
    }
  };

  return (
    <div className="screen on" id="sc-admin-settings">
      <div className="ph">
        <div>
          <h1>Platform Settings</h1>
          <p>Configure your broker platform.</p>
        </div>
        <button className="btn btn-primary btn-sm"><i className="ti ti-device-floppy"></i> Save All</button>
      </div>
      <div className="g2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="sh mb16">General</div>
            <div className="fg">
              <label className="fl">Platform Name</label>
              <input className="fi" defaultValue="AMG Trade" />
            </div>
            <div className="g2">
              <div className="fg">
                <label className="fl">Base Currency</label>
                <select className="fi" defaultValue="USD">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Language</label>
                <select className="fi" defaultValue="English">
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
            </div>
            <div className="g2">
              <div className="fg">
                <label className="fl">Min. Deposit (USD)</label>
                <input type="number" className="fi" defaultValue="50" />
              </div>
              <div className="fg">
                <label className="fl">Min. Withdrawal (USD)</label>
                <input type="number" className="fi" defaultValue="10" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="sh mb16">Email / SMTP Configuration</div>
            <div className="g2">
              <div className="fg">
                <label className="fl">SMTP Host</label>
                <input name="host" className="fi" placeholder="mail.company.com" value={smtpConfig.host} onChange={handleSmtpChange} />
              </div>
              <div className="fg" style={{ width: '100px' }}>
                <label className="fl">Port</label>
                <input name="port" type="number" min="1" max="65535" className="fi" value={smtpConfig.port} onChange={(e) => setSmtpConfig((prev) => ({ ...prev, port: Number(e.target.value) }))} />
              </div>
              <div className="fg" style={{ width: '120px' }}>
                <label className="fl">Encryption</label>
                <select name="encryption" className="fi" value={smtpConfig.encryption} onChange={handleSmtpChange}>
                  <option value="TLS">TLS</option>
                  <option value="SSL">SSL</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
            <div className="g2">
              <div className="fg">
                <label className="fl">SMTP Username</label>
                <input name="username" className="fi" placeholder="noreply@company.com" value={smtpConfig.username} onChange={handleSmtpChange} />
              </div>
              <div className="fg">
                <label className="fl">SMTP Password</label>
                <input name="password" type="password" className="fi" placeholder="••••••••" value={smtpConfig.password} onChange={handleSmtpChange} />
              </div>
            </div>
            <div className="g2">
              <div className="fg">
                <label className="fl">From Name</label>
                <input name="fromName" className="fi" placeholder="AMG Capital" value={smtpConfig.fromName} onChange={handleSmtpChange} />
              </div>
              <div className="fg">
                <label className="fl">From Email</label>
                <input name="fromEmail" className="fi" placeholder="noreply@company.com" value={smtpConfig.fromEmail} onChange={handleSmtpChange} />
              </div>
            </div>
            <div className="fg mt10">
              <label className="fl">Admin Alert Email (SMTP test recipient)</label>
              <input name="adminAlertEmail" className="fi" placeholder="admin@company.com" value={smtpConfig.adminAlertEmail} onChange={handleSmtpChange} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={testSmtpConfig} disabled={smtpTesting || smtpSaving}>
                <i className={`ti ${smtpTesting ? 'ti-loader-2 spin' : 'ti-plug-connected'}`} /> {smtpTesting ? 'Testing...' : 'Test Connection'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={saveSmtpConfig} disabled={smtpSaving || smtpTesting}>
                <i className={`ti ${smtpSaving ? 'ti-loader-2 spin' : 'ti-device-floppy'}`} /> {smtpSaving ? 'Saving...' : 'Save SMTP Config'}
              </button>
            </div>
            <div className="mt-3 text-xs c-t3">Test Connection verifies the SMTP login and sends a real test message to the Admin Alert Email, or the From Email when no alert address is configured.</div>
            {smtpMessage && <div className={`mt-3 text-xs ${smtpMessageOk ? 'val-pos' : 'val-neg'}`} role="status">{smtpMessage}</div>}
          </div>

          <div className="card">
            <div className="sh mb16">Deposit Wallet Configuration</div>
            <div className="g2">
              {Object.keys(emptyDepositWallets).map((key) => (
                <div className="fg" key={key}>
                  <label className="fl">{key.replaceAll('_', ' ')}</label>
                  <input
                    className="fi"
                    value={depositWallets[key as keyof DepositWallets]}
                    onChange={(e) => updateDepositWallet(key as keyof DepositWallets, e.target.value)}
                    placeholder={`Enter ${key.replaceAll('_', ' ')} wallet address`}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary btn-sm" onClick={saveDepositWallets} disabled={depositWalletsSaving}>
                {depositWalletsSaving ? 'Saving...' : 'Save Deposit Wallets'}
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>


          <div className="card">
            <div className="sh mb14">Withdrawal Method Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(withdrawalMethods).map(([key, enabled]) => (
                <div key={key} className="fb text-sm cursor-pointer" onClick={() => toggleWithdrawalMethod(key as keyof WithdrawalMethods)}>
                  <span className="c-t2">{key.replaceAll('_', ' ')}</span>
                  <div className={`toggle ${enabled ? 'on' : ''}`}></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary btn-sm" onClick={saveWithdrawalMethods} disabled={withdrawalMethodsSaving}>
                {withdrawalMethodsSaving ? 'Saving...' : 'Save Withdrawal Methods'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="sh mb14">Create Administrator</div>
            {admin?.isSuperAdmin ? <>
              <div className="text-xs c-t3 mb12">Only the primary super admin can create or deactivate administrators.</div>
              <div className="fg"><label className="fl">Name</label><input className="fi" placeholder="Full name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} /></div>
              <div className="fg"><label className="fl">Email</label><input type="email" className="fi" placeholder="admin@example.com" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} /></div>
              <div className="fg"><label className="fl">Password</label><input type="text" className="fi font-mono" placeholder="Min. 8 characters" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} /></div>
              <button className="btn btn-primary btn-sm" onClick={createAdmin} disabled={adminSaving || !adminForm.name || !adminForm.email || adminForm.password.length < 8}>
                <i className="ti ti-user-plus" /> {adminSaving ? 'Creating...' : 'Create Admin'}
              </button>

              {/* Managed Admins Table */}
              <div className="mt16" style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <div className="text-xs fw6 mb10">Managed Administrators</div>
                {adminsLoading ? (
                  <div className="text-xs c-t3">Loading administrators...</div>
                ) : managedAdmins.length === 0 ? (
                  <div className="text-xs c-t3 p-4 text-center border border-dashed rounded-lg" style={{ borderColor: 'var(--line)' }}>No secondary administrators created yet.</div>
                ) : (
                  <div className="tbl-wrap !mt-0">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Password</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th>Last Login</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managedAdmins.map((managedAdmin) => (
                          <AdminRow key={managedAdmin._id} managedAdmin={managedAdmin} onToggle={toggleManagedAdmin} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </> : <div className="text-xs c-t3">Administrator management is available only to the primary super admin.</div>}
          </div>
        </div>
      </div>

      {financeMessage && (
        <div className="card mt20">
          {financeMessage}
        </div>
      )}
    </div>
  );
}
