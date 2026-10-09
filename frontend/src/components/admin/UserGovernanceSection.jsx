import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../lib/api.js';

export default function UserGovernanceSection({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    super_admin: 0,
    content_manager: 0,
    support_admin: 0,
    students: 0,
    paid_students: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState(null);

  // Add User Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'STUDENT',
    paid: false
  });
  const [savingUser, setSavingUser] = useState(false);

  // Password Reset Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const authToken = token || localStorage.getItem('lm_auth_token') || localStorage.getItem('admin_token') || '';

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.counts) setCounts(data.counts);
      } else {
        // Fallback to students endpoint if users endpoint unavailable
        const sRes = await fetch(`${BASE_URL}/api/admin/students/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          setUsers(sData.students || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) return;
    setSavingUser(true);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`User ${newUser.email} created successfully with role ${newUser.role}!`);
        setModalOpen(false);
        setNewUser({ email: '', password: '', full_name: '', phone: '', role: 'STUDENT', paid: false });
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to create user account.', 'error');
      }
    } catch (e) {
      showToast('Network error creating user.', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast(`User role updated to ${newRole}!`);
        fetchUsers();
      } else {
        showToast('Failed to update user role.', 'error');
      }
    } catch (e) {
      showToast('Network error updating role.', 'error');
    }
  };

  const handleTogglePaid = async (userId, currentPaid) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ paid: !currentPaid })
      });
      if (res.ok) {
        showToast(`Student enrollment status toggled to ${!currentPaid ? 'PAID' : 'UNPAID'}!`);
        fetchUsers();
      } else {
        showToast('Failed to toggle paid status.', 'error');
      }
    } catch (e) {
      showToast('Network error updating paid status.', 'error');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_active: !currentActive })
      });
      if (res.ok) {
        showToast(`Account status set to ${!currentActive ? 'ACTIVE' : 'SUSPENDED'}!`);
        fetchUsers();
      } else {
        showToast('Failed to toggle account status.', 'error');
      }
    } catch (e) {
      showToast('Network error updating account status.', 'error');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser || !newPassword) return;
    setResettingPassword(true);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${targetUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        showToast(`Password successfully reset for ${targetUser.email}!`);
        setPasswordModalOpen(false);
        setNewPassword('');
        setTargetUser(null);
      } else {
        showToast('Failed to reset user password.', 'error');
      }
    } catch (e) {
      showToast('Network error resetting password.', 'error');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user: ${userEmail}?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`User ${userEmail} was deleted successfully.`);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to delete user.', 'error');
      }
    } catch (e) {
      showToast('Network error deleting user.', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'PAID') return u.paid;
    if (roleFilter === 'UNPAID') return !u.paid;
    return u.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-800 text-2xl">admin_panel_settings</span>
            <h1 className="text-xl font-bold text-stone-900">User &amp; Staff Role Governance</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Complete platform administrative privileges: configure student access, grant Super Admin rights, and manage credentials.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>+ Create User / Staff</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Accounts</span>
          <span className="text-xl font-bold text-stone-900 mt-1 block">{counts.total || users.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Super Admins</span>
          <span className="text-xl font-bold text-emerald-800 mt-1 block">{counts.super_admin || users.filter(u => u.role === 'SUPER_ADMIN').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Content Mgrs</span>
          <span className="text-xl font-bold text-indigo-800 mt-1 block">{counts.content_manager || users.filter(u => u.role === 'CONTENT_MANAGER').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Support Leads</span>
          <span className="text-xl font-bold text-amber-800 mt-1 block">{counts.support_admin || users.filter(u => u.role === 'SUPPORT_ADMIN').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Paid Enrollees</span>
          <span className="text-xl font-bold text-teal-800 mt-1 block">{counts.paid_students || users.filter(u => u.paid).length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Students</span>
          <span className="text-xl font-bold text-stone-800 mt-1 block">{counts.students || users.filter(u => u.role === 'STUDENT').length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
          <input
            type="text"
            placeholder="Search by email, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'STUDENT', 'PAID'].map(tab => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all whitespace-nowrap text-[11px] ${
                roleFilter === tab
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold bg-stone-50/70">
                <th className="py-3.5 px-4">User / Email</th>
                <th className="py-3.5 px-3">Role Authority</th>
                <th className="py-3.5 px-3">Enrollment Access</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSuperAdmin = u.role === 'SUPER_ADMIN';
                return (
                  <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSuperAdmin 
                            ? 'bg-emerald-800 text-white' 
                            : u.role === 'CONTENT_MANAGER' 
                              ? 'bg-indigo-800 text-white' 
                              : u.role === 'SUPPORT_ADMIN'
                                ? 'bg-amber-800 text-white'
                                : 'bg-stone-200 text-stone-700'
                        }`}>
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-stone-900 block">{u.email}</span>
                          <span className="text-[10px] text-stone-500">
                            {u.full_name || 'Architect User'} {u.phone ? `• ${u.phone}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <select
                        value={u.role || 'STUDENT'}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer ${
                          isSuperAdmin 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                            : u.role === 'CONTENT_MANAGER' 
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-300' 
                              : u.role === 'SUPPORT_ADMIN'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-stone-50 text-stone-800 border-stone-300'
                        }`}
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN (Full Rights)</option>
                        <option value="CONTENT_MANAGER">CONTENT MANAGER</option>
                        <option value="SUPPORT_ADMIN">SUPPORT ADMIN</option>
                        <option value="STUDENT">STUDENT</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleTogglePaid(u.id, u.paid)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider cursor-pointer border ${
                          u.paid 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                        }`}
                        title="Click to toggle lifetime paid enrollment"
                      >
                        {u.paid ? '✓ Lifetime Paid' : '○ Free / Lead'}
                      </button>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          u.is_active !== false 
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                            : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                        }`}
                      >
                        {u.is_active !== false ? 'Active' : 'Suspended'}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-stone-500 font-mono text-[11px]">
                      {u.created_at || 'Registered'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setTargetUser(u); setPasswordModalOpen(true); }}
                          className="p-1 text-stone-500 hover:text-emerald-800 hover:bg-stone-100 rounded-lg cursor-pointer"
                          title="Reset User Password"
                        >
                          <span className="material-symbols-outlined text-base">key</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete User"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-stone-400">
                    No users matching the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-stone-900">Provision New Platform User</h3>
                <p className="text-xs text-stone-500 mt-0.5">Assign administrative authority or student enrollment access.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="director@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="Elena Vance, AIA"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+91 94409 99908"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Role Authority</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full Governance Rights)</option>
                  <option value="CONTENT_MANAGER">Content Manager (Curriculum &amp; Media)</option>
                  <option value="SUPPORT_ADMIN">Support Admin (Student Success &amp; Coupons)</option>
                  <option value="STUDENT">Enrolled Student</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={newUser.paid}
                  onChange={(e) => setNewUser({ ...newUser, paid: e.target.checked })}
                  className="rounded accent-emerald-800 cursor-pointer"
                />
                <label htmlFor="paidCheck" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Grant Full Paid Lifetime Access to Course Modules
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {passwordModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-stone-900">Reset User Password</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Set a new secure password for <b>{targetUser.email}</b>:
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resettingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
