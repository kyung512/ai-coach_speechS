import { useUser } from '../../context/UserContext';

const ShowGreet = () => {
  const { profile } = useUser();
  
  return (
    <div className='fixed top-6 right-6 bg-blue-50 p-4 rounded-xl shadow-lg flex items-center space-x-3'>
      <div className='flex-shrink-0'>
        {/* Optional: You can add an icon here to enhance the greeting */}
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6 text-blue-500'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M15 17C15 18.1046 14.1046 19 13 19C11.8954 19 11 18.1046 11 17C11 15.8954 11.8954 15 13 15C14.1046 15 15 15.8954 15 17Z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M19 9C19 10.1046 18.1046 11 17 11C15.8954 11 15 10.1046 15 9C15 7.89543 15.8954 7 17 7C18.1046 7 19 7.89543 19 9Z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M13 7C13 5.89543 12.1046 5 11 5C9.89543 5 9 5.89543 9 7C9 8.10457 9.89543 9 11 9C12.1046 9 13 8.10457 13 7Z'
          />
        </svg>
      </div>
      <div className='flex-grow'>
        <p className='text-lg font-medium text-gray-800'>
          Hi {profile.name}, Welcome back!
        </p>
      </div>
    </div>
  );
};

export default ShowGreet;
