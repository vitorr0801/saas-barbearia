// src/components/profile/BarberProfileHeader.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Pencil, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useImageCropper } from "@/hooks/useImageCropper";
import { AvatarCropperModal } from "@/components/profile/AvatarCropperModal";

interface BarberProfileHeaderProps {
  name: string;
  rating: number;
  reviewCount: number;
  avatarUrl?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAvatarUpdated: (newUrl: string) => void;
}

export function BarberProfileHeader({
  name,
  rating,
  reviewCount,
  avatarUrl,
  isEditing,
  onToggleEdit,
  onAvatarUpdated,
}: BarberProfileHeaderProps) {
  const { currentUser, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cropper = useImageCropper();

  // Usuário seleciona o arquivo → abre o cropper, NÃO faz upload ainda
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    // Reset do input para permitir re-selecionar o mesmo arquivo
    e.target.value = "";
    cropper.openCropper(file);
  };

  // Usuário confirma o crop → gera blob → faz upload
  const handleCropConfirm = async () => {
    if (!currentUser) return toast.error("Sessão inválida");

    setIsUploading(true);
    const toastId = toast.loading("Enviando foto...");

    try {
      const croppedBlob = await cropper.getCroppedBlob(400);

      // 🚀 Caminho determinístico: evita acúmulo de arquivos órfãos no Storage
      // Sempre sobrescreve o mesmo arquivo por usuário
      const filePath = `avatars/${currentUser.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("barbershop-assets")
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // 🚀 Cache-bust: adiciona timestamp para forçar reload da imagem
      const { data: { publicUrl } } = supabase.storage
        .from("barbershop-assets")
        .getPublicUrl(filePath);

      const bustedUrl = `${publicUrl}?t=${Date.now()}`;

      // 1. Salva na tabela profiles (fonte de verdade para o app)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: bustedUrl })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;

      // 2. Atualiza metadados da sessão Auth → AuthContext lê isso
      await supabase.auth.updateUser({ data: { avatar_url: bustedUrl } });

      // 3. Força o AuthContext a re-buscar o perfil completo
      await refreshUser();

      toast.success("Foto atualizada!", { id: toastId });
      onAvatarUpdated(bustedUrl);
      cropper.closeCropper();
    } catch (error: any) {
      toast.error("Erro ao enviar foto: " + (error.message ?? "Tente novamente."), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="relative rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />

        <div className="px-6 pb-6 -mt-16">
          <div className="flex items-end justify-between mb-4">
            {/* Avatar com botão de câmera */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-card bg-card shadow-xl">
                <AvatarImage
                  src={avatarUrl}
                  alt={name}
                  // ✅ object-cover garante que a imagem não distorce no círculo
                  className="object-cover object-center w-full h-full"
                />
                <AvatarFallback className="bg-secondary text-4xl font-bold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full cursor-pointer hover:bg-black/60 transition-colors z-10"
                  title="Alterar foto"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Alterar</span>
                </label>
              )}
            </div>

            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={onToggleEdit}
              className="gap-2 mb-2 rounded-xl"
            >
              <Pencil className="h-4 w-4" />
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating) ? "fill-primary text-primary" : "text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviewCount} avaliações)</span>
          </div>
        </div>
      </div>

      {/* Input de arquivo escondido — acionado pelo label acima */}
      <input
        id="avatar-upload"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Modal de crop */}
      <AvatarCropperModal
        isOpen={cropper.isOpen}
        previewSrc={cropper.previewSrc}
        cropState={cropper.cropState}
        initialScale={cropper.initialScale}
        isUploading={isUploading}
        onClose={cropper.closeCropper}
        onConfirm={handleCropConfirm}
        onZoom={cropper.handleZoom}
        onSetScale={cropper.handleSetScale}
        onMouseDown={cropper.handleMouseDown}
        onMouseMove={cropper.handleMouseMove}
        onMouseUp={cropper.handleMouseUp}
        onWheelZoom={cropper.handleWheelZoom}
      />
    </>
  );
}