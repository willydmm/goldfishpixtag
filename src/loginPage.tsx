import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from './authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.indexOf(' ') === -1;
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password) && password.indexOf(' ') === -1;
  };

  const validateName = (name: string) => {
    const re = /^[A-Za-z]+$/;
    return re.test(name) && name.indexOf(' ') === -1;
  };

  const handleSignIn = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address';
      valid = false;
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters, include 1 uppercase and 1 lowercase letter, 1 numeric character, 1 special character, and no spaces';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      try {
        const session = await signIn(email, password);
        console.log('Sign in successful', session);
        if (session && typeof session.AccessToken !== 'undefined') {
          sessionStorage.setItem('accessToken', session.AccessToken);
          if (sessionStorage.getItem('accessToken')) {
            window.location.href = '/home';
          } else {
            console.error('Session token was not set properly.');
          }
        } else {
          console.error('SignIn session or AccessToken is undefined.');
        }
      } catch (error) {
        alert(`Sign in failed: ${error}`);
      }
    }
  };

  const handleSignUp = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address';
      valid = false;
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters, include 1 uppercase and 1 lowercase letter, 1 numeric character, 1 special character, and no spaces';
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    if (!validateName(firstName)) {
      newErrors.firstName = 'First name is required, can only contain letters, and no spaces';
      valid = false;
    }

    if (!validateName(lastName)) {
      newErrors.lastName = 'Last name is required, can only contain letters, and no spaces';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      try {
        await signUp(email, password, firstName, lastName);
        navigate('/confirm', { state: { email } });
      } catch (error) {
        alert(`Sign up failed: ${error}`);
      }
    }
  };

  return (
    <div className="loginForm">
      <h1>Welcome</h1>
      <h4>{isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}</h4>
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <div>
          <input
            className="inputText"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <div>
          <input
            className="inputText"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        {isSignUp && (
          <>
            <div>
              <input
                className="inputText"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>
            <div>
              <input
                className="inputText"
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
              {errors.firstName && <span className="error">{errors.firstName}</span>}
            </div>
            <div>
              <input
                className="inputText"
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
              {errors.lastName && <span className="error">{errors.lastName}</span>}
            </div>
          </>
        )}
        <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
};

export default LoginPage;
