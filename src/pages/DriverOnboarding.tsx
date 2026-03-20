import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ERideLogo from "@/components/ERideLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileCheck, Car, GraduationCap, CheckCircle2, AlertCircle,
  ChevronRight, ChevronLeft, Camera, Shield, Clock
} from "lucide-react";

type DocumentStatus = "pending" | "uploaded";

interface DocumentUpload {
  name: string;
  label: string;
  file: File | null;
  status: DocumentStatus;
  expiryDate: string;
}

interface VehicleCheck {
  id: string;
  label: string;
  checked: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "A rider selects 'Silent Trip'. What should you do?",
    options: [
      "Greet them and chat normally",
      "Greet briefly, then minimize conversation",
      "Don't say anything at all",
      "Play loud music to fill the silence",
    ],
    correctIndex: 1,
  },
  {
    question: "How do you verify a rider before starting the trip?",
    options: [
      "Ask their name",
      "Check their profile photo",
      "Request the 4-digit OTP",
      "Start driving immediately",
    ],
    correctIndex: 2,
  },
  {
    question: "A rider triggers the SOS button. What happens?",
    options: [
      "Nothing, it's just for show",
      "An alert is sent to eRide admin with trip coordinates",
      "The trip is cancelled automatically",
      "The police are called directly",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the correct procedure during an errand stop?",
    options: [
      "Leave the location and return later",
      "Wait at the stop for the selected time, meter running",
      "Cancel the trip and request a new one",
      "Charge a flat fee regardless of wait time",
    ],
    correctIndex: 1,
  },
  {
    question: "A Gold Member books a ride during surge pricing. What fare applies?",
    options: [
      "2x surge pricing",
      "Standard surge pricing (1.5x)",
      "No surge — 0% surge for Gold Members",
      "Half the surge rate",
    ],
    correctIndex: 2,
  },
];

const STEPS = [
  { icon: Upload, label: "Documents" },
  { icon: Car, label: "Vehicle" },
  { icon: GraduationCap, label: "Training" },
  { icon: CheckCircle2, label: "Complete" },
];

