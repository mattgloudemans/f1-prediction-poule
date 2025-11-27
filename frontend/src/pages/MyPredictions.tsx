import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPredictions } from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface Driver {
  id: number;
  name: string;
  team: string;
  driver_number: number;
}

interface Prediction {
  id: number;
  race_id: number;
  race_name: string;
  race_date: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  positions: Driver[];
  points?: number;
}

const MyPredictions = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPredictions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPredictions = async () => {
    try {
      const response = await getUserPredictions();
      setPredictions(response.data);
    } catch (error: any) {
      console.error('Failed to fetch predictions:', error);
      setError('Failed to load your predictions');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gradient-red">My Predictions</h1>
          <p className="text-f1-gray mb-8 text-lg">
            Please log in to view your predictions
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

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red-500 mx-auto shadow-f1-glow"></div>
        <p className="mt-4 text-f1-gray">Loading your predictions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="card-f1 p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-f1-gray">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-f1-primary mt-6"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="card-f1 p-12 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gradient-red">My Predictions</h1>
          <p className="text-f1-gray mb-8 text-lg">
            You haven't made any predictions yet
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-f1-primary"
          >
            Make Your First Prediction
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-xs px-3 py-1 rounded-full bg-green-600 text-white font-semibold">
            COMPLETED
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-xs px-3 py-1 rounded-full bg-yellow-600 text-white font-semibold">
            IN PROGRESS
          </span>
        );
      default:
        return (
          <span className="text-xs px-3 py-1 rounded-full bg-gray-600 text-white font-semibold">
            UPCOMING
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl md:text-display-xl font-bold text-gradient-red">
          My Predictions
        </h1>
        <button
          onClick={() => navigate('/')}
          className="btn-f1-secondary"
        >
          Back to Homepage
        </button>
      </div>

      <div className="space-y-6">
        {predictions.map((prediction) => (
          <div key={prediction.id} className="card-f1 p-6 hover:shadow-f1-glow transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-f1-red-500 mb-2">
                  {prediction.race_name}
                </h2>
                <p className="text-f1-gray">
                  {new Date(prediction.race_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(prediction.status)}
                {prediction.points !== undefined && (
                  <div className="text-2xl font-bold text-f1-red-500">
                    {prediction.points} pts
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {prediction.positions.map((driver, index) => (
                <div
                  key={index}
                  className="bg-f1-neutral-800 p-3 rounded border border-f1-neutral-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-f1-red-500 text-sm">
                      P{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{driver.name}</p>
                      <p className="text-xs text-f1-gray truncate">{driver.team}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {prediction.status === 'upcoming' && (
              <div className="mt-4 pt-4 border-t border-f1-neutral-700">
                <button
                  onClick={() => navigate('/')}
                  className="btn-f1-primary w-full"
                >
                  Edit Prediction
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPredictions;
