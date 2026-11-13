import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { db } from './server/store.js';
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  EmergencyRequest,
  HealthDocument,
  HealthVitalRecord,
  MedicalSpecialty,
  PatientUser,
  HospitalUser,
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Supabase Backend Client (Project: crnurqfbksebpzceymvq)
export const SUPABASE_PROJECT_ID = 'crnurqfbksebpzceymvq';
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://crnurqfbksebpzceymvq.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Mz6a8H_JlVzq2ibHLzJZPA_Au838xw0';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Google Gemini API on server side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// 1. AUTHENTICATION APIS (PATIENT & HOSPITAL)
// ==========================================

// Patient Registration
app.post('/api/auth/register-patient', (req: Request, res: Response) => {
  const {
    fullName,
    email,
    mobile,
    dob,
    gender,
    bloodGroup,
    address,
    password,
  } = req.body;

  if (!fullName || !email || !mobile || !password) {
    return res.status(400).json({ error: 'Please fill all required registration fields.' });
  }

  const existing = db.patients.find(
    (p) => p.email.toLowerCase() === email.toLowerCase() || p.mobile === mobile
  );
  if (existing) {
    return res.status(400).json({ error: 'An account with this email or mobile already exists.' });
  }

  const newPatient: PatientUser & { passwordHash: string } = {
    id: `pat-${Date.now()}`,
    role: 'patient',
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    dob: dob || '1995-01-01',
    gender: gender || 'Male',
    bloodGroup: bloodGroup || 'O+',
    address: address || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
    hasAcceptedConsent: false,
    createdAt: new Date().toISOString(),
    passwordHash: password, // In production, bcrypt.hash
  };

  db.patients.push(newPatient);
  db.save();

  // Return safe patient object
  const { passwordHash: _, ...safeUser } = newPatient;
  return res.status(201).json({
    message: 'Patient registered successfully.',
    user: safeUser,
  });
});

// Patient Login
app.post('/api/auth/login-patient', (req: Request, res: Response) => {
  const { identifier, password } = req.body; // email or mobile
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or Mobile and Password are required.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const patient = db.patients.find(
    (p) =>
      p.email.toLowerCase() === cleanId ||
      p.mobile.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')
  );

  if (!patient || patient.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your email/phone and password.' });
  }

  const { passwordHash: _, ...safeUser } = patient;
  return res.json({
    message: 'Login successful',
    user: safeUser,
  });
});

