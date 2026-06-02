import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";

export default function PortfolioEditor({ barber, onSaved }) {
  const [images, setImages] = useState(barber.portfolio_images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const uploadImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImages(prev => [...prev, file_url]);
    }
    setUploading(false);
    toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded!`);
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.Barber.update(barber.id, { portfolio_images: images });
    setSaving(false);
    toast.success("Portfolio saved!");
    onSaved?.({ ...barber, portfolio_images: images });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{images.length} photo{images.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground">Showcase your best work to attract clients</p>
        </div>
        <Label htmlFor="portfolio-upload" className="cursor-pointer">
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
              {uploading ? "Uploading..." : "Add Photos"}
            </span>
          </Button>
        </Label>
        <input id="portfolio-upload" type="file" accept="image/*" multiple className="hidden" onChange={uploadImage} />
      </div>

      {images.length === 0 ? (
        <Label htmlFor="portfolio-upload" className="cursor-pointer block">
          <div className="aspect-video rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <ImagePlus className="w-10 h-10 mb-3" />
            <p className="font-medium text-sm">Upload your portfolio photos</p>
            <p className="text-xs mt-1">Select multiple at once — JPG, PNG, WebP</p>
          </div>
        </Label>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(img)}>
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
              <button
                onClick={e => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          <Label htmlFor="portfolio-upload" className="cursor-pointer">
            <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-5 h-5" /><span className="text-[10px] mt-1">Add More</span></>}
            </div>
          </Label>
        </div>
      )}

      {images.length > 0 && (
        <Button onClick={save} disabled={saving} className="w-full h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Portfolio
        </Button>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}