import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { getQualifyingOrder, submitPrediction, getPrediction } from '../services/api';
import { haptics } from '../utils/haptics';
import { getTeamColor } from '../utils/teamColors';

// Detect touch device
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;
const backendOptions = isTouchDevice() ? {
  enableMouseEvents: true,
  delayTouchStart: 100,  // Short delay for faster drag initiation (was 200ms default)
  touchSlop: 5           // Pixels of movement allowed before drag starts
} : {};

interface Driver {
  id: number;
  driver_number: number;
  name: string;
  name_acronym?: string;
  team: string;
  position?: number;
  q1?: string;
  q2?: string;
  q3?: string;
}

interface DragItem {
  driver: Driver;
  source: 'qualifying' | 'grid';
  sourceIndex?: number;
}

const ItemType = 'DRIVER';

// Driver badge component with team color
const DriverBadge = ({ driverNumber, team, small = false }: { driverNumber: number; team: string; small?: boolean }) => {
  const teamColor = getTeamColor(team);
  return (
    <div className={`flex items-center justify-center rounded-md font-bold border-l-4 ${teamColor.border} bg-white text-black ${
      small ? 'w-10 h-8 text-sm' : 'w-12 h-10 text-base'
    }`}>
      {driverNumber}
    </div>
  );
};

// Driver card for the left column (qualifying order)
interface QualifyingDriverCardProps {
  driver: Driver;
  isSelected: boolean;
}