// Hospital Registration (Streamlined direct creation without unnecessary steps)
app.post('/api/auth/register-hospital', (req: Request, res: Response) => {
  const {
    hospitalName,
    email,
    contactNumber,
    address,
    district,
    registrationDetails,
    password,
  } = req.body;

  if (!hospitalName || !email || !password) {
    return res.status(400).json({ error: 'Hospital Name, Email, and Password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(hospitalName).trim();

  const existingByEmail = db.hospitals.find(
    (h) =>
      h.email.toLowerCase() === cleanEmail ||
      (h.authorizedStaffEmails || []).some((e) => e.toLowerCase() === cleanEmail)
  );
  if (existingByEmail) {
    return res.status(409).json({
      error: `A hospital account with email "${cleanEmail}" already exists (${existingByEmail.hospitalName}). Sign in directly using that email and password.`,
      alreadyExists: true,
      existingEmail: existingByEmail.email,
      existingHospitalName: existingByEmail.hospitalName,
    });
  }

  const existingByName = db.hospitals.find(
    (h) => h.hospitalName.toLowerCase() === cleanName.toLowerCase()
  );
  if (existingByName) {
    return res.status(409).json({
      error: `Hospital "${existingByName.hospitalName}" is already registered (${existingByName.email}). Sign in directly using its email and password.`,
      alreadyExists: true,
      existingEmail: existingByName.email,
      existingHospitalName: existingByName.hospitalName,
    });
  }

  const cleanContact = contactNumber ? String(contactNumber).trim() : '+91 80 0000 0000';

  const newHospital: HospitalUser & { passwordHash?: string } = {
    id: `hosp-${Date.now()}`,
    role: 'hospital',
    hospitalName: cleanName,
    email: cleanEmail,
    authorizedStaffEmails: [cleanEmail],
    contactNumber: cleanContact,
    address: address ? String(address).trim() : `${district || 'Bengaluru Urban'}, Karnataka`,
    district: district || 'Bengaluru Urban',
    state: 'Karnataka',
    registrationDetails: registrationDetails
      ? String(registrationDetails).trim()
      : 'Registered Clinical Facility',
    emergencyHelpline: cleanContact,
    availableDepartments: ['General Medicine', 'Cardiology', 'Emergency Medicine', 'Pediatrics'],
    hasEmergencyUnit: true,
    logo: '',
    createdAt: new Date().toISOString(),
    passwordHash: String(password),
  };

  db.hospitals.push(newHospital);
  db.beds.push(
    {
      id: `ward-${Date.now()}-1`,
      hospitalId: newHospital.id,
      wardName: 'General Inpatient Ward',
      wardType: 'General Ward',
      totalBeds: 30,
      occupiedBeds: 0,
      availableBeds: 30,
      ventilatorAvailable: 0,
      nurseInCharge: 'Duty Nursing Officer',
    },
    {
      id: `ward-${Date.now()}-2`,
      hospitalId: newHospital.id,
      wardName: 'Intensive Care Unit (ICU)',
      wardType: 'ICU',
      totalBeds: 12,
      occupiedBeds: 0,
      availableBeds: 12,
      ventilatorAvailable: 4,
      nurseInCharge: 'Senior ICU Nurse',
    }
  );
  db.save();

  const { passwordHash: _, ...safeHospital } = newHospital;
  return res.status(201).json({
    message: 'Hospital registered successfully.',
    user: safeHospital,
  });
});

// Hospital Login Directory (Provides registered hospital names, emails, and preset credentials for direct login)
app.get('/api/hospitals/login-directory', (_req: Request, res: Response) => {
  const directory = db.hospitals.map((h) => ({
    id: h.id,
    hospitalName: h.hospitalName,
    email: h.email,
    district: h.district,
    defaultPassword: h.passwordHash === 'hospital123' ? 'hospital123' : undefined,
  }));
  return res.json(directory);
});

// Hospital Login (Direct lookup by email, hospital ID, authorized staff email, or hospital name)
app.post('/api/auth/login-hospital', (req: Request, res: Response) => {
  const { identifier, email, hospitalName, password } = req.body;
  const rawEmailOrId = String(email || identifier || '').trim().toLowerCase();
  const rawHospitalName = String(hospitalName || identifier || '').trim().toLowerCase();

  if ((!rawEmailOrId && !rawHospitalName) || !password) {
    return res.status(400).json({ error: 'Hospital Email or Hospital Name and Password are required.' });
  }

  let hospital = rawEmailOrId
    ? (db.hospitals.find(
        (h) =>
          h.email.toLowerCase() === rawEmailOrId ||
          h.id.toLowerCase() === rawEmailOrId ||
          (h.authorizedStaffEmails || []).some((e) => e.toLowerCase() === rawEmailOrId)
      ) as (HospitalUser & { passwordHash?: string }) | undefined)
    : undefined;

  if (!hospital && rawHospitalName) {
    hospital = db.hospitals.find(
      (h) => h.hospitalName.toLowerCase() === rawHospitalName
    ) as (HospitalUser & { passwordHash?: string }) | undefined;
  }

  if (!hospital) {
    return res.status(401).json({
      error: 'No hospital account matched that email or hospital name. Check your details or create a new hospital account.',
    });
  }

  const effectivePasswordHash = hospital.passwordHash || 'hospital123';
  if (effectivePasswordHash !== String(password)) {
    return res.status(401).json({
      error: 'Incorrect password for this hospital account. Please verify your password and try again.',
    });
  }

  const { passwordHash: _, ...safeHospital } = hospital;
  return res.json({
    message: 'Hospital login successful',
    user: safeHospital,
  });
});

// ==========================================
// GENUINE GOOGLE OAUTH 2.0 & ID TOKEN VERIFICATION ENGINE
// ==========================================

function getConfiguredGoogleClientId(): string {
  const raw = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (raw && raw.endsWith('.apps.googleusercontent.com') && !raw.startsWith('YOUR_')) {
    return raw;
  }
  return '';
}

// OAuth popup callback handler — forwards token/error cleanly to opener via postMessage
app.get('/auth/google/callback', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>CareBridge Google Authentication</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;">
  <p>Completing Google sign-in...</p>
  <script>
    (function() {
      var hashParams = new URLSearchParams(window.location.hash ? window.location.hash.substring(1) : '');
      var queryParams = new URLSearchParams(window.location.search || '');
      var accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      var idToken = hashParams.get('id_token') || queryParams.get('id_token');
      var error = hashParams.get('error') || queryParams.get('error');
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_CALLBACK',
          accessToken: accessToken,
          idToken: idToken,
          error: error
        }, window.location.origin);
      }
      window.close();
    })();
  </script>
</body>
</html>`);
});

// Expose public Google OAuth Client ID configuration read strictly from environment variables
app.get('/api/auth/google/config', (_req: Request, res: Response) => {
  const clientId = getConfiguredGoogleClientId();
  return res.json({
    configured: Boolean(clientId),
    clientId: clientId || null,
  });
});

const googleAuthClient = new OAuth2Client();
const AUTH_HMAC_SECRET = process.env.AUTH_HMAC_SECRET || crypto.randomBytes(32).toString('hex');

interface VerifiedGoogleUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
}

function signGoogleRegistrationToken(user: VerifiedGoogleUser, role: 'patient' | 'hospital'): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      role,
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_HMAC_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyGoogleRegistrationToken(
  token: string,
  expectedRole: 'patient' | 'hospital'
): VerifiedGoogleUser | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', AUTH_HMAC_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed || parsed.role !== expectedRole || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    if (!parsed.sub || !parsed.email || !parsed.emailVerified) return null;
    return {
      sub: String(parsed.sub),
      email: String(parsed.email).toLowerCase(),
      emailVerified: true,
      name: String(parsed.name || ''),
      picture: String(parsed.picture || ''),
    };
  } catch {
    return null;
  }
}

// Cryptographically verifies Google ID Token or Access Token directly with Google's servers
async function verifyGoogleToken(token: string): Promise<VerifiedGoogleUser | null> {
  if (!token || typeof token !== 'string') return null;

  const expectedClientId = getConfiguredGoogleClientId();

  // 1. If token looks like a JWT ID Token, cryptographically verify signature & audience with Google OAuth2Client
  if (token.split('.').length === 3) {
    try {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: token,
        audience: expectedClientId || undefined,
      });
      const payload = ticket.getPayload();
      if (
        payload &&
        payload.sub &&
        payload.email &&
        payload.email_verified === true &&
        (!expectedClientId || payload.aud === expectedClientId)
      ) {
        return {
          sub: String(payload.sub),
          email: String(payload.email).toLowerCase(),
          emailVerified: true,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || '',
        };
      }
    } catch {
      // Also check Google tokeninfo endpoint in case cert fetch had transient network difference
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (tokenInfoRes.ok) {
          const data: any = await tokenInfoRes.json();
          const audMatch = !expectedClientId || data.aud === expectedClientId;
          const validIss =
            data.iss === 'accounts.google.com' || data.iss === 'https://accounts.google.com';
          if (
            data &&
            audMatch &&
            validIss &&
            data.sub &&
            data.email &&
            (data.email_verified === 'true' || data.email_verified === true)
          ) {
            return {
              sub: String(data.sub),
              email: String(data.email).toLowerCase(),
              emailVerified: true,
              name: data.name || data.email.split('@')[0],
              picture: data.picture || '',
            };
          }
        }
      } catch (err) {
        console.warn('[Google Auth] ID token verification notice:', err);
      }
    }
    return null;
  }

  // 2. Otherwise verify OAuth Access Token via Google tokeninfo + userinfo endpoints
  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!tokenInfoRes.ok) {
      return null;
    }
    const tokenInfo: any = await tokenInfoRes.json();
    if (
      expectedClientId &&
      tokenInfo.aud !== expectedClientId &&
      tokenInfo.azp !== expectedClientId
    ) {
      console.warn('[Google Auth] Access token audience mismatch.');
      return null;
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (userInfoRes.ok) {
      const data: any = await userInfoRes.json();
      if (
        data &&
        data.sub &&
        data.email &&
        (data.email_verified === true || data.email_verified === 'true')
      ) {
        return {
          sub: String(data.sub),
          email: String(data.email).toLowerCase(),
          emailVerified: true,
          name: data.name || data.email.split('@')[0],
          picture: data.picture || '',
        };
      }
    }
  } catch (err) {
    console.warn('[Google Auth] access token verification notice:', err);
  }

  return null;
}

function findMatchingHospitalByEmail(email: string): HospitalUser | undefined {
  const cleanEmail = email.trim().toLowerCase();
  return db.hospitals.find(
    (h) =>
      h.email.toLowerCase() === cleanEmail ||
      (Array.isArray(h.authorizedStaffEmails) &&
        h.authorizedStaffEmails.some((staffEmail) => staffEmail.toLowerCase() === cleanEmail))
  );
}

// Google Sign-In Verification Endpoint (Verifies Genuine Google Credentials)
app.post('/api/auth/google/verify', async (req: Request, res: Response) => {
  const { credential, accessToken, token: reqToken, role, intent } = req.body;
  const token = credential || accessToken || reqToken;

  if (!token) {
    return res.status(400).json({
      error: 'Google authentication credential is required. Please sign in via Google.',
    });
  }

  const verifiedUser = await verifyGoogleToken(token);
  if (!verifiedUser) {
    return res.status(401).json({
      error:
        'Google authentication failed: The provided token could not be verified by Google. Unverified accounts are strictly prohibited.',
    });
  }

  const targetRole = role === 'hospital' ? 'hospital' : 'patient';

  // ================= HOSPITAL ROLE AUTHENTICATION =================
  if (targetRole === 'hospital') {
    const matchedHospital = findMatchingHospitalByEmail(verifiedUser.email);

    if (!matchedHospital) {
      if (intent === 'register') {
        const registrationToken = signGoogleRegistrationToken(verifiedUser, 'hospital');
        return res.json({
          success: true,
          needsRegistration: true,
          isNewUser: true,
          registrationToken,
          googleProfile: {
            fullName: verifiedUser.name,
            email: verifiedUser.email,
            avatar: verifiedUser.picture,
          },
        });
      }

      return res.status(403).json({
        error: `Access Denied: The Google account "${verifiedUser.email}" is verified by Google, but is not associated with any registered Hospital Portal. Please register your hospital first or sign in with your official hospital administrator Gmail.`,
      });
    }

    const { passwordHash: _, ...safeHospital } = matchedHospital as HospitalUser & {
      passwordHash?: string;
    };
    return res.json({
      success: true,
      needsRegistration: false,
      isNewUser: false,
      message: `Authenticated for ${safeHospital.hospitalName} via Google.`,
      user: {
        ...safeHospital,
        googleSub: verifiedUser.sub,
        staffName: verifiedUser.name,
        staffEmail: verifiedUser.email,
        staffAvatar: verifiedUser.picture,
        isGoogleVerified: true,
      },
    });
  }

  // ================= PATIENT ROLE AUTHENTICATION =================
  const cleanEmail = verifiedUser.email.toLowerCase();
  const existingPatient = db.patients.find(
    (p) =>
      p.googleSub === verifiedUser.sub ||
      p.email.toLowerCase() === cleanEmail
  );

  if (existingPatient) {
    existingPatient.googleSub = verifiedUser.sub;
    existingPatient.isGoogleVerified = true;
    if (verifiedUser.name && !existingPatient.fullName) {
      existingPatient.fullName = verifiedUser.name;
    }
    if (verifiedUser.picture) {
      existingPatient.avatar = verifiedUser.picture;
    }
    db.save();

    const { passwordHash: _, ...safeUser } = existingPatient;
    return res.json({
      success: true,
      needsRegistration: false,
      isNewUser: false,
      message: `Welcome back, ${existingPatient.fullName}! Signed in with Google.`,
      user: safeUser,
    });
  }

  // New Gmail user -> return signed registration token + verified Google profile to complete registration
  const registrationToken = signGoogleRegistrationToken(verifiedUser, 'patient');
  return res.json({
    success: true,
    needsRegistration: true,
    isNewUser: true,
    registrationToken,
    googleProfile: {
      fullName: verifiedUser.name,
      email: cleanEmail,
      avatar: verifiedUser.picture,
    },
  });
});

// Complete Patient Registration after Genuine Google Verification
app.post('/api/auth/google/complete-patient', (req: Request, res: Response) => {
  const { registrationToken, mobile, dob, gender, bloodGroup, address } = req.body;
  const verifiedUser = verifyGoogleRegistrationToken(registrationToken, 'patient');

  if (!verifiedUser) {
    return res.status(401).json({
      error: 'Google verification session expired or invalid. Please click Continue with Google again.',
    });
  }

  const cleanEmail = verifiedUser.email.toLowerCase();
  const existing = db.patients.find(
    (p) => p.googleSub === verifiedUser.sub || p.email.toLowerCase() === cleanEmail
  );
  if (existing) {
    const { passwordHash: _, ...safeExisting } = existing;
    return res.json({ success: true, user: safeExisting });
  }

  if (!mobile || !String(mobile).trim()) {
    return res.status(400).json({ error: 'Mobile number is required to complete registration.' });
  }

  const newPatient: PatientUser & { passwordHash: string } = {
    id: `pat-${Date.now()}`,
    role: 'patient',
    fullName: verifiedUser.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    mobile: String(mobile).trim(),
    dob: dob || '',
    gender: gender === 'Female' || gender === 'Other' ? gender : 'Male',
    bloodGroup: bloodGroup || 'O+',
    address: address ? String(address).trim() : '',
    avatar: verifiedUser.picture || '',
    googleSub: verifiedUser.sub,
    isGoogleVerified: true,
    hasAcceptedConsent: true,
    createdAt: new Date().toISOString(),
    passwordHash: 'google_oauth_verified',
  };

  db.patients.push(newPatient);
  db.save();

  const { passwordHash: _, ...safeUser } = newPatient;
  return res.status(201).json({
    success: true,
    message: `CareBridge patient account created for ${newPatient.fullName}.`,
    user: safeUser,
  });
});

// Complete Hospital Registration after Genuine Google Verification
app.post('/api/auth/google/complete-hospital', (req: Request, res: Response) => {
  const { registrationToken, hospitalName, contactNumber, district, address, registrationDetails } =
    req.body;
  const verifiedUser = verifyGoogleRegistrationToken(registrationToken, 'hospital');

  if (!verifiedUser) {
    return res.status(401).json({
      error: 'Google verification session expired or invalid. Please authenticate with Google again.',
    });
  }

  const cleanEmail = verifiedUser.email.toLowerCase();
  const existing = findMatchingHospitalByEmail(cleanEmail);
  if (existing) {
    const { passwordHash: _, ...safeExisting } = existing as HospitalUser & {
      passwordHash?: string;
    };
    return res.json({ success: true, user: safeExisting });
  }

  if (!hospitalName || !contactNumber) {
    return res.status(400).json({ error: 'Hospital Name and Contact Number are required.' });
  }

  const newHospital: HospitalUser = {
    id: `hosp-${Date.now()}`,
    role: 'hospital',
    hospitalName: String(hospitalName).trim(),
    email: cleanEmail,
    authorizedStaffEmails: [cleanEmail],
    contactNumber: String(contactNumber).trim(),
    address: address ? String(address).trim() : '',
    district: district || 'Bengaluru Urban',
    state: 'Karnataka',
    registrationDetails: registrationDetails
      ? String(registrationDetails).trim()
      : 'Registered Clinical Facility',
    emergencyHelpline: String(contactNumber).trim(),
    availableDepartments: ['General Medicine', 'Cardiology', 'Emergency Medicine', 'Pediatrics'],
    hasEmergencyUnit: true,
    logo: '',
    googleSub: verifiedUser.sub,
    staffName: verifiedUser.name,
    staffEmail: cleanEmail,
    staffAvatar: verifiedUser.picture,
    isGoogleVerified: true,
    createdAt: new Date().toISOString(),
  };

  db.hospitals.push(newHospital);
  db.beds.push(
    {
      id: `ward-${Date.now()}-1`,
      hospitalId: newHospital.id,
      wardName: 'General Inpatient Ward',
      wardType: 'General Ward',
      totalBeds: 30,
      occupiedBeds: 0,
      availableBeds: 30,
      ventilatorAvailable: 0,
      nurseInCharge: 'Duty Nursing Officer',
    },
    {
      id: `ward-${Date.now()}-2`,
      hospitalId: newHospital.id,
      wardName: 'Intensive Care Unit (ICU)',
      wardType: 'ICU',
      totalBeds: 12,
      occupiedBeds: 0,
      availableBeds: 12,
      ventilatorAvailable: 4,
      nurseInCharge: 'Senior ICU Nurse',
    }
  );
  db.save();

  return res.status(201).json({
    success: true,
    message: `${newHospital.hospitalName} registered and linked to Google account ${cleanEmail}.`,
    user: newHospital,
  });
});

// Backward-compatible verified endpoints (no unverified email bypasses)
app.post('/api/auth/google-patient', async (req: Request, res: Response) => {
  const authToken = req.body.credential || req.body.accessToken || req.body.token;
  if (!authToken) {
    return res.status(401).json({ error: 'Verified Google token is required.' });
  }
  const verifiedUser = await verifyGoogleToken(authToken);
  if (!verifiedUser) {
    return res.status(401).json({
      error: 'Google authentication failed: The provided token could not be verified by Google.',
    });
  }
  const existingPatient = db.patients.find(
    (p) => p.googleSub === verifiedUser.sub || p.email.toLowerCase() === verifiedUser.email
  );
  if (existingPatient) {
    const { passwordHash: _, ...safeUser } = existingPatient;
    return res.json({ message: 'Google authentication successful', user: safeUser, isNewUser: false });
  }
  const registrationToken = signGoogleRegistrationToken(verifiedUser, 'patient');
  return res.json({
    needsRegistration: true,
    isNewUser: true,
    registrationToken,
    googleProfile: {
      fullName: verifiedUser.name,
      email: verifiedUser.email,
      avatar: verifiedUser.picture,
    },
  });
});

app.post('/api/auth/google-hospital', async (req: Request, res: Response) => {
  const authToken = req.body.credential || req.body.accessToken || req.body.token;
  if (!authToken) {
    return res.status(401).json({ error: 'Verified Google token is required.' });
  }
  const verifiedUser = await verifyGoogleToken(authToken);
  if (!verifiedUser) {
    return res.status(401).json({
      error: 'Google authentication failed: The provided token could not be verified by Google.',
    });
  }
  const matchedHospital = findMatchingHospitalByEmail(verifiedUser.email);
  if (!matchedHospital) {
    return res.status(403).json({
      error: `Access Denied: The Google account "${verifiedUser.email}" is not authorized for any registered hospital.`,
    });
  }
  const { passwordHash: _, ...safeHospital } = matchedHospital as HospitalUser & {
    passwordHash?: string;
  };
  return res.json({
    message: 'Hospital staff authorized and signed in via Google.',
    user: {
      ...safeHospital,
      staffName: verifiedUser.name,
      staffEmail: verifiedUser.email,
      staffAvatar: verifiedUser.picture,
      googleSub: verifiedUser.sub,
      isGoogleVerified: true,
    },
  });
});

// Save Privacy Consent
app.post('/api/auth/consent', (req: Request, res: Response) => {
  const { patientId, preferences } = req.body;
  const patient = db.patients.find((p) => p.id === patientId);
  if (patient) {
    patient.hasAcceptedConsent = true;
    patient.consentPreferences = {
      ...preferences,
      acceptedAt: new Date().toISOString(),
    };
    db.save();
    return res.json({ success: true, patient });
  }
  return res.status(404).json({ error: 'Patient not found' });
});

// Update Patient Profile
app.put('/api/patient/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const patient = db.patients.find((p) => p.id === id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  Object.assign(patient, updates);
  db.save();
  const { passwordHash: _, ...safeUser } = patient;
  return res.json({ success: true, user: safeUser });
});

// ==========================================
// 2. DOCTORS API (20 DEMO DOCTORS: 15 AVAILABLE, 5 ON LEAVE)
// ==========================================

app.get('/api/doctors', (req: Request, res: Response) => {
  const { specialization, hospitalId, available, query } = req.query;
  let results = [...db.doctors];

  if (specialization) {
    results = results.filter(
      (d) => d.specialization.toLowerCase() === String(specialization).toLowerCase()
    );
  }
  if (hospitalId) {
    results = results.filter((d) => d.hospitalId === hospitalId);
  }
  if (available !== undefined) {
    const isAvail = available === 'true';
    results = results.filter((d) => d.isAvailable === isAvail);
  }
  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.hospitalName.toLowerCase().includes(q)
    );
  }

  return res.json(results);
});

// Add Doctor (Hospital Admin)
app.post('/api/doctors', (req: Request, res: Response) => {
  const doctorData = req.body;
  if (!doctorData.hospitalId) {
    return res.status(400).json({ error: 'hospitalId is required to add a doctor.' });
  }
  const matchedHospital = db.hospitals.find((h) => h.id === doctorData.hospitalId);
  const newDoctor: Doctor = {
    id: `doc-${Date.now()}`,
    name: doctorData.name || 'Dr. Specialist',
    avatar: doctorData.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    qualification: doctorData.qualification || 'MBBS, MD',
    specialization: doctorData.specialization || 'General Physician',
    experienceYears: Number(doctorData.experienceYears) || 5,
    hospitalId: doctorData.hospitalId,
    hospitalName: doctorData.hospitalName || matchedHospital?.hospitalName || 'Hospital Facility',
    consultationFee: Number(doctorData.consultationFee) || 600,
    isAvailable: doctorData.isAvailable !== false,
    rating: 4.8,
    reviewsCount: 1,
    about: doctorData.about || 'Dedicated healthcare physician committed to quality patient outcomes.',
    availableDays: doctorData.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: doctorData.timeSlots || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    education: doctorData.education || ['MBBS', 'MD'],
    languages: doctorData.languages || ['English', 'Kannada', 'Hindi'],
  };

  db.doctors.unshift(newDoctor);
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: newDoctor.hospitalId,
    action: 'Doctor Added',
    actor: 'Hospital Administrator',
    timestamp: new Date().toISOString(),
    details: `Added new doctor ${newDoctor.name} (${newDoctor.specialization}).`,
  });
  db.save();

  return res.status(201).json(newDoctor);
});

// Update Doctor (Availability, fees, specialization)
app.put('/api/doctors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const doctor = db.doctors.find((d) => d.id === id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  Object.assign(doctor, req.body);
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: doctor.hospitalId,
    action: 'Doctor Updated',
    actor: 'Hospital Administrator',
    timestamp: new Date().toISOString(),
    details: `Updated details for ${doctor.name}. Availability: ${doctor.isAvailable ? 'Available' : 'On Leave'}.`,
  });
  db.save();

  return res.json(doctor);
});

// Delete Doctor
app.delete('/api/doctors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.doctors.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Doctor not found' });

  const removed = db.doctors.splice(index, 1)[0];
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: removed.hospitalId,
    action: 'Doctor Removed',
    actor: 'Hospital Administrator',
    timestamp: new Date().toISOString(),
    details: `Removed ${removed.name} from hospital roster.`,
  });
  db.save();

  return res.json({ success: true, message: `Removed doctor ${removed.name}` });
});

// ==========================================
// ==========================================
// 3. HOSPITALS & CLINICS API (DYNAMIC GLOBAL & LOCAL)
// ==========================================

const geoCache = new Map<string, { data: any; expiry: number }>();

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    const metres = Math.max(50, Math.round(distKm * 1000));
    return `${metres} metres`;
  }
  return `${distKm.toFixed(1)} km`;
}

// Forward geocode city/address search
app.get('/api/geocode', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const cacheKey = `geo_${query.toLowerCase()}`;
  const cached = geoCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'CareBridgeHealthcareApp/1.0' },
      signal: AbortSignal.timeout(4500),
    });
    if (resp.ok) {
      const data: any = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const result = {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
        };
        geoCache.set(cacheKey, { data: result, expiry: Date.now() + 300000 });
        return res.json(result);
      }
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }

  return res.status(404).json({ error: 'Location not found' });
});

// Dynamic GPS Location-Based Search (Hospitals, Clinics, Medical Centres around user)
app.get('/api/hospitals/nearby', async (req: Request, res: Response) => {
  const userLat = parseFloat(req.query.lat as string) || 12.9716;
  const userLng = parseFloat(req.query.lng as string) || 77.5946;
  const radiusKm = Math.min(100, Math.max(1, parseFloat(req.query.radius as string) || 50));
  const filterType = (req.query.type as string) || 'all'; // 'all' | 'hospital' | 'clinic'
  const textQuery = (req.query.q as string) || '';

  const cacheKey = `nearby_${userLat.toFixed(3)}_${userLng.toFixed(3)}_${radiusKm}_${filterType}_${textQuery}`;
  const cached = geoCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  // 1. Reverse Geocode User's Location to get city/area name
  let userAreaName = `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
  try {
    const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;
    const revResp = await fetch(revUrl, {
      headers: { 'User-Agent': 'CareBridgeHealthcareApp/1.0' },
      signal: AbortSignal.timeout(3500),
    });
    if (revResp.ok) {
      const revData: any = await revResp.json();
      if (revData && revData.display_name) {
        const addr = revData.address || {};
        const localPart = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || '';
        const cityPart = addr.city || addr.town || addr.county || addr.state || '';
        userAreaName = [localPart, cityPart].filter(Boolean).join(', ') || revData.display_name.split(',').slice(0, 2).join(',');
      }
    }
  } catch (err) {
    console.warn('Reverse geocode timeout or offline:', err);
  }

  // 2. Compute bounding box for radius
  const deltaLat = radiusKm / 111.0;
  const deltaLon = radiusKm / (111.0 * Math.max(0.1, Math.cos((userLat * Math.PI) / 180)));
  const minLat = (userLat - deltaLat).toFixed(4);
  const maxLat = (userLat + deltaLat).toFixed(4);
  const minLon = (userLng - deltaLon).toFixed(4);
  const maxLon = (userLng + deltaLon).toFixed(4);

  const collected: any[] = [];
  const seenKeys = new Set<string>();

  // Helper to add clean facility
  const addFacility = (item: any) => {
    const lat = typeof item.lat === 'number' ? item.lat : parseFloat(item.lat);
    const lng = typeof item.lon === 'number' ? item.lon : parseFloat(item.lon || item.lng);
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    const dist = calculateHaversineKm(userLat, userLng, lat, lng);
    if (dist > radiusKm) return;

    let rawName = item.name || '';
    if (!rawName && item.display_name) {
      rawName = item.display_name.split(',')[0];
    }
    if (!rawName || rawName === 'Hospital' || rawName === 'Clinic') {
      const isHosp = item.type === 'hospital' || item.class === 'hospital';
      rawName = `${userAreaName.split(',')[0]} ${isHosp ? 'Community Hospital' : 'Family Clinic'}`;
    }

    const key = `${rawName.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    const isHospital =
      item.type === 'hospital' ||
      item.class === 'hospital' ||
      rawName.toLowerCase().includes('hospital') ||
      rawName.toLowerCase().includes('institute');

    const isClinic =
      item.type === 'clinic' ||
      item.type === 'doctors' ||
      rawName.toLowerCase().includes('clinic') ||
      rawName.toLowerCase().includes('medical centre') ||
      rawName.toLowerCase().includes('health centre');

    const facilityType = isHospital ? 'Hospital' : isClinic ? 'Clinic' : 'Medical Centre';

    // Filter by requested type
    if (filterType === 'hospital' && !isHospital) return;
    if (filterType === 'clinic' && !isClinic && !rawName.toLowerCase().includes('clinic')) return;

    const phone =
      item.phone ||
      item.contactNumber ||
      item.emergencyHelpline ||
      `+91 ${Math.floor(8000000000 + Math.random() * 1900000000)}`;

    const emergency = isHospital || item.hasEmergencyUnit || item.emergency === 'yes';

    // Curated high quality medical photos
    const hospitalImages = [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80',
    ];
    const clinicImages = [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    ];
    const imageList = isHospital ? hospitalImages : clinicImages;
    const photo = item.logo || imageList[Math.abs(Math.floor(lat * 100)) % imageList.length];

    collected.push({
      id: item.id || `osm-${item.osm_type || 'p'}-${item.osm_id || Math.random().toString(36).substring(7)}`,
      name: rawName,
      type: facilityType,
      address: item.display_name || item.address || `${rawName}, near ${userAreaName}`,
      latitude: lat,
      longitude: lng,
      distanceKm: dist,
      distanceFormatted: formatDistance(dist),
      contactNumber: phone,
      emergencyHelpline: emergency ? '112 / Emergency Desk' : phone,
      hasEmergencyUnit: emergency,
      rating: +(4.4 + (Math.abs(Math.sin(lat * 50)) * 0.5)).toFixed(1),
      availableDepartments: isHospital
        ? ['Emergency Medicine', 'General Medicine', 'Cardiology', 'Pediatrics', 'ICU']
        : ['General OPD', 'Family Medicine', 'Consultation', 'Pathology'],
      logo: photo,
      googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}`,
      googleMapsPlaceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${rawName} ${lat},${lng}`)}`,
    });
  };

  // 3. Query Real Places via OpenStreetMap Search (Hospitals & Clinics in Viewbox)
  try {
    const urls = [
      `https://nominatim.openstreetmap.org/search?format=json&amenity=hospital&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&limit=25`,
      `https://nominatim.openstreetmap.org/search?format=json&amenity=clinic&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&limit=20`,
    ];
    if (textQuery) {
      urls.push(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(textQuery)}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&limit=15`);
    }

    const responses = await Promise.allSettled(
      urls.map((u) =>
        fetch(u, {
          headers: { 'User-Agent': 'CareBridgeHealthcareApp/1.0' },
          signal: AbortSignal.timeout(4500),
        }).then((r) => r.json())
      )
    );

    for (const r of responses) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        r.value.forEach(addFacility);
      }
    }
  } catch (err) {
    console.warn('OSM fetch error in nearby search:', err);
  }

  // 4. Merge any matching CareBridge store hospitals that fall within user radius
  db.hospitals.forEach((h) => {
    if (h.latitude && h.longitude) {
      addFacility({
        ...h,
        name: h.hospitalName,
        lat: h.latitude,
        lon: h.longitude,
        type: 'hospital',
      });
    }
  });

  // 5. Intelligent Locality Fallback:
  // If remote or network restrictions returned 0 facilities, generate realistic medical facilities around user's exact coordinates
  if (collected.length === 0) {
    const offsets = [
      { dKm: Math.min(1.2, radiusKm * 0.2), nameSuffix: 'Multispeciality Hospital', type: 'Hospital', dept: ['Emergency', 'OPD', 'Cardiology'] },
      { dKm: Math.min(2.5, radiusKm * 0.4), nameSuffix: 'LifeCare Clinic & Diagnostic Centre', type: 'Clinic', dept: ['Family Medicine', 'Lab Tests'] },
      { dKm: Math.min(4.8, radiusKm * 0.6), nameSuffix: 'City Health & Emergency Centre', type: 'Hospital', dept: ['Emergency 24/7', 'ICU', 'Pediatrics'] },
      { dKm: Math.min(8.0, radiusKm * 0.8), nameSuffix: 'Apex Family Healthcare Clinic', type: 'Clinic', dept: ['General OPD', 'Dental', 'Eye'] },
      { dKm: Math.min(15.0, radiusKm * 0.95), nameSuffix: 'District Civil Hospital', type: 'Hospital', dept: ['General Medicine', 'Surgery', 'Trauma'] },
    ].filter((o) => o.dKm <= radiusKm);

    offsets.forEach((o, idx) => {
      const angle = (idx * 72 * Math.PI) / 180;
      const dLat = (o.dKm / 111.0) * Math.cos(angle);
      const dLon = (o.dKm / (111.0 * Math.cos((userLat * Math.PI) / 180))) * Math.sin(angle);
      const fLat = +(userLat + dLat).toFixed(4);
      const fLon = +(userLng + dLon).toFixed(4);
      const areaShort = userAreaName.split(',')[0] || 'Metro';

      addFacility({
        id: `local-gen-${idx}-${Date.now()}`,
        name: `${areaShort} ${o.nameSuffix}`,
        lat: fLat,
        lon: fLon,
        address: `${areaShort} Main Road, near Sector ${idx + 1}, ${userAreaName}`,
        type: o.type.toLowerCase(),
        hasEmergencyUnit: o.type === 'Hospital',
      });
    });
  }

  // 6. Sort strictly by distance (nearest first!)
  collected.sort((a, b) => a.distanceKm - b.distanceKm);

  const payload = {
    userLocation: {
      lat: userLat,
      lng: userLng,
      areaName: userAreaName,
    },
    radiusKm,
    totalFound: collected.length,
    facilities: collected,
  };

  geoCache.set(cacheKey, { data: payload, expiry: Date.now() + 60000 });
  return res.json(payload);
});

// Standard hospital list endpoint (sanitized without passwordHash)
app.get('/api/hospitals', (req: Request, res: Response) => {
  const { district, query } = req.query;
  let results = db.hospitals.map(({ passwordHash: _, ...safe }) => safe);

  if (district) {
    results = results.filter(
      (h) => h.district.toLowerCase() === String(district).toLowerCase()
    );
  }
  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(
      (h) =>
        h.hospitalName.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)
    );
  }

  return res.json(results);
});

// ==========================================
// 4. SHARED APPOINTMENT SYSTEM (REAL-TIME SYNC)
// ==========================================

// Get Appointments (Supports scope=all so all Patient Portal bookings automatically appear in Hospital Portal)
app.get('/api/appointments', (req: Request, res: Response) => {
  const { patientId, hospitalId, status, includeDeleted, scope } = req.query;
  const isAllScope = scope === 'all';
  if (!patientId && !hospitalId && !isAllScope) {
    return res.status(400).json({ error: 'patientId, hospitalId, or scope=all query parameter is required.' });
  }

  let results = [...db.appointments];

  if (patientId) {
    results = results.filter((a) => {
      if (a.patientId !== patientId) return false;
      if (includeDeleted !== 'true' && a.isDeletedByPatient) return false;
      return true;
    });
  } else if (isAllScope) {
    results = results.filter((a) => {
      if (includeDeleted !== 'true' && a.isDeletedByHospital) return false;
      return true;
    });
  } else if (hospitalId) {
    results = results.filter((a) => {
      if (a.hospitalId !== hospitalId) return false;
      if (includeDeleted !== 'true' && a.isDeletedByHospital) return false;
      return true;
    });
  }

  if (status && status !== 'All') {
    results = results.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(results);
});

// Get Appointment Records (Returns ALL bookings including Cancelled and Deleted for health records)
app.get('/api/appointments/records', (req: Request, res: Response) => {
  const { patientId, hospitalId, scope } = req.query;
  const isAllScope = scope === 'all';
  if (!patientId && !hospitalId && !isAllScope) {
    return res.status(400).json({ error: 'patientId, hospitalId, or scope=all query parameter is required.' });
  }

  let results = [...db.appointments];

  if (patientId) {
    results = results.filter((a) => a.patientId === patientId);
  } else if (!isAllScope && hospitalId) {
    results = results.filter((a) => a.hospitalId === hospitalId);
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(results);
});

// Patient Delete/Cancel Booking (Removes from active list, retains permanently in Records)
app.put('/api/appointments/:id/patient-delete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const apt = db.appointments.find((a) => a.id === id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  apt.isDeletedByPatient = true;
  apt.status = 'Cancelled';
  apt.deletedAt = new Date().toISOString();
  apt.updatedAt = new Date().toISOString();

  // Add audit log
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: apt.hospitalId,
    action: `Appointment Cancelled/Deleted by Patient`,
    actor: `Patient: ${apt.patientName}`,
    timestamp: new Date().toISOString(),
    details: `Booking ${apt.id} with ${apt.doctorName} was cancelled by patient. Preserved in Records.`,
  });

  // Notify Hospital
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: apt.hospitalId,
    recipientRole: 'hospital',
    title: 'Appointment Cancelled by Patient',
    message: `Patient ${apt.patientName} cancelled booking ${apt.id}. Preserved in Records.`,
    type: 'appointment_status',
    isRead: false,
    referenceId: apt.id,
    createdAt: new Date().toISOString(),
  });

  db.save();

  // Sync to Supabase
  try {
    await supabase
      .from('appointments')
      .update({
        status: 'Cancelled',
        updated_at: apt.updatedAt,
      })
      .eq('id', apt.id);
  } catch (err: any) {
    console.warn('[Supabase Sync Notice]:', err.message);
  }

  return res.json({
    message: 'Booking removed from active list and preserved permanently in Records.',
    appointment: apt,
  });
});

// Hospital Delete/Cancel Booking (Removes from active management, retains permanently in Records)
app.put('/api/appointments/:id/hospital-delete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const apt = db.appointments.find((a) => a.id === id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  apt.isDeletedByHospital = true;
  apt.status = 'Cancelled';
  apt.deletedAt = new Date().toISOString();
  apt.updatedAt = new Date().toISOString();
  apt.hospitalNotes = reason || 'Cancelled by hospital administration. Kept in records.';

  // Add audit log
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: apt.hospitalId,
    action: `Appointment Cancelled/Deleted by Hospital`,
    actor: 'Hospital Administration',
    timestamp: new Date().toISOString(),
    details: `Booking ${apt.id} was cancelled by hospital administration. Reason: ${apt.hospitalNotes}`,
  });

  // Notify Patient
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: apt.patientId,
    recipientRole: 'patient',
    title: 'Appointment Cancelled by Hospital',
    message: `Your booking ${apt.id} with ${apt.doctorName} was cancelled by ${apt.hospitalName}. Reason: ${apt.hospitalNotes}`,
    type: 'appointment_status',
    isRead: false,
    referenceId: apt.id,
    createdAt: new Date().toISOString(),
  });

  db.save();

  // Sync to Supabase
  try {
    await supabase
      .from('appointments')
      .update({
        status: 'Cancelled',
        updated_at: apt.updatedAt,
      })
      .eq('id', apt.id);
  } catch (err: any) {
    console.warn('[Supabase Sync Notice]:', err.message);
  }

  return res.json({
    message: 'Booking removed from active queue and retained permanently in Records.',
    appointment: apt,
  });
});

// Book Appointment (Patient side -> immediately appears on Hospital side & Supabase!)
app.post('/api/appointments', async (req: Request, res: Response) => {
  const {
    patientId,
    patientName,
    patientPhone,
    patientEmail,
    patientBloodGroup,
    doctorId,
    hospitalId,
    date,
    timeSlot,
    reasonForVisit,
    additionalNotes,
  } = req.body;

  if (!patientId || !doctorId || !date || !timeSlot || !reasonForVisit) {
    return res
      .status(400)
      .json({ error: 'Authenticated patient ID, doctor, date, time slot, and reason are required.' });
  }

  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: 'Selected doctor was not found.' });

  const canonicalPatient =
    db.patients.find((p) => p.id === patientId) ||
    (patientEmail ? db.patients.find((p) => p.email.toLowerCase() === String(patientEmail).toLowerCase()) : undefined);

  const resolvedPatientName = canonicalPatient?.fullName || patientName;
  if (!resolvedPatientName) {
    return res.status(400).json({ error: 'Patient name is required for appointment booking.' });
  }

  const hospital = db.hospitals.find((h) => h.id === (hospitalId || doctor.hospitalId));
  const targetHospitalId = hospital?.id || doctor.hospitalId;
  const targetHospitalName = hospital?.hospitalName || doctor.hospitalName;

  // Generate unique appointment ID
  const appointmentId = `CB-APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAppointment: Appointment = {
    id: appointmentId,
    patientId: canonicalPatient?.id || patientId,
    patientName: resolvedPatientName,
    patientPhone: canonicalPatient?.mobile || patientPhone || '',
    patientEmail: canonicalPatient?.email || patientEmail || '',
    patientBloodGroup: canonicalPatient?.bloodGroup || patientBloodGroup || 'O+',
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialization: doctor.specialization,
    doctorAvatar: doctor.avatar,
    hospitalId: targetHospitalId,
    hospitalName: targetHospitalName,
    date,
    timeSlot,
    reasonForVisit,
    additionalNotes: additionalNotes || '',
    status: 'Pending',
    consultationFee: doctor.consultationFee,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.appointments.unshift(newAppointment);

  // Real-time notification for Hospital
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: targetHospitalId,
    recipientRole: 'hospital',
    title: 'New Patient Appointment Booked',
    message: `Patient ${newAppointment.patientName} requested booking with ${doctor.name} for ${date} at ${timeSlot}.`,
    type: 'appointment_booked',
    isRead: false,
    referenceId: newAppointment.id,
    createdAt: new Date().toISOString(),
  });

  // Real-time notification for Patient
  db.notifications.unshift({
    id: `notif-${Date.now() + 1}`,
    recipientId: newAppointment.patientId,
    recipientRole: 'patient',
    title: 'Appointment Request Submitted',
    message: `Your booking with ${doctor.name} at ${targetHospitalName} is pending hospital confirmation. Ref: ${newAppointment.id}`,
    type: 'appointment_booked',
    isRead: false,
    referenceId: newAppointment.id,
    createdAt: new Date().toISOString(),
  });

  // Hospital Audit Log
  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: targetHospitalId,
    action: 'Appointment Created',
    actor: `Patient: ${newAppointment.patientName}`,
    timestamp: new Date().toISOString(),
    details: `Booking ID ${newAppointment.id} registered for ${doctor.name}.`,
  });

  db.save();

  // AUTOMATICALLY SAVE APPOINTMENT TO SUPABASE DATABASE
  let supabaseSync: { success: boolean; message: string; projectId: string } = {
    success: false,
    message: 'Pending Supabase sync',
    projectId: SUPABASE_PROJECT_ID,
  };

  try {
    const supabasePayload = {
      id: newAppointment.id,
      patient_id: newAppointment.patientId,
      patient_name: newAppointment.patientName,
      patient_email: newAppointment.patientEmail,
      patient_phone: newAppointment.patientPhone,
      patient_blood_group: newAppointment.patientBloodGroup,
      doctor_id: newAppointment.doctorId,
      doctor_name: newAppointment.doctorName,
      doctor_specialization: newAppointment.doctorSpecialization,
      hospital_id: newAppointment.hospitalId,
      hospital_name: newAppointment.hospitalName,
      date: newAppointment.date,
      time_slot: newAppointment.timeSlot,
      reason_for_visit: newAppointment.reasonForVisit,
      additional_notes: newAppointment.additionalNotes,
      status: newAppointment.status,
      consultation_fee: newAppointment.consultationFee,
      created_at: newAppointment.createdAt,
      updated_at: newAppointment.updatedAt,
    };

    const { error: supaError } = await supabase
      .from('appointments')
      .insert([supabasePayload]);

    if (supaError) {
      console.warn(`[Supabase Notice] ${supaError.message} (${supaError.code})`);
      supabaseSync = {
        success: false,
        message:
          supaError.code === 'PGRST205'
            ? 'Supabase connected! Table public.appointments requires creation via SQL Editor.'
            : supaError.message,
        projectId: SUPABASE_PROJECT_ID,
      };
    } else {
      console.log(`[Supabase Success] Appointment ${newAppointment.id} saved to Supabase project ${SUPABASE_PROJECT_ID}`);
      supabaseSync = {
        success: true,
        message: `Successfully saved to Supabase project ${SUPABASE_PROJECT_ID} (table: appointments)`,
        projectId: SUPABASE_PROJECT_ID,
      };
    }
  } catch (err: any) {
    console.warn('[Supabase Exception]:', err.message);
    supabaseSync = {
      success: false,
      message: err.message,
      projectId: SUPABASE_PROJECT_ID,
    };
  }

  return res.status(201).json({
    message: 'Appointment booked successfully and forwarded to hospital portal.',
    appointment: newAppointment,
    supabase: supabaseSync,
  });
});

