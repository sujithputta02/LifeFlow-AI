import { create } from 'zustand';

// Helper to get or create guest ID
const getGuestId = () => {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem('lifeflow_guest_id');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lifeflow_guest_id', id);
    }
    return id;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useWorkflowStore = create((set, get) => ({
    guestId: getGuestId(),
    goal: '',
    setGoal: (goal) => set({ goal }),

    isLoading: false,
    error: null,

    workflow: null,
    setWorkflow: (workflow) => set({ workflow }),

    history: [],
    fetchHistory: async () => {
        try {
            const guestId = get().guestId;
            const response = await fetch(`${API_BASE_URL}/api/history?guestId=${guestId}`);
            if (response.ok) {
                const data = await response.json();
                set({ history: data });
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    },
    deleteWorkflow: async (id) => {
        try {
            await fetch(`${API_BASE_URL}/api/history/${id}`, {
                method: 'DELETE',
            });
            set((state) => ({
                history: state.history.filter((item) => item._id !== id)
            }));
        } catch (error) {
            console.error("Failed to delete workflow:", error);
        }
    },
    loadWorkflow: (workflowData) => {
        set({ workflow: workflowData, completedSteps: [] });
    },

    // --- GAMIFICATION STATE ---
    userPoints: 0,
    userLevel: 1,
    badges: [],
    newBadge: null,

    // Sync Helper
    syncGamification: async (points, level, badges) => {
        try {
            await fetch(`${API_BASE_URL}/api/gamification/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId: get().guestId, points, level, badges }),
            });
        } catch (error) {
            console.error("Failed to sync gamification:", error);
        }
    },

    // Fetch Profile on Init
    fetchProfile: async () => {
        try {
            const guestId = get().guestId;
            if (!guestId) return;
            const res = await fetch(`${API_BASE_URL}/api/gamification/${guestId}`);
            if (res.ok) {
                const data = await res.json();
                set({
                    userPoints: data.points,
                    userLevel: data.level,
                    badges: data.badges
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    },

    unlockBadge: (badgeId) => {
        const state = get();
        // Check if badge exists by ID
        if (!state.badges.some(b => b.id === badgeId)) {
            const newBadgeObj = { id: badgeId, date: new Date().toISOString() };
            const newBadges = [...state.badges, newBadgeObj];
            set({ badges: newBadges, newBadge: badgeId }); // newBadge can remain just the ID for popup
            state.syncGamification(state.userPoints, state.userLevel, newBadges);
        }
    },

    clearNewBadge: () => set({ newBadge: null }),

    addPoints: (amount) => {
        const state = get();
        const newPoints = state.userPoints + amount;
        const newLevel = Math.floor(newPoints / 100) + 1;

        let newBadges = [...state.badges];
        if (newLevel >= 5 && !newBadges.some(b => b.id === 'level_5')) {
            newBadges.push({ id: 'level_5', date: new Date().toISOString() });
        }

        set({ userPoints: newPoints, userLevel: newLevel, badges: newBadges });
        state.syncGamification(newPoints, newLevel, newBadges);
    },

    completedSteps: [],
    toggleStep: (stepId) => {
        const state = get();
        const isCompleted = state.completedSteps.includes(stepId);

        if (!isCompleted) {
            const newPoints = state.userPoints + 10;
            const newLevel = Math.floor(newPoints / 100) + 1;

            // Unlock First Steps badge
            let newBadges = [...state.badges];
            const hasFirstStep = newBadges.some(b => b.id === 'first_step');

            if (!hasFirstStep) {
                // unlockBadge will handle the push and sync
                get().unlockBadge('first_step');
            } else {
                // If already has badge, just sync points
                state.syncGamification(newPoints, newLevel, newBadges);
            }

            set({
                completedSteps: [...state.completedSteps, stepId],
                userPoints: newPoints,
                userLevel: newLevel
            });
        } else {
            set({ completedSteps: state.completedSteps.filter(id => id !== stepId) });
        }
    },

    generateWorkflow: async (goal, language) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-workflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, language, guestId: get().guestId }),
            });

            if (!response.ok) throw new Error('Failed to generate workflow');

            const data = await response.json();
            set((state) => ({
                workflow: data,
                isLoading: false,
                history: [data, ...state.history] // Optimistic update
            }));

            // Re-fetch history to ensure sync and getting correct DB states for 3D cards
            get().fetchHistory();

        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    reset: () => set({ goal: '', workflow: null, completedSteps: [], error: null, isLoading: false }),

    verifyStep: async (stepId, stepTitle, stepDescription, proof) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stepTitle, stepDescription, userProof: proof }),
            });

            if (!response.ok) throw new Error('Verification failed');

            const data = await response.json();

            if (data.isComplete) {
                set((state) => {
                    if (!state.completedSteps.includes(stepId)) {
                        const newPoints = state.userPoints + 50; // Bonus for AI verification!
                        const newLevel = Math.floor(newPoints / 100) + 1;
                        localStorage.setItem('lifeflow_points', newPoints);
                        localStorage.setItem('lifeflow_level', newLevel);

                        // Unlock Verified badge
                        get().unlockBadge('verified_pro');

                        return {
                            completedSteps: [...state.completedSteps, stepId],
                            userPoints: newPoints,
                            userLevel: newLevel
                        };
                    }
                    return state;
                });
            }

            return data; // { isComplete, feedback }
        } catch (error) {
            console.error(error);
            return { isComplete: false, feedback: "System error: Could not verify." };
        }
    }
}));
