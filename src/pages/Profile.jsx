import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { User, Scissors, Upload, Loader2, BadgeCheck, Plus, X, Trash2, Shield, Zap } from "lucide-react";
import { stripeStatusInfo } from "@/lib/stripeConfig";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBarber, setIsBarber] = useState(false);

  // Barber form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [portfolioImages, setPortfolioImages] = useState([]);

  // Service form
  const [newService, setNewService] = useState({ service_name: "", price: "", duration_minutes: "", description: "", category: "haircut" });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const isBrb = me?.role === "barber";
    setIsBarber(isBrb);

    if (isBrb) {
      const barbers = await base44.entities.Barber.filter({ user_email: me.email });
      if (barbers.length > 0) {
        const b = barbers[0];
        setBarber(b);
        setDisplayName(b.display_name || "");
        setBio(b.bio || "");
        setCity(b.city || "");
        setNeighborhood(b.neighborhood || "");
        setYearsExp(b.years_experience?.toString() || "");
        setSpecialties(b.specialties || []);
        setIsAvailable(b.is_available_now || false);
        setProfilePhoto(b.profile_photo || "");
        setPortfolioImages(b.portfolio_images || []);

        const svc = await base44.entities.Service.filter({ barber_id: b.id });
        setServices(svc);
      }
    }
    setLoading(false);
  };

  const becomeBarber = async () => {
    setSaving(true);
    await base44.auth.updateMe({ role: "barber" });
    const newBarber = await base44.entities.Barber.create({
      user_email: user.email,
      display_name: user.full_name,
      city: "",
      status: "active",
    });
    setBarber(newBarber);
    setIsBarber(true);
    setDisplayName(user.full_name);
    setSaving(false);
    toast.success("Welcome! Set up your barber profile.");
  };

  const saveProfile = async () => {
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
      portfolio_images: portfolioImages,
    });
    setSaving(false);
    toast.success("Profile updated!");
  };

  const uploadPhoto = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (type === "profile") {
      setProfilePhoto(file_url);
    } else {
      setPortfolioImages(prev => [...prev, file_url]);
    }
  };

  const uploadLicense = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Barber.update(barber.id, { license_image: file_url });
    toast.success("License uploaded! Verification pending.");
  };

  const addService = async () => {
    if (!newService.service_name || !newService.price) return;
    const created = await base44.entities.Service.create({
      ...newService,
      barber_id: barber.id,
      price: parseFloat(newService.price),
      duration_minutes: parseInt(newService.duration_minutes) || 30,
    });
    setServices(prev => [...prev, created]);
    setNewService({ service_name: "", price: "", duration_minutes: "", description: "", category: "haircut" });
    toast.success("Service added!");
  };

  const deleteService = async (serviceId) => {
    await base44.entities.Service.delete(serviceId);
    setServices(prev => prev.filter(s => s.id !== serviceId));
    toast.success("Service removed");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  // Non-barber view (client or admin)
  if (!isBarber) {
    const roleLabel = isAdmin ? "Admin" : "Client";
    const roleBgColor = isAdmin ? "bg-red-100 text-red-700" : "bg-secondary text-secondary-foreground";
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8">
        <h1 className="font-heading font-bold text-2xl mb-6">My Profile</h1>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isAdmin ? "bg-red-50" : "bg-primary/10"}`}>
              {isAdmin ? <Shield className="w-7 h-7 text-red-600" /> : <User className="w-7 h-7 text-primary" />}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg">{user?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className={`mt-1 border-0 ${roleBgColor}`}>{roleLabel}</Badge>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-card rounded-2xl border border-red-200 p-6 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-red-600" />
              <h3 className="font-heading font-semibold">Admin Controls</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Manage the NextCut platform, approve barbers, and track revenue.</p>
            <Link to="/admin" className="block">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                <Shield className="w-4 h-4 mr-2" /> Open Admin Dashboard
              </Button>
            </Link>
          </div>
        )}

        {!isAdmin && (
          <div className="bg-card rounded-2xl border border-border p-6 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Scissors className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-semibold">Are you a barber?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Join NextCut as a barber to get clients, manage bookings, and grow your business.
            </p>
            <Link to="/apply" className="block">
              <Button className="w-full">Apply as a Barber</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Barber view
  const stripeInfo = stripeStatusInfo(barber?.stripe_status || "not_connected");
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Barber Profile</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${stripeInfo.bg} ${stripeInfo.color}`}>
          <Zap className="w-3 h-3 inline mr-1" />{stripeInfo.label}
        </span>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full bg-secondary rounded-xl h-11">
          <TabsTrigger value="profile" className="flex-1 rounded-lg">Profile</TabsTrigger>
          <TabsTrigger value="services" className="flex-1 rounded-lg">Services</TabsTrigger>
          <TabsTrigger value="portfolio" className="flex-1 rounded-lg">Portfolio</TabsTrigger>
          <TabsTrigger value="verification" className="flex-1 rounded-lg">Verify</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="profile-photo" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="w-3.5 h-3.5 mr-1" /> Upload Photo</span>
                  </Button>
                </Label>
                <input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e, "profile")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Years of Experience</Label>
                <Input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Neighborhood</Label>
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" rows={3} placeholder="Tell clients about yourself..." />
            </div>

            {/* Specialties */}
            <div>
              <Label className="text-xs">Specialties</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button onClick={() => setSpecialties(prev => prev.filter(x => x !== s))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add specialty (e.g. Fades)"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSpecialty.trim()) {
                      setSpecialties(prev => [...prev, newSpecialty.trim()]);
                      setNewSpecialty("");
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (newSpecialty.trim()) {
                      setSpecialties(prev => [...prev, newSpecialty.trim()]);
                      setNewSpecialty("");
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <div>
                <p className="text-sm font-medium">Available Now</p>
                <p className="text-xs text-muted-foreground">Show clients you're ready for walk-ins</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-semibold mb-4">Your Services</h3>
            <div className="space-y-2 mb-4">
              {services.map((svc) => (
                <div key={svc.id} className="flex justify-between items-center p-3 bg-secondary rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium">{svc.service_name}</h4>
                    <span className="text-xs text-muted-foreground">{svc.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold">${svc.price}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteService(svc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-medium">Add New Service</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Service name" value={newService.service_name} onChange={(e) => setNewService(p => ({ ...p, service_name: e.target.value }))} />
                <Input placeholder="Price ($)" type="number" value={newService.price} onChange={(e) => setNewService(p => ({ ...p, price: e.target.value }))} />
                <Input placeholder="Duration (minutes)" type="number" value={newService.duration_minutes} onChange={(e) => setNewService(p => ({ ...p, duration_minutes: e.target.value }))} />
                <Input placeholder="Description (optional)" value={newService.description} onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Button onClick={addService} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Service
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-semibold mb-4">Portfolio</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {portfolioImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPortfolioImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <Label htmlFor="portfolio-upload" className="cursor-pointer">
                <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Upload</span>
                </div>
              </Label>
              <input id="portfolio-upload" type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e, "portfolio")} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Portfolio"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-heading font-semibold">License Verification</h3>
                <p className="text-xs text-muted-foreground">Upload your barber license to get the Verified badge</p>
              </div>
            </div>
            {barber?.license_verified ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-center">
                <BadgeCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-medium text-emerald-700">License Verified</p>
              </div>
            ) : (
              <>
                {barber?.license_image && (
                  <div className="p-3 bg-amber-50 rounded-xl text-center text-sm text-amber-700 mb-4">
                    License uploaded — verification pending
                  </div>
                )}
                <Label htmlFor="license-upload" className="cursor-pointer">
                  <div className="p-8 rounded-xl border-2 border-dashed border-border flex flex-col items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">Upload Barber License</span>
                    <span className="text-xs mt-1">JPG, PNG, or PDF</span>
                  </div>
                </Label>
                <input id="license-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={uploadLicense} />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}