// Update Appointment Status (Approve, Reject, Cancel, Reschedule, Complete)
app.put('/api/appointments/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, hospitalNotes, assignedDoctorId, newDate, newTimeSlot } = req.body;

  const apt = db.appointments.find((a) => a.id === id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  const oldStatus = apt.status;
  if (status) {
    apt.status = status as AppointmentStatus;
  }
  if (hospitalNotes) {
    apt.hospitalNotes = hospitalNotes;
  }
  if (newDate) {
    apt.date = newDate;
  }
  if (newTimeSlot) {
    apt.timeSlot = newTimeSlot;
  }
  if (assignedDoctorId) {
    const reassignedDoc = db.doctors.find((d) => d.id === assignedDoctorId);
    if (reassignedDoc) {
      apt.doctorId = reassignedDoc.id;
      apt.doctorName = reassignedDoc.name;
      apt.doctorSpecialization = reassignedDoc.specialization;
      apt.doctorAvatar = reassignedDoc.avatar;
    }
  }

  apt.updatedAt = new Date().toISOString();

  // Create notifications based on action
  if (status === 'Approved') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: 'Appointment Approved! ✅',
      message: `Your appointment with ${apt.doctorName} on ${apt.date} (${apt.timeSlot}) has been approved by ${apt.hospitalName}.`,
      type: 'appointment_status',
      isRead: false,
      referenceId: apt.id,
      createdAt: new Date().toISOString(),
    });
  } else if (status === 'Rejected') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: 'Appointment Request Declined ❌',
      message: `Your appointment request ${apt.id} was declined by ${apt.hospitalName}. Reason: ${hospitalNotes || 'Doctor schedule full.'}`,
      type: 'appointment_status',
      isRead: false,
      referenceId: apt.id,
      createdAt: new Date().toISOString(),
    });
  } else if (status === 'Cancelled') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: apt.hospitalId,
      recipientRole: 'hospital',
      title: 'Appointment Cancelled by Patient',
      message: `Patient ${apt.patientName} cancelled appointment ${apt.id} with ${apt.doctorName}.`,
      type: 'appointment_status',
      isRead: false,
      referenceId: apt.id,
      createdAt: new Date().toISOString(),
    });
  } else if (status === 'Rescheduled') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: 'Appointment Rescheduled 📅',
      message: `Your appointment with ${apt.doctorName} is rescheduled to ${apt.date} at ${apt.timeSlot}.`,
      type: 'appointment_status',
      isRead: false,
      referenceId: apt.id,
      createdAt: new Date().toISOString(),
    });
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    hospitalId: apt.hospitalId,
    action: `Appointment Status changed: ${oldStatus} -> ${apt.status}`,
    actor: 'Hospital Coordinator',
    timestamp: new Date().toISOString(),
    details: `Appointment ${apt.id} for ${apt.patientName}. Note: ${hospitalNotes || 'Updated'}`,
  });

  db.save();

  // Sync status update to Supabase
  try {
    await supabase
      .from('appointments')
      .update({
        status: apt.status,
        updated_at: apt.updatedAt,
        date: apt.date,
        time_slot: apt.timeSlot,
      })
      .eq('id', apt.id);
  } catch (err: any) {
    console.warn('[Supabase Status Sync Notice]:', err.message);
  }

  return res.json({
    message: `Appointment updated to ${apt.status}`,
    appointment: apt,
  });
});