export default function DriverOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1 state
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { name: "national_id", label: "National ID (Front & Back)", file: null, status: "pending", expiryDate: "" },
    { name: "psv_license", label: "PSV License", file: null, status: "pending", expiryDate: "" },
    { name: "ntsa_badge", label: "NTSA Badge", file: null, status: "pending", expiryDate: "" },
    { name: "good_conduct", label: "Certificate of Good Conduct", file: null, status: "pending", expiryDate: "" },
  ]);

  // Step 2 state
  const [vehicleChecks, setVehicleChecks] = useState<VehicleCheck[]>([
    { id: "ac", label: "Is the AC functional?", checked: false },
    { id: "firstaid", label: "Do you have a First Aid kit?", checked: false },
    { id: "model", label: "Is the vehicle model 2018 or newer?", checked: false },
  ]);
  const [vehiclePhotos, setVehiclePhotos] = useState<{ label: string; file: File | null }[]>([
    { label: "Front View", file: null },
    { label: "Side View", file: null },
    { label: "Interior View", file: null },
  ]);

  // Step 3 state
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleDocUpload = (index: number, file: File | null) => {
    setDocuments((prev) => prev.map((d, i) => i === index ? { ...d, file, status: file ? "uploaded" : "pending" } : d));
  };

  const handleDocExpiry = (index: number, date: string) => {
    setDocuments((prev) => prev.map((d, i) => i === index ? { ...d, expiryDate: date } : d));
  };

  const handleVehiclePhoto = (index: number, file: File | null) => {
    setVehiclePhotos((prev) => prev.map((p, i) => i === index ? { ...p, file } : p));
  };

  const canProceedStep1 = documents.every((d) => d.status === "uploaded" && d.expiryDate);
  const canProceedStep2 = vehicleChecks.every((c) => c.checked) && vehiclePhotos.every((p) => p.file);

  const handleQuizSubmit = () => {
    const allCorrect = quizAnswers.every((a, i) => a === QUIZ_QUESTIONS[i].correctIndex);
    setQuizSubmitted(true);
    setQuizPassed(allCorrect);
    if (allCorrect) {
      toast({ title: "Quiz Passed!", description: "You scored 100%. Proceeding to final step." });
    } else {
      toast({ title: "Quiz Failed", description: "You must score 100% to proceed. Please review and retry.", variant: "destructive" });
    }
  };

  const handleSubmitApplication = () => {
    const existing = JSON.parse(localStorage.getItem("eride_driver_applications") || "[]");
    existing.push({
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      documents: documents.map((d) => ({ name: d.label, expiry: d.expiryDate })),
      vehicleChecks: vehicleChecks.map((c) => ({ label: c.label, passed: c.checked })),
      quizScore: "100%",
    });
    localStorage.setItem("eride_driver_applications", JSON.stringify(existing));
    toast({ title: "Application Submitted!", description: "You'll be notified once an admin reviews your profile." });
  };

  const nextStep = () => {
    if (currentStep === 0 && !canProceedStep1) {
      toast({ title: "Incomplete", description: "Upload all documents with expiry dates.", variant: "destructive" });
      return;
    }
    if (currentStep === 1 && !canProceedStep2) {
      toast({ title: "Incomplete", description: "Complete all checks and upload vehicle photos.", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && !quizPassed) {
      toast({ title: "Quiz Required", description: "Pass the quiz with 100% to continue.", variant: "destructive" });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-panel px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <ERideLogo size="sm" />
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            <Shield className="w-3 h-3 mr-1" /> Driver Verification
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={step.label} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

            {/* STEP 1: Documents */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Document Upload</h2>
                  <p className="text-sm text-muted-foreground mt-1">Upload required verification documents. We'll remind you 7 days before any document expires.</p>
                </div>
                {documents.map((doc, i) => (
                  <Card key={doc.name} className="border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{doc.label}</Label>
                        {doc.status === "uploaded" && <Badge className="bg-primary/15 text-primary text-[10px]"><FileCheck className="w-3 h-3 mr-1" />Uploaded</Badge>}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`file-${doc.name}`} className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-input bg-muted/50 cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                            <Upload className="w-4 h-4" />
                            {doc.file ? doc.file.name.slice(0, 20) : "Choose file"}
                          </Label>
                          <input id={`file-${doc.name}`} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(i, e.target.files?.[0] || null)} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="date" value={doc.expiryDate} onChange={(e) => handleDocExpiry(i, e.target.value)} className="h-9 text-sm" placeholder="Expiry date" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* STEP 2: Vehicle Inspection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Vehicle Inspection</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confirm your vehicle meets eRide's safety and quality standards.</p>
                </div>
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Safety Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vehicleChecks.map((check, i) => (
                      <label key={check.id} className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox checked={check.checked} onCheckedChange={(checked) => setVehicleChecks((prev) => prev.map((c, ci) => ci === i ? { ...c, checked: !!checked } : c))} />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{check.label}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Vehicle Photos</CardTitle>
                    <CardDescription>Upload clear photos of your vehicle.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    {vehiclePhotos.map((photo, i) => (
                      <div key={photo.label}>
                        <Label htmlFor={`photo-${i}`} className="flex flex-col items-center justify-center gap-1.5 aspect-square rounded-lg border-2 border-dashed border-input bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                          {photo.file ? (
                            <img src={URL.createObjectURL(photo.file)} alt={photo.label} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground text-center px-1">{photo.label}</span>
                            </>
                          )}
                        </Label>
                        <input id={`photo-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleVehiclePhoto(i, e.target.files?.[0] || null)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: Training & Quiz */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Training & Assessment</h2>
                  <p className="text-sm text-muted-foreground mt-1">Watch the training video and pass the quiz with a perfect score.</p>
                </div>
                <Card className="border-border/60 overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    {!videoWatched ? (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                          <GraduationCap className="w-7 h-7 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">eRide Hospitality Training</p>
                        <Button size="sm" onClick={() => setVideoWatched(true)}>
                          ▶ Watch Training (2 min)
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                        <p className="text-sm font-medium text-foreground">Training Video Completed</p>
                        <p className="text-xs text-muted-foreground">Now complete the quiz below</p>
                      </div>
                    )}
                  </div>
                </Card>

                {videoWatched && (
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Assessment Quiz
                        {quizSubmitted && (
                          <Badge className={quizPassed ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}>
                            {quizPassed ? "Passed" : "Failed"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Score 100% to proceed. Select the best answer for each question.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {QUIZ_QUESTIONS.map((q, qi) => {
                        const isCorrect = quizSubmitted && quizAnswers[qi] === q.correctIndex;
                        const isWrong = quizSubmitted && quizAnswers[qi] !== null && quizAnswers[qi] !== q.correctIndex;
                        return (
                          <div key={qi} className="space-y-2">
                            <p className="text-sm font-medium text-foreground flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">{qi + 1}</span>
                              {q.question}
                            </p>
                            <div className="space-y-1.5 pl-7">
                              {q.options.map((opt, oi) => {
                                const selected = quizAnswers[qi] === oi;
                                const showCorrect = quizSubmitted && oi === q.correctIndex;
                                const showWrong = quizSubmitted && selected && oi !== q.correctIndex;
                                return (
                                  <button
                                    key={oi}
                                    disabled={quizSubmitted && quizPassed}
                                    onClick={() => {
                                      if (quizSubmitted && !quizPassed) {
                                        setQuizSubmitted(false);
                                      }
                                      setQuizAnswers((prev) => prev.map((a, ai) => ai === qi ? oi : a));
                                    }}
                                    className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-all ${
                                      showCorrect ? "border-primary bg-primary/10 text-primary" :
                                      showWrong ? "border-destructive bg-destructive/10 text-destructive" :
                                      selected ? "border-primary bg-primary/5 text-foreground" :
                                      "border-border hover:border-primary/40 text-foreground"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {!quizPassed && (
                        <Button onClick={handleQuizSubmit} disabled={quizAnswers.some((a) => a === null)} className="w-full">
                          {quizSubmitted ? "Retry Quiz" : "Submit Quiz"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 4: Complete */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-glow-pulse">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Application Ready</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    All steps completed. Submit your application for admin review. You'll receive a <span className="text-primary font-medium">Verified</span> badge once approved.
                  </p>
                </div>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  {[
                    { label: "Documents uploaded", icon: FileCheck },
                    { label: "Vehicle inspection passed", icon: Car },
                    { label: "Training quiz — 100%", icon: GraduationCap },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-accent/40">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSubmitApplication} size="lg" className="w-full max-w-sm">
                  Submit Application
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex gap-3 pt-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button onClick={nextStep} className="flex-1">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
