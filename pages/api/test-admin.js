// Test endpoint - Firebase Admin bağlantısını kontrol eder
import { getAuth, isFirebaseAdminAvailable } from '../../utils/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Firebase Admin durumu kontrol et
    const isAvailable = isFirebaseAdminAvailable();
    
    if (!isAvailable) {
      return res.status(500).json({
        error: 'Firebase Admin not initialized',
        envCheck: {
          NODE_ENV: process.env.NODE_ENV,
          hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
          privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0
        }
      });
    }

    // Auth service'i test et
    const auth = getAuth();
    
    // Dummy token test (bu başarısız olacak ama service çalışıyor demektir)
    try {
      await auth.verifyIdToken('dummy-token');
    } catch (authError) {
      // Expected error - bu normal
      if (authError.code === 'auth/argument-error') {
        return res.status(200).json({
          success: true,
          message: 'Firebase Admin successfully initialized',
          status: 'connected',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Firebase Admin initialized but auth test inconclusive',
      status: 'partial',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firebase Admin test error:', error);
    
    return res.status(500).json({
      error: 'Firebase Admin test failed',
      message: error.message,
      code: error.code,
      envCheck: {
        NODE_ENV: process.env.NODE_ENV,
        hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0
      }
    });
  }
}