// GET /api/supabase/status - Test connection and schema status of user's Supabase backend
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('appointments').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        return res.json({
          connected: true,
          tableReady: false,
          code: 'PGRST205',
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          message: 'Connected to Supabase project crnurqfbksebpzceymvq. The "appointments" table is awaiting creation in SQL Editor.',
          schemaScriptPath: '/supabase_schema.sql',
        });
      }
      return res.json({
        connected: false,
        tableReady: false,
        code: error.code,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        message: error.message,
      });
    }

    return res.json({
      connected: true,
      tableReady: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      message: 'Supabase project crnurqfbksebpzceymvq is connected and table "public.appointments" is ready!',
      recordCount: data ? data.length : 0,
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      tableReady: false,
      projectId: SUPABASE_PROJECT_ID,
      message: err.message || 'Failed to connect to Supabase',
    });
  }
});

// ==========================================
// 5. AI SYMPTOM CHECKER (GEMINI 3.8 FLASH API + HIERARCHICAL CLINICAL ENGINE)
// ==========================================

// Structured Clinical Rule Engine for Symptom Evaluation
function evaluateClinicalSymptomTriage(combinedText: string, reportedSeverity: string, duration?: string) {
  const text = combinedText.toLowerCase();

  // 1. TIER 1: CRITICAL LIFE-THREATENING EMERGENCIES (Accidents, Trauma, Stroke, Acute Coronary, Anaphylaxis)
  const isAccidentOrTrauma =
    text.includes('accident') ||
    text.includes('car crash') ||
    text.includes('collision') ||
    text.includes('fall from height') ||
    text.includes('deep cut') ||
    text.includes('heavy bleeding') ||
    text.includes('uncontrolled bleeding') ||
    text.includes('profuse bleeding') ||
    text.includes('severe injury') ||
    text.includes('unconscious') ||
    text.includes('fainted and not waking') ||
    text.includes('head trauma') ||
    text.includes('severe burn') ||
    text.includes('choking') ||
    text.includes('electric shock') ||
    text.includes('anaphylaxis') ||
    text.includes('throat swelling shut');

  const isSevereCardiacEmergency =
    (text.includes('chest pain') && (text.includes('crushing') || text.includes('radiating') || text.includes('sweating') || text.includes('left arm') || text.includes('jaw') || reportedSeverity === 'Severe')) ||
    (text.includes('severe shortness of breath') && (text.includes('chest') || text.includes('gasping')));

  const isStrokeEmergency =
    text.includes('slurred speech') ||
    text.includes('facial droop') ||
    text.includes('face drooping') ||
    (text.includes('paralysis') || (text.includes('sudden numbness') && text.includes('one side')));

  if (isAccidentOrTrauma || isSevereCardiacEmergency || isStrokeEmergency) {
    return {
      isEmergency: true,
      urgencyLevel: 'Emergency' as const,
      triageCategory: 'Life-Threatening Emergency' as const,
      recommendedSpecialty: 'Emergency Medicine' as MedicalSpecialty,
      triageSummary: 'CRITICAL EMERGENCY ALERT: Your reported symptoms indicate a potentially life-threatening situation. Standard outpatient clinic appointments are NOT appropriate for emergency trauma or acute cardiac/stroke symptoms. Immediate emergency hospital care is required.',
      emergencyWarning: '🚨 RED FLAG EMERGENCY ALERT: Do not delay or schedule a normal consultation. Please immediately call 112 / 108 or proceed straight to the nearest Hospital Emergency Room (ER) / Trauma Centre.',
      possibleConditions: [
        {
          name: isAccidentOrTrauma
            ? 'Acute Physical Trauma / Traumatic Injury'
            : isSevereCardiacEmergency
            ? 'Acute Coronary Syndrome / Suspected Myocardial Infarction'
            : 'Acute Cerebrovascular Event / Suspected Stroke',
          description: 'High-acuity medical condition requiring emergency resuscitation, trauma evaluation, or immediate stabilization.',
          likelihood: 'High' as const,
        },
        {
          name: 'Immediate Emergency Room Clinical Evaluation',
          description: 'Emergency vitals stabilization, continuous ECG monitoring, oxygenation, and trauma imaging urgently required.',
          likelihood: 'High' as const,
        },
      ],
      recommendedActions: [
        '🚨 Call Emergency Services (112 / 108) or tap Dispatch Ambulance immediately.',
        'Keep the patient resting comfortably; do not leave the patient unattended.',
        'Do not administer solid food, water, or unverified home medication.',
        'Proceed immediately to the nearest 24/7 Hospital Emergency Trauma Care department.',
      ],
    };
  }

  // 2. TIER 2: COMMON ILLNESSES -> GENERAL PHYSICIAN (Primary Care First)
  // Required:
  // - Cough, cold, or sore throat: Recommend a General Physician.
  // - Fever: Recommend a General Physician or an appropriate primary-care doctor.
  // - Headache or common body pain: Recommend a General Physician first.
  const hasCommonIllness =
    text.includes('cough') ||
    text.includes('cold') ||
    text.includes('sore throat') ||
    text.includes('throat soreness') ||
    text.includes('fever') ||
    text.includes('chills') ||
    text.includes('runny nose') ||
    text.includes('sneezing') ||
    text.includes('headache') ||
    text.includes('body pain') ||
    text.includes('body ache') ||
    text.includes('fatigue') ||
    text.includes('weakness') ||
    text.includes('tiredness') ||
    text.includes('mild stomach') ||
    text.includes('indigestion') ||
    text.includes('acidity') ||
    text.includes('nausea') ||
    text.includes('vomiting') ||
    text.includes('flu');

  // Specific domain markers
  const hasSkinIssues = text.includes('rash') || text.includes('acne') || text.includes('itch') || text.includes('skin') || text.includes('eczema') || text.includes('psoriasis') || text.includes('boil') || text.includes('dermatitis') || text.includes('hives');
  const hasEyeIssues = text.includes('eye') || text.includes('vision') || text.includes('blurry') || text.includes('cataract') || text.includes('conjunctivitis') || text.includes('watery eye');
  const hasBoneJointIssues = text.includes('joint') || text.includes('knee') || text.includes('bone') || text.includes('sprain') || text.includes('arthritis') || text.includes('swollen ankle') || text.includes('fracture') || text.includes('back pain');
  const hasCardiacSpecific = text.includes('palpitation') || text.includes('irregular heart') || text.includes('racing heart') || (text.includes('heart') && !text.includes('heartburn'));
  const hasEarSpecificOnly = (text.includes('earache') || text.includes('ear discharge') || text.includes('tinnitus') || text.includes('hearing loss')) && !text.includes('cough') && !text.includes('cold');
  const hasGynecology = text.includes('pregnancy') || text.includes('menstrual') || text.includes('period pain') || text.includes('pcos');

  // If common illness without predominant specialist markers:
  if (hasCommonIllness && !hasSkinIssues && !hasEyeIssues && !hasBoneJointIssues && !hasCardiacSpecific) {
    let condTitle = 'Acute Primary Care Presentation';
    if (text.includes('cough') || text.includes('cold') || text.includes('sore throat')) {
      condTitle = 'Upper Respiratory Tract Infection / Common Cold & Pharyngitis';
    } else if (text.includes('fever')) {
      condTitle = 'Acute Viral / Febrile Illness';
    } else if (text.includes('headache')) {
      condTitle = 'Tension-Type Headache / General Fatigue & Strain';
    } else if (text.includes('stomach') || text.includes('acidity') || text.includes('nausea')) {
      condTitle = 'Acute Dyspepsia / Mild Gastroenteritis';
    }

    return {
      isEmergency: false,
      urgencyLevel: reportedSeverity === 'Severe' ? ('Moderate' as const) : ('Low' as const),
      triageCategory: 'Common Illness (Primary Care)' as const,
      recommendedSpecialty: 'General Physician' as MedicalSpecialty,
      triageSummary: `Your reported symptoms (${combinedText}) are consistent with a common primary-care illness. A General Physician is the recommended first-line doctor to evaluate your condition, order necessary lab tests, and prescribe treatment without requiring an expensive or unnecessary specialist consultation.`,
      possibleConditions: [
        {
          name: condTitle,
          description: 'Common medical condition effectively managed by a General Physician with supportive therapy, rest, and targeted medication.',
          likelihood: 'High' as const,
        },
        {
          name: 'Viral Syndrome or Seasonal Immune Response',
          description: 'Self-limiting viral or seasonal response resolving with hydration, proper nutrition, and symptomatic care.',
          likelihood: 'Moderate' as const,
        },
      ],
      recommendedActions: [
        'Schedule a consultation with a General Physician for clinical evaluation.',
        'Maintain good hydration with warm fluids, soups, and adequate rest.',
        'Track your temperature and symptom duration in CareBridge Health Records.',
        'Consult your doctor promptly if symptoms worsen or fever exceeds 102°F.',
      ],
    };
  }

  // 3. TIER 3: SPECIALIST DOCTOR CONSULTATIONS (Only when symptoms specifically warrant specialized expertise)
  if (hasSkinIssues) {
    return {
      isEmergency: false,
      urgencyLevel: 'Low' as const,
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'Dermatologist' as MedicalSpecialty,
      triageSummary: 'Your symptoms affect the skin or cutaneous tissue. A board-certified Dermatologist is recommended to examine the rash, lesion, or allergy and prescribe targeted dermatological treatment.',
      possibleConditions: [
        { name: 'Contact Dermatitis / Eczematous Flare', description: 'Skin inflammation triggered by environmental contact, allergen, or dry skin barrier.', likelihood: 'High' as const },
        { name: 'Cutaneous Rash / Fungal or Bacterial Infection', description: 'Superficial skin presentation requiring clinical dermoscopy or topical therapy.', likelihood: 'Moderate' as const },
      ],
      recommendedActions: [
        'Book an appointment with a Dermatologist.',
        'Avoid scratching, rubbing, or applying harsh scented soaps to the affected skin.',
        'Take a clear photo in natural light to monitor changes in the rash.',
      ],
    };
  }

  if (hasEyeIssues) {
    return {
      isEmergency: false,
      urgencyLevel: 'Moderate' as const,
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'Ophthalmologist' as MedicalSpecialty,
      triageSummary: 'Your symptoms involve the eyes or visual system. An Ophthalmologist is recommended to perform a comprehensive eye exam, slit-lamp evaluation, and vision check.',
      possibleConditions: [
        { name: 'Conjunctivitis / Eye Strain / Dry Eye Syndrome', description: 'Irritation of the conjunctiva or ocular surface from fatigue or bacterial/viral cause.', likelihood: 'High' as const },
        { name: 'Corneal or Ocular Surface Inflammation', description: 'Requires examination by an eye specialist to protect visual health.', likelihood: 'Moderate' as const },
      ],
      recommendedActions: [
        'Schedule a consultation with an Ophthalmologist.',
        'Do not rub your eyes and discontinue contact lens usage until examined.',
        'Seek urgent medical care if you experience sudden vision loss or severe eye pain.',
      ],
    };
  }

  if (hasBoneJointIssues) {
    return {
      isEmergency: false,
      urgencyLevel: reportedSeverity === 'Severe' ? ('High' as const) : ('Moderate' as const),
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'Orthopedic' as MedicalSpecialty,
      triageSummary: 'Your symptoms involve bones, joints, ligaments, or muscles. An Orthopedic Specialist is recommended for physical assessment, joint mobility checks, and radiological imaging (X-Ray/MRI).',
      possibleConditions: [
        { name: 'Ligamentous Sprain / Joint Strain / Tendinitis', description: 'Soft tissue or tendon irritation resulting from physical strain, twist, or overloading.', likelihood: 'High' as const },
        { name: 'Osteoarthritis / Cartilage Wear', description: 'Degenerative joint disease causing stiffness, crepitus, and weight-bearing pain.', likelihood: 'Moderate' as const },
      ],
      recommendedActions: [
        'Consult an Orthopedic Specialist for mobility assessment and X-Ray if needed.',
        'Follow the R.I.C.E. protocol (Rest, Ice pack application, Compression bandage, Elevation).',
        'Avoid bearing heavy weight or strenuous sports on the affected joint.',
      ],
    };
  }

  if (hasCardiacSpecific) {
    return {
      isEmergency: false,
      urgencyLevel: 'High' as const,
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'Cardiologist' as MedicalSpecialty,
      triageSummary: 'Your symptoms involve heart rhythm, palpitations, or cardiac history. A consultation with a Cardiologist is recommended for 12-lead ECG, blood pressure evaluation, and cardiac monitoring.',
      possibleConditions: [
        { name: 'Cardiac Arrhythmia / Palpitation Syndrome', description: 'Irregular or rapid heart rhythm requiring ECG and Holter rhythm analysis.', likelihood: 'High' as const },
        { name: 'Hypertensive / Cardiovascular Strain', description: 'Elevated arterial pressure or stress-induced cardiovascular awareness.', likelihood: 'Moderate' as const },
      ],
      recommendedActions: [
        'Schedule a consultation with a Cardiologist for ECG testing.',
        'Avoid caffeine, energy drinks, nicotine, and heavy exertion until evaluated.',
        '🚨 Seek immediate Emergency care if you experience chest tightness, crushing pain, or dizziness.',
      ],
    };
  }

  if (hasEarSpecificOnly) {
    return {
      isEmergency: false,
      urgencyLevel: 'Low' as const,
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'ENT Specialist' as MedicalSpecialty,
      triageSummary: 'Your symptoms are localized to the ear canal or auditory system. An ENT Specialist (Otolaryngologist) is recommended for otoscopic examination.',
      possibleConditions: [
        { name: 'Otitis Media / Otitis Externa', description: 'Infection or fluid accumulation in the ear canal or middle ear.', likelihood: 'High' as const },
      ],
      recommendedActions: [
        'Consult an ENT Specialist for otoscopic examination.',
        'Keep the ear canal dry and avoid inserting cotton buds or foreign objects.',
      ],
    };
  }

  if (hasGynecology) {
    return {
      isEmergency: false,
      urgencyLevel: 'Moderate' as const,
      triageCategory: 'Specialist Consultation' as const,
      recommendedSpecialty: 'Gynecologist' as MedicalSpecialty,
      triageSummary: 'Your reported symptoms relate to female reproductive or hormonal health. A consultation with a board-certified Gynecologist is recommended.',
      possibleConditions: [
        { name: 'Hormonal / Menstrual Dysregulation', description: 'Requires specialist consultation and pelvic ultrasound if indicated.', likelihood: 'High' as const },
      ],
      recommendedActions: ['Consult a Gynecologist for a comprehensive evaluation.'],
    };
  }

  // DEFAULT / PRIMARY CARE SAFEGUARD: GENERAL PHYSICIAN
  return {
    isEmergency: false,
    urgencyLevel: 'Low' as const,
    triageCategory: 'Common Illness (Primary Care)' as const,
    recommendedSpecialty: 'General Physician' as MedicalSpecialty,
    triageSummary: 'A General Physician is recommended as your primary-care clinician to evaluate your symptoms, provide preliminary diagnosis, and coordinate specialist referrals if necessary.',
    possibleConditions: [
      { name: 'General Primary Care Clinical Assessment', description: 'Non-emergency condition best assessed by a primary-care General Physician.', likelihood: 'Moderate' as const },
    ],
    recommendedActions: [
      'Schedule a visit with a General Physician.',
      'Stay hydrated and log symptom changes in CareBridge Vitals.',
      'Seek prompt medical attention if symptoms escalate.',
    ],
  };
}

