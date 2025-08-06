import { useUser } from '../context/UserContext';

export default function GoalsPanel() {
  const { user } = useUser();
  const active = user.goals?.filter(g => g.status === 'active') ?? [];

  return (
    <div className='card'>
      <h2 className='font-bold mb-2'>My SMART Goals</h2>
      {active.length === 0 ? (
        <p>No active goals yet. <code>/goal ...</code> to create one. </p>
      ) : (
        <ul className='list-disc pl-4 space-y-1'>
          {active.map(g => <li key={g.id}>{g.text}</li>)}
        </ul>
      )}
    </div>
  )

}