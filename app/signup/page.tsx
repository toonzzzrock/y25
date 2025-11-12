"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [userType, setUserType] = useState<"user" | "publisher">("user");
  const [values, setValues] = useState({
    username: "",
    email: "",
    dateOfBirth: "",
    sex: "",
    password: "",
    confirmPassword: "",
    terms: false,
    bankAccountName: "",
    bankAccountSerial: ""
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    dateOfBirth?: string;
    sex?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    bankAccountName?: string;
    bankAccountSerial?: string;
  }>({});

  // Real-time password strength validation
  const passwordStrength = useMemo(() => {
    const pwd = values.password;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const isValid = Object.values(checks).every(Boolean);

    return { checks, passed, isValid, total: 5 };
  }, [values.password]);

  function show(message: string, type: 'success' | 'error' = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Date of birth validation helper
  const isValidDateOfBirth = (dateString: string): boolean => {
    if (!dateString) return false;
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Check if age is at least 13
    if (age < 13) return false;
    if (age === 13 && monthDiff < 0) return false;
    if (age === 13 && monthDiff === 0 && today.getDate() < birthDate.getDate()) return false;
    
    // Check if date is in the future
    if (birthDate > today) return false;
    
    return true;
  };

  // Check username uniqueness
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username) return false;
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      return data.available === true;
    } catch (error) {
      console.error('Error checking username:', error);
      return true; // Assume available if check fails
    }
  };

  // Check email uniqueness
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    if (!email) return false;
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.available === true;
    } catch (error) {
      console.error('Error checking email:', error);
      return true; // Assume available if check fails
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Reset errors
    const newErrors: typeof errors = {};

    // Validation with detailed error messages
    if (!values.username) {
      newErrors.username = "Username is required";
    }

    if (!values.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(values.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!values.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (!isValidDateOfBirth(values.dateOfBirth)) {
      newErrors.dateOfBirth = "You must be at least 13 years old";
    }

    if (!values.sex || !['Male', 'Female', 'Other'].includes(values.sex)) {
      newErrors.sex = "Please select your gender";
    }

    if (!values.password) {
      newErrors.password = "Password is required";
    } else if (!passwordStrength.isValid) {
      newErrors.password = "Password does not meet all requirements";
    }

    if (!values.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (userType === "publisher") {
      const trimmedBankAccountName = values.bankAccountName.trim();
      const trimmedBankAccountSerial = values.bankAccountSerial.trim();

      if (!trimmedBankAccountName) {
        newErrors.bankAccountName = "Bank account name is required";
      }

      if (!trimmedBankAccountSerial) {
        newErrors.bankAccountSerial = "Bank account serial number is required";
      }
    }

    if (!values.terms) {
      newErrors.terms = "You must accept Terms & Conditions";
    }

    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorMessages = Object.values(newErrors).join("\n");
      show(errorMessages, 'error');
      return;
    }

    // Check username availability before final submission
    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(values.username);
    setCheckingUsername(false);

    if (!isAvailable) {
      const usernameError = "Username already taken. Please choose a different one.";
      setErrors(prev => ({ ...prev, username: usernameError }));
      show(usernameError, 'error');
      return;
    }

    // Check email availability before final submission
    setCheckingEmail(true);
    const emailAvailable = await checkEmailAvailability(values.email);
    setCheckingEmail(false);

    if (!emailAvailable) {
      const emailError = "Email already registered. Please use a different email.";
      setErrors(prev => ({ ...prev, email: emailError }));
      show(emailError, 'error');
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    setLoading(true);
    try {
      const trimmedBankAccountName = values.bankAccountName.trim();
      const trimmedBankAccountSerial = values.bankAccountSerial.trim();

      await signup({
        username: values.username,
        email: values.email,
        dateOfBirth: values.dateOfBirth,
        sex: values.sex,
        password: values.password,
        userType,
        bankAccountName: userType === "publisher" ? trimmedBankAccountName : undefined,
        bankAccountSerial: userType === "publisher" ? trimmedBankAccountSerial : undefined,
      });
      show("Account created successfully! Redirecting to login...", 'success');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      show(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="header">
        <Link href="/" className="logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <span className="logo-y25">Y25</span>
          <span className="logo-divider">/</span>
          <span className="logo-text">ONLINE GAME PLATFORM</span>
        </Link>
        <nav className="nav">
          <Link href="/" className="btn-signup">Login</Link>
        </nav>
      </header>
      <main className="main-content">
        <div className="signup-wrapper">
          <div className="signup-left-panel">
            <Link className="back-button" href="/">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="decorative-content">
              <div className="red-circle" />
              <div className="star-burst" />
              <div className="line-pattern" />
              <h2 className="panel-title">
                <span className="title-create">CREATE</span>
                <span className="title-your">YOUR</span>
                <span className="title-account">ACCOUNT</span>
              </h2>
              <div className="game-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 5L35 20L50 25L35 30L30 45L25 30L10 25L25 20L30 5Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
          <div className="signup-right-panel" style={{ overflowY: "auto" }}>
            <div className="signup-container">
              <h1 className="signup-title">Sign Up</h1>
              <div className="user-type-toggle">
                {(["user", "publisher"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`toggle-btn ${userType === t ? "active" : ""}`}
                    onClick={() => {
                      setUserType(t);
                      if (t === "user") {
                        setErrors((prev) => ({
                          ...prev,
                          bankAccountName: undefined,
                          bankAccountSerial: undefined,
                        }));
                      }
                    }}
                  >
                    {t === "user" ? "User" : "Publisher"}
                  </button>
                ))}
              </div>
              <form className="signup-form" onSubmit={submit} style={{ overflow: "visible" }}>
                {/* Username */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#000000ff' }}>Username</span>
                    {!values.username && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    className="form-input signup-input"
                    placeholder="Username"
                    autoComplete="username"
                    value={values.username}
                    onChange={async (e) => {
                      const newUsername = e.target.value;
                      setValues((v) => ({ ...v, username: newUsername }));
                      
                      // Real-time username availability check with debounce
                      if (newUsername.length >= 3) {
                        setCheckingUsername(true);
                        // Wait a bit before checking to avoid too many requests
                        setTimeout(async () => {
                          const isAvailable = await checkUsernameAvailability(newUsername);
                          if (isAvailable) {
                            setErrors(prev => ({ ...prev, username: undefined }));
                          } else {
                            setErrors(prev => ({ ...prev, username: 'Username already taken' }));
                          }
                          setCheckingUsername(false);
                        }, 500);
                      } else if (newUsername) {
                        setCheckingUsername(false);
                        setErrors(prev => ({ ...prev, username: undefined }));
                      }
                    }}
                    style={{
                      borderColor: errors.username ? '#ff3333' : undefined,
                      borderWidth: errors.username ? '2px' : undefined,
                      backgroundColor: errors.username ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                    }}
                    required
                  />
                  {errors.username && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.username}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#000000ff' }}>Email address</span>
                    {!values.email && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  <input
                    type="email"
                    className="form-input signup-input"
                    placeholder="Email address"
                    autoComplete="email"
                    value={values.email}
                    onChange={async (e) => {
                      const newEmail = e.target.value;
                      setValues((v) => ({ ...v, email: newEmail }));
                      
                      // Real-time email validation
                      if (newEmail && !isValidEmail(newEmail)) {
                        setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
                      } else if (newEmail) {
                        // Check email availability with debounce
                        setCheckingEmail(true);
                        setTimeout(async () => {
                          const isAvailable = await checkEmailAvailability(newEmail);
                          if (isAvailable) {
                            setErrors(prev => ({ ...prev, email: undefined }));
                          } else {
                            setErrors(prev => ({ ...prev, email: 'Email already registered' }));
                          }
                          setCheckingEmail(false);
                        }, 500);
                      } else {
                        setCheckingEmail(false);
                        setErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    style={{
                      borderColor: errors.email ? '#ff3333' : undefined,
                      borderWidth: errors.email ? '2px' : undefined,
                      backgroundColor: errors.email ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                    }}
                    required
                  />
                  {errors.email && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#000000ff' }}>Date of Birth</span>
                    {!values.dateOfBirth && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  <input
                    type="date"
                    className="form-input signup-input"
                    value={values.dateOfBirth}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, dateOfBirth: e.target.value }));
                      // Real-time date of birth validation
                      if (e.target.value && !isValidDateOfBirth(e.target.value)) {
                        setErrors(prev => ({ ...prev, dateOfBirth: 'You must be at least 13 years old' }));
                      } else if (e.target.value) {
                        setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
                      }
                    }}
                    style={{
                      borderColor: errors.dateOfBirth ? '#ff3333' : undefined,
                      borderWidth: errors.dateOfBirth ? '2px' : undefined,
                      backgroundColor: errors.dateOfBirth ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                    }}
                    required
                  />
                  {errors.dateOfBirth && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.dateOfBirth}
                    </div>
                  )}
                </div>

                {/* Sex */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#000000ff' }}>Gender</span>
                  </label>
                  <select
                    className="form-input signup-input"
                    value={values.sex}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, sex: e.target.value }));
                      if (e.target.value) setErrors(prev => ({ ...prev, sex: undefined }));
                    }}
                    style={{
                      borderColor: errors.sex ? '#ff3333' : undefined,
                      borderWidth: errors.sex ? '2px' : undefined,
                      backgroundColor: errors.sex ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                    }}
                    required
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sex && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.sex}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="form-group" style={{ position: "relative", marginTop: "0.5rem" }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#000000ff' }}>Password</span>
                    {!values.password && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input signup-input"
                    placeholder="Password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, password: e.target.value }));
                      if (e.target.value) setErrors(prev => ({ ...prev, password: undefined }));
                      // Also validate confirm password if it has been filled
                      if (values.confirmPassword) {
                        if (e.target.value !== values.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                        } else {
                          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }
                    }}
                    style={{
                      borderColor: errors.password ? '#ff3333' : undefined,
                      borderWidth: errors.password ? '2px' : undefined,
                      backgroundColor: errors.password ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                      paddingRight: '40px',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      bottom: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#999",
                      fontSize: '1rem',
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                  {errors.password && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.password}
                    </div>
                  )}
                  {/* Password strength indicator */}
                  {values.password && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '3px',
                              backgroundColor: i < passwordStrength.passed ? '#ff6600' : '#e0e0e0',
                              borderRadius: '2px',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ color: passwordStrength.isValid ? '#4caf50' : '#999', marginBottom: '0.35rem' }}>
                        {passwordStrength.passed}/5 requirements met
                      </div>
                      <div style={{ color: '#666', lineHeight: '1.4' }}>
                        {!passwordStrength.checks.length && <div>• At least 8 characters</div>}
                        {!passwordStrength.checks.uppercase && <div>• Uppercase letter (A-Z)</div>}
                        {!passwordStrength.checks.lowercase && <div>• Lowercase letter (a-z)</div>}
                        {!passwordStrength.checks.digit && <div>• Number (0-9)</div>}
                        {!passwordStrength.checks.special && <div>• Special character (!@#$%^&*)</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ position: "relative", marginTop: "0.5rem" }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                   <span style={{ color: '#000000ff' }}>Confirm Password</span>
                    {!values.confirmPassword && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input signup-input"
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, confirmPassword: e.target.value }));
                      // Real-time confirm password validation
                      if (e.target.value && e.target.value !== values.password) {
                        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                      } else if (e.target.value) {
                        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    style={{
                      borderColor: errors.confirmPassword ? '#ff3333' : undefined,
                      borderWidth: errors.confirmPassword ? '2px' : undefined,
                      backgroundColor: errors.confirmPassword ? '#ffebee' : undefined,
                      color: '#1a1a1a',
                      paddingRight: '40px',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      bottom: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#999",
                      fontSize: '1rem',
                    }}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                  {errors.confirmPassword && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>

                {userType === 'publisher' && (
                  <>
                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#000000ff' }}>Bank Account Name</span>
                        {!values.bankAccountName && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        className="form-input signup-input"
                        placeholder="Bank account name"
                        value={values.bankAccountName}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setValues((prev) => ({ ...prev, bankAccountName: nextValue }));
                          if (nextValue.trim()) {
                            setErrors((prev) => ({ ...prev, bankAccountName: undefined }));
                          }
                        }}
                        style={{
                          borderColor: errors.bankAccountName ? '#ff3333' : undefined,
                          borderWidth: errors.bankAccountName ? '2px' : undefined,
                          backgroundColor: errors.bankAccountName ? '#ffebee' : undefined,
                          color: '#1a1a1a',
                        }}
                        required={userType === 'publisher'}
                      />
                      {errors.bankAccountName && (
                        <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                          {errors.bankAccountName}
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#000000ff' }}>Bank Account Serial Number</span>
                        {!values.bankAccountSerial && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        className="form-input signup-input"
                        placeholder="Serial number"
                        value={values.bankAccountSerial}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setValues((prev) => ({ ...prev, bankAccountSerial: nextValue }));
                          if (nextValue.trim()) {
                            setErrors((prev) => ({ ...prev, bankAccountSerial: undefined }));
                          }
                        }}
                        style={{
                          borderColor: errors.bankAccountSerial ? '#ff3333' : undefined,
                          borderWidth: errors.bankAccountSerial ? '2px' : undefined,
                          backgroundColor: errors.bankAccountSerial ? '#ffebee' : undefined,
                          color: '#1a1a1a',
                        }}
                        required={userType === 'publisher'}
                      />
                      {errors.bankAccountSerial && (
                        <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                          {errors.bankAccountSerial}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="form-group checkbox-group" style={{ marginTop: "0.75rem" }}>
                  <label className="checkbox-label" style={{
                    padding: errors.terms ? '0.75rem' : '0.35rem',
                    backgroundColor: errors.terms ? '#ffebee' : 'transparent',
                    borderRadius: '4px',
                    border: errors.terms ? '2px solid #ff3333' : 'none'
                  }}>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={values.terms}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, terms: e.target.checked }));
                        if (e.target.checked) setErrors(prev => ({ ...prev, terms: undefined }));
                      }}
                      required
                    />
                    <span className="checkbox-custom" />
                    <span className="checkbox-text" style={{ fontSize: '0.9rem' }}>
                      Accept Terms & Conditions
                      {!values.terms && <span style={{ color: '#ff6600', marginLeft: '0.25rem' }}>*</span>}
                    </span>
                  </label>
                  {errors.terms && (
                    <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      {errors.terms}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-join"
                  disabled={loading || !passwordStrength.isValid || values.password !== values.confirmPassword}
                  style={{ marginTop: '1rem' }}
                >
                  <span>{loading ? "Creating account..." : "Join us"}</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="form-footer" style={{ marginTop: "0.75rem", fontSize: '0.85rem' }}>
                  <p>
                    Already have an account? <Link href="/" className="login-link">Login</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      {notification && (
        <div
          className="notification"
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "1rem 1.5rem",
            borderRadius: 8,
            backgroundColor: notification.type === 'error' ? "#f44336" : "#4caf50",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