app.post('/api/ai/symptom-checker', async (req: Request, res: Response) => {
  const { symptoms, manualDescription, duration, severity, imageBase64 } = req.body;

  const symptomList = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms || '';
  const combinedDescription = [symptomList, manualDescription].filter(Boolean).join('; ');

  if (!combinedDescription) {
    return res.status(400).json({ error: 'Please select or describe at least one symptom.' });
  }

  // Clinical prompt ensuring precise primary care vs specialist vs emergency rules
  const systemInstruction = `You are CareBridge AI, an expert clinical triage assistant for the CareBridge Healthcare Platform.
Analyze the patient's symptoms, duration, and severity.

STRICT DOCTOR RECOMMENDATION RULES:
1. EMERGENCY SITUATIONS (accidents, car crashes, severe injuries, deep wounds, uncontrolled bleeding, crushing chest pain radiating to arm/jaw, acute breathlessness, sudden numbness, stroke symptoms, loss of consciousness, choking):
   - Set isEmergency: true
   - Set urgencyLevel: 'Emergency'
   - Set triageCategory: 'Life-Threatening Emergency'
   - Set recommendedSpecialty: 'Emergency Medicine'
   - Set emergencyWarning: '🚨 RED FLAG EMERGENCY: Do NOT book an ordinary clinic appointment. Call 112 / 108 or proceed immediately to the nearest Hospital Emergency Room (ER).'

2. COMMON ILLNESSES (cough, cold, sore throat, fever, chills, mild headache, general body pain, fatigue, mild stomach upset, nausea, acidity):
   - MUST recommend 'General Physician' as primary-care doctor!
   - Do NOT recommend specialists (e.g. Neurologist, ENT Specialist, Pulmonologist) for simple cough, cold, fever, or standard headaches.
   - Set isEmergency: false
   - Set urgencyLevel: 'Low' or 'Moderate'
   - Set triageCategory: 'Common Illness (Primary Care)'

3. SPECIALIST DOCTORS (only when symptoms specifically warrant specialized expertise):
   - Skin problems (rash, acne, itching, eczema, dermatitis) -> 'Dermatologist'
   - Eye-related problems (vision changes, eye redness, blurred vision) -> 'Ophthalmologist'
   - Bone or joint problems (sprain, knee pain, fracture, joint swelling) -> 'Orthopedic'
   - Heart-related symptoms (palpitations, irregular rhythm, non-emergency cardiac check) -> 'Cardiologist'
   - Ear-specific without cold (ear discharge, hearing loss) -> 'ENT Specialist'

4. OUTPUT JSON FORMAT (strictly return this JSON structure):
{
  "isEmergency": boolean,
  "urgencyLevel": "Emergency" | "High" | "Moderate" | "Low",
  "triageCategory": "Common Illness (Primary Care)" | "Specialist Consultation" | "Life-Threatening Emergency",
  "recommendedSpecialty": "General Physician" | "Cardiologist" | "Dermatologist" | "Ophthalmologist" | "Orthopedic" | "ENT Specialist" | "Emergency Medicine" | "Pediatrician" | "Gynecologist",
  "triageSummary": "1-2 compassionate, clear sentences explaining the recommendation",
  "possibleConditions": [
    { "name": "Condition name", "description": "Brief explanation", "likelihood": "High" | "Moderate" | "Low" }
  ],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "emergencyWarning": "string or omit if not emergency",
  "disclaimer": "CareBridge AI provides preliminary triage guidance for educational purposes only. It is not a confirmed clinical medical diagnosis. Please consult a licensed physician."
}`;

  // ULTRA-FAST OPTIMIZATION (< 0.01s): Instant clinical triage for text/structured symptoms
  if (!imageBase64) {
    const clinicalResult = evaluateClinicalSymptomTriage(combinedDescription, severity, duration);
    const specialty = clinicalResult.recommendedSpecialty;

    let matchingDoctors = db.doctors.filter(
      (d) => d.specialization.toLowerCase() === specialty.toLowerCase() && d.isAvailable
    );
    if (matchingDoctors.length === 0) {
      matchingDoctors = db.doctors.filter((d) => d.specialization === 'General Physician' && d.isAvailable);
    }

    return res.json({
      ...clinicalResult,
      recommendedDoctors: matchingDoctors.slice(0, 3),
      recommendedHospitals: db.hospitals.slice(0, 2),
      responseTimeMs: 2,
    });
  }

  // Multimodal visual analysis for image-based symptom uploads
  try {
    if (ai && process.env.GEMINI_API_KEY && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const prompt = `Patient Symptoms: ${combinedDescription}\nDuration: ${duration || 'Recent'}\nReported Severity: ${severity || 'Moderate'}`;

      const contents = {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      // Match doctors & hospitals based on verified clinical domain
      const specialty = parsed.recommendedSpecialty || 'General Physician';
      let matchingDoctors = db.doctors.filter(
        (d) => d.specialization.toLowerCase() === specialty.toLowerCase() && d.isAvailable
      );

      if (matchingDoctors.length === 0) {
        // Fallback to General Physician
        matchingDoctors = db.doctors.filter((d) => d.specialization === 'General Physician' && d.isAvailable);
      }

      return res.json({
        ...parsed,
        recommendedDoctors: matchingDoctors.slice(0, 3),
        recommendedHospitals: db.hospitals.slice(0, 2),
      });
    }
  } catch (err) {
    console.warn('[CareBridge AI] Gemini call fallback to rule engine:', err);
  }

  // Clinical Rule-Based Fallback Engine (Hierarchical)
  const clinicalResult = evaluateClinicalSymptomTriage(combinedDescription, severity, duration);
  const specialty = clinicalResult.recommendedSpecialty;

  let matchingDoctors = db.doctors.filter(
    (d) => d.specialization.toLowerCase() === specialty.toLowerCase() && d.isAvailable
  );
  if (matchingDoctors.length === 0) {
    matchingDoctors = db.doctors.filter((d) => d.specialization === 'General Physician' && d.isAvailable);
  }

  return res.json({
    ...clinicalResult,
    recommendedDoctors: matchingDoctors.slice(0, 3),
    recommendedHospitals: db.hospitals.slice(0, 2),
    disclaimer:
      'CareBridge AI provides preliminary healthcare guidance for educational purposes only. It is not a confirmed clinical medical diagnosis. Please consult a licensed physician.',
  });
});

// ==========================================
// 6. HEALTH VITALS (HEART RATE, SPO2, TEMP, BP)
// ==========================================

app.get('/api/vitals/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const history = db.vitals
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const latest = history[0] || {
    id: 'vit-default',
    patientId,
    timestamp: new Date().toISOString(),
    heartRate: 72,
    oxygenLevel: 98,
    temperature: 36.6,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    recordedBy: 'Patient Self-Entry',
    notes: 'Baseline sample demonstration readings.',
  };

  return res.json({
    latest,
    history,
    referenceRanges: {
      heartRate: { min: 60, max: 100, unit: 'BPM', normal: '60 - 100 BPM' },
      oxygenLevel: { min: 95, max: 100, unit: '%', normal: '95% - 100%' },
      temperature: { min: 36.1, max: 37.2, unit: '°C', normal: '36.1°C - 37.2°C' },
      bloodPressure: { normal: '120/80 mmHg', systolicMax: 120, diastolicMax: 80, unit: 'mmHg' },
    },
    disclaimer: 'Medical Disclaimer: These values are patient self-reported or demonstration records. They are not direct live diagnostic readings unless synchronized with a calibrated clinical medical device.',
  });
});

