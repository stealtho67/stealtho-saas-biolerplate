import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, User, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";

const SPECIALTY_SUGGESTIONS = [
  "Fades", "Beard Trim", "Line-ups", "Hot Towel Shave", "Kids Cuts",
  "Afro Styling", "Braids", "Dreadlocks", "Color", "Straight Razor",
  "Taper", "Designs", "Mohawks", "Classic Cuts"
];

export default function ProfileEditor({ barber, onSaved }) {
  const [displayName, setDisplayName] = useState(barber.display_name || "");
  const [bio, setBio] = useState(barber.bio || "");
  const [city, setCity] = useState(barber.city || "");
  const [neighborhood, setNeighborhood] = useState(barber.neighborhood || "");
  const [yearsExp, setYearsExp] = useState(barber.years_experience?.toString() || "");
  const [specialties, setSpecialties] = useState(barber.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [isAvailable, setIsAvailable] = useState(barber.is_available_now || false);
  const [profilePhoto, setProfilePhoto] = useState(barber.profile_photo || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfilePhoto(file_url);
    setPhotoUploading(false);
  };

  const toggleSpecialty = (s) => {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const save = async () => {
    if (!displayName.trim()) { toast.error("Display name is required"); return; }
    if (!city.trim()) { toast.error("City is required"); return; }
    setSaving(true);
    await base44.entities.Barber.update(barber.id, {
      display_name: displayName,
      bio,
      city,
      neighborhood,
      years_experience: yearsExp ? parseInt(yearsExp) : undefined,
      specialties,
      is_available_now: isAvailable,
      profile_photo: profilePhoto,
    });
    setSaving(false);
    toast.success("Profile saved!");
    onSaved?.({ ...barber, display_name: displayName, bio, city, neighborhood, years_experience: yearsExp ? parseInt(yearsExp) : undefined, specialties, is_available_now: isAvailable, profile_photo: profilePhoto });
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
          {profilePhoto ? (
            <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
          ) : photoUploading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground/30" /></div>
          )}
        </div>
        <div>
          <Label htmlFor="prof-photo" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-3.5 h-3.5 mr-1.5" />{profilePhoto ? "Change Photo" : "Upload Photo"}</span>
            </Button>
          </Label>
          <input id="prof-photo" type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          <p className="text-xs text-muted-foreground mt-1">Professional photo = more bookings</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs font-medium">Display Name *</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1" placeholder="Your barber name" />
        </div>
        <div>
          <Label className="text-xs font-medium">Years of Experience</Label>
          <Input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value)} className="mt-1" placeholder="e.g. 5" min="0" max="50" />
        </div>
        <div>
          <Label className="text-xs font-medium">City *</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1" placeholder="e.g. Los Angeles" />
        </div>
        <div>
          <Label className="text-xs font-medium">Neighborhood</Label>
          <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="mt-1" placeholder="e.g. Hollywood" />
        </div>
      </div>

      {/* Bio */}
      <div>
        <Label className="text-xs font-medium">Bio</Label>
        <Textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1 resize-none" rows={4} placeholder="Tell clients about your experience and style..." />
        <p className="text-xs text-muted-foreground mt-1">{bio.length} characters</p>
      </div>

      {/* Specialties */}
      <div>
        <Label className="text-xs font-medium">Specialties</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SPECIALTY_SUGGESTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggleSpecialty(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                specialties.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}>
              {specialties.includes(s) && "✓ "}{s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input placeholder="Custom specialty..." value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newSpecialty.trim()) { toggleSpecialty(newSpecialty.trim()); setNewSpecialty(""); }}}
            className="flex-1 h-9" />
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { if (newSpecialty.trim()) { toggleSpecialty(newSpecialty.trim()); setNewSpecialty(""); }}}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {specialties.filter(s => !SPECIALTY_SUGGESTIONS.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specialties.filter(s => !SPECIALTY_SUGGESTIONS.includes(s)).map(s => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">{s}
                <button onClick={() => toggleSpecialty(s)}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
        <div>
          <p className="text-sm font-medium">Available Now</p>
          <p className="text-xs text-muted-foreground">Show clients you're ready for walk-ins</p>
        </div>
        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
      </div>

      <Button onClick={save} disabled={saving} className="w-full h-11">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Profile
      </Button>
    </div>
  );
}