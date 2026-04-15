const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const publicSummaryRateLimit = new Map();

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_DAYS = 30;
const MIN_TTL_HOURS = 24;
const MAX_TTL_HOURS = 72;
const DEFAULT_TTL_HOURS = 48;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const normalizeRangeDate = (value, boundary) => {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return boundary === 'end' ? endOfDay(parsed) : startOfDay(parsed);
};

const getChecklistActivityDate = (item) => (
  parseDate(item.completedAt)
  || parseDate(item.updatedAt)
  || parseDate(item.createdAt)
  || parseDate(item.dueDate)
);

const getMediaActivityDate = (item) => (
  parseDate(item.createdAt)
  || parseDate(item.logDate)
);

const isWithinRange = (value, rangeStart, rangeEnd) => {
  if (!value) return false;
  if (rangeStart && value < rangeStart) return false;
  if (rangeEnd && value > rangeEnd) return false;
  return true;
};

const sortByDateAsc = (items, key) => [...items].sort((a, b) => {
  const left = parseDate(a[key]) || new Date(8640000000000000);
  const right = parseDate(b[key]) || new Date(8640000000000000);
  return left - right;
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const calculateComplianceScore = ({ checklistItems, overdueItems, expiringDocuments, expiredDocuments, recentMediaLogs }) => {
  const totalChecklistItems = checklistItems.length;
  const completedChecklistItems = checklistItems.filter((item) => item.completed).length;
  const checklistCompletion = totalChecklistItems > 0
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

  const overdueCount = overdueItems.length;
  const expiringCount = expiringDocuments.length;
  const expiredCount = expiredDocuments.length;
  const recentMediaLogsCount = recentMediaLogs.length;

  let score = checklistCompletion;
  score -= Math.min(45, overdueCount * 8);
  score -= Math.min(18, expiringCount * 4);
  score -= Math.min(22, expiredCount * 8);
  if (recentMediaLogsCount > 0) {
    score += Math.min(8, recentMediaLogsCount * 2);
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    checklistCompletion,
    factors: {
      totalChecklistItems,
      completedChecklistItems,
      overdueCount,
      expiringCount,
      expiredCount,
      recentMediaLogsCount,
    },
  };
};

const getAuthTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  if (req.body && typeof req.body.idToken === 'string') {
    return req.body.idToken.trim();
  }

  return null;
};

const toList = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

/** Admin .get() returns QuerySnapshot; use empty object for skipped branch. */
const emptySnap = () => ({ docs: [] });

/** Browser CORS for HTTPS report endpoints (RN fetch often has no Origin). */
const getAllowedReportOrigins = () => {
  const env = process.env.REPORT_LINKS_ALLOWED_ORIGINS;
  if (!env || !String(env).trim()) {
    return [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:19006',
      'https://foodtruckcompliance.app',
    ];
  }
  return String(env).split(',').map((s) => s.trim()).filter(Boolean);
};

const isReportCorsOriginAllowed = (origin) => {
  if (!origin) return false;
  return getAllowedReportOrigins().some((allowed) => {
    if (allowed === origin) return true;
    if (allowed.endsWith('*')) return origin.startsWith(allowed.slice(0, -1));
    return false;
  });
};

const finishOptionsPreflight = (req, res) => {
  if (req.method !== 'OPTIONS') {
    return false;
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Max-Age', '7200');
  const origin = req.headers.origin;
  if (origin && isReportCorsOriginAllowed(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.status(204).send('');
  return true;
};

/** Call on every POST response so browsers can read JSON error bodies. */
const attachReportCorsHeadersIfAllowed = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isReportCorsOriginAllowed(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
};

const fetchUserDefaultBusinessId = async (uid) => {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return data.defaultBusinessId || null;
};

/** Same merge as dashboard: business rows win id collisions when user row is tenant-scoped. */
const mergeBusinessAndUserCollections = (businessSnap, userSnap) => {
  const map = new Map();
  toList(businessSnap).forEach((item) => {
    map.set(item.id, item);
  });
  toList(userSnap).forEach((item) => {
    if (!item?.businessId || !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const mergeMediaLogsById = (businessSnap, userSnap) => {
  const map = new Map();
  toList(businessSnap).forEach((item) => map.set(item.id, item));
  toList(userSnap).forEach((item) => {
    if (!item?.businessId || !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const createReadinessHtml = (payload) => {
  const { readiness, counts, overdueItems, expiringDocuments, expiredDocuments, generatedAt, uid } = payload;
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Readiness Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
    h1 { margin-bottom: 4px; }
    .muted { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
    .score { font-size: 36px; font-weight: 700; color: #2563eb; }
    ul { margin-top: 6px; }
  </style>
</head>
<body>
  <h1>Inspection Readiness Report</h1>
  <div class="muted">Generated: ${generatedAt} | User: ${uid}</div>
  <div class="card">
    <div class="score">${readiness.score}%</div>
    <div>Checklist completion: ${readiness.checklistCompletion}%</div>
  </div>
  <div class="card">
    <strong>Counts</strong>
    <ul>
      <li>Overdue checklist items: ${counts.overdue}</li>
      <li>Expiring documents (30 days): ${counts.expiringDocuments}</li>
      <li>Expired documents: ${counts.expiredDocuments}</li>
      <li>Recent evidence: ${counts.recentMediaLogs}</li>
    </ul>
  </div>
  <div class="card">
    <strong>Top blockers</strong>
    <ul>
      ${overdueItems.slice(0, 5).map((item) => `<li>Checklist: ${item.name || 'Unnamed item'}</li>`).join('')}
      ${expiredDocuments.slice(0, 5).map((doc) => `<li>Expired doc: ${doc.documentType || 'Document'}</li>`).join('')}
      ${expiringDocuments.slice(0, 5).map((doc) => `<li>Expiring doc: ${doc.documentType || 'Document'}</li>`).join('')}
    </ul>
  </div>
</body>
</html>
`.trim();
};

const createReadinessPdfBuffer = (payload) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fontSize(20).text('Inspection Readiness Report');
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${payload.generatedAt}`);
  doc.text(`User: ${payload.uid}`);
  doc.fillColor('#111827');
  doc.moveDown(1);

  doc.fontSize(26).text(`${payload.readiness.score}%`);
  doc.fontSize(12).text(`Checklist completion: ${payload.readiness.checklistCompletion}%`);
  doc.moveDown(1);

  doc.fontSize(14).text('Summary');
  doc.fontSize(11)
    .text(`Overdue checklist items: ${payload.counts.overdue}`)
    .text(`Expiring documents (30 days): ${payload.counts.expiringDocuments}`)
    .text(`Expired documents: ${payload.counts.expiredDocuments}`)
    .text(`Recent evidence: ${payload.counts.recentMediaLogs}`);
  doc.moveDown(1);

  doc.fontSize(14).text('Top blockers');
  payload.overdueItems.slice(0, 5).forEach((item) => {
    doc.fontSize(11).text(`- Checklist: ${item.name || 'Unnamed item'}`);
  });
  payload.expiredDocuments.slice(0, 5).forEach((item) => {
    doc.fontSize(11).text(`- Expired doc: ${item.documentType || 'Document'}`);
  });
  payload.expiringDocuments.slice(0, 5).forEach((item) => {
    doc.fontSize(11).text(`- Expiring doc: ${item.documentType || 'Document'}`);
  });

  doc.end();
});

const getFunctionTargetUrl = (name) => `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/${name}`;

const normalizeSlug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

const getRequestIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
};

const checkPublicSummaryRateLimit = (req) => {
  const ip = getRequestIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;
  const state = publicSummaryRateLimit.get(ip) || { count: 0, windowStart: now };
  if (now - state.windowStart > windowMs) {
    publicSummaryRateLimit.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (state.count >= maxRequests) {
    return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - state.windowStart)) / 1000) };
  }
  publicSummaryRateLimit.set(ip, { ...state, count: state.count + 1 });
  return { allowed: true };
};

const sendExpoPushNotification = async ({ expoToken, title, body, data = {} }) => {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoToken,
      sound: 'default',
      title,
      body,
      data,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.data?.status === 'error') {
    throw new Error(payload?.data?.message || `expo-push-failed-${response.status}`);
  }
  return payload;
};

exports.generateSecureReadinessReport = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (finishOptionsPreflight(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    attachReportCorsHeadersIfAllowed(req, res);
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  attachReportCorsHeadersIfAllowed(req, res);

  try {
    const token = getAuthTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: 'missing-auth-token' });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token, true);
    const uid = decodedToken.uid;
    const {
      startDate: rawStartDate = null,
      endDate: rawEndDate = null,
      ttlHours: rawTtlHours = DEFAULT_TTL_HOURS,
      format = 'pdf',
      userId,
    } = req.body || {};

    if (userId && userId !== uid) {
      res.status(403).json({ error: 'cross-user-request-denied' });
      return;
    }

    const ttlHours = clamp(Number(rawTtlHours) || DEFAULT_TTL_HOURS, MIN_TTL_HOURS, MAX_TTL_HOURS);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    const rangeStart = normalizeRangeDate(rawStartDate, 'start');
    const rangeEnd = normalizeRangeDate(rawEndDate, 'end');

    const businessId = await fetchUserDefaultBusinessId(uid);

    const [docBiz, docUser, chkBiz, chkUser, mediaBiz, mediaUser] = await Promise.all([
      businessId
        ? db.collection('documents').where('businessId', '==', businessId).get()
        : Promise.resolve(emptySnap()),
      db.collection('documents').where('userId', '==', uid).get(),
      businessId
        ? db.collection('checklistItems').where('businessId', '==', businessId).get()
        : Promise.resolve(emptySnap()),
      db.collection('checklistItems').where('userId', '==', uid).get(),
      businessId
        ? db.collection('mediaLogs').where('businessId', '==', businessId).limit(120).get()
        : Promise.resolve(emptySnap()),
      db.collection('mediaLogs').where('userId', '==', uid).limit(120).get(),
    ]);

    const documents = mergeBusinessAndUserCollections(docBiz, docUser);
    const checklistItemsAll = mergeBusinessAndUserCollections(chkBiz, chkUser);
    const mediaLogsMerged = mergeMediaLogsById(mediaBiz, mediaUser);

    const checklistItems = checklistItemsAll.filter((item) => {
      if (!rangeStart && !rangeEnd) return true;
      return isWithinRange(getChecklistActivityDate(item), rangeStart, rangeEnd);
    });
    const mediaLogs = mediaLogsMerged.filter((item) => {
      if (!rangeStart && !rangeEnd) return true;
      return isWithinRange(getMediaActivityDate(item), rangeStart, rangeEnd);
    });

    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const expiringCutoff = new Date(todayEnd.getTime() + EXPIRING_WINDOW_DAYS * DAY_MS);

    const openChecklistItems = checklistItems.filter((item) => !item.completed);
    const overdueItems = sortByDateAsc(
      openChecklistItems.filter((item) => {
        const dueDate = parseDate(item.dueDate);
        return dueDate && dueDate < todayStart;
      }),
      'dueDate',
    );
    const expiredDocuments = sortByDateAsc(
      documents.filter((item) => {
        const expiryDate = parseDate(item.expiryDate);
        return expiryDate && expiryDate < todayStart;
      }),
      'expiryDate',
    );
    const expiringDocuments = sortByDateAsc(
      documents.filter((item) => {
        const expiryDate = parseDate(item.expiryDate);
        return expiryDate && expiryDate >= todayStart && expiryDate <= expiringCutoff;
      }),
      'expiryDate',
    );

    const recentMediaLogs = [...mediaLogs]
      .sort((a, b) => {
        const left = getMediaActivityDate(a) || new Date(0);
        const right = getMediaActivityDate(b) || new Date(0);
        return right - left;
      })
      .slice(0, 4);

    const readiness = calculateComplianceScore({
      checklistItems,
      overdueItems,
      expiringDocuments,
      expiredDocuments,
      recentMediaLogs,
    });

    const reportPayload = {
      uid,
      generatedAt: now.toISOString(),
      appliedRange: {
        startDate: rangeStart ? rangeStart.toISOString() : null,
        endDate: rangeEnd ? rangeEnd.toISOString() : null,
      },
      readiness,
      counts: {
        overdue: overdueItems.length,
        expiringDocuments: expiringDocuments.length,
        expiredDocuments: expiredDocuments.length,
        recentMediaLogs: recentMediaLogs.length,
      },
      overdueItems,
      expiringDocuments,
      expiredDocuments,
      recentMediaLogs,
    };

    const reportId = crypto.randomUUID();
    const isHtml = String(format).toLowerCase() === 'html';
    const extension = isHtml ? 'html' : 'pdf';
    const reportPath = `reports/${uid}/${reportId}.${extension}`;
    const file = bucket.file(reportPath);

    if (isHtml) {
      const html = createReadinessHtml(reportPayload);
      await file.save(Buffer.from(html, 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        metadata: {
          metadata: {
            expiresAt: expiresAt.toISOString(),
            uid,
            businessId: businessId || '',
            reportId,
            format: 'html',
          },
        },
      });
    } else {
      const pdfBuffer = await createReadinessPdfBuffer(reportPayload);
      await file.save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
          metadata: {
            expiresAt: expiresAt.toISOString(),
            uid,
            businessId: businessId || '',
            reportId,
            format: 'pdf',
          },
        },
      });
    }

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
    });

    await db.collection('reportLinks').doc(reportId).set({
      reportId,
      uid,
      ownerUid: uid,
      businessId: businessId || null,
      path: reportPath,
      format: extension,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      revokedAt: null,
    });

    res.status(200).json({
      reportId,
      format: extension,
      expiresAt: expiresAt.toISOString(),
      signedUrl,
      tokenId: reportId,
      path: reportPath,
      revokeUrl: getFunctionTargetUrl('revokeSecureReadinessReport'),
    });
  } catch (error) {
    console.error('generateSecureReadinessReport failed', error);
    res.status(500).json({
      error: 'internal',
      message: error.message || 'unexpected-error',
    });
  }
});

