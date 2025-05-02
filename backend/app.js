//Client ID: 13698194171-mjdo68bmbthcanchn640skerudifmomn.apps.googleusercontent.com

const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const session = require('express-session');


const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // allows cookies/session to be sent
}));
app.use(session({
  secret: 'super_secret_key',  // change this to something random in production
  resave: false,
  saveUninitialized: true,
}));
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/auth/google/callback'   // This must match your Authorized Redirect URI
);
app.use(express.json());

// --- OpenAI setup ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.get('/api/emails', async (req, res) => {
  if (!req.session.tokens) return res.status(401).send('Not authenticated');

  const pageToken = req.query.pageToken || undefined;

  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      labelIds: ['INBOX'],
      pageToken,
    });

    const messages = await Promise.all(
      (response.data.messages || []).map(async (msg) => {
        const msgDetail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const subjectHeader = msgDetail.data.payload.headers.find(h => h.name === 'Subject');
        const subject = subjectHeader ? subjectHeader.value : '(No Subject)';
        const snippet = msgDetail.data.snippet;
        const bodyPart = msgDetail.data.payload.parts?.find(p => p.mimeType === 'text/plain');
        const body = bodyPart?.body?.data ? Buffer.from(bodyPart.body.data, 'base64').toString() : '';

        return {
          id: msg.id,
          subject,
          snippet,
          body,
        };
      })
    );

    res.json({
      emails: messages,
      nextPageToken: response.data.nextPageToken || null,
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  } catch (err) {
    console.error('Error fetching emails', err);
    res.status(500).send('Error fetching emails');
  }
});

// --- New Route: Generate AI Reply ---
const base64url = require('base64url'); // npm install base64url
app.post('/api/generate-reply', express.json(), async (req, res) => {
  const { emailBody, tone } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant writing professional email replies.`,
        },
        {
          role: 'user',
          content: `Generate a ${tone} reply to the following email:\n\n${emailBody}`,
        },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).send('Failed to generate reply');
  }
});


app.post('/api/send-reply', express.json(), async (req, res) => {
  if (!req.session.tokens) return res.status(401).send('Not authenticated');

  const { to, subject, body } = req.body;

  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const rawMessage =
    `To: ${to}\r\n` +
    `Subject: Re: ${subject}\r\n` +
    `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
    `${body}`;

  try {
    const encodedMessage = base64url(rawMessage);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    res.send({ status: 'sent' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).send('Failed to send email');
  }
});
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // 'offline' to get refresh token
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'email',
      'profile',
    ],
  });
  res.redirect(url);
});
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    res.redirect('http://localhost:3000/dashboard');

  } catch (err) {
    console.error('Error authenticating with Google:', err);
    res.status(500).send('Authentication Failed');
  }
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
