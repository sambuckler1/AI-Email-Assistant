'use client';

import { useEffect, useState } from 'react';

interface Email {
  id: string;
  subject: string;
  snippet: string;
  body: string;
}

function extractEmailAddress(email: Email): string {
  // TEMP: Use your email or a fixed value until full metadata is supported
  return 'sambuckler06@gmail.com'; // Replace with your real Gmail for now
}

export default function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [generatedReply, setGeneratedReply] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);

  const fetchEmails = async (token?: string | null) => {
    setLoadingEmails(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/emails${token ? `?pageToken=${token}` : ''}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        setError('Failed to load emails.');
        return;
      }

      const data = await res.json();
      setEmails(data.emails);
      setNextPageToken(data.nextPageToken || null);

      if (token) {
        setPageHistory((prev) => [...prev, token]);
      } else {
        setPageHistory([]);
      }
    } catch (err) {
      setError('Error fetching emails.');
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handlePrev = () => {
    const history = [...pageHistory];
    history.pop(); // current
    const prevToken = history.pop();
    if (prevToken) {
      setPageHistory(history);
      fetchEmails(prevToken);
    } else {
      fetchEmails(); // first page
    }
  };

  async function generateReply(emailBody: string) {
    setLoadingReply(true);
    const res = await fetch('http://localhost:5000/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emailBody, tone: 'professional' }),
    });
    const data = await res.json();
    setGeneratedReply(data.reply);
    setLoadingReply(false);
  }

  async function sendReply() {
    if (!selectedEmail) return;

    const to = extractEmailAddress(selectedEmail);
    const subject = selectedEmail.subject;

    await fetch('http://localhost:5000/api/send-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ to, subject, body: generatedReply }),
    });

    alert('Reply sent!');
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Your Gmail Inbox</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loadingEmails ? (
        <p>Loading emails...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-8">
            <div>
              {emails.map((email) => (
                <div key={email.id} className="border p-4 rounded-lg mb-4">
                  <h2 className="font-semibold">{email.subject}</h2>
                  <p className="text-gray-600 mb-2">{email.snippet}</p>
                  <button
                    onClick={() => {
                      setSelectedEmail(email);
                      generateReply(email.body);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Generate Reply
                  </button>
                </div>
              ))}
            </div>

            {selectedEmail && (
              <div className="border p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Suggested Reply:</h2>
                {loadingReply ? (
                  <p>Generating reply...</p>
                ) : (
                  <>
                    <textarea
                      className="w-full h-64 p-2 border rounded"
                      value={generatedReply}
                      onChange={(e) => setGeneratedReply(e.target.value)}
                    />
                    <button
                      onClick={sendReply}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Send Reply
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between mt-8">
            <button
              disabled={pageHistory.length === 0}
              onClick={handlePrev}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={!nextPageToken}
              onClick={() => fetchEmails(nextPageToken)}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
