"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Trophy, TrendingUp, AlertCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Evaluation {
  id: string;
  resumeId: string;
  jobId: string;
  overallScore: string;
  skillsScore: string;
  experienceScore: string;
  educationScore: string;
  breakdown: Record<string, unknown>;
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed unused state variables

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('/api/evaluations');
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-blue-600';
    if (numScore >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (numScore >= 60) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (numScore >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRecommendationIcon = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return <Trophy className="h-4 w-4 text-green-600" />;
    if (numScore >= 60) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Evaluation Results</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          {evaluations.length} evaluations
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Evaluation #{evaluation.id.slice(-6)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(evaluation.overallScore)}
                  {getScoreBadge(evaluation.overallScore)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Score</span>
                  <span className={`font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {parseFloat(evaluation.overallScore).toFixed(1)}%
                  </span>
                </div>
                <Progress value={parseFloat(evaluation.overallScore)} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Skills</div>
                  <div className={`font-semibold ${getScoreColor(evaluation.skillsScore)}`}>
                    {evaluation.skillsScore ? parseFloat(evaluation.skillsScore).toFixed(0) : 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className={`font-semibold ${getScoreColor(evaluation.experienceScore)}`}>
                    {evaluation.experienceScore ? parseFloat(evaluation.experienceScore).toFixed(0) : 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Education</div>
                  <div className={`font-semibold ${getScoreColor(evaluation.educationScore)}`}>
                    {evaluation.educationScore ? parseFloat(evaluation.educationScore).toFixed(0) : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Created: {formatDate(evaluation.createdAt)}
              </div>

              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-green-700">Top Strengths:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {evaluation.strengths.slice(0, 2).map((strength, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Evaluation Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {parseFloat(evaluation.overallScore).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {evaluation.skillsScore ? parseFloat(evaluation.skillsScore).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {evaluation.experienceScore ? parseFloat(evaluation.experienceScore).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {evaluation.educationScore ? parseFloat(evaluation.educationScore).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Education</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Recommendation:</h4>
                      <p className="text-sm text-muted-foreground">{evaluation.recommendation}</p>
                    </div>

                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-700">Strengths:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {evaluation.strengths.map((strength, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-700">Areas for Improvement:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {evaluation.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {evaluations.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No evaluations yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by uploading resumes and job descriptions to see evaluation results
          </p>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/resumes'}>
              Upload Resumes
            </Button>
            <Button onClick={() => window.location.href = '/dashboard/jobs'}>
              Create Jobs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}