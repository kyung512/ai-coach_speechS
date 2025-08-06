import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout';
import App from './App';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,          // ← every child route inherits the navbar
    children: [
      { path: '/',        element: <App /> },
      { path: '/signup',  element: <Signup /> },
      { path: '/signin',  element: <Signin /> },
      // {
      //   path: '/dashboard',
      //   element: (
      //     <PrivateRoute>
      //       <Dashboard />
      //     </PrivateRoute>
      //   ),
      // },
    ],
  },
]);