'use client';

export default function HomePage() {
  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Client Email Assistant</h1>

      <button
        onClick={handleGoogleSignIn}
        className="bg-white text-gray-800 px-6 py-3 rounded shadow border hover:bg-gray-50 transition"
      >
        Sign in with Google
      </button>
    </main>
  );
}
