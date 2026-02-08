import { useState } from 'react';
import type { Exercise } from "../api/types";
import { RotateCw } from 'lucide-react';
import Model from 'react-body-highlighter';

interface MuscleHeatmapProps {
    sets: { exerciseId: string, weight: number, reps: number }[];
    exercises: Exercise[];
}

type View = 'anterior' | 'posterior';

// Colors from light green to deep emerald
const HEATMAP_COLORS = [
    '#d1fae5', // 1: emerald-100
    '#a7f3d0', // 2: emerald-200
    '#6ee7b7', // 3: emerald-300
    '#34d399', // 4: emerald-400
    '#10b981', // 5: emerald-500
    '#059669', // 6: emerald-600
    '#047857', // 7: emerald-700
    '#065f46', // 8: emerald-800
    '#064e3b', // 9: emerald-900 (max)
];

export function MuscleHeatmap({ sets, exercises }: MuscleHeatmapProps) {
    const [view, setView] = useState<View>('anterior');

    // 1. Calculate volume per muscle group
    const volumeByMuscle: Record<string, number> = {};

    sets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (exercise) {
            const vol = set.weight * set.reps;
            const muscle = exercise.muscle_group.toLowerCase();
            volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + vol;
        }
    });

    const maxVolume = Math.max(...Object.values(volumeByMuscle), 1);

    // Helper to get normalized frequency 1-9
    const getFrequency = (muscles: string[]) => {
        let totalVol = 0;
        muscles.forEach(m => {
            totalVol += volumeByMuscle[m] || 0;
            // Map generic groups to specific API responses
            if (m === 'legs') {
                totalVol += volumeByMuscle['quadriceps'] || 0;
                totalVol += volumeByMuscle['hamstrings'] || 0;
                totalVol += volumeByMuscle['calves'] || 0;
                totalVol += volumeByMuscle['glutes'] || 0;
            }
            if (m === 'back') {
                totalVol += volumeByMuscle['lats'] || 0;
                totalVol += volumeByMuscle['traps'] || 0;
                totalVol += volumeByMuscle['lower back'] || 0;
            }
            if (m === 'chest') totalVol += volumeByMuscle['pecs'] || 0;
            if (m === 'arms') {
                totalVol += volumeByMuscle['biceps'] || 0;
                totalVol += volumeByMuscle['triceps'] || 0;
            }
            if (m === 'shoulders') totalVol += volumeByMuscle['delts'] || 0;
            if (m === 'abs') totalVol += volumeByMuscle['core'] || 0;
        });

        if (totalVol === 0) return 0;
        // Scale 1 to 9
        return Math.ceil((totalVol / maxVolume) * 9);
    };

    // 2. Construct Data for react-body-highlighter
    // It expects: { name: string, muscles: string[], frequency: number }
    // valid muscles: 'chest', 'abs', 'obliques', 'quadriceps', 'front-deltoids', 'biceps', 'forearm', 'trapezius', 'upper-back', 'lower-back', 'back-deltoids', 'triceps', 'gluteal', 'hamstring', 'calves'

    const possibleMuscles = [
        // Front
        { id: 'chest', keys: ['chest', 'pectoralis'] },
        { id: 'abs', keys: ['core', 'abs'] },
        { id: 'obliques', keys: ['core', 'obliques'] },
        { id: 'quadriceps', keys: ['legs', 'quadriceps'] },
        { id: 'front-deltoids', keys: ['shoulders', 'delts'] },
        { id: 'biceps', keys: ['arms', 'biceps'] },
        { id: 'forearm', keys: ['arms', 'forearms'] },
        // Back
        { id: 'trapezius', keys: ['back', 'traps', 'shoulders'] }, // Traps often work with shoulders
        { id: 'upper-back', keys: ['back', 'lats'] },
        { id: 'lower-back', keys: ['back', 'lower back'] },
        { id: 'back-deltoids', keys: ['shoulders', 'delts'] }, // Posterior & Side (approx)
        { id: 'triceps', keys: ['arms', 'triceps'] },
        { id: 'gluteal', keys: ['legs', 'glutes'] },
        { id: 'hamstring', keys: ['legs', 'hamstrings'] },
        { id: 'calves', keys: ['legs', 'calves'] },
    ];

    const data = possibleMuscles.map(pm => {
        const freq = getFrequency(pm.keys);
        if (freq === 0) return null;

        // We cast id to any to avoid strict typing issues with specific strings vs string
        return {
            name: pm.id,
            muscles: [pm.id as any],
            frequency: freq
        };
    }).filter(d => d !== null) as any[];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[300px] aspect-[1/2]">
                <button
                    onClick={() => setView(v => v === 'anterior' ? 'posterior' : 'anterior')}
                    className="absolute top-0 right-0 p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors z-10 shadow-lg border border-slate-700"
                    title="Toggle View"
                >
                    <RotateCw className="w-5 h-5 text-emerald-400" />
                </button>

                <Model
                    type={view}
                    data={data}
                    style={{ width: '100%', height: '100%' }}
                    highlightedColors={HEATMAP_COLORS}
                />
            </div>
        </div>
    );
}
