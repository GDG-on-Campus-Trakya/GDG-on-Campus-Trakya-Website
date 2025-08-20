// components/UserInfo.jsx
"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { faculties, departments } from "@/constants";
import ProfileImageUpload from "./ProfileImageUpload";
import { StoragePaths } from "../utils/storageUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserInfo = ({ user }) => {
  const [profileData, setProfileData] = useState({
    name: "",
    faculty: "",
    department: "",
    photoURL: "",
    imagePath: "", // Store Firebase Storage path for deletion
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            name: data.name || "",
            faculty: data.faculty || "",
            department: data.department || "",
            photoURL: data.photoURL || user.photoURL || "",
            imagePath: data.imagePath || "", // Load stored image path
          });
        }
      }
    };
    fetchProfileData();
  }, [user]);

  const handleImageUpload = async (imageData) => {
    // Delete old profile image if it exists
    if (profileData.imagePath) {
      try {
        const { deleteImage } = await import('../utils/storageUtils');
        await deleteImage(profileData.imagePath);
        console.log('Old profile image deleted:', profileData.imagePath);
      } catch (error) {
        console.warn('Failed to delete old profile image:', error);
      }
    } else if (profileData.photoURL && profileData.photoURL.includes('firebasestorage.googleapis.com')) {
      // Fallback: Extract path from URL if no stored path
      try {
        const { deleteImage } = await import('../utils/storageUtils');
        const url = new URL(profileData.photoURL);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch) {
          const imagePath = decodeURIComponent(pathMatch[1]);
          await deleteImage(imagePath);
          console.log('Old profile image deleted from URL:', imagePath);
        }
      } catch (error) {
        console.warn('Failed to delete old profile image from URL:', error);
      }
    }
    
    setProfileData(prev => ({
      ...prev,
      photoURL: imageData.url,
      imagePath: imageData.path // Store the path for future deletion
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...profileData,
          email: user.email,
        },
        { merge: true }
      );

      toast.success("Profil bilgileri başarıyla güncellendi");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Profil güncellenirken bir hata oluştu");
    }
    setIsLoading(false);
  };

  const isProfileComplete = () => {
    const requiredFields = ['name', 'faculty', 'department'];
    return requiredFields.every((field) => profileData[field]?.trim() !== "");
  };

  return (
    <div className="flex flex-col items-center gap-5 justify-center mb-10 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-5 justify-center">
        <div className="relative">
          <img
            src={profileData.photoURL || user.photoURL || "/landing.jpg"}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-400"
          />
          <ProfileImageUpload
            onImageUpload={handleImageUpload}
            currentImageUrl={profileData.photoURL}
            folder={StoragePaths.PROFILES}
            prefix={`profile_${user.uid}_`}
            isEditing={isEditing}
          />
        </div>
        <div className="flex flex-col text-left">
          <h2 className="text-2xl font-semibold">
            {profileData.name || "İsim girilmemiş"}
          </h2>
          <p className="text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="w-full space-y-4 mt-4">
        {!isProfileComplete() && !isEditing && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <p>
              Lütfen etkinliklere katılabilmek için profil bilgilerinizi
              tamamlayın.
            </p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-300">İsim</label>
                <Input
                  placeholder="İsim"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      name: e.target.value,
                    })
                  }
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Fakülte</label>
                <Select
                  value={profileData.faculty}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, faculty: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Fakülte seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {faculties.map((faculty) => (
                      <SelectItem
                        key={faculty}
                        value={faculty}
                        className="text-white hover:bg-gray-600 focus:bg-gray-600"
                      >
                        {faculty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Bölüm</label>
                <Select
                  value={profileData.department}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, department: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Bölüm seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {departments.map((department) => (
                      <SelectItem
                        key={department}
                        value={department}
                        className="text-white hover:bg-gray-600 focus:bg-gray-600"
                      >
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-gray-500">İsim</label>
                <p className="font-medium">{profileData.name || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Fakülte</label>
                <p className="font-medium">{profileData.faculty || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Bölüm</label>
                <p className="font-medium">{profileData.department || "-"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Profili Düzenle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
