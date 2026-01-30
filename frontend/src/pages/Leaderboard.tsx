import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';

interface LeaderboardEntry {
  id: number;
  nickname: string;
  avatar_url?: string;
  total_points: number;
  rank: number;
}

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

  const topThree = leaderboard.slice(0, 3);

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

      {/* Podium Display */}
      {topThree.length >= 3 && (
        <div className="mb-16">
          <div className="flex items-end justify-center gap-4 max-w-4xl mx-auto">
            {/* 2nd Place */}
            <div className="flex flex-col items-center w-1/3 hover-lift">
              <div className="mb-4 relative group">
                {topThree[1]?.avatar_url ? (
                  <img
                    src={topThree[1].avatar_url}
                    alt={topThree[1].nickname}
                    className="w-24 h-24 rounded-full border-4 border-gray-300 shadow-lg group-hover:border-white transition-all duration-300 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-f1-neutral-800 border-4 border-gray-300 flex items-center justify-center text-3xl shadow-lg group-hover:border-white transition-all duration-300">
                    👤
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-gray-200 to-gray-400 text-f1-neutral-900 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                  2
                </div>
              </div>
              <p className="font-bold text-lg mb-2">{topThree[1]?.nickname}</p>
              <div className="bg-gradient-to-br from-gray-200 to-gray-400 text-f1-neutral-900 rounded-t-lg w-full pt-8 pb-4 px-4 text-center shadow-card" style={{ height: '120px' }}>
                <p className="text-2xl font-bold">{topThree[1]?.total_points}</p>
                <p className="text-sm font-semibold">POINTS</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center w-1/3 hover-lift">
              <div className="mb-4 relative group">
                {topThree[0]?.avatar_url ? (
                  <img
                    src={topThree[0].avatar_url}
                    alt={topThree[0].nickname}
                    className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-f1-glow-lg group-hover:scale-105 transition-all duration-300 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-f1-neutral-800 border-4 border-yellow-400 flex items-center justify-center text-4xl shadow-f1-glow-lg group-hover:scale-105 transition-all duration-300">
                    👤
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-300 to-yellow-500 text-f1-neutral-900 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  1
                </div>
              </div>
              <p className="font-bold text-xl mb-2">{topThree[0]?.nickname}</p>
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-f1-neutral-900 rounded-t-lg w-full pt-8 pb-4 px-4 text-center shadow-card-hover" style={{ height: '160px' }}>
                <p className="text-3xl font-bold">{topThree[0]?.total_points}</p>
                <p className="text-sm font-semibold">POINTS</p>
                <p className="text-xs mt-2 font-bold">🏆 CHAMPION 🏆</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center w-1/3 hover-lift">
              <div className="mb-4 relative group">
                {topThree[2]?.avatar_url ? (
                  <img
                    src={topThree[2].avatar_url}
                    alt={topThree[2].nickname}
                    className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-lg group-hover:border-orange-400 transition-all duration-300 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-f1-neutral-800 border-4 border-orange-500 flex items-center justify-center text-3xl shadow-lg group-hover:border-orange-400 transition-all duration-300">
                    👤
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-orange-400 to-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                  3
                </div>
              </div>
              <p className="font-bold text-lg mb-2">{topThree[2]?.nickname}</p>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-t-lg w-full pt-8 pb-4 px-4 text-center shadow-card" style={{ height: '100px' }}>
                <p className="text-2xl font-bold">{topThree[2]?.total_points}</p>
                <p className="text-sm font-semibold">POINTS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 racing-stripe pl-6">Full Standings</h2>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-f1-gray text-lg">No users have made predictions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`card-f1-interactive flex items-center gap-4 ${
                  entry.rank <= 3 ? 'border-gradient-red shadow-f1-glow' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  entry.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-f1-neutral-900' :
                  entry.rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-f1-neutral-900' :
                  entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                  'bg-f1-neutral-800 text-f1-gray'
                }`}>
                  {entry.rank}
                </div>

                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.nickname}
                    className="w-12 h-12 rounded-full border-2 border-f1-red-500 hover-scale overflow-hidden shadow-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-f1-neutral-700 flex items-center justify-center border-2 border-f1-neutral-600">
                    👤
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-bold">{entry.nickname}</h3>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-f1-red-500">{entry.total_points}</p>
                  <p className="text-xs text-f1-gray font-semibold">POINTS</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
