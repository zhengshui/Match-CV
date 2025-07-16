"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Resume {
  id: string;
  filename: string;
  parsedData: Record<string, unknown>;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await response.json();
        toast({
          title: "Success",
          description: `Resume "${selectedFile.name}" uploaded successfully!`,
        });
        setIsUploadDialogOpen(false);
        setSelectedFile(null);
        fetchResumes();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to upload resume",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Resume</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                </p>
              </div>
              <Button type="submit" disabled={!selectedFile || uploading}>
                {uploading ? "Uploading..." : "Upload Resume"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resumes.map((resume) => (
          <Card key={resume.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {resume.filename}
                </CardTitle>
                <Badge variant="secondary">
                  {resume.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(resume.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                Size: {formatFileSize(resume.fileSize)}
              </div>
              
              {resume.parsedData?.personalInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {resume.parsedData.personalInfo.name || 'Name not found'}
                    </span>
                  </div>
                  {resume.parsedData.personalInfo.email && (
                    <div className="text-sm text-muted-foreground">
                      {resume.parsedData.personalInfo.email}
                    </div>
                  )}
                </div>
              )}

              {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {resume.parsedData.skills.slice(0, 3).map((skillGroup: Record<string, unknown>, index: number) => (
                      (skillGroup.items as string[])?.slice(0, 2).map((skill: string, skillIndex: number) => (
                        <Badge key={`${index}-${skillIndex}`} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Evaluate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resumes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resumes uploaded yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first resume to start evaluating candidates
          </p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            Upload Resume
          </Button>
        </div>
      )}
    </div>
  );
}