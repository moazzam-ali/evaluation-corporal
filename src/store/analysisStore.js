import { create } from "zustand";

const useAnalysisStore = create((set, get) => ({
  // Raw data
  analysisData: null,
  isLoading: false,
  error: null,

  // Parsed results
  overallScore: 0,
  skinType: "",
  metrics: [],
  recommendations: [],
  summary: "",
  insights: [],
  tips: [],
  routineNote: "",
  formData: null,
  imageUrl: null,

  // Actions
  fetchAnalysis: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/results?id=${id}`);
      if (!response.ok) {
        throw new Error("Analysis not found");
      }
      const data = await response.json();
      const { results, formData, imageUrl } = data.data;

      set({
        analysisData: data.data,
        overallScore: results.overall_score || 0,
        skinType: results.skin_type || "unknown",
        metrics: results.metrics || [],
        recommendations: results.recommendations || [],
        summary: results.summary || "",
        insights: results.insights || [],
        tips: results.tips || [],
        routineNote: results.routine_note || "",
        formData: formData || null,
        imageUrl: imageUrl || null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  setAnalysisFromResponse: (data) => {
    const { results, formData, imageUrl } = data;
    set({
      analysisData: data,
      overallScore: results.overall_score || 0,
      skinType: results.skin_type || "unknown",
      metrics: results.metrics || [],
      recommendations: results.recommendations || [],
      summary: results.summary || "",
      insights: results.insights || [],
      tips: results.tips || [],
      routineNote: results.routine_note || "",
      formData: formData || null,
      imageUrl: imageUrl || null,
    });
  },

  reset: () => {
    set({
      analysisData: null,
      isLoading: false,
      error: null,
      overallScore: 0,
      skinType: "",
      metrics: [],
      recommendations: [],
      summary: "",
      insights: [],
      tips: [],
      routineNote: "",
      formData: null,
      imageUrl: null,
    });
  },
}));

export default useAnalysisStore;
