import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const raffleUtils = {
  // Create a new raffle
  async createRaffle(raffleData) {
    try {
      const docRef = await addDoc(collection(db, "raffles"), {
        ...raffleData,
        isActive: true,
        isCompleted: false,
        participants: [],
        participantPosts: [],
        winner: null,
        winnerPost: null,
        completedAt: null,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Get all raffles
  async getRaffles(filters = {}) {
    try {
      let q = collection(db, "raffles");

      if (filters.eventId) {
        q = query(q, where("eventId", "==", filters.eventId));
      }
      if (filters.isActive !== undefined) {
        q = query(q, where("isActive", "==", filters.isActive));
      }
      if (filters.isCompleted !== undefined) {
        q = query(q, where("isCompleted", "==", filters.isCompleted));
      }

      q = query(q, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const raffles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, raffles };
    } catch (error) {
      console.error("Error fetching raffles:", error);
      return { success: false, error: error.message };
    }
  },

  // Get raffle by ID
  async getRaffle(raffleId) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      const raffleSnap = await getDoc(raffleRef);

      if (!raffleSnap.exists()) {
        return { success: false, error: "Raffle not found" };
      }

      return { success: true, raffle: { id: raffleSnap.id, ...raffleSnap.data() } };
    } catch (error) {
      console.error("Error fetching raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Get participants of a raffle with their posts
  async getRaffleParticipants(raffleId) {
    try {
      const participantsQuery = query(
        collection(db, "raffle_participants"),
        where("raffleId", "==", raffleId),
        orderBy("participatedAt", "desc")
      );

      const querySnapshot = await getDocs(participantsQuery);
      const participants = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, participants };
    } catch (error) {
      console.error("Error fetching raffle participants:", error);
      return { success: false, error: error.message };
    }
  },

  // Draw winner from raffle
  async drawWinner(raffleId) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      const raffleSnap = await getDoc(raffleRef);

      if (!raffleSnap.exists()) {
        return { success: false, error: "Raffle not found" };
      }

      const raffleData = raffleSnap.data();
      
      if (raffleData.isCompleted) {
        return { success: false, error: "Raffle already completed" };
      }

      if (!raffleData.participants || raffleData.participants.length === 0) {
        return { success: false, error: "No participants in raffle" };
      }

      // Get participant details
      const participantsResult = await this.getRaffleParticipants(raffleId);
      if (!participantsResult.success) {
        return { success: false, error: "Could not fetch participants" };
      }

      const participants = participantsResult.participants;
      
      // Randomly select a winner
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];

      // Update raffle with winner
      await updateDoc(raffleRef, {
        winner: winner.userId,
        winnerPost: winner.postId,
        isCompleted: true,
        isActive: false,
        completedAt: serverTimestamp(),
      });

      return { 
        success: true, 
        winner: {
          userId: winner.userId,
          userEmail: winner.userEmail,
          userName: winner.userName,
          postId: winner.postId,
        }
      };
    } catch (error) {
      console.error("Error drawing winner:", error);
      return { success: false, error: error.message };
    }
  },

  // Update raffle
  async updateRaffle(raffleId, updateData) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      await updateDoc(raffleRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Delete raffle
  async deleteRaffle(raffleId) {
    try {
      // Delete all raffle participants first
      const participantsQuery = query(
        collection(db, "raffle_participants"),
        where("raffleId", "==", raffleId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      
      const deletePromises = participantsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete the raffle
      await deleteDoc(doc(db, "raffles", raffleId));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Get raffle statistics
  async getRaffleStats(raffleId = null) {
    try {
      let rafflesQuery = collection(db, "raffles");
      let participantsQuery = collection(db, "raffle_participants");

      if (raffleId) {
        rafflesQuery = query(rafflesQuery, where("id", "==", raffleId));
        participantsQuery = query(participantsQuery, where("raffleId", "==", raffleId));
      }

      const [rafflesSnapshot, participantsSnapshot] = await Promise.all([
        getDocs(rafflesQuery),
        getDocs(participantsQuery)
      ]);

      const raffles = rafflesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const participants = participantsSnapshot.docs.map(doc => doc.data());

      const stats = {
        totalRaffles: raffles.length,
        activeRaffles: raffles.filter(r => r.isActive).length,
        completedRaffles: raffles.filter(r => r.isCompleted).length,
        totalParticipants: participants.length,
        uniqueParticipants: new Set(participants.map(p => p.userId)).size,
        averageParticipantsPerRaffle: raffles.length > 0 ? 
          participants.length / raffles.length : 0,
      };

      if (raffleId) {
        const raffle = raffles[0];
        const raffleParticipants = participants.filter(p => p.raffleId === raffleId);
        
        stats.raffleDetails = {
          ...raffle,
          participantCount: raffleParticipants.length,
          uniqueParticipantCount: new Set(raffleParticipants.map(p => p.userId)).size,
        };
      }

      return { success: true, stats };
    } catch (error) {
      console.error("Error getting raffle stats:", error);
      return { success: false, error: error.message };
    }
  },

  // Check if user participated in raffle
  async hasUserParticipated(raffleId, userId) {
    try {
      const participantsQuery = query(
        collection(db, "raffle_participants"),
        where("raffleId", "==", raffleId),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(participantsQuery);
      return { 
        success: true, 
        participated: !querySnapshot.empty,
        participationCount: querySnapshot.size 
      };
    } catch (error) {
      console.error("Error checking user participation:", error);
      return { success: false, error: error.message };
    }
  },

  // Get active raffle for an event
  async getActiveRaffleForEvent(eventId) {
    try {
      const rafflesQuery = query(
        collection(db, "raffles"),
        where("eventId", "==", eventId),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(rafflesQuery);
      
      if (querySnapshot.empty) {
        return { success: true, raffle: null };
      }

      const raffle = { 
        id: querySnapshot.docs[0].id, 
        ...querySnapshot.docs[0].data() 
      };

      return { success: true, raffle };
    } catch (error) {
      console.error("Error getting active raffle for event:", error);
      return { success: false, error: error.message };
    }
  },

  // End raffle (deactivate without selecting winner)
  async endRaffle(raffleId) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      await updateDoc(raffleRef, {
        isActive: false,
        endedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error ending raffle:", error);
      return { success: false, error: error.message };
    }
  },
};