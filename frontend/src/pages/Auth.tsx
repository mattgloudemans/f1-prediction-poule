import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login as loginMagicLink, registerWithPassword, loginWithPassword } from '../services/api';
import { AuthContext } from '../context/AuthContext';

type AuthMethod = 'magic-link' | 'password';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMethod === 'magic-link') {
        // Magic link flow
        if (isRegister) {
          await register(nickname, email);
          setMessage('Account created! Check your email for a login link.');
        } else {
          await loginMagicLink(email);
          setMessage('Check your email for a login link.');
        }
      } else {
        // Password flow
        if (isRegister) {
          if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
            setLoading(false);
            return;
          }
          const response = await registerWithPassword(nickname, email, password);
          // Auto-login after registration
          login(response.data.token);
          navigate('/');
        } else {
          const response = await loginWithPassword(email, password);
          login(response.data.token);
          navigate('/');
        }
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card-f1 p-8 shadow-card-hover">
        <h2 className="text-3xl font-bold text-center mb-8 text-gradient-red">
          {isRegister ? 'Register' : 'Login'}
        </h2>

        {/* Auth Method Toggle */}
        <div className="flex rounded-lg bg-f1-neutral-800 p-1 mb-6">
          <button
            type="button"
            onClick={() => setAuthMethod('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authMethod === 'password'
                ? 'bg-f1-red text-white'
                : 'text-f1-gray hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('magic-link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authMethod === 'magic-link'
                ? 'bg-f1-red text-white'
                : 'text-f1-gray hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold mb-2">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="input-f1 w-full"
                placeholder="Your racing nickname"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-f1 w-full"
              placeholder="your.email@example.com"
            />
          </div>

          {authMethod === 'password' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-f1 w-full"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input-f1 w-full"
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-f1-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : isRegister ? (
              'Register'
            ) : authMethod === 'password' ? (
              'Login'
            ) : (
              'Send Login Link'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-lg border-2 ${
            message.includes('Check') || message.includes('created') || message.includes('successful')
              ? 'bg-green-900/30 border-green-500 text-green-400'
              : 'bg-red-900/30 border-red-500 text-red-400'
          }`}>
            <p className="font-semibold">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage('');
            }}
            className="text-f1-gray hover:text-f1-red-400 transition-all duration-300 font-semibold"
          >
            {isRegister
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-f1-neutral-700">
          <p className="text-sm text-f1-gray text-center">
            {authMethod === 'password'
              ? '🔐 Login with your email and password'
              : '🔒 No password required! We\'ll send you a magic link to access your account.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