exports.getPublicTruckSummary = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  const rateLimit = checkPublicSummaryRateLimit(req);
  if (!rateLimit.allowed) {
    res.set('Retry-After', String(rateLimit.retryAfterSec || 60));
    res.status(429).json({ error: 'too-many-requests' });
    return;
  }

  const slug = normalizeSlug(req.query?.slug);
  if (!slug) {
    res.status(404).json({ error: 'not-found' });
    return;
  }

  try {
    const snapshot = await db
      .collection('businesses')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'not-found' });
      return;
    }

    const business = snapshot.docs[0].data() || {};
    if (business.publicProfileEnabled !== true) {
      res.status(404).json({ error: 'not-found' });
      return;
    }

    res.status(200).json({
      slug,
      businessName: business.name || null,
      truckType: business.truckType || null,
      businessType: business.businessType || null,
      foodTypes: Array.isArray(business.foodTypes) ? business.foodTypes : [],
      state: business.state || null,
      publicScore: business.publicScoreEnabled === true ? (business.latestScore ?? null) : null,
      updatedAt: business.updatedAt || null,
    });
  } catch (error) {
    console.error('getPublicTruckSummary failed', error);
    res.status(500).json({ error: 'internal' });
  }
});

exports.revokeSecureReadinessReport = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (finishOptionsPreflight(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    attachReportCorsHeadersIfAllowed(req, res);
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  attachReportCorsHeadersIfAllowed(req, res);

  try {
    const token = getAuthTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: 'missing-auth-token' });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token, true);
    const uid = decodedToken.uid;
    const reportId = req.body?.reportId;

    if (!reportId || typeof reportId !== 'string') {
      res.status(400).json({ error: 'invalid-report-id' });
      return;
    }

    const reportRef = db.collection('reportLinks').doc(reportId);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      res.status(404).json({ error: 'report-not-found' });
      return;
    }

    const reportData = reportSnap.data();
    if (reportData.uid !== uid) {
      res.status(403).json({ error: 'cross-user-request-denied' });
      return;
    }

    if (reportData.revokedAt) {
      res.status(200).json({ revoked: true, alreadyRevoked: true, reportId });
      return;
    }

    if (reportData.path) {
      await bucket.file(reportData.path).delete({ ignoreNotFound: true });
    }

    await reportRef.delete();

    res.status(200).json({ revoked: true, reportId });
  } catch (error) {
    console.error('revokeSecureReadinessReport failed', error);
    res.status(500).json({
      error: 'internal',
      message: error.message || 'unexpected-error',
    });
  }
});

