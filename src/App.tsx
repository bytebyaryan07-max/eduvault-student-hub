import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Upload, 
  User, 
  Bookmark, 
  GraduationCap, 
  ThumbsUp, 
  Download, 
  School, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  LogOut, 
  X, 
  FileText,
  Filter,
  Check,
  Award,
  Trash2
} from "lucide-react";
import { EducationalResource, UserProfile, ResourceCategory } from "./types";
import { SEED_RESOURCES } from "./data/seedResources";
import { auth, db, signInAnonymously, onAuthStateChanged, signOut, googleProvider, signInWithPopup } from "./lib/firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  addDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

// Importing our custom modular components
import ResourceCard from "./components/ResourceCard";
import UploadModal from "./components/UploadModal";
import AiRecommendationsWidget from "./components/AiRecommendationsWidget";
import StudyAssistantPanel from "./components/StudyAssistantPanel";
import CommentsSection from "./components/CommentsSection";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("");
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  
  // UI States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResource, setPreviewResource] = useState<EducationalResource | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<EducationalResource | null>(null);
  const [deleteConfirmTitleInput, setDeleteConfirmTitleInput] = useState("");
  const [hasEntered, setHasEntered] = useState(() => {
    return localStorage.getItem("eduvault_has_entered") === "true";
  });
  
  // Profile edit forms
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"student" | "teacher" | "admin">("student");
  const [editCollege, setEditCollege] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Stats
  const [totalDownloadsCount, setTotalDownloadsCount] = useState(1280);

  const isAnonymous = !user || user.isAnonymous || (profile && profile.id.startsWith("guest_"));

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid, firebaseUser.email || "");
      } else {
        // Sign in anonymously if not authenticated
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("Anonymous authentication failed or restricted. Falling back to local guest profile:", error);
          let localUid = localStorage.getItem("eduvault_local_uid");
          if (!localUid) {
            localUid = "guest_" + Math.random().toString(36).substring(2, 15);
            localStorage.setItem("eduvault_local_uid", localUid);
          }
          const guestUser = {
            uid: localUid,
            isAnonymous: true,
            displayName: "Guest Student",
            email: "guest@eduvault.in"
          };
          setUser(guestUser);
          await loadUserProfile(localUid, "guest@eduvault.in");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUser(result.user);
        await loadUserProfile(result.user.uid, result.user.email || "");
        setShowLoginModal(false);
        setHasEntered(true);
        localStorage.setItem("eduvault_has_entered", "true");
      }
    } catch (error: any) {
      console.error("Google login failed:", error);
      if (error.code === "auth/popup-closed-by-user") {
        alert("Sign-in popup was closed before completing. If you are using the AI Studio preview pane, please click the 'Open in New Tab' button (top-right of preview) to avoid iframe popup restrictions.");
      } else if (error.code === "auth/popup-blocked") {
        alert("The login popup was blocked by your browser. Please allow popups for this site, or open the application in a new tab using the 'Open in New Tab' icon at the top right of the preview panel.");
      } else {
        alert("Failed to log in with Google: " + (error.message || error));
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
      setHasEntered(false);
      localStorage.removeItem("eduvault_has_entered");
      alert("Signed out successfully.");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Fetch educational resources
  const fetchResources = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const list: EducationalResource[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as EducationalResource);
      });

      if (list.length === 0) {
        // Firestore is empty. Seed it with initial educational documents!
        console.log("Firestore empty. Seeding with initial educational resources...");
        const batch = writeBatch(db);
        SEED_RESOURCES.forEach((res) => {
          const docRef = doc(db, "resources", res.id);
          batch.set(docRef, res);
        });
        await batch.commit();
        setResources(SEED_RESOURCES);
      } else {
        setResources(list);
      }
    } catch (err) {
      console.error("Error loading resources from Firestore. Using seeded fallback.", err);
      setResources(SEED_RESOURCES);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Load profile and bookmarks
  const loadUserProfile = async (uid: string, fallbackEmail: string) => {
    try {
      let userData: UserProfile | null = null;
      const isGuest = uid.startsWith("guest_");

      if (!isGuest) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          userData = userDoc.data() as UserProfile;
        }
      } else {
        const storedProfile = localStorage.getItem("eduvault_profile");
        if (storedProfile) {
          userData = JSON.parse(storedProfile);
        }
      }

      if (userData) {
        setProfile(userData);
        setEditName(userData.displayName);
        setEditRole(userData.role);
        setEditCollege(userData.college || "");
        setEditCourse(userData.course || "");
      } else {
        // Create initial default user profile
        const newProfile: UserProfile = {
          id: uid,
          displayName: isGuest ? "Guest Student" : (auth.currentUser?.displayName || "EduVault Student"),
          email: fallbackEmail || "student@eduvault.in",
          role: "student",
          college: "DTU Delhi",
          course: "BTech Computer Science",
          createdAt: new Date().toISOString()
        };

        if (!isGuest) {
          await setDoc(doc(db, "users", uid), newProfile);
        } else {
          localStorage.setItem("eduvault_profile", JSON.stringify(newProfile));
        }

        setProfile(newProfile);
        setEditName(newProfile.displayName);
        setEditRole(newProfile.role);
        setEditCollege(newProfile.college || "");
        setEditCourse(newProfile.course || "");
      }

      // Load user bookmarks
      let ids: string[] = [];
      if (!isGuest) {
        const bookmarkSnapshot = await getDocs(collection(db, "users", uid, "bookmarks"));
        bookmarkSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.resourceId) ids.push(data.resourceId);
        });
      } else {
        const storedBookmarks = localStorage.getItem("eduvault_bookmarks");
        if (storedBookmarks) {
          ids = JSON.parse(storedBookmarks);
        }
      }
      setBookmarkedIds(ids);

    } catch (err) {
      console.error("Error loading user profile:", err);
      // Local fallback profile
      const localProfile: UserProfile = {
        id: uid,
        displayName: uid.startsWith("guest_") ? "Guest Student" : "EduVault Student",
        email: fallbackEmail || "student@eduvault.in",
        role: "student",
        college: "DTU Delhi",
        course: "BTech Computer Science",
        createdAt: new Date().toISOString()
      };
      setProfile(localProfile);
    }
  };

  // Handle bookmarking
  const handleBookmarkToggle = async (resourceId: string) => {
    if (!profile) return;
    const isBookmarked = bookmarkedIds.includes(resourceId);
    
    // Update state instantly for fluid UX
    let updatedIds = [...bookmarkedIds];
    if (isBookmarked) {
      updatedIds = updatedIds.filter(id => id !== resourceId);
    } else {
      updatedIds.push(resourceId);
    }
    setBookmarkedIds(updatedIds);

    // Save locally for persistence in both guest and signed-in modes
    localStorage.setItem("eduvault_bookmarks", JSON.stringify(updatedIds));

    // Only try to sync with Firestore if user is not a guest
    if (!profile.id.startsWith("guest_")) {
      try {
        const bookmarkRef = doc(db, "users", profile.id, "bookmarks", resourceId);
        if (isBookmarked) {
          await deleteDoc(bookmarkRef);
        } else {
          await setDoc(bookmarkRef, {
            id: resourceId,
            resourceId,
            userId: profile.id,
            addedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to sync bookmark to Firestore:", err);
      }
    }
  };

  // Handle liking
  const handleLike = async (resourceId: string) => {
    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        return { ...res, likesCount: res.likesCount + 1 };
      }
      return res;
    }));

    try {
      await updateDoc(doc(db, "resources", resourceId), {
        likesCount: increment(1)
      });
    } catch (err) {
      console.error("Error saving like:", err);
    }
  };

  // Handle Download
  const handleDownload = (resource: EducationalResource) => {
    if (isAnonymous) {
      setShowLoginModal(true);
      return;
    }
    setTotalDownloadsCount(prev => prev + 1);
    setResources(prev => prev.map(res => {
      if (res.id === resource.id) {
        return { ...res, downloadCount: res.downloadCount + 1 };
      }
      return res;
    }));

    try {
      updateDoc(doc(db, "resources", resource.id), {
        downloadCount: increment(1)
      });
    } catch (err) {
      console.error("Error tracking download:", err);
    }

    if (resource.fileUrl) {
      if (resource.fileUrl.startsWith("data:")) {
        // High fidelity forced download for local device-uploaded files
        const element = document.createElement("a");
        element.href = resource.fileUrl;
        
        // Guess file extension based on type
        let ext = "pdf";
        if (resource.fileType === "docx") ext = "docx";
        else if (resource.fileType === "image") {
          if (resource.fileUrl.includes("image/png")) ext = "png";
          else if (resource.fileUrl.includes("image/jpeg") || resource.fileUrl.includes("image/jpg")) ext = "jpg";
          else ext = "png";
        }
        
        element.download = `${resource.title.replace(/\s+/g, "_")}.${ext}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        window.open(resource.fileUrl, "_blank");
      }
    } else {
      // For text files, we can download it as a local .txt file!
      const element = document.createElement("a");
      const file = new Blob([resource.content || resource.description], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${resource.title.replace(/\s+/g, "_")}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Handle user profile updating
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsUpdatingProfile(true);
    try {
      const updatedData = {
        ...profile,
        displayName: editName.trim() || profile.displayName,
        role: editRole,
        college: editCollege.trim(),
        course: editCourse.trim()
      };

      if (!profile.id.startsWith("guest_")) {
        await setDoc(doc(db, "users", profile.id), updatedData);
      } else {
        localStorage.setItem("eduvault_profile", JSON.stringify(updatedData));
      }

      setProfile(updatedData);
      setShowProfileEdit(false);
    } catch (err) {
      console.error("Failed to update user profile in Firestore:", err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle document submission / uploads
  const handleUploadResource = async (resourceData: any) => {
    if (!profile) return;
    if (isAnonymous) {
      setShowLoginModal(true);
      return;
    }

    const newResourceDoc = {
      ...resourceData,
      uploadedBy: profile.id,
      uploadedByName: profile.displayName,
      uploadedAt: new Date().toISOString(),
      downloadCount: 0,
      likesCount: 0,
      isApproved: true
    };

    try {
      if (!profile.id.startsWith("guest_")) {
        const docRef = await addDoc(collection(db, "resources"), newResourceDoc);
        const createdResource = { id: docRef.id, ...newResourceDoc } as EducationalResource;
        setResources((prev) => [createdResource, ...prev]);
      } else {
        // Guest fallback
        const mockId = "guest-resource-" + Math.random().toString(36).substring(2, 9);
        const createdResource = { id: mockId, ...newResourceDoc } as EducationalResource;
        setResources((prev) => [createdResource, ...prev]);
        alert("Resource uploaded successfully to your session! Log in with Google to publish it globally for all students.");
      }
    } catch (err) {
      console.error("Error saving newly uploaded resource in Firestore:", err);
      // Fallback local save in state
      const mockId = "user-" + Math.random().toString();
      setResources((prev) => [{ id: mockId, ...newResourceDoc } as EducationalResource, ...prev]);
    }
  };

  // Handle deleting a resource
  const handleDeleteResource = async (resourceId: string) => {
    try {
      const resToDelete = resources.find((r) => r.id === resourceId);
      if (!resToDelete) return;

      const isAuthorized = profile && (profile.role === "admin" || profile.id === resToDelete.uploadedBy);
      if (!isAuthorized) {
        alert("You are not authorized to delete this resource.");
        return;
      }

      // 1. Instantly update local resources state
      setResources((prev) => prev.filter((r) => r.id !== resourceId));

      // 2. If the deleted resource is currently previewed, close the preview
      if (previewResource?.id === resourceId) {
        setPreviewResource(null);
      }

      // 3. Remove from Firestore if not guest-only or temporary
      if (!resourceId.startsWith("guest-resource-") && !resourceId.startsWith("user-")) {
        await deleteDoc(doc(db, "resources", resourceId));
      }
      
      setResourceToDelete(null);
      setDeleteConfirmTitleInput("");
      alert("Study resource removed successfully.");
    } catch (err) {
      console.error("Error deleting resource:", err);
      setResourceToDelete(null);
      setDeleteConfirmTitleInput("");
      alert("An error occurred while deleting, but the resource has been cleared from your current session.");
    }
  };

  // Filters logic
  const filteredResources = resources.filter((res) => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.college && res.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
      res.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || res.category === selectedCategory;
    const matchesSubject = !selectedSubjectFilter || res.subject === selectedSubjectFilter;
    const matchesCourse = !selectedCourseFilter || res.course === selectedCourseFilter;
    const matchesCollege = !selectedCollegeFilter || res.college === selectedCollegeFilter;
    const matchesBookmark = !showOnlyBookmarks || bookmarkedIds.includes(res.id);

    return matchesSearch && matchesCategory && matchesSubject && matchesCourse && matchesCollege && matchesBookmark;
  });

  // Extract metadata filters
  const subjects = Array.from(new Set(resources.map((r) => r.subject)));
  const courses = Array.from(new Set(resources.map((r) => r.course)));
  const colleges = Array.from(new Set(resources.map((r) => r.college).filter(Boolean)));

  const handleSelectRecommendedResource = (id: string) => {
    const found = resources.find((r) => r.id === id);
    if (found) {
      setPreviewResource(found);
    }
  };

  const handleSelectRecommendedSubject = (subj: string) => {
    setSelectedSubjectFilter(subj);
    setSelectedCategory("All");
    setSearchQuery("");
  };

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setSelectedSubjectFilter("");
    setSelectedCourseFilter("");
    setSelectedCollegeFilter("");
    setShowOnlyBookmarks(false);
  };

  const isGoogleUser = user && !user.isAnonymous && !user.uid.startsWith("guest_");
  const showLanding = !isGoogleUser && !hasEntered;

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/50 flex flex-col justify-between font-sans text-gray-900 antialiased overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl -z-10 animate-pulse duration-4000" />

        {/* Top Header */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                EduVault
                <span className="text-[9px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                  India
                </span>
              </h1>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            🇮🇳 Built for Indian Students
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Community Study Exchange
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                One Platform.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 font-bold">
                  Every Student Resource.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                Unlock peer-verified lecture notes, previous year question papers, lab manuals, and assignments. Powered by smart AI study plans.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="bg-white border border-gray-150 rounded-2xl p-3.5 text-center shadow-xs">
                <p className="text-lg font-extrabold text-indigo-600">{resources.length || 8}+</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Resources</p>
              </div>
              <div className="bg-white border border-gray-150 rounded-2xl p-3.5 text-center shadow-xs">
                <p className="text-lg font-extrabold text-emerald-600">100%</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified</p>
              </div>
              <div className="bg-white border border-gray-150 rounded-2xl p-3.5 text-center shadow-xs">
                <p className="text-lg font-extrabold text-amber-600 font-semibold">Free</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Access</p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <button
                onClick={handleGoogleSignIn}
                className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button
                onClick={() => {
                  setHasEntered(true);
                  localStorage.setItem("eduvault_has_entered", "true");
                }}
                className="w-full sm:w-auto flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-6 py-3.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Explore as Guest</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="text-[11px] text-gray-400">
              No registration required to browse or download. Logging in with Google unlocks cloud backup & custom AI advice.
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white/40">
          <p>© {new Date().getFullYear()} EduVault India. Built with 🤍 for peer learning.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 antialiased flex flex-col">
      
      {/* Banner / Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <BookOpen className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                  EduVault
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                    India
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500 font-medium font-sans">One Platform. Every Student Resource.</p>
              </div>
            </div>

            {/* Middle Stats - Invisible on very small mobile */}
            <div className="hidden md:flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span><strong className="text-gray-900 font-semibold font-sans">{resources.length}</strong> Resources</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span><strong className="text-gray-900 font-semibold font-sans">{bookmarkedIds.length}</strong> Bookmarked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                <span><strong className="text-gray-900 font-semibold font-sans">{totalDownloadsCount}</strong> Downloads</span>
              </div>
            </div>

            {/* Profile Action Area */}
            <div className="flex items-center gap-3">
              {isAnonymous ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  {profile && (
                    <button 
                      onClick={() => setShowProfileEdit(true)}
                      className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                      title="Edit Guest Profile"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                        {profile.displayName.charAt(0)}
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                profile ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowProfileEdit(true)}
                      className="flex items-center gap-2 text-left hover:bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-150 transition-all cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                        {profile.displayName.charAt(0)}
                      </div>
                      <div className="hidden sm:block">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{profile.displayName}</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5 font-sans">{profile.course || profile.role}</p>
                      </div>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-400 hover:text-rose-600 p-2.5 rounded-xl border border-gray-150 hover:bg-rose-50 transition-all cursor-pointer flex items-center justify-center"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Upload</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="h-4 bg-gray-200 w-16 rounded" />
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Guest Warning Banner */}
        {isAnonymous && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center text-amber-700 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-amber-950">You are browsing in Guest Mode</h3>
                <p className="text-xs text-amber-800 mt-1">
                  Connect your Google Account to unlock **downloading resources**, **uploading files**, starting public discussions, and cloud-synced bookmarks!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap self-stretch sm:self-auto cursor-pointer flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </button>
          </div>
        )}

        {/* User Profile Customization Alert / Banner if college is default */}
        {profile && profile.displayName === "EduVault Student" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Personalize your EduVault Library!</h3>
                <p className="text-xs text-amber-700 mt-1">
                  Tell us your current course, semester, or targeted exam to get tailored AI study advice and recommended material.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all whitespace-nowrap self-stretch sm:self-auto"
            >
              Setup Profile
            </button>
          </div>
        )}

        {/* AI advisor recommendations header */}
        <AiRecommendationsWidget
          userProfile={profile}
          bookmarks={bookmarkedIds}
          allResources={resources}
          searchQuery={searchQuery}
          onSelectResource={handleSelectRecommendedResource}
          onSelectSubject={handleSelectRecommendedSubject}
        />

        {/* Search, Discovery and Filters layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar Filters */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-indigo-600" />
                Filter Library
              </span>
              {(selectedSubjectFilter || selectedCourseFilter || selectedCollegeFilter || showOnlyBookmarks || searchQuery) && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Quick bookmark filter */}
            <div>
              <button
                onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  showOnlyBookmarks 
                    ? "bg-amber-50 border-amber-200 text-amber-700" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" fill={showOnlyBookmarks ? "currentColor" : "none"} />
                  My Bookmarked Materials
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${showOnlyBookmarks ? "bg-amber-200/60" : "bg-gray-200"}`}>
                  {bookmarkedIds.length}
                </span>
              </button>
            </div>

            {/* Course Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Course / Stream</label>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Subject / Branch</label>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* College Filter */}
            {colleges.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">School / College-wise</label>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Colleges / Schools</option>
                  {colleges.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Disclaimer info */}
            <div className="bg-indigo-50/40 rounded-xl p-3 border border-indigo-100 text-[10px] text-indigo-800 leading-normal">
              🎓 <strong>EduVault Community:</strong> Anyone can read and download. Registered students can contribute files and generate instant AI revision outlines.
            </div>
          </div>

          {/* Core Documents Catalog Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search and Category Tabs */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Smart Search: notes, papers, subjects, or colleges..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Categories Navigation */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-gray-100">
                {["All", "Notes", "Previous Year Question Paper", "Assignment", "Book", "Lab Manual", "Syllabus", "Study Material"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white shadow-xs" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    {cat === "Previous Year Question Paper" ? "Question Papers" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  isBookmarked={bookmarkedIds.includes(res.id)}
                  onBookmark={() => handleBookmarkToggle(res.id)}
                  onLike={() => handleLike(res.id)}
                  onDownload={() => handleDownload(res)}
                  onSelect={() => setPreviewResource(res)}
                  onDelete={
                    profile && (profile.id === res.uploadedBy || profile.role === "admin")
                      ? () => {
                          setResourceToDelete(res);
                          setDeleteConfirmTitleInput("");
                        }
                      : undefined
                  }
                />
              ))}

              {filteredResources.length === 0 && (
                <div className="col-span-full bg-white border border-gray-150 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No matching study materials found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    We couldn't find any resources matching your active filters. Try broadening your keywords, clearing subjects, or upload one to help the community!
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => {
                        if (isAnonymous) {
                          setShowLoginModal(true);
                        } else {
                          setShowUploadModal(true);
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload first copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            <p className="font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-1">
              EduVault India 🇮🇳
            </p>
            <p className="mt-1">Free, open, community-driven academic exchange. Built for students, by students.</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600">Content Guidelines</a>
          </div>
        </div>
      </footer>

      {/* Upload Modal Overlay */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadResource}
        />
      )}

      {/* Login Custom Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-indigo-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                EduVault Student Gateway
              </span>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 text-left">
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">Unlock Premium Academic Tools</h3>
                <p className="text-xs text-gray-500">
                  Join thousands of other students across top Indian universities sharing verified study guides, syllabus documents, and exam keys.
                </p>
              </div>

              {/* Core Features list */}
              <div className="space-y-3 bg-indigo-50/40 rounded-2xl p-4 border border-indigo-50">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Direct Download & Upload Permissions</h4>
                    <p className="text-[11px] text-gray-500">Unlock instant study guide downloading, direct file publishing, and permanent cloud-synced backups.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Instant AI Revision Outlines</h4>
                    <p className="text-[11px] text-gray-500">Get tailored revision sheets and doubt resolutions instantly from the AI Assistant.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Community Reputation</h4>
                    <p className="text-[11px] text-gray-500">Gain reputation points and verify resources as a certified contributor.</p>
                  </div>
                </div>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4.5 py-3.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-xs text-gray-500 hover:text-indigo-600 font-bold transition-all cursor-pointer"
                >
                  Keep browsing as guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Custom Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-50 bg-rose-50/50">
              <span className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
                <Trash2 className="w-4 h-4 text-rose-600 animate-pulse" />
                Confirm Resource Deletion
              </span>
              <button 
                onClick={() => {
                  setResourceToDelete(null);
                  setDeleteConfirmTitleInput("");
                }} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 text-left space-y-1">
                <p className="text-xs font-bold text-rose-900">Warning: This Action is Permanent!</p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  You are about to permanently delete this study material. Other students and class members will immediately lose access to this file. This action cannot be undone.
                </p>
              </div>

              <div className="space-y-1 bg-slate-50 border border-gray-100 rounded-xl p-3.5 text-left">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Document to Delete</p>
                <p className="text-xs font-bold text-gray-800 break-words">{resourceToDelete.title}</p>
                <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="font-medium text-indigo-600">Subject: {resourceToDelete.subject}</span>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-emerald-600">Category: {resourceToDelete.category}</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-xs font-semibold text-gray-700">
                  To confirm, type the exact document title below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmTitleInput}
                  onChange={(e) => setDeleteConfirmTitleInput(e.target.value)}
                  placeholder="Type or paste document title here..."
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-gray-400">
                  Case-insensitive. Matching the title verifies you wish to discard this study material.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setResourceToDelete(null);
                    setDeleteConfirmTitleInput("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmTitleInput.trim().toLowerCase() !== resourceToDelete.title.trim().toLowerCase()}
                  onClick={() => handleDeleteResource(resourceToDelete.id)}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all cursor-pointer ${
                    deleteConfirmTitleInput.trim().toLowerCase() === resourceToDelete.title.trim().toLowerCase()
                      ? "bg-rose-600 hover:bg-rose-700 shadow-sm"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <User className="w-5 h-5 text-indigo-600" />
                Student Academic Profile
              </span>
              <button 
                onClick={() => setShowProfileEdit(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              
              {/* Google Connection Section */}
              <div className="bg-slate-50 border border-gray-150 rounded-xl p-3 text-center space-y-2">
                {auth.currentUser && !auth.currentUser.isAnonymous ? (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-medium">Connected as</p>
                    <p className="text-xs font-bold text-gray-800">{auth.currentUser.email}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signOut(auth);
                          setShowProfileEdit(false);
                        } catch (err) {
                          console.error("Sign out failed", err);
                        }
                      }}
                      className="px-3 py-1 bg-white border border-gray-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      Sign Out Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-medium leading-normal">
                      Connect your Google Account to automatically sync your bookmarks, reviews, and uploads to the cloud!
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signInWithPopup(auth, googleProvider);
                          setShowProfileEdit(false);
                        } catch (err) {
                          console.error("Google login failed", err);
                          alert("Google sign-in failed. Please ensure popups are allowed in your browser.");
                        }
                      }}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-[10px] font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Account Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="student">School or College Student</option>
                  <option value="teacher">Teacher or Professor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Course / Class (e.g. BTech CSE, Class 12, BCA, UPSC)</label>
                <input
                  type="text"
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  placeholder="e.g. BTech CSE, Class 12 Science"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">School / College / Institute Name</label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  placeholder="e.g. DTU, Delhi University"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview + AI Assistant Split Pane Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            
            {/* Modal Title bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-extrabold uppercase">
                  {previewResource.category}
                </span>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{previewResource.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {profile && (profile.id === previewResource.uploadedBy || profile.role === "admin") && (
                  <button
                    onClick={() => {
                      setResourceToDelete(previewResource);
                      setDeleteConfirmTitleInput("");
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Delete study resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Resource</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewResource(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Double Column Split Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
              
              {/* Left Column: Resource Document Details & Preview Content */}
              <div className="lg:col-span-3 p-6 overflow-y-auto space-y-6 border-r border-gray-100">
                
                {/* File description, metadata */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 leading-relaxed">{previewResource.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] text-gray-500">
                    <div>
                      <span>Subject:</span> <strong className="text-gray-800 font-semibold">{previewResource.subject}</strong>
                    </div>
                    <div>
                      <span>Course/Class:</span> <strong className="text-gray-800 font-semibold">{previewResource.course}</strong>
                    </div>
                    <div>
                      <span>Year/Semester:</span> <strong className="text-gray-800 font-semibold">{previewResource.year}</strong>
                    </div>
                    {previewResource.college && (
                      <div className="col-span-2">
                        <span>Institution:</span> <strong className="text-gray-800 font-semibold">{previewResource.college}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main preview box */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Document Preview</h4>
                  
                  {previewResource.fileType === "text" && previewResource.content ? (
                    <div className="bg-gray-950 text-gray-100 rounded-xl p-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-gray-800 max-h-[300px] overflow-y-auto">
                      {previewResource.content}
                    </div>
                  ) : previewResource.fileUrl && (previewResource.fileUrl.startsWith("data:image/") || previewResource.fileType === "image") ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-slate-100 flex justify-center p-3 max-h-[350px]">
                      <img 
                        src={previewResource.fileUrl} 
                        alt={previewResource.title} 
                        referrerPolicy="no-referrer"
                        className="object-contain max-h-[320px] w-auto shadow-xs rounded-lg" 
                      />
                    </div>
                  ) : previewResource.fileUrl && previewResource.fileUrl.startsWith("data:application/pdf") ? (
                    <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-indigo-100 mx-auto text-rose-500">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900">Direct PDF Document (.pdf)</h5>
                        <p className="text-[10px] text-gray-500 mt-1 max-w-md mx-auto">
                          This file was uploaded directly from a student's device. Download it now to read in full resolution on your local viewer.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(previewResource)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download & Open PDF
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 bg-gray-50 rounded-xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-100 mx-auto">
                        <FileText className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900">PDF / External Document File</h5>
                        <p className="text-[10px] text-gray-500 mt-1">
                          This is an uploaded cloud document. Click below to download or view the complete original file on Google Drive.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(previewResource)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </button>
                    </div>
                  )}
                </div>

                {/* Likes / Download bar */}
                <div className="flex items-center justify-between border-t border-b border-gray-100 py-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(previewResource.id)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{previewResource.likesCount} student recommendations</span>
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-600">
                      Downloaded {previewResource.downloadCount} times
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(previewResource)}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl transition-all"
                  >
                    Get Original Document
                  </button>
                </div>

                {/* Real-time Comments Section */}
                <CommentsSection
                  resourceId={previewResource.id}
                  currentUser={profile}
                />

              </div>

              {/* Right Column: AI Assistant for Interactive Study */}
              <div className="lg:col-span-2 p-6 bg-slate-50 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-200" />
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">AI Reading Assistant</h4>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    This document is loaded into your active workspace. Generate bullet summaries, quiz yourself on core exam questions, or ask specific doubts.
                  </p>
                  
                  <StudyAssistantPanel
                    resource={previewResource}
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
