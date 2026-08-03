import { RouterProvider } from 'react-router-dom';
import { router } from '../src/routes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <RouterProvider
        router={router}
        fallbackElement={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-400">Loading…</div>
          </div>
        }
      />
    </AuthProvider>
  );
}

export default App;
