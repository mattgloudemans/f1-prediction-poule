import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';

interface LeaderboardEntry {
  id: number;
  nickname: string;
  avatar_url?: string;
  total_points: number;
  rank: number;
  last_race_points: number;
  last_race_rank: number | null;
  best_race_points: number;
  best_race_name: string | null;
  diff_to_leader: number;
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red mx-auto"></div>
        <p className="mt-4 text-f1-gray">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl md:text-display-xl font-bold mb-8 text-center text-gradient-red">Championship</h1>

      {/* Full Leaderboard Table */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 racing-stripe pl-6">Full Standings</h2>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-f1-gray text-lg">No users have made predictions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-800 text-f1-gray text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Total Points</th>
                  <th className="px-4 py-3 text-right">Last Race</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Most Points (Race)</th>
                  <th className="px-4 py-3 text-right">Diff to Leader</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-t border-gray-700 ${
                      Number(entry.rank) % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'
                    } ${Number(entry.rank) <= 3 ? 'font-semibold' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        Number(entry.rank) === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900' :
                        Number(entry.rank) === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900' :
                        Number(entry.rank) === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'text-f1-gray'
                      }`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.nickname}
                            className="w-8 h-8 rounded-full border border-gray-600 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-f1-neutral-700 flex items-center justify-center border border-gray-600 text-sm">
                            👤
                          </div>
                        )}
                        <span className="text-white">{entry.nickname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-f1-red-500 font-bold text-lg">{entry.total_points}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white">{entry.last_race_points}</span>
                      {entry.last_race_rank && (
                        <span className="text-f1-gray text-xs ml-1">({ordinal(entry.last_race_rank)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-white">{entry.best_race_points}</span>
                      {entry.best_race_name && (
                        <span className="text-f1-gray text-xs ml-1">({entry.best_race_name})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(entry.rank) === 1 ? (
                        <span className="text-yellow-400 font-bold text-xs">LEADER</span>
                      ) : (
                        <span className="text-f1-gray">-{entry.diff_to_leader}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
