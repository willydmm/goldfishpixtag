import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmForgotPassword, forgotPassword, signIn, signInWithGoogle, signUp } from './authService';
import './loginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });

  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+\@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.indexOf(' ') === -1;
  };

  const validatePassword = (password: string) => {
    const length = password.length >= 8;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const number = /\d/.test(password);
    const special = /[@$!%*?&]/.test(password);

    setPasswordValidation({
      length,
      lower,
      upper,
      number,
      special,
    });

    return length && lower && upper && number && special;
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
      newErrors.password = 'Invalid password';
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
      newErrors.password = 'Password must meet all the requirements';
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPassword(value);
    validatePassword(value);
  };

  const handleForgotPassword = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setIsForgotPassword(true);
    } catch (error) {
      alert(`Forgot Password failed: ${error}`);
    }
  };

  const handleConfirmForgotPassword = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      await confirmForgotPassword(email, confirmationCode, newPassword);
      alert('Password reset successful');
      setIsForgotPassword(false);
    } catch (error) {
      alert(`Password reset failed: ${error}`);
    }
  };

  return (
    <div>
      <header data-bs-theme="dark">
        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
            alt="GoldFishPixTag"
            height="60"
            className="bi me-2"
            style={{ paddingLeft: '20px', paddingRight: '5px' }}
          />
          <p style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>GoldfishPixTag</p>
        </div>
      </header>
      <div className="login">
        <h2>Welcome to GoldfishPixTag!</h2>
        <img
          src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
          alt="GoldFishPixTag"
          height="150"
          className="bi me-2"
          style={{ paddingLeft: '20px', paddingRight: '5px' }}
        />
        <h5>{isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}</h5>
        <div className="spacer"></div>
        <form className="loginForm" onSubmit={isSignUp ? handleSignUp : (isForgotPassword ? handleConfirmForgotPassword : handleSignIn)}>
          <div>
            <input
              className="inputText form-control mb-2"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          {!isForgotPassword ? (
            <>
              <div>
                <input
                  className="inputText form-control mb-2"
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Password"
                  required
                />
                {errors.password && <span className="error">{errors.password}</span>}
                {isSignUp && (
                  <ul className="validation">
                    <li className={passwordValidation.lower ? 'valid' : 'invalid'}>Password must contain a lower case letter</li>
                    <li className={passwordValidation.upper ? 'valid' : 'invalid'}>Password must contain an upper case letter</li>
                    <li className={passwordValidation.special ? 'valid' : 'invalid'}>Password must contain a special character</li>
                    <li className={passwordValidation.number ? 'valid' : 'invalid'}>Password must contain a number</li>
                    <li className={passwordValidation.length ? 'valid' : 'invalid'}>Password must contain at least 8 characters</li>
                  </ul>
                )}
              </div>
              {isSignUp && (
                <>
                  <div>
                    <input
                      className="inputText form-control mb-2"
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
                      className="inputText form-control mb-2"
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
                      className="inputText form-control mb-3"
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
              <button className="btn btn-primary mt-3" type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
            </>
          ) : (
            <>
              <div>
                <input
                  className="inputText form-control mb-2"
                  id="confirmationCode"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Confirmation Code"
                  required
                />
              </div>
              <div>
                <input
                  className="inputText form-control mb-2"
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                />
              </div>
              <button className="btn btn-primary mt-3" type="submit">Reset Password</button>
            </>
          )}
        </form>
        <div className="mt-2">
          {!isForgotPassword ? (
            <button className="btn btn-link" onClick={handleForgotPassword}>Forgot Password?</button>
          ) : (
            <button className="btn btn-link" onClick={() => setIsForgotPassword(false)}>Back to Sign In</button>
          )}
          <button className="btn btn-link" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
        <div className="mt-3">
          <button type="button" className="btn btn-outline-primary" onClick={signInWithGoogle}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25px" height="25px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Sign In with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
