import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/Banner';
import PredictionInterface from '../components/PredictionInterface';
import SprintPredictionInterface from '../components/SprintPredictionInterface';
import { getUpcomingRaces } from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface Race {
  id: number;
  race_name: string;
  circuit_name: string;
  country: string;
  race_date: string;
  round: number;
  race_type: 'sprint' | 'main';
}

const Homepage = () => {
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [activeTab, setActiveTab] = useState<'sprint' | 'main'>('main');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingRaces();
  }, []);

  const fetchUpcomingRaces = async () => {
    try {
      const response = await getUpcomingRaces();
      const races = response.data;
      setUpcomingRaces(races);

      // Default to sprint tab if sprint is first upcoming race
      if (races.length > 0) {
        const firstRace = races[0];
        if (firstRace.race_type === 'sprint') {
          setActiveTab('sprint');
        }
      }
    } catch (error) {
      console.error('Failed to fetch upcoming races:', error);
    } finally {
      setLoading(false);
    }
  };

  const sprintRace = upcomingRaces.find(r => r.race_type === 'sprint');
  const mainRace = upcomingRaces.find(r => r.race_type === 'main');
  const nextRace = upcomingRaces[0] || null;
  const hasSprint = !!sprintRace;

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red-500 mx-auto shadow-f1-glow"></div>
        <p className="mt-4 text-f1-gray">Loading next race...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <Banner
          nextRaceDate={nextRace ? new Date(nextRace.race_date) : undefined}
          nextRaceName={nextRace?.race_name}
        />
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-display-xl font-bold mb-4 text-gradient-red">
            Welcome to F1 Prediction Poule!
          </h2>
          <p className="text-f1-gray mb-8 text-lg">
            Please log in or register to make your race predictions
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="btn-f1-primary"
          >
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  if (!nextRace) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <div className="card-f1 p-12">
          <h2 className="text-2xl font-bold mb-4">No Upcoming Races</h2>
          <p className="text-f1-gray">The season has not started yet or has ended.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Banner
        nextRaceDate={new Date(nextRace.race_date)}
        nextRaceName={nextRace.race_name}
        isSprint={nextRace.race_type === 'sprint'}
      />

      {/* Sprint/Main Toggle Tabs (only shown for sprint weekends) */}
      {hasSprint && (
        <div className="flex gap-2 mt-4 mb-2">
          <button
            onClick={() => setActiveTab('sprint')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-colors ${
              activeTab === 'sprint'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            SPRINT
          </button>
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-colors ${
              activeTab === 'main'
                ? 'bg-f1-red text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            MAIN RACE
          </button>
        </div>
      )}

      <div className="mt-4">
        {hasSprint && activeTab === 'sprint' && sprintRace ? (
          <SprintPredictionInterface raceId={sprintRace.id} mainRaceId={mainRace?.id} />
        ) : mainRace ? (
          <PredictionInterface raceId={mainRace.id} />
        ) : (
          <div className="text-center py-8 text-f1-gray">No race available</div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
