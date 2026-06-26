export interface Skill {
  id: string;
  name: string;
}

export interface SkillTrend {
  skillId: string;
  skillName: string;
  count: number;
}

export interface DemandBreakdownPoint {
  label: string;
  count: number;
}

export interface JobPosting {
  id: string;
  companyName: string;
  designation: string;
  location?: string;
  level?: string;
  industry?: string;
  employeeCount?: number;
  totalApplicants?: number;
  skills: string[];
}

export interface ResumeAnalysisResult {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

export interface ApiError {
  error: string;
  message: string;
}
