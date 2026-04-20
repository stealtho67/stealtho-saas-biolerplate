import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Scissors, MapPin, User, FileText, Upload,
  CheckCircle2, Loader2, Plus, X, ArrowLeft, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Skills & Bio", icon: Scissors },
  { id: 4, label: "License", icon: FileText },
];

const SPECIALTY_SUGGESTIONS = [
  "Fades", "Beard Trim", "Line-ups", "Hot Towel Shave", "Kids Cuts",
  "Afro Styling", "Braids", "Dreadlocks", "Color", "Straight Razor",
  "Taper", "Designs", "Mohawks", "Classic Cuts"
];

export default function BarberApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [licenseImage, setLicenseImage] = useState("");
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const uploadProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfilePhoto(file_url);
    setPhotoUploading(false);
  };

  const uploadLicense = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLicenseImage(file_url);
    setLicenseUploading(false);
  };

  const toggleSpecialty = (s) => {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addCustomSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties(prev => [...prev, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const canProceed = () => {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return city.trim().length > 0;
    if (step === 3) return bio.trim().length > 10;
    if (step === 4) return true; // license optional but encouraged
    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return; // prevent double-submit
    setSubmitting(true);
    setSubmitError("");

    try {
      const me = await base44.auth.me();

      // Guard: prevent duplicate barber records for same email
      const existing = await base44.entities.Barber.filter({ user_email: me.email });
      if (existing.length > 0) {
        setSubmitError("You already have a barber application on file. Check your dashboard.");
        setSubmitting(false);
        return;
      }

      // 1. Create the barber record first (most critical step)
      await base44.entities.Barber.create({
        user_email: me.email,
        display_name: displayName,
        bio,
        city,
        neighborhood,
        years_experience: yearsExp ? parseInt(yearsExp) : undefined,
        specialties,
        profile_photo: profilePhoto || "",
        license_image: licenseImage || "",
        license_verified: false,
        status: "pending",
        rating: 0,
        total_reviews: 0,
        total_bookings: 0,
        is_available_now: false,
        is_featured: false,
        stripe_status: "not_connected",
        stripe_onboarding_complete: false,
        payouts_enabled: false,
      });

      // 2. Update role — do this AFTER barber record is saved
      await base44.auth.updateMe({ role: "barber" });

      // 3. Send confirmation email — fire and forget, never block submit
      base44.integrations.Core.SendEmail({
        to: me.email,
        subject: "NextCut — Application Received!",
        body: `Hi ${displayName},\n\nWe've received your barber application on NextCut. Our team will review it and get back to you within 1-2 business days.\n\nThanks for joining!\n— The NextCut Team`
      }).catch(() => {}); // intentionally non-blocking

      setDone(true);
    } catch (err) {
      console.error("Barber application submit error:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-24 md:pb-0">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-heading font-bold text-2xl mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-2">
            Thanks, <strong>{displayName}</strong>! Your barber application is now under review.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Our team typically reviews applications within 1–2 business days. You'll be notified once approved.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-6">
            🕐 Your profile is <strong>pending approval</strong>. You won't appear in the marketplace until an admin approves your application.
          </div>
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 backdrop-blur-xl bg-card/80">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/profile")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-base">Barber Application</h1>
            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="max-w-lg mx-auto mt-3 flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${s.id <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  s.id < step ? "bg-primary text-white" :
                  s.id === step ? "bg-primary text-white ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s.id < step ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                {s.id < STEPS.length && <div className={`w-8 h-0.5 ${s.id < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl">Tell us about yourself</h2>
              <p className="text-muted-foreground text-sm mt-1">This is how clients will see you on the platform.</p>
            </div>

            {/* Profile photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : photoUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3.5 h-3.5 mr-1.5" /> {profilePhoto ? "Change Photo" : "Upload Photo"}</span>
                </Button>
              </Label>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={uploadProfilePhoto} />
              <p className="text-xs text-muted-foreground">A professional photo increases bookings by 3x</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Marcus Cole"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl">Where do you work?</h2>
              <p className="text-muted-foreground text-sm mt-1">Clients search by location — be specific for better matches.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">City <span className="text-red-500">*</span></Label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Los Angeles"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Neighborhood <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="e.g. Hollywood, Downtown"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Years of Experience <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  value={yearsExp}
                  onChange={e => setYearsExp(e.target.value)}
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g. 5"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl">Your skills & story</h2>
              <p className="text-muted-foreground text-sm mt-1">A great bio helps clients trust you before they book.</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Bio <span className="text-red-500">*</span></Label>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell clients about your experience, your style, and what makes you unique as a barber..."
                className="mt-1.5 resize-none"
                rows={4}
              />
              <p className={`text-xs mt-1 ${bio.length < 10 ? "text-muted-foreground" : "text-emerald-600"}`}>
                {bio.length} characters {bio.length < 10 ? "(minimum 10)" : "✓"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Specialties</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      specialties.includes(s)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {specialties.includes(s) && "✓ "}{s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add custom specialty..."
                  value={newSpecialty}
                  onChange={e => setNewSpecialty(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustomSpecialty()}
                  className="flex-1 h-9"
                />
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={addCustomSpecialty}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {specialties.filter(s => !SPECIALTY_SUGGESTIONS.includes(s)).map(s => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button onClick={() => toggleSpecialty(s)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl">License & Verification</h2>
              <p className="text-muted-foreground text-sm mt-1">Uploading your license earns you the Verified badge and builds client trust.</p>
            </div>

            <div className="p-4 bg-accent rounded-xl border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Why upload your license?</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <li>• Get the ✓ Verified badge on your profile</li>
                    <li>• Rank higher in search results</li>
                    <li>• Build instant trust with new clients</li>
                  </ul>
                </div>
              </div>
            </div>

            {licenseImage ? (
              <div className="relative">
                <img src={licenseImage} alt="License" className="w-full rounded-xl border border-border object-contain max-h-48" />
                <button
                  onClick={() => setLicenseImage("")}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> License uploaded
                </p>
              </div>
            ) : (
              <Label htmlFor="license-upload" className="cursor-pointer block">
                <div className={`p-10 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center text-center ${licenseUploading ? "border-primary" : "border-border hover:border-primary"}`}>
                  {licenseUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  )}
                  <p className="font-medium text-sm">{licenseUploading ? "Uploading..." : "Upload Barber License"}</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF accepted</p>
                </div>
              </Label>
            )}
            <input id="license-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={uploadLicense} />

            <p className="text-xs text-muted-foreground text-center">
              You can also skip this step and upload your license later from your profile.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting} className="flex-1 h-12 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : "Submit Application 🎉"}
            </Button>
          )}
        </div>
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}