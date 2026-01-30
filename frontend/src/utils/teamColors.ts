// Team color mapping for F1 2026 teams
// Used for consistent team colors across the application

export const teamColors: Record<string, { bg: string; border: string; text: string }> = {
  'McLaren': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
  'Ferrari': { bg: 'bg-red-600', border: 'border-red-600', text: 'text-red-500' },
  'Red Bull Racing': { bg: 'bg-blue-700', border: 'border-blue-700', text: 'text-blue-400' },
  'Red Bull': { bg: 'bg-blue-700', border: 'border-blue-700', text: 'text-blue-400' },
  'Mercedes': { bg: 'bg-teal-400', border: 'border-teal-400', text: 'text-teal-400' },
  'Aston Martin': { bg: 'bg-green-600', border: 'border-green-600', text: 'text-green-500' },
  'Alpine': { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-400' },
  'Williams': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
  'Racing Bulls': { bg: 'bg-blue-900', border: 'border-blue-900', text: 'text-blue-300' },
  'RB': { bg: 'bg-blue-900', border: 'border-blue-900', text: 'text-blue-300' },
  'Kick Sauber': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
  'Sauber': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
  'Haas F1 Team': { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-300' },
  'Haas': { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-300' },
  'Cadillac F1 Team': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400' },
  'Cadillac': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400' },
};

export const getTeamColor = (teamName: string): { bg: string; border: string; text: string } => {
  // Try exact match first
  if (teamColors[teamName]) {
    return teamColors[teamName];
  }

  // Try partial match
  const teamKey = Object.keys(teamColors).find(key =>
    teamName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(teamName.toLowerCase())
  );

  if (teamKey) {
    return teamColors[teamKey];
  }

  // Default gray color
  return { bg: 'bg-gray-600', border: 'border-gray-600', text: 'text-gray-400' };
};
