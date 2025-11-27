import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
  id: number;
  nickname: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  created_at: string;
}

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  scheduleHuman: string;
  lastDataUpdate: string | null;
  lastRun: string | null;
  lastStatus: 'success' | 'error' | 'running' | null;
  lastMessage: string | null;
  isRunning: boolean;
  pendingRaces?: number;
}

interface CronJobsResponse {
  cronJobs: CronJob[];
  stats: {
    completedRaces: number;
    pendingRaces: number;
    upcomingRaces: number;
  };
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [cronStats, setCronStats] = useState<CronJobsResponse['stats'] | null>(null);
  const [cronLoading, setCronLoading] = useState(false);

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

      // Also fetch cron jobs
      fetchCronJobs(creds);
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

  const fetchCronJobs = useCallback(async (creds?: { username: string; password: string }) => {
    const authCreds = creds || credentials;
    if (!authCreds) return;

    setCronLoading(true);
    try {
      const auth = btoa(`${authCreds.username}:${authCreds.password}`);
      const response = await axios.get<CronJobsResponse>('/api/admin/cronjobs', {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      setCronJobs(response.data.cronJobs);
      setCronStats(response.data.stats);
    } catch (err: any) {
      console.error('Failed to fetch cron jobs:', err);
    } finally {
      setCronLoading(false);
    }
  }, [credentials]);

  const triggerCronJob = async (jobId: string) => {
    if (!credentials) return;

    try {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      const endpoint = jobId === 'syncDriverStandings'
        ? '/api/admin/cronjobs/sync-driver-standings'
        : '/api/admin/cronjobs/sync-race-results';

      await axios.post(endpoint, {}, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      // Update local state to show running
      setCronJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, isRunning: true, lastStatus: 'running' } : job
      ));

      // Poll for completion
      const pollInterval = setInterval(async () => {
        await fetchCronJobs();
        const updatedJob = cronJobs.find(j => j.id === jobId);
        if (updatedJob && !updatedJob.isRunning) {
          clearInterval(pollInterval);
        }
      }, 2000);

      // Stop polling after 60 seconds max
      setTimeout(() => clearInterval(pollInterval), 60000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to trigger job');
    }
  };

  // Poll cron job status while any job is running
  useEffect(() => {
    if (!isAuthenticated || !credentials) return;

    const hasRunningJob = cronJobs.some(job => job.isRunning);
    if (!hasRunningJob) return;

    const interval = setInterval(() => {
      fetchCronJobs();
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, credentials, cronJobs, fetchCronJobs]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setUsername('');
    setPassword('');
    setUsers([]);
    setCronJobs([]);
    setCronStats(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: CronJob['lastStatus'], isRunning: boolean) => {
    if (isRunning) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
          <span className="animate-spin h-3 w-3 border-2 border-blue-300 border-t-transparent rounded-full"></span>
          Running
        </span>
      );
    }
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-300">Success</span>;
      case 'error':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-900/50 text-red-300">Error</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-400">Not run</span>;
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

      {/* Cronjob Management */}
      <div className="card-f1 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Scheduled Jobs</h2>
          <button
            onClick={() => fetchCronJobs()}
            disabled={cronLoading}
            className="btn-f1-secondary text-sm py-2 px-4"
          >
            {cronLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Race Stats */}
        {cronStats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{cronStats.completedRaces}</p>
              <p className="text-sm text-green-300">Completed</p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{cronStats.pendingRaces}</p>
              <p className="text-sm text-yellow-300">Pending Sync</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{cronStats.upcomingRaces}</p>
              <p className="text-sm text-blue-300">Upcoming</p>
            </div>
          </div>
        )}

        {/* Cron Jobs List */}
        <div className="space-y-4">
          {cronJobs.map((job) => (
            <div key={job.id} className="bg-f1-neutral-800 rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{job.name}</h3>
                    {getStatusBadge(job.lastStatus, job.isRunning)}
                    {job.pendingRaces !== undefined && job.pendingRaces > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300">
                        {job.pendingRaces} pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-f1-gray mb-3">{job.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-f1-gray">Schedule:</span>
                      <span className="ml-2 font-mono text-xs bg-f1-neutral-700 px-2 py-1 rounded">
                        {job.schedule}
                      </span>
                      <span className="ml-2 text-f1-gray">({job.scheduleHuman})</span>
                    </div>
                    <div>
                      <span className="text-f1-gray">Last Data Update:</span>
                      <span className="ml-2">{formatDate(job.lastDataUpdate)}</span>
                    </div>
                    {job.lastRun && (
                      <div className="sm:col-span-2">
                        <span className="text-f1-gray">Last Manual Run:</span>
                        <span className="ml-2">{formatDate(job.lastRun)}</span>
                        {job.lastMessage && (
                          <span className={`ml-2 text-xs ${job.lastStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            - {job.lastMessage}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => triggerCronJob(job.id)}
                  disabled={job.isRunning}
                  className={`px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ${
                    job.isRunning
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-f1-red hover:bg-red-700 text-white'
                  }`}
                >
                  {job.isRunning ? 'Running...' : 'Run Now'}
                </button>
              </div>
            </div>
          ))}

          {cronJobs.length === 0 && !cronLoading && (
            <div className="text-center py-8 text-f1-gray">
              No cron jobs configured
            </div>
          )}

          {cronLoading && cronJobs.length === 0 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red mx-auto"></div>
              <p className="mt-4 text-f1-gray">Loading jobs...</p>
            </div>
          )}
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
          <h2 className="text-xl font-bold mb-4 text-f1-red-500">Schedule Info</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-f1-neutral-800 p-4 rounded-lg">
              <p className="text-f1-gray mb-2">Jobs run automatically via system cron:</p>
              <ul className="list-disc list-inside text-f1-gray space-y-1">
                <li>Driver standings: Mon & Thu @ 09:00 UTC</li>
                <li>Race results: Mon & Thu @ 09:15 UTC</li>
                <li>Log rotation: Sundays @ 00:00 UTC</li>
              </ul>
            </div>
            <div className="text-xs text-f1-gray">
              <p>Logs stored in /var/log/cron.log</p>
              <p>Use "Run Now" for immediate sync</p>
            </div>
          </div>
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
