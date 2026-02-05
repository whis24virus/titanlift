import { create } from 'zustand';
import type { Workout, Set } from '../api/types';

interface WorkoutState {
    activeWorkout: Workout | null;
    sets: Set[];
    startWorkout: (workout: Workout) => void;
    addSet: (set: Set) => void;
    finishWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
    activeWorkout: null,
    sets: [],
    startWorkout: (workout) => set({ activeWorkout: workout, sets: [] }),
    addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
    finishWorkout: () => set({ activeWorkout: null, sets: [] }),
}));
