import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Scissors, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["haircut", "beard", "combo", "styling", "color", "other"];

export default function ServicesEditor({ barberId, initialServices }) {
  const [services, setServices] = useState(initialServices || []);
  const [form, setForm] = useState({ service_name: "", price: "", duration_minutes: "30", description: "", category: "haircut" });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const addService = async () => {
    if (!form.service_name.trim() || !form.price) { toast.error("Name and price required"); return; }
    setAdding(true);
    const created = await base44.entities.Service.create({
      barber_id: barberId,
      service_name: form.service_name.trim(),
      price: parseFloat(form.price),
      duration_minutes: parseInt(form.duration_minutes) || 30,
      description: form.description,
      category: form.category,
    });
    setServices(prev => [...prev, created]);
    setForm({ service_name: "", price: "", duration_minutes: "30", description: "", category: "haircut" });
    setAdding(false);
    toast.success("Service added!");
  };

  const deleteService = async (id) => {
    setDeleting(id);
    await base44.entities.Service.delete(id);
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
    toast.success("Service removed");
  };

  return (
    <div className="space-y-6">
      {/* Existing Services */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Services ({services.length})</h3>
        {services.length === 0 ? (
          <div className="text-center py-10 bg-secondary rounded-xl">
            <Scissors className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No services yet — add your first one below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map(svc => (
              <div key={svc.id} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{svc.service_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{svc.duration_minutes} min
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{svc.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="font-heading font-bold text-primary">${svc.price}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={deleting === svc.id} onClick={() => deleteService(svc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Service */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Add New Service</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Service Name *</Label>
            <Input value={form.service_name} onChange={e => setForm(p => ({...p, service_name: e.target.value}))} className="mt-1" placeholder="e.g. Classic Fade" />
          </div>
          <div>
            <Label className="text-xs">Price ($) *</Label>
            <Input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} className="mt-1" placeholder="e.g. 35" min="0" />
          </div>
          <div>
            <Label className="text-xs">Duration (minutes)</Label>
            <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({...p, duration_minutes: e.target.value}))} className="mt-1" placeholder="30" min="5" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Description (optional)</Label>
          <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="mt-1" placeholder="Brief description..." />
        </div>
        <Button onClick={addService} disabled={adding} className="w-full">
          {adding ? "Adding..." : <><Plus className="w-4 h-4 mr-1" />Add Service</>}
        </Button>
      </div>
    </div>
  );
}