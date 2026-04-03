import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Shield, User, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface ClientPersonalInfoProps {
  isEditing: boolean;
  data: {
    name: string;
    whatsapp: string;
    cpf: string;
    email: string;
  };
  onChange: (field: string, value: string) => void;
}

export function ClientPersonalInfo({ isEditing, data, onChange }: ClientPersonalInfoProps) {
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isEditing) setSavedFields(new Set());
  }, [isEditing]);

  const handleChange = (field: string, value: string) => {
    const normalizedValue =
      field === "cpf" || field === "whatsapp"
        ? value.replace(/\D/g, "").slice(0, 11)
        : value;

    onChange(field, normalizedValue);
    setSavedFields(prev => new Set(prev).add(field));
    setTimeout(() => {
      setSavedFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 1500);
  };

  const maskCPF = (cpf: string) => {
    if (!isEditing && cpf.length >= 11) {
      return `***.***.${cpf.slice(-5, -2)}-${cpf.slice(-2)}`;
    }
    return cpf;
  };

  const fields = [
    { key: "name", label: "Nome Completo", icon: User, value: data.name, type: "text" },
    { key: "whatsapp", label: "WhatsApp", icon: Phone, value: data.whatsapp, type: "tel" },
    { key: "cpf", label: "CPF", icon: Shield, value: maskCPF(data.cpf), type: "text" },
    { key: "email", label: "E-mail", icon: Mail, value: data.email, type: "email" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Informações Pessoais</h2>
      <div className="space-y-4">
        {fields.map(({ key, label, icon: Icon, value, type }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Label>
            <div className="relative">
              <Input
                type={type}
                value={value}
                readOnly={!isEditing}
                maxLength={key === "cpf" || key === "whatsapp" ? 11 : undefined}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`bg-secondary/50 border-border text-foreground transition-all ${
                  isEditing
                    ? "border-primary/50 focus:border-primary"
                    : "cursor-default opacity-80"
                }`}
              />
              {savedFields.has(key) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-fade-in">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
