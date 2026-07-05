import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, Flame, ArrowRight, Lightbulb, RefreshCw } from "lucide-react";
import { EducationalResource, AIRecommendation, UserProfile } from "../types";

interface AiRecommendationsWidgetProps {
  userProfile: UserProfile | null;
  bookmarks: string[];
  allResources: EducationalResource[];
  searchQuery: string;
  onSelectResource: (resourceId: string) => void;
  onSelectSubject: (subject: string) => void;
}

export default function AiRecommendationsWidget({
  userProfile,
  bookmarks,
  allResources,
  searchQuery,
  onSelectResource,
  onSelectSubject
}: AiRecommendationsWidgetProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Clean resources of heavy Base64 content/fileUrl strings to optimize payload
      const cleanedResources = allResources.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        subject: r.subject,
        course: r.course,
        college: r.college,
        year: r.year,
        description: r.description
      }));

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          bookmarks,
          allResources: cleanedResources,
          query: searchQuery
        })
      });
      const data = await response.json();
      setRecommendation(data);
    } catch (err) {
      console.error("Failed to load AI recommendations:", err);
      // Fallback local recommendations
      setRecommendation({
        suggestedSubjectKeys: ["Computer Science", "Mathematics", "Physics"],
        recommendedResourceIds: allResources.slice(0, 2).map(r => r.id),
        studyAdvice: "Create an active review session by writing down 3 key takeaways after reading any set of study notes.",
        trendingTopics: ["DSA Cracking Guides", "Fourier Transforms", "SQL Mastery"]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once we have initial resources, and refresh whenever user course or profile changes
    if (allResources.length > 0) {
      fetchRecommendations();
    }
  }, [userProfile?.course, userProfile?.role, allResources.length]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-indigo-800">
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
          <h3 className="text-sm font-bold tracking-tight uppercase">AI is analyzing recommendations...</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-indigo-950/50 rounded w-3/4 animate-pulse" />
          <div className="h-10 bg-indigo-950/50 rounded animate-pulse" />
          <div className="h-4 bg-indigo-950/50 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  // Match recommended resource IDs with actual resources
  const recommendedResources = allResources.filter((r) =>
    recommendation.recommendedResourceIds?.includes(r.id)
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900 relative overflow-hidden group">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />
      
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400 animate-pulse" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-200">AI Study Vault Advisor</h3>
        </div>
        <button 
          onClick={fetchRecommendations}
          className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition-all"
          title="Refresh AI Recommendations"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Advice tip */}
      <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-4 mb-5 flex items-start gap-2.5">
        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-100 leading-relaxed italic">
          "{recommendation.studyAdvice}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Suggested subjects */}
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Suggested Subjects
          </span>
          <div className="space-y-2">
            {recommendation.suggestedSubjectKeys?.map((subj) => (
              <button
                key={subj}
                onClick={() => onSelectSubject(subj)}
                className="w-full text-left text-xs bg-slate-800/60 hover:bg-indigo-900/40 hover:border-indigo-500/40 border border-slate-700/60 rounded-lg px-3 py-2 transition-all flex items-center justify-between"
              >
                <span>{subj}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
              </button>
            ))}
            {recommendation.suggestedSubjectKeys?.length === 0 && (
              <p className="text-xs text-gray-400">No subjects suggested yet.</p>
            )}
          </div>
        </div>

        {/* Handpicked Resources */}
        <div className="md:col-span-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
            <Flame className="w-4 h-4 text-indigo-400 animate-pulse" />
            Handpicked materials for you
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendedResources.map((res) => (
              <div
                key={res.id}
                onClick={() => onSelectResource(res.id)}
                className="bg-slate-800/60 hover:bg-indigo-900/30 hover:border-indigo-500/40 border border-slate-700/60 rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">
                      {res.category}
                    </span>
                    <span className="text-[10px] bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded">
                      {res.year}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {res.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                    {res.description}
                  </p>
                </div>
                <div className="text-[10px] text-indigo-300 mt-2 flex items-center justify-between">
                  <span>{res.subject}</span>
                  <span className="font-semibold flex items-center gap-0.5">
                    🚀 Preview →
                  </span>
                </div>
              </div>
            ))}
            {recommendedResources.length === 0 && (
              <div className="sm:col-span-2 bg-slate-800/40 rounded-xl p-4 text-center border border-dashed border-slate-700">
                <p className="text-xs text-gray-400">
                  Bookmark resources or update your Course in your profile to trigger custom AI matchmaking!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
