import { create } from 'zustand';

export const useWorkflowStore = create((set) => ({
    goal: '',
    setGoal: (goal) => set({ goal }),

    isLoading: false,
    error: null,

    workflow: null,
    setWorkflow: (workflow) => set({ workflow }),

    history: [],
    fetchHistory: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/history');
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
            await fetch(`http://localhost:5000/api/history/${id}`, {
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

    completedSteps: [],
    toggleStep: (stepId) => set((state) => {
        const isCompleted = state.completedSteps.includes(stepId);
        return {
            completedSteps: isCompleted
                ? state.completedSteps.filter(id => id !== stepId)
                : [...state.completedSteps, stepId]
        };
    }),

    generateWorkflow: async (goal, language) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('http://localhost:5000/api/generate-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, language }),
            });

            if (!response.ok) throw new Error('Failed to generate workflow');

            const data = await response.json();
            set((state) => ({
                workflow: data,
                isLoading: false,
                history: [data, ...state.history]
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    reset: () => set({ goal: '', workflow: null, completedSteps: [], error: null, isLoading: false }),

    verifyStep: async (stepId, stepTitle, stepDescription, proof) => {
        try {
            const response = await fetch('http://localhost:5000/api/verify-step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stepTitle, stepDescription, userProof: proof }),
            });

            if (!response.ok) throw new Error('Verification failed');

            const data = await response.json();

            if (data.isComplete) {
                set((state) => {
                    if (!state.completedSteps.includes(stepId)) {
                        return { completedSteps: [...state.completedSteps, stepId] };
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