exports.dailyReminderCheck = onSchedule(
  {
    schedule: 'every day 08:00',
    timeZone: 'America/New_York',
    region: 'us-central1',
  },
  async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const expiringCutoff = new Date(todayStart.getTime() + EXPIRING_WINDOW_DAYS * DAY_MS);

    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() || {};
      const expoToken = userData?.pushTokens?.expo || null;
      if (!expoToken) {
        continue;
      }

      const prefSnap = await db.collection('users').doc(userId).collection('preferences').doc('settings').get();
      const prefs = prefSnap.exists ? prefSnap.data() : {};
      const notificationPreferences = prefs?.notificationPreferences || {};
      const reminders = prefs?.reminders || {};
      const enabled = Boolean(notificationPreferences.enabled);
      const inAppOnly = Boolean(notificationPreferences.inAppRemindersOnly);
      if (!enabled || inAppOnly) {
        continue;
      }

      const [documentsSnap, checklistSnap] = await Promise.all([
        db.collection('documents').where('userId', '==', userId).get(),
        db.collection('checklistItems').where('userId', '==', userId).get(),
      ]);

      const documents = toList(documentsSnap);
      const checklistItems = toList(checklistSnap);

      const overdueCount = checklistItems.filter((item) => {
        const dueDate = parseDate(item?.dueDate);
        return !item?.completed && dueDate && dueDate < todayStart;
      }).length;

      const expiringCount = documents.filter((docItem) => {
        const expiry = parseDate(docItem?.expiryDate);
        return expiry && expiry >= todayStart && expiry <= expiringCutoff;
      }).length;

      const overdueEnabled = notificationPreferences.overdueNotifications !== false && reminders.overdueEnabled !== false;
      const expiringEnabled = notificationPreferences.expiringDocumentNotifications !== false && reminders.expiringDocumentsEnabled !== false;

      const notificationParts = [];
      if (overdueEnabled && overdueCount > 0) {
        notificationParts.push(`${overdueCount} overdue checklist item${overdueCount === 1 ? '' : 's'}`);
      }
      if (expiringEnabled && expiringCount > 0) {
        notificationParts.push(`${expiringCount} document${expiringCount === 1 ? '' : 's'} expiring soon`);
      }

      if (notificationParts.length === 0) {
        continue;
      }

      const body = notificationParts.join(' • ');
      try {
        await sendExpoPushNotification({
          expoToken,
          title: 'Compliance reminder',
          body,
          data: { type: 'daily-reminder' },
        });
      } catch (error) {
        console.error(`dailyReminderCheck send failed for user ${userId}`, error.message);
      }
    }
  },
);
