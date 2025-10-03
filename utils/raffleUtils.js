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
import { logger } from "./logger";

export const raffleUtils = {
  // Create a new raffle
  async createRaffle(raffleData) {
    try {
      // First, get existing posts for this event
      const postsQuery = query(
        collection(db, "posts"),
        where("eventId", "==", raffleData.eventId)
      );

      const postsSnapshot = await getDocs(postsQuery);
      const existingPosts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extract unique participants and their posts
      const participants = [
        ...new Set(existingPosts.map((post) => post.userId)),
      ];
      const participantPosts = existingPosts.map((post) => post.id);


      // Create raffle with existing participants
      const docRef = await addDoc(collection(db, "raffles"), {
        ...raffleData,
        isActive: true,
        isCompleted: false,
        participants,
        participantPosts,
        winner: null,
        winnerPost: null,
        completedAt: null,
        createdAt: serverTimestamp(),
      });

      // Also create individual participant records
      for (const post of existingPosts) {
        await addDoc(collection(db, "raffle_participants"), {
          raffleId: docRef.id,
          userId: post.userId,
          postId: post.id,
          participatedAt: serverTimestamp(),
        });
      }


      return {
        success: true,
        id: docRef.id,
        participants: participants,
        participantCount: participants.length,
      };
    } catch (error) {
      logger.error("Error creating raffle:", error);
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

      // Remove orderBy to avoid index requirement, sort in memory instead
      const querySnapshot = await getDocs(q);
      let raffles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort in memory by createdAt desc
      raffles = raffles.sort((a, b) => {
        const aTime = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
        const bTime = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
        return bTime - aTime; // desc order
      });

      return { success: true, raffles };
    } catch (error) {
      logger.error("Error fetching raffles:", error);
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

      return {
        success: true,
        raffle: { id: raffleSnap.id, ...raffleSnap.data() },
      };
    } catch (error) {
      logger.error("Error fetching raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Get participants of a raffle with their posts
  async getRaffleParticipants(raffleId) {
    try {
      const participantsQuery = query(
        collection(db, "raffle_participants"),
        where("raffleId", "==", raffleId)
      );

      const querySnapshot = await getDocs(participantsQuery);
      let participants = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user details for each participant
      const participantsWithUserData = await Promise.all(
        participants.map(async (participant) => {
          try {
            const userRef = doc(db, "users", participant.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                ...participant,
                userEmail: userData.email,
                userName: userData.name || userData.displayName,
              };
            } else {
              return {
                ...participant,
                userEmail: "Kullanıcı bulunamadı",
                userName: "Kullanıcı bulunamadı",
              };
            }
          } catch (error) {
            return {
              ...participant,
              userEmail: "Kullanıcı bilgisi alınamadı",
              userName: "Kullanıcı bilgisi alınamadı",
            };
          }
        })
      );

      // Sort in memory instead of using orderBy
      participantsWithUserData.sort((a, b) => {
        const aTime = a.participatedAt?.toDate
          ? a.participatedAt.toDate()
          : new Date(a.participatedAt);
        const bTime = b.participatedAt?.toDate
          ? b.participatedAt.toDate()
          : new Date(b.participatedAt);
        return bTime - aTime; // desc order
      });

      return { success: true, participants: participantsWithUserData };
    } catch (error) {
      logger.error("Error fetching raffle participants:", error);
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
        winner: winner.userEmail,
        winnerId: winner.userId,
        winnerPost: winner.postId,
        winnerName: winner.userName,
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
        },
      };
    } catch (error) {
      logger.error("Error drawing winner:", error);
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
      logger.error("Error updating raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Delete raffle
  async deleteRaffle(raffleId) {
    try {
      // Get raffle data first to check if it has an announcement
      const raffleRef = doc(db, "raffles", raffleId);
      const raffleSnap = await getDoc(raffleRef);

      if (raffleSnap.exists()) {
        const raffleData = raffleSnap.data();

        // Delete associated announcement if exists
        if (raffleData.announcementId) {
          try {
            await deleteDoc(
              doc(db, "announcements", raffleData.announcementId)
            );
          } catch (error) {
          }
        }
      }

      // Delete all raffle participants first
      const participantsQuery = query(
        collection(db, "raffle_participants"),
        where("raffleId", "==", raffleId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);

      const deletePromises = participantsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete the raffle
      await deleteDoc(raffleRef);

      return { success: true };
    } catch (error) {
      logger.error("Error deleting raffle:", error);
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
        participantsQuery = query(
          participantsQuery,
          where("raffleId", "==", raffleId)
        );
      }

      const [rafflesSnapshot, participantsSnapshot] = await Promise.all([
        getDocs(rafflesQuery),
        getDocs(participantsQuery),
      ]);

      const raffles = rafflesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const participants = participantsSnapshot.docs.map((doc) => doc.data());

      const stats = {
        totalRaffles: raffles.length,
        activeRaffles: raffles.filter((r) => r.isActive).length,
        completedRaffles: raffles.filter((r) => r.isCompleted).length,
        totalParticipants: participants.length,
        uniqueParticipants: new Set(participants.map((p) => p.userId)).size,
        averageParticipantsPerRaffle:
          raffles.length > 0 ? participants.length / raffles.length : 0,
      };

      if (raffleId) {
        const raffle = raffles[0];
        const raffleParticipants = participants.filter(
          (p) => p.raffleId === raffleId
        );

        stats.raffleDetails = {
          ...raffle,
          participantCount: raffleParticipants.length,
          uniqueParticipantCount: new Set(
            raffleParticipants.map((p) => p.userId)
          ).size,
        };
      }

      return { success: true, stats };
    } catch (error) {
      logger.error("Error getting raffle stats:", error);
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
        participationCount: querySnapshot.size,
      };
    } catch (error) {
      logger.error("Error checking user participation:", error);
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
        ...querySnapshot.docs[0].data(),
      };

      return { success: true, raffle };
    } catch (error) {
      logger.error("Error getting active raffle for event:", error);
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
      logger.error("Error ending raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Change raffle winner
  async changeWinner(raffleId, newWinnerId) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      const raffleSnap = await getDoc(raffleRef);

      if (!raffleSnap.exists()) {
        return { success: false, error: "Raffle not found" };
      }

      // Get participant details to find the new winner
      const participantsResult = await this.getRaffleParticipants(raffleId);
      if (!participantsResult.success) {
        return { success: false, error: "Could not fetch participants" };
      }

      const participants = participantsResult.participants;
      const newWinner = participants.find((p) => p.userId === newWinnerId);

      if (!newWinner) {
        return {
          success: false,
          error: "Selected winner is not a participant",
        };
      }

      // Update raffle with new winner
      await updateDoc(raffleRef, {
        winner: newWinner.userEmail,
        winnerId: newWinner.userId,
        winnerPost: newWinner.postId,
        winnerName: newWinner.userName,
        isCompleted: true,
        isActive: false,
        completedAt: serverTimestamp(),
      });

      return {
        success: true,
        winner: {
          userId: newWinner.userId,
          userEmail: newWinner.userEmail,
          userName: newWinner.userName,
          postId: newWinner.postId,
        },
      };
    } catch (error) {
      logger.error("Error changing winner:", error);
      return { success: false, error: error.message };
    }
  },

  // Announce raffle result to social feed
  async announceRaffleResult(raffleId) {
    try {
      const raffleRef = doc(db, "raffles", raffleId);
      const raffleSnap = await getDoc(raffleRef);

      if (!raffleSnap.exists()) {
        return { success: false, error: "Raffle not found" };
      }

      const raffle = raffleSnap.data();

      if (!raffle.isCompleted || !raffle.winner) {
        return {
          success: false,
          error: "Raffle must be completed with a winner first",
        };
      }

      // Create announcement post
      const announcementPost = {
        type: "raffle_result",
        title: `🎉 ${raffle.title}`,
        content: `${raffle.eventName} etkinliği için düzenlenen "${
          raffle.title
        }" çekilişinin kazananı belli oldu!\n\n🏆 Kazanan: ${
          raffle.winnerName || raffle.winner
        }\n🎁 Ödül: ${raffle.prize}\n\nTebrikler! 🎊`,
        eventId: raffle.eventId,
        eventName: raffle.eventName,
        raffleId: raffleId,
        winner: raffle.winner,
        winnerId: raffle.winnerId,
        winnerName: raffle.winnerName,
        prize: raffle.prize,
        createdAt: serverTimestamp(),
        isAnnouncement: true,
      };

      const docRef = await addDoc(
        collection(db, "announcements"),
        announcementPost
      );

      // Mark raffle as announced
      await updateDoc(raffleRef, {
        isAnnounced: true,
        announcedAt: serverTimestamp(),
        announcementId: docRef.id,
      });

      return { success: true, announcementId: docRef.id };
    } catch (error) {
      logger.error("Error announcing raffle result:", error);
      return { success: false, error: error.message };
    }
  },
};
