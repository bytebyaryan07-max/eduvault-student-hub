import React, { useState, useRef } from "react";
import { X, Upload, FileText, Globe, Tag, AlertCircle, File, Trash2, Check } from "lucide-react";
import { EducationalResource, ResourceCategory } from "../types";

interface UploadModalProps {
  onClose: () => void;
  onUpload: (resourceData: Omit<EducationalResource, "id" | "uploadedBy" | "uploadedByName" | "uploadedAt" | "downloadCount" | "likesCount" | "isApproved">) => Promise<void>;
}

export default function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("Notes");
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("1st Year");
  
  // New flexible upload methods
  const [uploadMethod, setUploadMethod] = useState<"device" | "link" | "text">("device");
  const [fileType, setFileType] = useState<"pdf" | "docx" | "image" | "text" | "link">("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [content, setContent] = useState("");
  
  // Direct file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories: ResourceCategory[] = [
    "Notes",
    "Previous Year Question Paper",
    "Assignment",
    "Practical File",
    "Book",
    "Lab Manual",
    "Syllabus",
    "Study Material"
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;

    // Check size (Firestore size limit per document is 1MB, so we keep files up to 1.5MB max to allow comfortable storage)
    if (file.size > 1.5 * 1024 * 1024) {
      setError("To ensure fast, reliable synchronization across student accounts, direct file uploads are optimized to 1.5MB. For larger textbooks or files, please select the 'Cloud Link' method below.");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Auto-fill Title if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
    if (!title) {
      setTitle(cleanName.replace(/[_-]/g, " "));
    }

    // Auto-detect type
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith(".pdf")) {
      setFileType("pdf");
    } else if (nameLower.endsWith(".docx") || nameLower.endsWith(".doc")) {
      setFileType("docx");
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(nameLower)) {
      setFileType("image");
    } else {
      setFileType("pdf"); // Fallback
    }

    // Read file as Base64 data url
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setError("Failed to process the selected file from your device.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !course.trim()) {
      setError("Please fill in all required fields (Title, Subject, Course).");
      return;
    }

    if (uploadMethod === "device" && !selectedFile) {
      setError("Please select or drag-and-drop a file from your device first.");
      return;
    }

    if (uploadMethod === "link" && !fileUrl.trim()) {
      setError("Please provide a valid document URL or sharing link.");
      return;
    }

    if (uploadMethod === "text" && !content.trim()) {
      setError("Please write or paste study material notes in the content workspace.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onUpload({
        title: title.trim(),
        description: description.trim(),
        category,
        subject: subject.trim(),
        course: course.trim(),
        college: college.trim() || undefined,
        year,
        fileType: uploadMethod === "text" ? "text" : fileType,
        fileUrl: uploadMethod === "text" ? "" : fileUrl,
        content: uploadMethod === "text" ? content : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit resource. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Upload Study Resource</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resource Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 2 - Electrostatics Revision Notes"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what chapters, topics, or chapters are included in this document..."
                rows={2}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Physics, Chemistry"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Course / Stream */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Course / Stream / Class <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BTech CSE, Class 12, UPSC, BCA"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Year / Semester */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Year / Semester
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 1st Year, Semester 4, 2026"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* School / College */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                School / College / Institute Name (Optional)
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. DTU Delhi, IIT Bombay, VIT, Kendriya Vidyalaya"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Upload Method Selector */}
            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <span className="block text-xs font-semibold text-gray-700 mb-2">
                Document Upload Method
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod("device");
                    setError("");
                  }}
                  className={`px-3 py-2 text-xs font-bold border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    uploadMethod === "device"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod("link");
                    setError("");
                  }}
                  className={`px-3 py-2 text-xs font-bold border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    uploadMethod === "link"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Cloud / URL Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod("text");
                    setError("");
                    setFileType("text");
                  }}
                  className={`px-3 py-2 text-xs font-bold border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    uploadMethod === "text"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Write Notes</span>
                </button>
              </div>
            </div>

            {/* Render conditional inputs */}
            {uploadMethod === "device" && (
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Select Study File <span className="text-rose-500">*</span>
                </label>
                
                {!selectedFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
                        : "border-gray-200 hover:border-indigo-400 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">Drag and drop your file here, or browse</p>
                    <p className="text-[10px] text-gray-400 mt-1">Supports PDF, DOCX, and high-quality study images (Max 1.5MB)</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 font-mono">
                          <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Ready to save
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {uploadMethod === "link" && (
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cloud Share Link or Document URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/file/d/... or http://example.com/syllabus.pdf"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Make sure you set the link permissions to 'Anyone with the link can view'.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Document File Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx / .doc)</option>
                    <option value="image">Image (.png / .jpg)</option>
                    <option value="link">Other Website Link</option>
                  </select>
                </div>
              </div>
            )}

            {uploadMethod === "text" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Study Notes / Markdown Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Enter your notes here... Supports Markdown headers, lists, bold text, code, etc."
                  rows={8}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}

          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isSubmitting ? "Uploading file..." : "Publish Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
