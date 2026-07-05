import React from "react";
import { EducationalResource } from "../types";
import { FileText, FileSpreadsheet, Image as ImageIcon, Link as LinkIcon, Download, ThumbsUp, Bookmark, Calendar, School, User, Trash2 } from "lucide-react";

interface ResourceCardProps {
  key?: React.Key;
  resource: EducationalResource;
  isBookmarked: boolean;
  onBookmark: () => void;
  onLike: () => void;
  onDownload: () => void;
  onSelect: () => void;
  onDelete?: () => void;
}

export default function ResourceCard({
  resource,
  isBookmarked,
  onBookmark,
  onLike,
  onDownload,
  onSelect,
  onDelete
}: ResourceCardProps) {
  
  const getIcon = () => {
    switch (resource.fileType) {
      case "text":
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case "docx":
        return <FileSpreadsheet className="w-5 h-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            {getIcon()}
            {resource.category}
          </span>
          <div className="flex items-center gap-1.5">
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150 cursor-pointer"
                title="Delete study resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
              className={`p-1.5 rounded-lg transition-colors duration-150 ${
                isBookmarked 
                  ? "bg-amber-50 text-amber-500 hover:bg-amber-100" 
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
              title={isBookmarked ? "Remove from Bookmarks" : "Add to Bookmarks"}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <h3 
          onClick={onSelect}
          className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-150 cursor-pointer line-clamp-1"
        >
          {resource.title}
        </h3>
        
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2rem]">
          {resource.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-3.5">
          <span className="text-[11px] font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">
            {resource.subject}
          </span>
          <span className="text-[11px] font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">
            {resource.course}
          </span>
          <span className="text-[11px] font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">
            {resource.year}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-gray-100">
        {resource.college && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
            <School className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{resource.college}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>Uploaded by <strong className="text-gray-700 font-medium">{resource.uploadedByName}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{new Date(resource.uploadedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors duration-150"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{resource.likesCount}</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Download className="w-3.5 h-3.5" />
              <span>{resource.downloadCount}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSelect}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-150"
            >
              Preview
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-150 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
