'use client';

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center gap-2 rounded bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow hover:bg-gray-100"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 11.84v4.33h6.19c-.27 1.66-2.05 4.87-6.19 4.87-3.74 0-6.78-3.08-6.78-6.88s3.04-6.88 6.78-6.88c2.14 0 3.57.9 4.39 1.66l2.99-2.88C17.34 3.36 14.94 2.2 12 2.2 6.48 2.2 2 6.64 2 12s4.48 9.8 10 9.8c5.94 0 9.8-4.18 9.8-10 0-.67-.07-1.17-.16-1.68H12z"
        />
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleSignInButton;
