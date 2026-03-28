import 'server-only';
import { getFirestore } from '@/utils/firebaseAdmin';
import { generateSlug } from './slug';

export async function getAllTests() {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection('personality_tests')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || generateSlug(data.title || ''),
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || null,
        questionCount: data.questionCount || data.questions?.length || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching personality tests:', error);
    return [];
  }
}

export async function getTestBySlug(slug) {
  const db = getFirestore();
  if (!db) return null;

  try {
    // Direct query by slug field
    const snapshot = await db.collection('personality_tests').where('slug', '==', slug).limit(1).get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, slug, ...doc.data() };
    }

    // Fallback: match by generated slug from title
    const allSnapshot = await db.collection('personality_tests').get();
    const doc = allSnapshot.docs.find(
      (d) => generateSlug(d.data().title || '') === slug
    );

    if (!doc) return null;

    return {
      id: doc.id,
      slug,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Error fetching personality test by slug:', error);
    return null;
  }
}

export async function getTestById(testId) {
  const db = getFirestore();
  if (!db) return null;

  try {
    const doc = await db.collection('personality_tests').doc(testId).get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Error fetching personality test:', error);
    return null;
  }
}
