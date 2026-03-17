"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase" // Importação vital
import { toast } from "sonner" // Para feedbacks visuais
import { Header } from "@/components/Header"
import { ClientProfileHeader } from "@/components/profile/ClientProfileHeader"
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo"
import { ClientFavorites } from "@/components/profile/ClientFavorites"
import { SaveBar } from "@/components/profile/SaveBar"

export default function ClientProfile() {
  // 🚀 Adicionamos o 'refreshUser' para atualizar o Header e outros componentes após o save
  const { currentUser, isLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Estado para o loading do botão
  
  const [data, setData] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    email: "",
  });

  useEffect(() => {
    if (currentUser) {
      setData({
        name: currentUser.name || "",
        whatsapp: currentUser.phone || "",
        cpf: "", 
        email: currentUser.email || "",
      });
    }
  }, [currentUser]);

  const handleFieldChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  /**
   * 🛡️ LÓGICA DE PERSISTÊNCIA MUNDIAL
   */
  const handleSave = async () => {
    if (!currentUser?.id) return;

    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      // 1. Enviamos os dados para a tabela 'profiles'
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.whatsapp.replace(/\D/g, ""), // Limpa a máscara (salva só números)
          // Se tiver campo de CPF no banco, adicione aqui: cpf: data.cpf
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // 2. 🚀 O SEGREDO: Força o AuthContext a ler os novos dados do banco
      await refreshUser();

      toast.success("Perfil atualizado!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar dados", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container pt-28 pb-24 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="px-4 mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Gerencie suas informações pessoais e barbearias favoritas.
          </p>
        </header>

        <div className="px-4 space-y-6">
          <ClientProfileHeader
            name={data.name}
            memberSince="Membro BarberPro"
            isEditing={isEditing}
            onToggleEdit={() => {
              setIsEditing(!isEditing);
              if (isEditing) setHasChanges(false);
            }}
          />
          
          <ClientPersonalInfo
            isEditing={isEditing}
            data={data}
            onChange={handleFieldChange}
          />
          
          <ClientFavorites />
        </div>

        {/* DICA: Se o seu componente SaveBar aceitar uma prop de loading, 
          passe o 'isSaving' para ele desabilitar o botão enquanto salva.
        */}
        <SaveBar 
          visible={isEditing && hasChanges} 
          onSave={handleSave} 
          isLoading={isSaving} 
        />
      </main>
    </div>
  );
}