import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

export const socialUtils = {
  // Post Operations
  async createPost(postData) {
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        ...postData,
        timestamp: serverTimestamp(),
        likes: [],
        likeCount: 0,
        commentCount: 0,
        isAdminPost: false,
        isFeatured: false,
        isHidden: false,
        // All posts are event posts now - eventId and eventName are required
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating post:", error);
      return { success: false, error: error.message };
    }
  },

  async getPosts(filters = {}, pagination = {}) {
    try {
      let q = collection(db, "posts");

      // Start with basic query
      q = query(q, orderBy("timestamp", "desc"));

      // Apply pagination first
      if (pagination.limit) {
        q = query(q, limit(pagination.limit));
      }
      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }

      const querySnapshot = await getDocs(q);
      let posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Apply filters in memory (for now, until we create indexes)
      if (filters.eventId) {
        posts = posts.filter(post => post.eventId === filters.eventId);
      }
      if (filters.isEventPost !== undefined) {
        posts = posts.filter(post => post.isEventPost === filters.isEventPost);
      }
      if (filters.userId) {
        posts = posts.filter(post => post.userId === filters.userId);
      }
      if (filters.isHidden !== undefined) {
        posts = posts.filter(post => post.isHidden === filters.isHidden);
      }

      return { success: true, posts, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
    } catch (error) {
      console.error("Error fetching posts:", error);
      return { success: false, error: error.message };
    }
  },

  async likePost(postId, userId) {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        return { success: false, error: "Post not found" };
      }

      const postData = postSnap.data();
      const isLiked = postData.likes?.includes(userId);

      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
          likeCount: increment(-1),
        });
        return { success: true, action: "unliked" };
      } else {
        // Like
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          likeCount: increment(1),
        });
        return { success: true, action: "liked" };
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      return { success: false, error: error.message };
    }
  },

  async deletePost(postId) {
    try {
      // Get post data first to delete image from storage
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data();
        
        // Delete image from storage if exists
        if (postData.imageUrl) {
          try {
            const imageRef = ref(storage, postData.imageUrl);
            await deleteObject(imageRef);
          } catch (storageError) {
            console.warn("Error deleting image from storage:", storageError);
          }
        }
      }

      // Delete post document
      await deleteDoc(postRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting post:", error);
      return { success: false, error: error.message };
    }
  },

  async hidePost(postId, hidden = true) {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { isHidden: hidden });
      return { success: true };
    } catch (error) {
      console.error("Error hiding post:", error);
      return { success: false, error: error.message };
    }
  },

  // Image Upload
  async uploadPostImage(file, userId) {
    try {
      const timestamp = Date.now();
      const fileName = `posts/${userId}/${timestamp}_${file.name}`;
      const imageRef = ref(storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { success: true, url: downloadURL };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { success: false, error: error.message };
    }
  },

  // Event-related utilities
  async getActiveEventsForPosting() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      // Simple query without range filters to avoid index issues
      const eventsQuery = collection(db, "events");

      const querySnapshot = await getDocs(eventsQuery);
      let events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));


      // Filter events that started within last 3 days (so they're still postable)
      events = events.filter(event => {
        // Fix field names: title -> name, startDate -> date+time
        if (!event.date || !event.time) {
          return false;
        }
        
        // Combine date and time strings to create proper Date object
        const dateTimeString = `${event.date}T${event.time}:00`;
        const startDate = new Date(dateTimeString);
        
        if (isNaN(startDate.getTime())) {
          return false;
        }
        
        const threeDaysAfterStart = new Date(startDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        const isPostable = startDate <= now && now <= threeDaysAfterStart;
        
        // Event should have started already and posting window should still be open
        return isPostable;
      });


      // Add canPost check (should all be true now, but keeping for consistency)
      events = events.map(event => ({
        ...event,
        canPost: socialUtils.canPostForEvent(event),
      }));


      return { success: true, events };
    } catch (error) {
      console.error("Error fetching active events:", error);
      return { success: false, error: error.message };
    }
  },

  canPostForEvent(eventData) {
    const now = new Date();
    
    // Handle both old format (startDate) and new format (date + time)
    let eventStart;
    if (eventData.startDate) {
      // Old format
      eventStart = new Date(eventData.startDate.toDate ? eventData.startDate.toDate() : eventData.startDate);
    } else if (eventData.date && eventData.time) {
      // New format
      const dateTimeString = `${eventData.date}T${eventData.time}:00`;
      eventStart = new Date(dateTimeString);
    } else {
      return false;
    }
    
    if (isNaN(eventStart.getTime())) {
      return false;
    }
    
    const threeDaysAfter = new Date(eventStart.getTime() + (3 * 24 * 60 * 60 * 1000));

    return now >= eventStart && now <= threeDaysAfter;
  },

  // Raffle utilities
  async addToRaffle(eventId, userId, postId) {
    try {
      // Check if raffle exists for this event
      const rafflesQuery = query(
        collection(db, "raffles"),
        where("eventId", "==", eventId),
        where("isActive", "==", true)
      );

      const raffleSnapshot = await getDocs(rafflesQuery);
      
      if (raffleSnapshot.empty) {
        // No active raffle for this event
        return { success: true, message: "No active raffle for this event" };
      }

      const raffleDoc = raffleSnapshot.docs[0];
      const raffleRef = doc(db, "raffles", raffleDoc.id);

      // Add participant to raffle
      await updateDoc(raffleRef, {
        participants: arrayUnion(userId),
        participantPosts: arrayUnion(postId),
      });

      // Add to raffle_participants collection for detailed tracking
      await addDoc(collection(db, "raffle_participants"), {
        raffleId: raffleDoc.id,
        userId,
        postId,
        participatedAt: serverTimestamp(),
      });

      return { success: true, message: "Added to raffle successfully" };
    } catch (error) {
      console.error("Error adding to raffle:", error);
      return { success: false, error: error.message };
    }
  },

  // Comment Operations
  async addComment(postId, userId, userEmail, userName, userPhoto, commentText) {
    try {
      const commentData = {
        postId,
        userId,
        userEmail,
        userName: userName || userEmail,
        userPhoto: userPhoto || null,
        text: commentText.trim(),
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "comments"), commentData);
      
      // Update post comment count
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
      });

      return { success: true, id: docRef.id, comment: commentData };
    } catch (error) {
      console.error("Error adding comment:", error);
      return { success: false, error: error.message };
    }
  },

  async getComments(postId) {
    try {
      // Simplified query to avoid index requirement
      const commentsQuery = query(
        collection(db, "comments"),
        where("postId", "==", postId)
      );

      const querySnapshot = await getDocs(commentsQuery);
      let comments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Load updated user profiles for comments
      const enhancedComments = await Promise.all(
        comments.map(async (comment) => {
          if (comment.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", comment.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...comment,
                  userName: userData.name || comment.userName,
                  userPhoto: userData.photoURL || comment.userPhoto,
                };
              }
            } catch (error) {
              console.error("Error loading comment user profile:", error);
            }
          }
          return comment;
        })
      );

      // Sort in memory instead of using orderBy
      const sortedComments = enhancedComments.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return aTime - bTime;
      });

      return { success: true, comments: sortedComments };
    } catch (error) {
      console.error("Error fetching comments:", error);
      return { success: false, error: error.message };
    }
  },

  async deleteComment(commentId, postId) {
    try {
      await deleteDoc(doc(db, "comments", commentId));
      
      // Update post comment count
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(-1),
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: error.message };
    }
  },

  // Announcements Operations
  async getAnnouncements(pagination = {}) {
    try {
      let q = collection(db, "announcements");

      // Order by creation date (newest first)
      q = query(q, orderBy("createdAt", "desc"));

      // Apply pagination
      if (pagination.limit) {
        q = query(q, limit(pagination.limit));
      }
      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const announcements = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { 
        success: true, 
        announcements, 
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] 
      };
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return { success: false, error: error.message };
    }
  },

  // Get combined feed of posts and announcements
  async getCombinedFeed(filters = {}, pagination = {}) {
    try {
      // Get posts
      const postsResult = await this.getPosts(filters, pagination);
      if (!postsResult.success) {
        return postsResult;
      }

      // Get announcements
      const announcementsResult = await this.getAnnouncements(pagination);
      if (!announcementsResult.success) {
        return announcementsResult;
      }

      // Combine and sort by timestamp/createdAt
      const combinedFeed = [
        ...postsResult.posts.map(post => ({ ...post, type: 'post' })),
        ...announcementsResult.announcements.map(announcement => ({ ...announcement, type: 'announcement' }))
      ];

      // Sort by timestamp (posts) or createdAt (announcements)
      combinedFeed.sort((a, b) => {
        const aTime = a.type === 'post' 
          ? (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp))
          : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt));
        const bTime = b.type === 'post' 
          ? (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp))
          : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt));
        
        return bTime - aTime; // Newest first
      });

      return { 
        success: true, 
        feed: combinedFeed,
        lastDoc: postsResult.lastDoc // Use posts lastDoc for pagination
      };
    } catch (error) {
      console.error("Error fetching combined feed:", error);
      return { success: false, error: error.message };
    }
  },

  // Statistics
  async getPostStats(eventId = null) {
    try {
      let q = collection(db, "posts");
      
      if (eventId) {
        q = query(q, where("eventId", "==", eventId));
      }

      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        totalPosts: posts.length,
        totalLikes: posts.reduce((sum, post) => sum + (post.likeCount || 0), 0),
        uniqueUsers: new Set(posts.map(post => post.userId)).size,
        eventPosts: posts.filter(post => post.isEventPost).length,
        generalPosts: posts.filter(post => !post.isEventPost).length,
      };

      return { success: true, stats };
    } catch (error) {
      console.error("Error getting post stats:", error);
      return { success: false, error: error.message };
    }
  },
};