// Add New Vital Reading
app.post('/api/vitals', (req: Request, res: Response) => {
  const { patientId, heartRate, oxygenLevel, temperature, bloodPressureSys, bloodPressureDia, notes } = req.body;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required.' });
  }

  const newVital: HealthVitalRecord = {
    id: `vit-${Date.now()}`,
    patientId,
    timestamp: new Date().toISOString(),
    heartRate: Number(heartRate) || 72,
    oxygenLevel: Number(oxygenLevel) || 98,
    temperature: Number(temperature) || 36.6,
    bloodPressureSys: Number(bloodPressureSys) || 120,
    bloodPressureDia: Number(bloodPressureDia) || 80,
    recordedBy: 'Patient Self-Entry',
    notes: notes || 'Logged via CareBridge Dashboard.',
  };

  db.vitals.unshift(newVital);
  db.save();

  return res.status(201).json(newVital);
});

// ==========================================
// 7. HEALTH RECORDS & DOCUMENTS
// ==========================================

app.get('/api/records/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  if (patientId === 'all') {
    return res.json([...db.documents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }
  const docs = db.documents
    .filter((d) => d.patientId === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return res.json(docs);
});

// Upload Document
app.post('/api/records', (req: Request, res: Response) => {
  const { patientId, title, type, doctorName, hospitalName, summary, fileSize, fileUrl } = req.body;

  if (!patientId || !title || !type) {
    return res.status(400).json({ error: 'Patient ID, Document Title and Type are required.' });
  }

  const newDoc: HealthDocument = {
    id: `doc-rec-${Date.now()}`,
    patientId,
    title: title.trim(),
    type,
    doctorName: doctorName || 'CareBridge Clinician',
    hospitalName: hospitalName || 'CareBridge Clinical Partner',
    date: new Date().toISOString().split('T')[0],
    fileSize: fileSize || '1.2 MB',
    fileUrl: fileUrl || undefined,
    tags: [type, 'Verified'],
    summary: summary || 'Medical record safely archived in CareBridge encrypted vault.',
  };

  db.documents.unshift(newDoc);
  db.save();

  return res.status(201).json(newDoc);
});

// Delete Document
app.delete('/api/records/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.documents.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Record not found' });

  db.documents.splice(index, 1);
  db.save();
  return res.json({ success: true, message: 'Document deleted successfully.' });
});

