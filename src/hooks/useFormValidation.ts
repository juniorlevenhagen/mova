import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  type Step1Data,
  type Step2Data,
  type Step3Data,
} from "@/lib/validation";

export function useStep1Form() {
  return useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
  });
}

export function useStep2Form() {
  return useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
  });
}

export function useStep3Form() {
  return useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
  });
}
