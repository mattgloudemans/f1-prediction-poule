import { useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  nickname: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  created_at: string;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Test authentication by fetching users
      const auth = btoa(`${username}:${password}`);
      const response = await axios.get('/api/admin/users', {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      // If successful, save credentials and mark as authenticated
      const creds = { username, password };
      setCredentials(creds);
      setIsAuthenticated(true);
      setUsers(response.data);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!credentials) return;

    setLoading(true);
    try {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      const response = await axios.get('/api/admin/users', {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, nickname: string) => {
    if (!credentials) return;

    if (!confirm(`Are you sure you want to delete user "${nickname}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setUsername('');
    setPassword('');
    setUsers([]);
  };

  const handleSync = async (type: 'standings' | 'results') => {
    if (!credentials) return;

    const endpoint = type === 'standings'
      ? '/api/admin/cronjobs/sync-driver-standings'
      : '/api/admin/cronjobs/sync-race-results';

    setSyncStatus(prev => ({ ...prev, [type]: 'loading' }));
    setSyncMessage(null);

    try {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      await axios.post(endpoint, {}, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      setSyncStatus(prev => ({ ...prev, [type]: 'success' }));
      setSyncMessage(`${type === 'standings' ? 'Driver standings' : 'Race results'} sync started successfully!`);

      // Refresh users to show updated points
      if (type === 'results') {
        setTimeout(() => fetchUsers(), 3000);
      }

      // Reset status after 5 seconds
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [type]: 'idle' }));
        setSyncMessage(null);
      }, 5000);
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, [type]: 'error' }));
      setSyncMessage(err.response?.data?.error || `Failed to sync ${type}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-f1 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-gradient-red">
            Admin Panel
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-f1 w-full"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-f1 w-full"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-f1-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl md:text-display-xl font-bold text-gradient-red">
          Admin Panel
        </h1>
        <button
          onClick={handleLogout}
          className="btn-f1-secondary"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Admin Actions */}
      <div className="card-f1 mb-8">
        <h2 className="text-2xl font-bold mb-6">Admin Actions</h2>

        {syncMessage && (
          <div className={`mb-4 px-4 py-3 rounded ${
            syncStatus.standings === 'success' || syncStatus.results === 'success'
              ? 'bg-green-900/50 border border-green-500 text-green-200'
              : 'bg-red-900/50 border border-red-500 text-red-200'
          }`}>
            {syncMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sync Driver Standings */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h3 className="font-bold text-blue-400 mb-2">Sync Driver Standings</h3>
            <p className="text-sm text-f1-gray mb-4">
              Fetch latest F1 championship standings from Jolpi API and update driver points.
            </p>
            <button
              onClick={() => handleSync('standings')}
              disabled={syncStatus.standings === 'loading'}
              className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                syncStatus.standings === 'loading'
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : syncStatus.standings === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {syncStatus.standings === 'loading' ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Syncing...
                </span>
              ) : syncStatus.standings === 'success' ? (
                'Synced!'
              ) : (
                'Sync Standings'
              )}
            </button>
          </div>

          {/* Sync Race Results */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h3 className="font-bold text-f1-red-500 mb-2">Sync Race Results & Calculate Points</h3>
            <p className="text-sm text-f1-gray mb-4">
              Fetch race results, update race statuses, and recalculate prediction points for all users.
            </p>
            <button
              onClick={() => handleSync('results')}
              disabled={syncStatus.results === 'loading'}
              className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                syncStatus.results === 'loading'
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : syncStatus.results === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-f1-red hover:bg-red-700 text-white'
              }`}
            >
              {syncStatus.results === 'loading' ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Syncing...
                </span>
              ) : syncStatus.results === 'success' ? (
                'Synced!'
              ) : (
                'Sync Results & Calculate Points'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduling Documentation */}
      <div className="card-f1 mb-8">
        <h2 className="text-2xl font-bold mb-6">Scheduling Logic Documentation</h2>

        {/* Visual Timeline */}
        <div className="bg-f1-neutral-800 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold text-f1-red-500 mb-4">Race Weekend Timeline</h3>
          <div className="font-mono text-sm text-f1-gray space-y-2">
            <p className="text-orange-400 font-bold">SUNDAY (Race Day)</p>
            <p>12:00 UTC ──────────────────────────────────────── 20:00 UTC</p>
            <p>    │                                                    │</p>
            <p>    ├─ Copy missing predictions (every 2 min until 18:00)│</p>
            <p>    │                                                    │</p>
            <p>    └─ Check for provisional results (every 5 min) ──────┘</p>
            <p>                    │</p>
            <p>                    ▼</p>
            <p className="text-green-400">         Race ends ~14:00-16:00 UTC</p>
            <p>                    │</p>
            <p>                    ▼ (5 min after race)</p>
            <p className="text-yellow-400">         📧 Provisional Results Email sent</p>
            <p></p>
            <p className="text-blue-400 font-bold">MONDAY (Next Day)</p>
            <p>09:00 UTC ──────────────────────────────────────── 20:00 UTC</p>
            <p>    │                                                    │</p>
            <p>    ├─ 09:00: Sync driver standings                      │</p>
            <p>    ├─ 09:15: Sync race results                          │</p>
            <p>    │                                                    │</p>
            <p>    └─ Check for final results (hourly 12:00-20:00) ─────┘</p>
            <p>                    │</p>
            <p>                    ▼ (24+ hours after race)</p>
            <p className="text-green-400">         📧 Final Results Email sent</p>
            <p className="text-f1-gray">         (Points recalculated for DQs/penalties)</p>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Copy Missing Predictions */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-orange-400 mb-3">1. Copy Missing Predictions</h4>
            <p className="text-sm text-f1-gray mb-3">
              Runs for races that locked 1-10 minutes ago. Finds users who have predicted before
              but NOT for this race, and copies their most recent prediction automatically.
            </p>
            <div className="text-xs space-y-1">
              <p><span className="text-f1-gray">Schedule:</span> <span className="font-mono">*/2 12-18 * * 0</span></p>
              <p><span className="text-f1-gray">Trigger:</span> Race locked 1-10 min ago</p>
              <p><span className="text-f1-gray">Email:</span> None (silent operation)</p>
            </div>
          </div>

          {/* Provisional Results */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-yellow-400 mb-3">2. Send Provisional Results</h4>
            <p className="text-sm text-f1-gray mb-3">
              Fetches results from Jolpi API, stores in database, calculates points for each
              user's prediction, and sends provisional results email.
            </p>
            <div className="text-xs space-y-1">
              <p><span className="text-f1-gray">Schedule:</span> <span className="font-mono">*/5 12-20 * * 0</span></p>
              <p><span className="text-f1-gray">Trigger:</span> Race finished 5 min - 3 hrs ago, not sent yet</p>
              <p><span className="text-f1-gray">Email:</span> Provisional results with points breakdown</p>
            </div>
          </div>

          {/* Final Results */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-green-400 mb-3">3. Process Final Results</h4>
            <p className="text-sm text-f1-gray mb-3">
              Re-fetches results (may include DQs/penalties), recalculates all points from scratch,
              updates user totals, and sends final results email.
            </p>
            <div className="text-xs space-y-1">
              <p><span className="text-f1-gray">Schedule:</span> <span className="font-mono">0 12-20 * * 1</span></p>
              <p><span className="text-f1-gray">Trigger:</span> Race 24+ hrs old, status = provisional</p>
              <p><span className="text-f1-gray">Email:</span> Final points (shows changes if any)</p>
            </div>
          </div>

          {/* Sync Jobs */}
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-blue-400 mb-3">4. Sync Driver Standings & Race Results</h4>
            <p className="text-sm text-f1-gray mb-3">
              Updates F1 championship points and imports race results from Jolpi API.
              Can be triggered manually from this panel.
            </p>
            <div className="text-xs space-y-1">
              <p><span className="text-f1-gray">Schedule:</span> <span className="font-mono">0 9 * * 1,4</span> and <span className="font-mono">15 9 * * 1,4</span></p>
              <p><span className="text-f1-gray">Trigger:</span> Mon & Thu at 09:00/09:15 UTC</p>
              <p><span className="text-f1-gray">Email:</span> None</p>
            </div>
          </div>
        </div>

        {/* Points System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-f1-red-500 mb-3">Main Race Points (Top 10)</h4>
            <div className="grid grid-cols-5 gap-2 text-center text-sm">
              {[
                { pos: 'P1', pts: 25 }, { pos: 'P2', pts: 18 }, { pos: 'P3', pts: 15 },
                { pos: 'P4', pts: 12 }, { pos: 'P5', pts: 10 }, { pos: 'P6', pts: 8 },
                { pos: 'P7', pts: 6 }, { pos: 'P8', pts: 4 }, { pos: 'P9', pts: 2 }, { pos: 'P10', pts: 1 }
              ].map(({ pos, pts }) => (
                <div key={pos} className="bg-f1-neutral-700 rounded p-2">
                  <p className="text-f1-gray text-xs">{pos}</p>
                  <p className="font-bold">{pts}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-f1-neutral-800 p-5 rounded-lg">
            <h4 className="font-bold text-orange-500 mb-3">Sprint Race Points (Top 8)</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              {[
                { pos: 'P1', pts: 8 }, { pos: 'P2', pts: 7 }, { pos: 'P3', pts: 6 }, { pos: 'P4', pts: 5 },
                { pos: 'P5', pts: 4 }, { pos: 'P6', pts: 3 }, { pos: 'P7', pts: 2 }, { pos: 'P8', pts: 1 }
              ].map(({ pos, pts }) => (
                <div key={pos} className="bg-f1-neutral-700 rounded p-2">
                  <p className="text-f1-gray text-xs">{pos}</p>
                  <p className="font-bold">{pts}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-400 mt-3">+50% bonus if predicted within ±1 position</p>
          </div>
        </div>

        {/* Email Types */}
        <div className="bg-f1-neutral-800 p-5 rounded-lg mb-6">
          <h4 className="font-bold text-f1-red-500 mb-3">Email Types</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1-neutral-700">
                  <th className="text-left py-2 px-3 text-f1-gray">Email</th>
                  <th className="text-left py-2 px-3 text-f1-gray">Trigger</th>
                  <th className="text-left py-2 px-3 text-f1-gray">Contents</th>
                </tr>
              </thead>
              <tbody className="text-f1-gray">
                <tr className="border-b border-f1-neutral-700/50">
                  <td className="py-2 px-3 font-medium text-white">Magic Link</td>
                  <td className="py-2 px-3">User login/register</td>
                  <td className="py-2 px-3">Authentication link (expires 1 hour)</td>
                </tr>
                <tr className="border-b border-f1-neutral-700/50">
                  <td className="py-2 px-3 font-medium text-white">Prediction Confirmation</td>
                  <td className="py-2 px-3">User saves prediction</td>
                  <td className="py-2 px-3">List of predicted positions</td>
                </tr>
                <tr className="border-b border-f1-neutral-700/50">
                  <td className="py-2 px-3 font-medium text-yellow-400">Provisional Results</td>
                  <td className="py-2 px-3">~5 min after race</td>
                  <td className="py-2 px-3">Race results, prediction breakdown, points earned</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-green-400">Final Results</td>
                  <td className="py-2 px-3">24+ hours after race</td>
                  <td className="py-2 px-3">Final points, changes highlighted if any</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Yearly Points Reset */}
        <div className="bg-f1-neutral-800 p-5 rounded-lg mb-6">
          <h4 className="font-bold text-purple-400 mb-3">5. Yearly Points Reset</h4>
          <p className="text-sm text-f1-gray mb-3">
            Automatically resets all user points to 0 at the start of each new F1 season.
            This ensures a fresh leaderboard competition every year.
          </p>
          <div className="text-xs space-y-1">
            <p><span className="text-f1-gray">Schedule:</span> <span className="font-mono">0 0 1 1 *</span></p>
            <p><span className="text-f1-gray">Trigger:</span> January 1st at 00:00 UTC</p>
            <p><span className="text-f1-gray">Action:</span> UPDATE users SET total_points = 0</p>
            <p><span className="text-f1-gray">Email:</span> None</p>
          </div>
        </div>

        {/* Race Status Flow */}
        <div className="bg-f1-neutral-800 p-5 rounded-lg">
          <h4 className="font-bold text-f1-red-500 mb-3">Race Status Flow</h4>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded">upcoming</span>
            <span className="text-f1-gray">→ race ends →</span>
            <span className="bg-orange-900/50 text-orange-300 px-3 py-1 rounded">provisional</span>
            <span className="text-f1-gray">→ 24 hours →</span>
            <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded">completed</span>
          </div>
          <p className="text-xs text-f1-gray mt-3">
            Provisional status allows for DQs/penalties to be applied before final points are calculated.
          </p>
        </div>
      </div>

      {/* System Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* API URLs */}
        <div className="card-f1">
          <h2 className="text-xl font-bold mb-4 text-f1-red-500">External APIs</h2>
          <div className="space-y-3">
            <div className="bg-f1-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-f1-gray mb-1">OpenF1 API</p>
              <p className="text-xs font-mono break-all">https://api.openf1.org/v1</p>
              <p className="text-xs text-f1-gray mt-1">Driver info, live data</p>
            </div>
            <div className="bg-f1-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-f1-gray mb-1">Jolpi Ergast API</p>
              <p className="text-xs font-mono break-all">https://api.jolpi.ca/ergast/f1</p>
              <p className="text-xs text-f1-gray mt-1">Championship standings, race results</p>
            </div>
          </div>
        </div>

        {/* Cron Schedule Info */}
        <div className="card-f1">
          <h2 className="text-xl font-bold mb-4 text-f1-red-500">Cron Schedule Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="bg-purple-900/30 border border-purple-500/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 font-medium">Yearly points reset</span>
                <span className="text-purple-400 font-mono text-xs">0 0 1 1 *</span>
              </div>
              <p className="text-xs text-purple-200/70 mt-1">Every January 1st at midnight</p>
            </div>
            <div className="bg-f1-neutral-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Driver standings sync</span>
                <span className="text-f1-gray font-mono text-xs">0 9 * * 1,4</span>
              </div>
              <p className="text-xs text-f1-gray mt-1">Every Monday & Thursday at 9:00 AM</p>
            </div>
            <div className="bg-f1-neutral-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Race results sync</span>
                <span className="text-f1-gray font-mono text-xs">0 3 * * 1</span>
              </div>
              <p className="text-xs text-f1-gray mt-1">Every Monday at 3:00 AM</p>
            </div>
            <div className="bg-f1-neutral-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Copy missing predictions</span>
                <span className="text-f1-gray font-mono text-xs">*/2 12-18 * * 0</span>
              </div>
              <p className="text-xs text-f1-gray mt-1">Every Sunday, every 2 minutes between 12:00 - 18:00</p>
            </div>
            <div className="bg-f1-neutral-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Send provisional results</span>
                <span className="text-f1-gray font-mono text-xs">*/5 12-20 * * 0</span>
              </div>
              <p className="text-xs text-f1-gray mt-1">Every Sunday, every 5 minutes between 12:00 - 20:00</p>
            </div>
            <div className="bg-f1-neutral-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Process final results</span>
                <span className="text-f1-gray font-mono text-xs">0 12-20 * * 1</span>
              </div>
              <p className="text-xs text-f1-gray mt-1">Every Monday, hourly between 12:00 - 20:00</p>
            </div>
          </div>
          <p className="text-xs text-f1-gray mt-3">All times are in UTC. Logs: /var/log/cron.log</p>
        </div>
      </div>

      <div className="card-f1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">User Management</h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="btn-f1-secondary text-sm py-2 px-4"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading && users.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-f1-red mx-auto"></div>
            <p className="mt-4 text-f1-gray">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-f1-neutral-700">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Nickname</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Points</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-f1-neutral-800 hover:bg-f1-neutral-800/50"
                  >
                    <td className="py-3 px-4 text-f1-gray">{user.id}</td>
                    <td className="py-3 px-4 font-medium">{user.nickname}</td>
                    <td className="py-3 px-4 text-f1-gray">{user.email}</td>
                    <td className="py-3 px-4 text-f1-red-500 font-bold">
                      {user.total_points}
                    </td>
                    <td className="py-3 px-4 text-f1-gray text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.nickname)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && !loading && (
              <div className="text-center py-8 text-f1-gray">
                No users found
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-f1-gray">
          Total users: <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Admin;
