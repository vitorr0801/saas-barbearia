import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { useState } from "react";

interface SaveBarProps {
  visible: boolean;
  onSave: () => void;
}

export function SaveBar({ visible, onSave }: SaveBarProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!visible) return null;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      onSave();
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg p-4 animate-slide-up">
      <Button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full h-12 text-base font-semibold gap-2 btn-primary-glow"
      >
        {saved ? (
          <>
            <Check className="h-5 w-5" />
            Salvo com Sucesso!
          </>
        ) : saving ? (
          <span className="animate-pulse-subtle">Salvando...</span>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Salvar Alterações
          </>
        )}
      </Button>
    </div>
  );
}
