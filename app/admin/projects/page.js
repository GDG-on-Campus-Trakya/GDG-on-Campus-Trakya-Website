"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImage, StoragePaths } from "../../../utils/storageUtils";
import UserMentionInput from "../../../components/UserMentionInput";

export default function AdminProjectsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubLink: "",
    image: null,
    collaborators: [],
    status: "active",
    archived: false,
  });

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isAdmin) return;
      
      try {
        const projectsQuery = query(
          collection(db, "projects"),
          orderBy("createdAt", "desc")
        );
        const projectSnapshot = await getDocs(projectsQuery);
        setProjects(
          projectSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Projeler yüklenirken bir hata oluştu!");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, user]
    }));
  };

  const removeCollaborator = (userUid) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(collab => collab.uid !== userUid)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Lütfen tüm zorunlu alanları doldurun!");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingProject?.imageUrl || "";
      
      if (formData.image) {
        const uploadResult = await uploadImage(
          formData.image,
          StoragePaths.PROJECTS || "projects",
          "project_"
        );
        imageUrl = uploadResult.url;
      }

      const projectData = {
        title: formData.title,
        description: formData.description,
        githubLink: formData.githubLink || "",
        imageUrl: imageUrl,
        collaborators: formData.collaborators.map(collab => ({
          uid: collab.uid,
          email: collab.email,
          name: collab.name || collab.email,
          photoURL: collab.photoURL || "",
        })),
        status: formData.status,
        archived: formData.archived,
        updatedAt: serverTimestamp(),
      };

      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, "projects", editingProject.id), projectData);
        toast.success("Proje başarıyla güncellendi!");
      } else {
        // Create new project
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdBy: user.uid,
          createdByName: user.displayName || user.email,
          createdAt: serverTimestamp(),
          // Social features
          likes: [],
          comments: [],
          views: 0,
          // Admin features
          status: "active", // active, completed, paused
          archived: false,
        });
        toast.success("Proje başarıyla eklendi!");
      }

      setFormData({
        title: "",
        description: "",
        githubLink: "",
        image: null,
        collaborators: [],
        status: "active",
        archived: false,
      });
      setShowAddForm(false);
      setEditingProject(null);

      // Refresh projects
      const projectsQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
      );
      const projectSnapshot = await getDocs(projectsQuery);
      setProjects(
        projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(editingProject ? "Proje güncellenirken bir hata oluştu!" : "Proje eklenirken bir hata oluştu!");
    } finally {
      setUploading(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      githubLink: project.githubLink || "",
      image: null,
      collaborators: project.collaborators || [],
      status: project.status || "active",
      archived: project.archived || false,
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      description: "",
      githubLink: "",
      image: null,
      collaborators: [],
      status: "active",
      archived: false,
    });
    setShowAddForm(false);
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (window.confirm(`"${projectTitle}" projesini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        setProjects(prev => prev.filter(project => project.id !== projectId));
        toast.success("Proje başarıyla silindi!");
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Proje silinirken bir hata oluştu!");
      }
    }
  };

  const handleManageSocial = (project) => {
    setSelectedProject(project);
    setShowSocialModal(true);
  };

  const handleResetViews = async (projectId) => {
    if (window.confirm("Görüntülenme sayısını sıfırlamak istediğinizden emin misiniz?")) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          views: 0
        });
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, views: 0 } : p
        ));
        setSelectedProject(prev => ({ ...prev, views: 0 }));
        toast.success("Görüntülenme sayısı sıfırlandı!");
      } catch (error) {
        console.error("Error resetting views:", error);
        toast.error("Görüntülenme sayısı sıfırlanırken bir hata oluştu!");
      }
    }
  };

  const handleResetLikes = async (projectId) => {
    if (window.confirm("Tüm beğenileri silmek istediğinizden emin misiniz?")) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          likes: []
        });
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, likes: [] } : p
        ));
        setSelectedProject(prev => ({ ...prev, likes: [] }));
        toast.success("Tüm beğeniler silindi!");
      } catch (error) {
        console.error("Error resetting likes:", error);
        toast.error("Beğeniler silinirken bir hata oluştu!");
      }
    }
  };

  const handleDeleteComment = async (projectId, commentId) => {
    if (window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
      try {
        const project = projects.find(p => p.id === projectId);
        const updatedComments = project.comments.filter(c => c.id !== commentId);
        
        await updateDoc(doc(db, "projects", projectId), {
          comments: updatedComments
        });
        
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, comments: updatedComments } : p
        ));
        setSelectedProject(prev => ({ ...prev, comments: updatedComments }));
        toast.success("Yorum silindi!");
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Yorum silinirken bir hata oluştu!");
      }
    }
  };

  if (loading || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Projeler Yönetimi
            </h1>
            <p className="text-gray-600 mt-1">
              Tüm projeleri görüntüleyin ve yönetin
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Admin Paneli
            </Link>
            <Link
              href="/projects"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Projeler Sayfası
            </Link>
            <button
              onClick={() => showAddForm ? handleCancelEdit() : setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              {showAddForm ? "İptal" : "Yeni Proje Ekle"}
            </button>
          </div>
        </div>

        {/* Projects Stats */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            İstatistikler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Toplam Proje</h3>
              <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">İşbirlikçili Projeler</h3>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.collaborators && p.collaborators.length > 0).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800">GitHub Linkli</h3>
              <p className="text-2xl font-bold text-purple-600">
                {projects.filter(p => p.githubLink).length}
              </p>
            </div>
          </div>
        </div>

        {/* Add Project Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white shadow-md rounded-lg p-6 mb-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                {editingProject ? "Proje Düzenle" : "Yeni Proje Ekle"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Başlığı *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Proje başlığını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Proje hakkında kısa bir açıklama yazın"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Linki
                  </label>
                  <input
                    type="url"
                    name="githubLink"
                    value={formData.githubLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/username/project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Görseli
                  </label>
                  {editingProject?.imageUrl && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Mevcut görsel:</p>
                      <img
                        src={editingProject.imageUrl}
                        alt="Mevcut proje görseli"
                        className="w-32 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingProject?.imageUrl && (
                    <p className="text-xs text-gray-500 mt-1">
                      Yeni bir görsel seçerseniz mevcut görsel değiştirilecektir.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşbirlikçiler
                  </label>
                  <UserMentionInput
                    onUserSelect={handleUserSelect}
                    selectedUsers={formData.collaborators}
                    placeholder="Kullanıcı emaili ile ara ve ekle..."
                  />
                  
                  {/* Selected Collaborators */}
                  {formData.collaborators.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-600">Seçilen işbirlikçiler:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.collaborators.map((collab) => (
                          <div
                            key={collab.uid}
                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <img
                              src={collab.photoURL || "/default-profile.png"}
                              alt={collab.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{collab.name || collab.email}</span>
                            <button
                              type="button"
                              onClick={() => removeCollaborator(collab.uid)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proje Durumu
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="completed">Tamamlanmış</option>
                      <option value="paused">Beklemede</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        name="archived"
                        checked={formData.archived}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          archived: e.target.checked
                        }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Projeyi Arşivle
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 
                      (editingProject ? "Güncelleniyor..." : "Ekleniyor...") : 
                      (editingProject ? "Proje Güncelle" : "Proje Ekle")
                    }
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">
              Tüm Projeler ({projects.length})
            </h2>
          </div>
          
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">Henüz proje bulunmuyor.</p>
              <Link
                href="/projects"
                className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                İlk Projeyi Ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşbirlikçiler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sosyal Veriler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {project.imageUrl && (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {project.description}
                            </div>
                            {project.githubLink && (
                              <a
                                href={project.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                GitHub ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {project.collaborators && project.collaborators.length > 0 ? (
                            project.collaborators.slice(0, 3).map((collab, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full text-xs"
                              >
                                <img
                                  src={collab.photoURL || "/default-profile.png"}
                                  alt={collab.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-blue-800">
                                  {collab.name?.split(' ')[0] || collab.email.split('@')[0]}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                          {project.collaborators && project.collaborators.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{project.collaborators.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                              <span>{project.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 6h-2l-9-4-9 4v2h2l9-4 9 4v2zm-9 5.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span>{project.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                              </svg>
                              <span>{project.comments?.length || 0}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleManageSocial(project)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          >
                            Yönet
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.createdAt ? (
                          new Date(project.createdAt.toDate()).toLocaleDateString('tr-TR')
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.title)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Social Data Management Modal */}
      <AnimatePresence>
        {showSocialModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSocialModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Sosyal Veri Yönetimi
                    </h3>
                    <p className="text-gray-600 mt-1">{selectedProject.title}</p>
                  </div>
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stats and Actions */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-4">İstatistikler ve İşlemler</h4>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-red-600">{selectedProject.likes?.length || 0}</p>
                          <p className="text-xs text-red-600">Beğeni</p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 6h-2l-9-4-9 4v2h2l9-4 9 4v2zm-9 5.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{selectedProject.views || 0}</p>
                          <p className="text-xs text-blue-600">Görüntülenme</p>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-green-600">{selectedProject.comments?.length || 0}</p>
                          <p className="text-xs text-green-600">Yorum</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handleResetViews(selectedProject.id)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Görüntülenme Sayısını Sıfırla
                        </button>
                        
                        <button
                          onClick={() => handleResetLikes(selectedProject.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Tüm Beğenileri Sil
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments Management */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Yorumlar ({selectedProject.comments?.length || 0})</h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProject.comments && selectedProject.comments.length > 0 ? (
                        selectedProject.comments
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((comment) => (
                          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                              <img
                                src={comment.userPhoto || "/default-profile.png"}
                                alt={comment.userName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm">{comment.userName}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteComment(selectedProject.id, comment.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Henüz yorum bulunmuyor.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}