import { useCallback } from 'react';
import { useUser } from '../context/UserContext';

const useProfileUpdater = () => {
  const { patchProfile } = useUser();

  // Process the summarizer and update the profile with goals and mood
  const processAndUpdateProfile = useCallback(async (history, fact) => {
    try {
      // Process the summarizer to extract fact (goals, mood, etc.)
      // const fact = await processSummarizer(history);

      // Update profile with goals and mood
      patchProfileWithGoalsAndMood(fact);
    } catch (error) {
      console.error('Error processing and updating profile:', error);
    }
  }, [patchProfile]);

  // Function to update profile with goals and mood
  const patchProfileWithGoalsAndMood = (fact) => {
    patchProfile((p) => {
      let goals = updateGoals(p.goals, fact);
      let moodHistory = updateMoodHistory(p.moodHistory, fact);
      return { ...p, goals, moodHistory };
    });
  };

  // Handle goals updates in profile
  const updateGoals = (prevGoals, fact) => {
    const isValidGoal =
      typeof fact.goal === 'string' && fact.goal.trim() !== '' && fact.goal !== 'none';

    if (isValidGoal) {
      const norm = fact.goal.trim().toLowerCase();
      const duplicateGoal = prevGoals.find(
        (g) => g.status === 'active' && g.goal.trim().toLowerCase() === norm
      );

      if (duplicateGoal) {
        return prevGoals.map((g) => (g.id === duplicateGoal.id ? { ...g, ...fact } : g));
      } else {
        return [
          ...prevGoals,
          { id: crypto.randomUUID(), ...fact, status: 'active', created: Date.now() },
        ];
      }
    }

    return prevGoals;
  };

  // Handle mood history updates in profile
  const updateMoodHistory = (prevMoodHistory, fact) => {
    if (fact.mood && fact.mood !== 'none') {
      const now = Date.now();
      const lastMood = prevMoodHistory.at(-1);
      const sameMood = lastMood && lastMood.mood.toLowerCase() === fact.mood.toLowerCase();
      const within24h = lastMood && now - lastMood.date < 24 * 60 * 60 * 1000;

      if (!(sameMood && within24h)) {
        return [...prevMoodHistory, { date: now, mood: fact.mood }].slice(-60);
      }
    }
    return prevMoodHistory;
  };

  return {
    processAndUpdateProfile,
  };
};

export default useProfileUpdater;
