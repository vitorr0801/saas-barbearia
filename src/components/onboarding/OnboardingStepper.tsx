 import { Check } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface OnboardingStepperProps {
   currentStep: number;
   steps: string[];
 }
 
 export function OnboardingStepper({ currentStep, steps }: OnboardingStepperProps) {
   return (
     <div className="w-full px-4 py-6">
       <div className="flex items-center justify-between relative">
         {/* Progress line background */}
         <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-secondary rounded-full" />
         
         {/* Progress line fill */}
         <div 
           className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500"
           style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
         />
         
         {steps.map((step, index) => (
           <div key={step} className="relative z-10 flex flex-col items-center">
             <div
               className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                 index < currentStep
                   ? "bg-primary text-primary-foreground"
                   : index === currentStep
                   ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                   : "bg-secondary text-muted-foreground"
               )}
             >
               {index < currentStep ? (
                 <Check className="h-5 w-5" />
               ) : (
                 index + 1
               )}
             </div>
             <span
               className={cn(
                 "mt-2 text-xs font-medium transition-colors duration-300 text-center max-w-[80px]",
                 index <= currentStep ? "text-foreground" : "text-muted-foreground"
               )}
             >
               {step}
             </span>
           </div>
         ))}
       </div>
     </div>
   );
 }