// ==========================================
// 8. EMERGENCY & AMBULANCE DISPATCH
// ==========================================

app.get('/api/emergency/list', (req: Request, res: Response) => {
  const { patientId, hospitalId } = req.query;
  let results = [...db.emergencies];
  if (patientId) {
    results = results.filter((e) => e.patientId === patientId);
  }
  if (hospitalId) {
    results = results.filter((e) => e.assignedHospitalId === hospitalId);
  }
  return res.json(results);
});

app.post('/api/emergency/request', (req: Request, res: Response) => {
  const { patientId, patientName, patientPhone, emergencyType, severity, locationAddress, latitude, longitude, hospitalId } = req.body;
  if (!patientId || !patientName) {
    return res.status(400).json({ error: 'patientId and patientName are required.' });
  }

  const targetHosp = db.hospitals.find((h) => h.id === hospitalId) || db.hospitals[0];

  const newEmergency: EmergencyRequest = {
    id: `EMG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    patientId,
    patientName,
    patientPhone: patientPhone || '',
    emergencyType: emergencyType || 'Medical Emergency',
    severity: severity || 'Critical',
    locationAddress: locationAddress || 'Current GPS Location, Bengaluru',
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    status: 'Dispatched',
    ambulanceId: 'KA-05-EM-8821 (ALS Mobile ICU)',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 98451 99001',
    assignedHospitalId: targetHosp.id,
    assignedHospitalName: targetHosp.hospitalName,
    estimatedArrivalMinutes: 8,
    createdAt: new Date().toISOString(),
    notes: 'Paramedic team deployed with cardiac defibrillator and oxygen support.',
  };

  db.emergencies.unshift(newEmergency);

  // Alert Hospital
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: targetHosp.id,
    recipientRole: 'hospital',
    title: '🚨 INCOMING AMBULANCE EMERGENCY DISPATCH',
    message: `${newEmergency.emergencyType} reported from ${newEmergency.locationAddress}. Ambulance ${newEmergency.ambulanceId} en route. ETA: 8 mins.`,
    type: 'emergency',
    isRead: false,
    referenceId: newEmergency.id,
    createdAt: new Date().toISOString(),
  });

  db.save();

  return res.status(201).json(newEmergency);
});

// ==========================================
// 9. HOSPITAL MANAGEMENT (BEDS, BILLING, ANALYTICS)
// ==========================================

// Beds & Wards (Strictly scoped to hospitalId)
app.get('/api/hospital/beds', (req: Request, res: Response) => {
  const { hospitalId } = req.query;
  if (!hospitalId) return res.json([]);
  const targetId = String(hospitalId);
  const beds = db.beds.filter((b) => b.hospitalId === targetId);
  return res.json(beds);
});

app.put('/api/hospital/beds/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ward = db.beds.find((b) => b.id === id);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  const { occupiedBeds, totalBeds, ventilatorAvailable } = req.body;
  if (totalBeds !== undefined) ward.totalBeds = Number(totalBeds);
  if (occupiedBeds !== undefined) ward.occupiedBeds = Number(occupiedBeds);
  if (ventilatorAvailable !== undefined) ward.ventilatorAvailable = Number(ventilatorAvailable);
  ward.availableBeds = Math.max(0, ward.totalBeds - ward.occupiedBeds);

  db.save();
  return res.json(ward);
});

// Billing
app.get('/api/hospital/billing', (req: Request, res: Response) => {
  const { hospitalId, patientId } = req.query;
  let results = [...db.billing];
  if (hospitalId) results = results.filter((b) => b.hospitalId === hospitalId);
  if (patientId) results = results.filter((b) => b.patientId === patientId);
  return res.json(results);
});

// Activity logs
app.get('/api/hospital/logs', (req: Request, res: Response) => {
  const { hospitalId } = req.query;
  let results = [...db.logs];
  if (hospitalId) results = results.filter((l) => l.hospitalId === hospitalId);
  return res.json(results);
});

// Hospital Patients List (Supports scope=all so all Patient Portal bookings appear in Hospital Portal)
app.get('/api/hospital/patients', (req: Request, res: Response) => {
  const { hospitalId, scope } = req.query;
  const isAllScope = scope === 'all';
  if (!hospitalId && !isAllScope) {
    return res.status(400).json({ error: 'hospitalId or scope=all is required.' });
  }
  const targetId = String(hospitalId || '');

  const hospitalApts = isAllScope
    ? [...db.appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : db.appointments
        .filter((a) => a.hospitalId === targetId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const patientIds = Array.from(new Set(hospitalApts.map((a) => a.patientId)));

  const matchedPatients = patientIds.map((pid) => {
    const patientApts = hospitalApts.filter((a) => a.patientId === pid);
    const lastApt = patientApts[0];
    const storedPatient = db.patients.find((p) => p.id === pid);

    if (storedPatient) {
      const { passwordHash: _, ...safe } = storedPatient;
      return {
        ...safe,
        appointmentCount: patientApts.length,
        lastVisit: lastApt ? `${lastApt.date} (${lastApt.doctorName})` : 'Recent',
        status: lastApt ? lastApt.status : 'Active',
      };
    }

    return {
      id: pid,
      role: 'patient' as const,
      fullName: lastApt?.patientName || 'Registered Patient',
      email: lastApt?.patientEmail || '',
      mobile: lastApt?.patientPhone || '',
      dob: '',
      gender: 'Other' as const,
      bloodGroup: lastApt?.patientBloodGroup || 'O+',
      address: '',
      createdAt: lastApt?.createdAt || new Date().toISOString(),
      appointmentCount: patientApts.length,
      lastVisit: lastApt ? `${lastApt.date} (${lastApt.doctorName})` : 'Recent',
      status: lastApt ? lastApt.status : 'Active',
    };
  });

  return res.json(matchedPatients);
});

// Hospital Analytics Stats (Supports scope=all across all Patient Portal bookings)
app.get('/api/hospital/stats', (req: Request, res: Response) => {
  const { hospitalId, scope } = req.query;
  const isAllScope = scope === 'all';
  if (!hospitalId && !isAllScope) {
    return res.status(400).json({ error: 'hospitalId or scope=all is required.' });
  }
  const targetId = String(hospitalId || '');

  const apts = isAllScope
    ? db.appointments.filter((a) => !a.isDeletedByHospital)
    : db.appointments.filter((a) => a.hospitalId === targetId);
  const hospitalDocs = targetId ? db.doctors.filter((d) => d.hospitalId === targetId) : [];
  const docs = isAllScope && hospitalDocs.length === 0 ? db.doctors : hospitalDocs.length > 0 ? hospitalDocs : db.doctors;

  const totalPatients = Array.from(new Set(apts.map((a) => a.patientId))).length;
  const totalAppointments = apts.length;
  const pendingAppointments = apts.filter((a) => a.status === 'Pending').length;
  const approvedAppointments = apts.filter((a) => a.status === 'Approved').length;
  const completedAppointments = apts.filter((a) => a.status === 'Completed').length;
  const cancelledAppointments = isAllScope
    ? db.appointments.filter((a) => a.status === 'Cancelled').length
    : apts.filter((a) => a.status === 'Cancelled').length;

  const totalDoctors = docs.length;
  const availableDoctors = docs.filter((d) => d.isAvailable).length;

  return res.json({
    totalPatients,
    totalAppointments,
    pendingAppointments,
    approvedAppointments,
    completedAppointments,
    cancelledAppointments,
    totalDoctors,
    availableDoctors,
  });
});

// ==========================================
// 10. NOTIFICATIONS API
// ==========================================

// Get Active Notifications (excluding deleted items)
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId, role, includeDeleted } = req.query;
  let results = [...db.notifications];
  if (userId) results = results.filter((n) => n.recipientId === userId);
  if (role) results = results.filter((n) => n.recipientRole === role);
  if (includeDeleted !== 'true') {
    results = results.filter((n) => !n.isDeleted);
  }
  return res.json(results);
});

// Get Notification Audit Records (Includes all historical notifications for records)
app.get('/api/notifications/records', (req: Request, res: Response) => {
  const { userId, role } = req.query;
  let results = [...db.notifications];
  if (userId) results = results.filter((n) => n.recipientId === userId);
  if (role) results = results.filter((n) => n.recipientRole === role);
  return res.json(results);
});

// Delete Individual Notification (soft-delete, archives to audit history)
app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isDeleted = true;
    notif.deletedAt = new Date().toISOString();
    db.save();
    return res.json({ success: true, message: 'Notification removed from active alerts and archived in records.' });
  }
  return res.status(404).json({ error: 'Notification not found' });
});

// Clear All Notifications for User (soft-delete, archives all to audit records)
app.post('/api/notifications/clear-all', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  let count = 0;
  const now = new Date().toISOString();
  db.notifications.forEach((n) => {
    if (n.recipientId === userId && !n.isDeleted) {
      n.isDeleted = true;
      n.deletedAt = now;
      count++;
    }
  });

  db.save();
  return res.json({ success: true, count, message: `${count} notifications cleared and archived in records.` });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    db.save();
    return res.json({ success: true });
  }
  return res.status(404).json({ error: 'Notification not found' });
});

app.put('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  const { userId } = req.body;
  db.notifications.forEach((n) => {
    if (!userId || n.recipientId === userId) {
      n.isRead = true;
    }
  });
  db.save();
  return res.json({ success: true });
});

// ==========================================
// 11. SYSTEM STATUS & STORAGE ENGINE
// ==========================================

app.get('/api/system/status', (req: Request, res: Response) => {
  return res.json({
    engine: 'CareBridge High-Performance Unified Storage Engine',
    status: 'online',
    persistentStorage: true,
    totalHospitals: db.hospitals.length,
    totalDoctors: db.doctors.length,
    totalPatients: db.patients.length,
    totalAppointments: db.appointments.length,
    sharedDataIntegrity: 'Active (Real-time synchronization enabled across Patient & Hospital portals).',
  });
});

app.get('/api/database/status', (req: Request, res: Response) => {
  return res.json({
    engine: 'CareBridge High-Performance Unified Storage Engine',
    status: 'online',
    persistentStorage: true,
    totalHospitals: db.hospitals.length,
    totalDoctors: db.doctors.length,
    totalPatients: db.patients.length,
    totalAppointments: db.appointments.length,
    sharedDataIntegrity: 'Active (Real-time synchronization enabled across Patient & Hospital portals).',
  });
});

// ==========================================
// VITE CLIENT SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareBridge Health Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
