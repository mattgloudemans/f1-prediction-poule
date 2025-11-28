import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JOLPI_API_URL = process.env.JOLPI_API_URL || 'https://api.jolpi.ca/ergast/f1';

export interface JolpiRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
}

export interface JolpiDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

export interface JolpiStanding {
  position: string;
  points: string;
  wins: string;
  Driver: JolpiDriver;
  Constructors: Array<{
    constructorId: string;
    name: string;
  }>;
}

export interface JolpiResult {
  number: string;
  position: string;
  points: string;
  Driver: JolpiDriver;
  Constructor: {
    constructorId: string;
    name: string;
  };
  status: string;
}

export const getRaces = async (season: number = 2025): Promise<JolpiRace[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}.json`);
    return response.data.MRData.RaceTable.Races || [];
  } catch (error) {
    console.error('Error fetching races from Jolpi:', error);
    throw error;
  }
};

export const getDriverStandings = async (season: number = 2025): Promise<JolpiStanding[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/driverStandings.json`);
    return response.data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch (error) {
    console.error('Error fetching driver standings from Jolpi:', error);
    throw error;
  }
};

export const getRaceResults = async (season: number, round: number): Promise<JolpiResult[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/${round}/results.json`);
    return response.data.MRData.RaceTable.Races[0]?.Results || [];
  } catch (error) {
    console.error('Error fetching race results from Jolpi:', error);
    throw error;
  }
};

export const getDrivers = async (season: number = 2025): Promise<JolpiDriver[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/drivers.json`);
    return response.data.MRData.DriverTable.Drivers || [];
  } catch (error) {
    console.error('Error fetching drivers from Jolpi:', error);
    throw error;
  }
};

export interface JolpiQualifyingResult {
  number: string;
  position: string;
  Driver: JolpiDriver;
  Constructor: {
    constructorId: string;
    name: string;
  };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export const getQualifyingResults = async (season: number, round: number): Promise<JolpiQualifyingResult[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/${round}/qualifying.json`);
    return response.data.MRData.RaceTable.Races[0]?.QualifyingResults || [];
  } catch (error) {
    console.error('Error fetching qualifying results from Jolpi:', error);
    throw error;
  }
};

// Get sprint results for a specific round
export const getSprintResults = async (season: number, round: number): Promise<JolpiResult[]> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/${round}/sprint.json`);
    return response.data.MRData.RaceTable.Races[0]?.SprintResults || [];
  } catch (error) {
    console.error('Error fetching sprint results from Jolpi:', error);
    return []; // Return empty array if no sprint for this round
  }
};

// Check if a round has a sprint race
export const hasSprint = async (season: number, round: number): Promise<boolean> => {
  try {
    const response = await axios.get(`${JOLPI_API_URL}/${season}/${round}/sprint.json`);
    const races = response.data.MRData.RaceTable.Races || [];
    return races.length > 0;
  } catch {
    return false;
  }
};

// F1 2025 sprint race rounds (hardcoded for reliability)
export const SPRINT_ROUNDS_2025 = [2, 4, 6, 9, 11, 23]; // Example rounds - update with actual 2025 calendar

export interface JolpiPracticeResult {
  number: string;
  position: string;
  Driver: JolpiDriver;
  Constructor: {
    constructorId: string;
    name: string;
  };
  Time?: {
    time: string;
  };
  laps: string;
}

// Get practice session results (FP1, FP2, FP3)
export const getPracticeResults = async (season: number, round: number, session: 1 | 2 | 3): Promise<JolpiPracticeResult[]> => {
  try {
    const endpoint = session === 1 ? 'fp1' : session === 2 ? 'fp2' : 'fp3';
    const response = await axios.get(`${JOLPI_API_URL}/${season}/${round}/${endpoint}.json`);
    const races = response.data.MRData.RaceTable.Races || [];
    if (races.length === 0) return [];

    const sessionKey = session === 1 ? 'FirstPractice' : session === 2 ? 'SecondPractice' : 'ThirdPractice';
    return races[0][sessionKey + 'Results'] || races[0].PracticeResults || [];
  } catch (error) {
    console.error(`Error fetching FP${session} results from Jolpi:`, error);
    return [];
  }
};
