export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: "student" | "teacher" | "admin";
  college?: string;
  course?: string;
  createdAt: string;
}

export type ResourceCategory = 
  | "Notes" 
  | "Previous Year Question Paper" 
  | "Assignment" 
  | "Practical File" 
  | "Book" 
  | "Lab Manual" 
  | "Syllabus" 
  | "Study Material";

export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  fileType: "pdf" | "docx" | "image" | "text" | "link";
  fileUrl: string;
  category: ResourceCategory;
  subject: string;
  course: string; // e.g. "BTech Computer Science", "Class 12 Science", "Diploma Mechanical"
  college?: string;
  year: string; // e.g. "2024", "1st Year", "Semester 3"
  uploadedBy: string; // User UID
  uploadedByName: string; // User Display Name
  uploadedAt: string;
  downloadCount: number;
  likesCount: number;
  content?: string; // Markdown/Text content for raw files / text preview
  isApproved: boolean;
}

export interface Comment {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  rating?: number;
}

export interface Bookmark {
  id: string;
  resourceId: string;
  userId: string;
  addedAt: string;
}

export interface AIRecommendation {
  suggestedSubjectKeys: string[];
  recommendedResourceIds: string[];
  studyAdvice: string;
  trendingTopics: string[];
}
