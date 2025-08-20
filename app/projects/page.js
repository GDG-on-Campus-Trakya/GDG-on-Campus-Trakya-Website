"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
        <p className="text-lg">Projeler yükleniyor...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Projeler | GDG on Campus Trakya</title>
        <meta 
          name="description" 
          content="GDG on Campus Trakya topluluğunun üyeleri tarafından geliştirilen projeleri keşfedin. Yazılım, tasarım ve teknoloji alanındaki yaratıcı çalışmalara göz atın." 
        />
        <meta property="og:title" content="Projeler | GDG on Campus Trakya" />
        <meta 
          property="og:description" 
          content="GDG on Campus Trakya topluluğunun üyeleri tarafından geliştirilen projeleri keşfedin." 
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Projeler | GDG on Campus Trakya" />
        <meta 
          name="twitter:description" 
          content="GDG on Campus Trakya topluluğunun üyeleri tarafından geliştirilen projeleri keşfedin." 
        />
      </Head>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white"
      >
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x"
          >
            Topluluk Projeleri
          </motion.span>
        </motion.h1>

        {/* Description Section */}
        <motion.div 
          variants={itemVariants}
          className="max-w-4xl mx-auto text-center mb-12 sm:mb-16"
        >
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-6"
          >
            GDG on Campus Trakya topluluğu üyelerinin hayal gücü ve teknik becerilerinin 
            buluştuğu yaratıcı projeler. Web geliştirmeden mobil uygulamalara, 
            yapay zekadan oyun geliştirmeye kadar geniş bir yelpazede yer alan projelerimizi keşfedin.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Açık Kaynak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>İşbirlikçi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Öğrenme Odaklı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>İnovatif</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 opacity-20">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                Henüz proje eklenmemiş
              </h3>
              <p className="text-gray-400">
                Topluluk üyelerinin projeleri burada görüntülenecek.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-gray-600 group"
              >
                <Link href={`/projects/${project.id}`} className="block">
                  {project.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-3 line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-4 text-sm line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                    
                    {/* Collaborators */}
                    {project.collaborators && project.collaborators.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2 font-medium">İşbirlikçiler:</p>
                        <div className="flex flex-wrap gap-2">
                          {project.collaborators.slice(0, 3).map((collab, collabIndex) => (
                            <div
                              key={collabIndex}
                              className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/30"
                            >
                              <img
                                src={collab.photoURL || "/default-profile.png"}
                                alt={collab.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="truncate max-w-20">
                                {collab.name || collab.email.split('@')[0]}
                              </span>
                            </div>
                          ))}
                          {project.collaborators.length > 3 && (
                            <div className="flex items-center px-3 py-1 rounded-full text-xs text-gray-400 bg-gray-700/50">
                              +{project.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Stats */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{project.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{project.comments?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{project.views || 0}</span>
                      </div>
                      {/* Project Status */}
                      {project.status && (
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          project.status === "active" ? "bg-green-500/20 text-green-300" :
                          project.status === "completed" ? "bg-blue-500/20 text-blue-300" :
                          project.status === "paused" ? "bg-yellow-500/20 text-yellow-300" : 
                          "bg-green-500/20 text-green-300"
                        }`}>
                          {project.status === "active" ? "Aktif" :
                           project.status === "completed" ? "Tamamlanmış" :
                           project.status === "paused" ? "Beklemede" : "Aktif"}
                        </div>
                      )}
                    </div>
                    
                    {/* GitHub Button and Date */}
                    <div className="flex justify-between items-center">
                      {project.createdAt && (
                        <div className="text-xs text-gray-400">
                          <p className="opacity-75">
                            {new Date(project.createdAt.toDate()).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {project.githubLink && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(project.githubLink, '_blank');
                            }}
                            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ml-4"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                          </motion.div>
                        )}
                        
                        <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Detayları Gör →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      </motion.div>
      
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
    </>
  );
}