const QualifyingDriverCard = ({ driver, isSelected }: QualifyingDriverCardProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => {
      haptics.light();
      return { driver, source: 'qualifying' as const };
    },
    canDrag: !isSelected,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const teamColor = getTeamColor(driver.team);

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-2 rounded-lg transition-all border-l-4 ${teamColor.border} ${
        isSelected
          ? 'bg-gray-700 opacity-40 cursor-not-allowed'
          : isDragging
          ? 'opacity-50 cursor-grabbing'
          : 'bg-gray-800 hover:bg-gray-700 cursor-grab'
      }`}
    >
      <DriverBadge driverNumber={driver.driver_number} team={driver.team} small />
      <span className="font-bold text-white text-sm">
        {driver.name_acronym || driver.name.substring(0, 3).toUpperCase()}
      </span>
    </div>
  );
};

// Grid slot for the right column (starting grid)
interface GridSlotProps {
  position: number;
  driver: Driver | null;
  onDrop: (item: DragItem, targetPosition: number) => void;
  onDragStart: (position: number) => void;
  isLeft: boolean;
}

const GridSlot = ({ position, driver, onDrop, onDragStart, isLeft }: GridSlotProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => {
      haptics.light();
      onDragStart(position);
      return { driver, source: 'grid' as const, sourceIndex: position - 1 };
    },
    canDrag: !!driver,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType,
    drop: (item: DragItem) => {
      haptics.success();
      onDrop(item, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      drag(node);
      drop(node);
    },
    [drag, drop]
  );

  const teamColor = driver ? getTeamColor(driver.team) : null;

  return (
    <div
      className={`flex items-center gap-1 ${isLeft ? '' : 'flex-row-reverse'}`}
      style={{ marginLeft: isLeft ? '0' : 'auto', marginRight: isLeft ? 'auto' : '0' }}
    >
      <span className="text-f1-gray font-bold text-xs w-5 text-center">{position}</span>
      <div
        ref={ref}
        className={`w-24 h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 ${
          isDragging
            ? 'opacity-50 border-f1-red'
            : isOver && canDrop
            ? 'border-f1-red bg-f1-red/20'
            : driver && teamColor
            ? `${teamColor.border} bg-gray-800 cursor-grab`
            : 'border-dashed border-gray-600 bg-gray-900'
        }`}
      >
        {driver ? (
          <>
            <DriverBadge driverNumber={driver.driver_number} team={driver.team} small />
            <span className="font-bold text-white text-xs">
              {driver.name_acronym || driver.name.substring(0, 3).toUpperCase()}
            </span>
          </>
        ) : (
          <span className="text-gray-600 text-[10px]">Drop</span>
        )}
      </div>
    </div>
  );
};

// Drop zone for removing drivers (left column area)
interface RemoveZoneProps {
  onDrop: (item: DragItem) => void;
  children: React.ReactNode;
}

const RemoveZone = ({ onDrop, children }: RemoveZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType,
    drop: (item: DragItem) => {
      if (item.source === 'grid') {
        onDrop(item);
      }
    },
    canDrop: (item: DragItem) => item.source === 'grid',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`transition-all rounded-lg ${
        isOver && canDrop ? 'bg-red-900/30 ring-2 ring-red-500' : ''
      }`}
    >
      {children}
    </div>
  );
};

interface PredictionInterfaceProps {
  raceId: number;
}

const PredictionInterface = ({ raceId }: PredictionInterfaceProps) => {
  const navigate = useNavigate();
  const [qualifyingDrivers, setQualifyingDrivers] = useState<Driver[]>([]);
  const [predictions, setPredictions] = useState<(Driver | null)[]>(Array(10).fill(null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [hasQualifyingResults, setHasQualifyingResults] = useState(false);
  const [orderSource, setOrderSource] = useState<string>('');
  const [showQualiDetails, setShowQualiDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, [raceId]);

  const fetchData = async () => {
    try {
      // Fetch qualifying order
      const qualifyingResponse = await getQualifyingOrder(raceId);
      const { drivers, source, hasQualifyingResults: hasQuali } = qualifyingResponse.data;
      setQualifyingDrivers(drivers);
      setOrderSource(source || '');
      setHasQualifyingResults(hasQuali || false);

      // Try to fetch existing prediction
      try {
        const predictionResponse = await getPrediction(raceId);
        const existingPrediction = predictionResponse.data;

        // Load existing predictions
        const loadedPredictions: (Driver | null)[] = [];
        for (let i = 1; i <= 10; i++) {
          const driverId = existingPrediction[`position_${i}`];
          if (driverId) {
            const driver = drivers.find((d: Driver) => d.id === driverId);
            loadedPredictions.push(driver || null);
          } else {
            loadedPredictions.push(null);
          }
        }
        setPredictions(loadedPredictions);
      } catch {
        // No existing prediction
        console.log('No existing prediction found');
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  // Get set of selected driver IDs for quick lookup
  const selectedIds = new Set(predictions.filter(d => d !== null).map(d => d!.id));

  const handleDrop = (item: DragItem, targetPosition: number) => {
    const newPredictions = [...predictions];
    const targetIndex = targetPosition - 1;

    if (item.source === 'qualifying') {
      // Adding from qualifying list
      if (newPredictions[targetIndex]) {
        // Slot is occupied - swap with empty slot or push down
        const emptyIndex = newPredictions.findIndex(d => d === null);
        if (emptyIndex !== -1) {
          newPredictions[emptyIndex] = newPredictions[targetIndex];
        }
      }
      newPredictions[targetIndex] = item.driver;
    } else if (item.source === 'grid' && item.sourceIndex !== undefined) {
      // Reordering within grid
      const sourceIndex = item.sourceIndex;
      if (sourceIndex !== targetIndex) {
        const sourceDriver = newPredictions[sourceIndex];
        const targetDriver = newPredictions[targetIndex];

        // Swap positions
        newPredictions[targetIndex] = sourceDriver;
        newPredictions[sourceIndex] = targetDriver;
      }
    }

    setPredictions(newPredictions);
  };

  const handleRemoveFromGrid = (item: DragItem) => {
    if (item.sourceIndex !== undefined) {
      const newPredictions = [...predictions];
      newPredictions[item.sourceIndex] = null;
      setPredictions(newPredictions);
    }
  };

  const handleDragStart = (_position: number) => {
    // Could be used for visual feedback if needed
  };

  const handleSubmit = async () => {
    if (predictions.some(d => d === null)) {
      setMessage('Please fill all 10 positions before submitting');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const positions = predictions.map(d => d!.id);
      await submitPrediction(raceId, positions);
      setMessage('Prediction submitted successfully! Check your email for confirmation.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const filledCount = predictions.filter(d => d !== null).length;

  return (
    <DndProvider backend={DndBackend} options={backendOptions}>
      <div className="flex flex-col gap-4">
        {/* Two columns side by side */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left Column - Qualifying Order */}
          <RemoveZone onDrop={handleRemoveFromGrid}>
            <div>
              <h2 className="text-sm font-bold text-f1-red mb-1">
                {orderSource === 'qualifying' ? 'Qualifying Results' : orderSource === 'previous_race' ? 'Previous Race Order' : 'Championship Order'}
              </h2>
              {hasQualifyingResults && (
                <button
                  onClick={() => setShowQualiDetails(!showQualiDetails)}
                  className="text-xs text-green-400 hover:text-green-300 mb-1 flex items-center gap-1"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  {showQualiDetails ? 'Hide times' : 'Show times'}
                </button>
              )}
              {hasQualifyingResults && showQualiDetails && (
                <div className="mb-2 bg-gray-900 rounded-lg p-2 text-xs max-h-[200px] overflow-y-auto">
                  <div className="grid grid-cols-[24px_1fr_auto] gap-x-1 gap-y-0.5">
                    {qualifyingDrivers.map((driver) => {
                      const bestTime = driver.q3 || driver.q2 || driver.q1 || '-';
                      return (
                        <div key={driver.id} className="contents">
                          <span className="text-f1-gray font-mono">P{driver.position}</span>
                          <span className="text-white font-bold truncate">{driver.name_acronym || driver.name.substring(0, 3).toUpperCase()}</span>
                          <span className="text-green-400 font-mono">{bestTime}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1">
                {qualifyingDrivers.map((driver) => (
                  <QualifyingDriverCard
                    key={driver.id}
                    driver={driver}
                    isSelected={selectedIds.has(driver.id)}
                  />
                ))}
              </div>
            </div>
          </RemoveZone>

          {/* Right Column - Starting Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-f1-red">GRID</h2>
              <span className="text-xs text-f1-gray">{filledCount}/10</span>
            </div>

            {/* F1 Starting Grid Layout - 2 column staggered */}
            <div className="space-y-1.5 py-2 px-1 bg-gray-900/50 rounded-lg">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((position) => {
                const isLeft = position % 2 === 1; // Odd positions on left
                return (
                  <div
                    key={position}
                    className={`flex ${isLeft ? 'justify-start pl-1' : 'justify-end pr-1'}`}
                  >
                    <GridSlot
                      position={position}
                      driver={predictions[position - 1]}
                      onDrop={handleDrop}
                      onDragStart={handleDragStart}
                      isLeft={isLeft}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button - Full width below */}
        <button
          onClick={handleSubmit}
          disabled={submitting || predictions.some(d => d === null)}
          className={`w-full py-3 rounded-lg font-bold text-base transition-colors ${
            predictions.some(d => d === null)
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {submitting ? 'Submitting...' : 'CONFIRM PREDICTION'}
        </button>

        {/* View All Predictions Button */}
        <button
          onClick={() => navigate('/predictions')}
          className="w-full py-3 rounded-lg font-bold text-base transition-colors bg-gray-700 hover:bg-gray-600"
        >
          VIEW PREDICTIONS
        </button>

        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes('success') ? 'bg-green-800' : 'bg-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default PredictionInterface;
