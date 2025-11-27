import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyToken } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const VerifyAuth = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const [loading, setLoading] = useState(true);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('Invalid verification link');
      setLoading(false);
      return;
    }

    verify(token);
  }, [searchParams]);

  const verify = async (token: string) => {
    try {
      const response = await verifyToken(token);
      login(response.data.token);
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
        {loading && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red mx-auto mb-4"></div>
        )}
        <h2 className="text-2xl font-bold mb-4">
          {loading ? 'Verifying...' : message.includes('successful') ? 'Success!' : 'Error'}
        </h2>
        <p className={`text-lg ${
          message.includes('successful') ? 'text-green-500' : loading ? 'text-f1-gray' : 'text-red-500'
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default VerifyAuth;
