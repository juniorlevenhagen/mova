"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Step1BasicData } from "./signup/Step1BasicData";
import { Step2ProfileCustomization } from "./signup/Step2ProfileCustomization";
import { Step3PlanSelection } from "./signup/Step3PlanSelection";

export type SignupData = {
  // Etapa 1 - Dados básicos
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;

  // Etapa 2 - Personalização
  objective:
    | "emagrecer"
    | "ganho_massa"
    | "definicao"
    | "saude_cardiovascular"
    | "";
  trainingFrequency: number;
  trainingLocation: "casa" | "academia" | "";
  specificities: string;
  dietaryRestrictions: string;
  weight: number;
  height: number;
  age: number;
  currentActivityLevel: "iniciante" | "intermediario" | "avancado" | "";
  alreadyExercises: boolean;

  // Etapa 3 - Plano
  selectedPlan: "gratuito" | "completo" | "";
};

export function SignupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>({
    // Etapa 1
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeToTerms: false,

    // Etapa 2
    objective: "",
    trainingFrequency: 0,
    trainingLocation: "",
    specificities: "",
    dietaryRestrictions: "",
    weight: 0,
    height: 0,
    age: 0,
    currentActivityLevel: "",
    alreadyExercises: false,

    // Etapa 3
    selectedPlan: "",
  });

  const updateFormData = (data: Partial<SignupData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log("Dados finais:", formData);
    // TODO: Implementar envio dos dados
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicData
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onBack={handleGoHome}
          />
        );
      case 2:
        return (
          <Step2ProfileCustomization
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <Step3PlanSelection
            data={formData}
            updateData={updateFormData}
            onSubmit={handleSubmit}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            Etapa {currentStep} de 3
          </span>
        </div>
      </div>

      {renderStep()}
    </div>
  );
}
