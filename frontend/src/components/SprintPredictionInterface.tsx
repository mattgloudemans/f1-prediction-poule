import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getQualifyingOrder, submitSprintPrediction, getSprintPrediction } from '../services/api';

interface Driver {
  id: number;
  driver_number: number;
  name: string;
  name_acronym?: string;
  team: string;
  position?: number;
}

interface DragItem {
  driver: Driver;
  source: 'qualifying' | 'grid';
  sourceIndex?: number;
}

const ItemType = 'DRIVER';

// Racing number image component - compact for mobile
const RacingNumberImage = ({ driverNumber, small = false }: { driverNumber: number; small?: boolean }) => {
  return (
    <div className={`flex items-center justify-center bg-white rounded text-black font-bold ${
      small ? 'w-8 h-6 text-xs' : 'w-10 h-6 text-sm'
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
    item: { driver, source: 'qualifying' as const },
    canDrag: !isSelected,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 p-1.5 rounded transition-all ${
        isSelected
          ? 'bg-gray-700 opacity-40 cursor-not-allowed'
          : isDragging
          ? 'opacity-50 cursor-grabbing'
          : 'bg-gray-800 hover:bg-gray-700 cursor-grab'
      }`}
    >
      <RacingNumberImage driverNumber={driver.driver_number} small />
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
    drop: (item: DragItem) => onDrop(item, position),
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

  return (
    <div
      className={`flex items-center gap-1 ${isLeft ? '' : 'flex-row-reverse'}`}
      style={{ marginLeft: isLeft ? '0' : 'auto', marginRight: isLeft ? 'auto' : '0' }}
    >
      <span className="text-f1-gray font-bold text-xs w-5 text-center">{position}</span>
      <div
        ref={ref}
        className={`w-20 h-10 rounded border-2 transition-all flex items-center justify-center gap-1 ${
          isDragging
            ? 'opacity-50 border-f1-red'
            : isOver && canDrop
            ? 'border-f1-red bg-f1-red/20'
            : driver
            ? 'border-gray-600 bg-gray-800 cursor-grab'
            : 'border-dashed border-gray-600 bg-gray-900'
        }`}
      >
        {driver ? (
          <>
            <RacingNumberImage driverNumber={driver.driver_number} small />
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

interface SprintPredictionInterfaceProps {
  raceId: number;
  mainRaceId?: number; // For linking to main race prediction
}

const SprintPredictionInterface = ({ raceId, mainRaceId }: SprintPredictionInterfaceProps) => {
  const navigate = useNavigate();
  const [qualifyingDrivers, setQualifyingDrivers] = useState<Driver[]>([]);
  const [predictions, setPredictions] = useState<(Driver | null)[]>(Array(8).fill(null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [raceId]);

  const fetchData = async () => {
    try {
      // Fetch qualifying order (use main race qualifying if available)
      const qualifyingResponse = await getQualifyingOrder(mainRaceId || raceId);
      const { drivers } = qualifyingResponse.data;
      setQualifyingDrivers(drivers);

      // Try to fetch existing sprint prediction
      try {
        const predictionResponse = await getSprintPrediction(raceId);
        const existingPrediction = predictionResponse.data;

        // Load existing predictions (8 positions for sprint)
        const loadedPredictions: (Driver | null)[] = [];
        for (let i = 1; i <= 8; i++) {
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
        console.log('No existing sprint prediction found');
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
      setMessage('Please fill all 8 positions before submitting');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const positions = predictions.map(d => d!.id);
      await submitSprintPrediction(raceId, positions);
      setMessage('Sprint prediction submitted successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to submit sprint prediction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const filledCount = predictions.filter(d => d !== null).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        {/* Sprint badge */}
        <div className="flex items-center justify-center gap-2 bg-orange-600 text-white py-1 px-3 rounded-full text-sm font-bold mx-auto">
          SPRINT RACE
        </div>

        {/* Two columns side by side */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left Column - Qualifying Order */}
          <RemoveZone onDrop={handleRemoveFromGrid}>
            <div>
              <h2 className="text-sm font-bold text-f1-red mb-2">Qualifying results</h2>
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
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

          {/* Right Column - Sprint Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-f1-red">SPRINT GRID</h2>
              <span className="text-xs text-f1-gray">{filledCount}/8</span>
            </div>

            {/* F1 Starting Grid Layout - 2 column staggered (8 positions for sprint) */}
            <div className="space-y-1.5 py-2 px-1 bg-gray-900/50 rounded-lg">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((position) => {
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
              : 'bg-orange-600 hover:bg-orange-500'
          }`}
        >
          {submitting ? 'Submitting...' : 'CONFIRM SPRINT PREDICTION'}
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

export default SprintPredictionInterface;
