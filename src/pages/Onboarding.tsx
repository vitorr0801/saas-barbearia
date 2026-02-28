 import { useState } from "react";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
 import { StepIdentity } from "@/components/onboarding/StepIdentity";
 import { StepTeam, type Barber } from "@/components/onboarding/StepTeam";
 import { StepServices, type Service } from "@/components/onboarding/StepServices";
 import { StepSuccess } from "@/components/onboarding/StepSuccess";
 import { toast } from "sonner";
 
 const steps = ["Identidade", "Equipe", "Serviços"];
 
 export default function Onboarding() {
   const [currentStep, setCurrentStep] = useState(0);
   const [isComplete, setIsComplete] = useState(false);
 
   const [businessData, setBusinessData] = useState({
     name: "",
     address: "",
     openTime: "09:00",
     closeTime: "20:00",
   });
 
   const [barbers, setBarbers] = useState<Barber[]>([
     { id: crypto.randomUUID(), name: "", commission: "50" },
   ]);
 
   const [services, setServices] = useState<Service[]>([
     { id: crypto.randomUUID(), name: "", price: "", duration: "30" },
   ]);
 
   const handleNext = () => {
     if (currentStep === 0 && !businessData.name) {
       toast.error("Preencha o nome da barbearia");
       return;
     }
     if (currentStep === 1 && barbers.some((b) => !b.name)) {
       toast.error("Preencha o nome de todos os barbeiros");
       return;
     }
     if (currentStep === 2) {
       if (services.some((s) => !s.name || !s.price)) {
         toast.error("Preencha nome e preço de todos os serviços");
         return;
       }
       setIsComplete(true);
       toast.success("Configuração concluída!");
       return;
     }
     setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
   };
 
   const handleBack = () => {
     setCurrentStep((prev) => Math.max(prev - 1, 0));
   };
 
   const handlePreview = () => {
     toast.info("Prévia da agenda será exibida aqui");
   };
 
   if (isComplete) {
     return (
       <div className="min-h-screen bg-background p-4">
         <StepSuccess />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <div className="px-4 pt-6 pb-2">
         <h1 className="text-lg font-semibold text-foreground text-center">Setup Inicial</h1>
         <p className="text-xs text-muted-foreground text-center mt-1">
           Configure sua barbearia em 3 minutos
         </p>
       </div>
 
       {/* Stepper */}
       <OnboardingStepper currentStep={currentStep} steps={steps} />
 
       {/* Content */}
       <div className="flex-1 px-4 py-6 overflow-y-auto">
         {currentStep === 0 && (
           <StepIdentity data={businessData} onChange={setBusinessData} />
         )}
         {currentStep === 1 && (
           <StepTeam barbers={barbers} onChange={setBarbers} />
         )}
         {currentStep === 2 && (
           <StepServices
             services={services}
             onChange={setServices}
             onPreview={handlePreview}
           />
         )}
       </div>
 
       {/* Footer Actions */}
       <div className="p-4 border-t border-border bg-card">
         <div className="flex gap-3">
           {currentStep > 0 && (
             <Button
               variant="outline"
               onClick={handleBack}
               className="flex-1"
             >
               <ChevronLeft className="h-4 w-4 mr-1" />
               Voltar
             </Button>
           )}
           <Button
             onClick={handleNext}
             className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
           >
             {currentStep === steps.length - 1 ? "Finalizar" : "Continuar"}
             {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
           </Button>
         </div>
       </div>
     </div>
   );
 }